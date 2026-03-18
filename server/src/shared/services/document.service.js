import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Document from '../../shared/models/Document.js';
import Application from '../../shared/models/Application.js';
import Client from '../../shared/models/Client.js';
import { logAudit } from '../../shared/utils/audit.js';
import { notifyUsers } from '../../shared/utils/notify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../../uploads');

const DOC_TYPE_TO_CHECKLIST = {
  PASSPORT: 'Passport', COE: 'CoE', OSHC: 'OSHC', ENGLISH_TEST: 'English Test',
  GTE_STATEMENT: 'GTE/GS Statement', FINANCIAL_EVIDENCE: 'Financial Evidence',
  AFP_POLICE: 'AFP Police Check', SKILLS_ASSESSMENT: 'Skills Assessment',
  COMPLETION_LETTER: 'Completion Letter', TRANSCRIPT: 'Points Evidence',
  WORK_REFERENCE: 'Points Evidence', STATE_NOMINATION: 'State Nomination',
  FORM_956: 'Form 956', FORM_956A: 'Form 956A',
};

export class DocumentService {
  static async getAll(user, query) {
    const { applicationId, clientId } = query;
    const filter = {};
    if (applicationId) filter.applicationId = applicationId;
    if (clientId) filter.clientId = clientId;

    if (user.role === 'STUDENT') {
      if (!clientId) return [];
      const myClient = await Client.findOne({ userId: user._id, _id: clientId });
      if (!myClient) return [];
    } else if (user.role === 'SUPER_ADMIN' && query.consultancyId) {
      filter.consultancyId = query.consultancyId;
    } else if (user.role !== 'SUPER_ADMIN') {
      filter.consultancyId = user.profile?.consultancyId || user._id;
    }

    return Document.find(filter).populate('uploadedBy', 'profile').populate('clientId', 'profile');
  }

  static async create(data, user) {
    const consultancyId = user.profile?.consultancyId || user._id;
    const doc = await Document.create({
      ...data,
      consultancyId,
      uploadedBy: user._id,
    });

    if (doc.clientId) {
      const client = await Client.findById(doc.clientId).select('assignedAgentId');
      await logAudit(consultancyId, 'Document', doc._id, 'CREATE', user._id, {
        description: `Document added: ${doc.type || doc.name || 'Document'}`,
        clientId: doc.clientId,
        applicationId: doc.applicationId,
        assignedAgentId: client?.assignedAgentId,
      });
    }
    return doc;
  }

  static async upload(file, body, user) {
    if (!file) throw Object.assign(new Error('No file uploaded'), { status: 400 });
    const { clientId, applicationId, type } = body;
    let consultancyId = user.profile?.consultancyId || user._id;

    if (user.role === 'STUDENT' && clientId) {
      const myClient = await Client.findById(clientId);
      if (!myClient || myClient.userId?.toString() !== user._id.toString()) {
        throw Object.assign(new Error('Not authorized'), { status: 403 });
      }
      consultancyId = myClient.consultancyId;
    }

    const fileUrl = `/uploads/${file.filename}`;
    const doc = await Document.create({
      name: file.originalname,
      type: type || 'Document',
      fileUrl,
      fileKey: file.filename,
      clientId: clientId || undefined,
      applicationId: applicationId || undefined,
      consultancyId,
      uploadedBy: user._id,
      status: 'UPLOADED',
    });

    if (clientId && (type === 'PHOTO' || type === 'CLIENT_SIGNATURE')) {
      const update = type === 'PHOTO' ? { 'profile.photoUrl': fileUrl } : { 'profile.signatureUrl': fileUrl };
      await Client.findByIdAndUpdate(clientId, update);
    }

    if (clientId) {
      const client = await Client.findById(clientId).select('assignedAgentId consultancyId profile userId');
      await logAudit(consultancyId, 'Document', doc._id, 'CREATE', user._id, {
        description: `Document uploaded: ${type || doc.name || 'Document'}`,
        clientId,
        applicationId: doc.applicationId,
        assignedAgentId: client?.assignedAgentId,
      });

      const toNotify = [];
      if (user.role === 'STUDENT' && client?.assignedAgentId) {
        toNotify.push(client.assignedAgentId);
      } else if (user.role !== 'STUDENT' && client?.userId) {
        toNotify.push(client.userId);
      }

      if (toNotify.length) {
        await notifyUsers({
          consultancyId: client.consultancyId,
          userIds: toNotify,
          excludeUserId: user._id,
          type: 'DOCUMENT_UPLOADED',
          title: user.role === 'STUDENT' ? 'Client uploaded document' : 'New document from your agent',
          message: user.role === 'STUDENT'
            ? `${client.profile?.firstName} ${client.profile?.lastName} uploaded ${type}`
            : `Your agent uploaded ${type || doc.name || 'a document'}`,
          relatedEntityType: 'Document',
          relatedEntityId: doc._id,
        });
      }
    }

    const checklistName = DOC_TYPE_TO_CHECKLIST[type];
    if (clientId && checklistName) {
      const appFilter = { clientId, status: { $nin: ['COMPLETED'] } };
      if (applicationId) appFilter._id = applicationId;
      const apps = await Application.find(appFilter);
      for (const app of apps) {
        const idx = (app.documentChecklist || []).findIndex((i) => {
          const iname = (i.name || '').toLowerCase();
          const cname = checklistName.toLowerCase();
          return iname === cname || iname.includes(cname) || cname.includes(iname) || (cname.includes('gte') && iname.includes('gte')) || (cname.includes('points') && iname.includes('points')) || (cname.includes('regional') && iname.includes('regional'));
        });
        if (idx >= 0) {
          app.documentChecklist[idx].uploaded = true;
          app.documentChecklist[idx].documentId = doc._id;
          await app.save();
        }
      }
    }
    return doc;
  }

  static async update(id, data, user) {
    const doc = await Document.findByIdAndUpdate(id, data, { new: true });
    if (!doc) throw Object.assign(new Error('Not found'), { status: 404 });

    if (doc.clientId && Object.keys(data).length) {
      const client = await Client.findById(doc.clientId).select('assignedAgentId');
      await logAudit(doc.consultancyId, 'Document', doc._id, 'UPDATE', user._id, {
        description: `Document updated: ${doc.type || doc.name || 'Document'}`,
        clientId: doc.clientId,
        applicationId: doc.applicationId,
        assignedAgentId: client?.assignedAgentId,
      });
    }
    return doc;
  }

  static async delete(id, user) {
    const doc = await Document.findById(id);
    if (!doc) throw Object.assign(new Error('Not found'), { status: 404 });

    if (user.role === 'STUDENT' && doc.clientId) {
      const myClient = await Client.findById(doc.clientId);
      if (!myClient || myClient.userId?.toString() !== user._id.toString()) {
        throw Object.assign(new Error('Not authorized'), { status: 403 });
      }
    }

    if (doc.clientId) {
      const client = await Client.findById(doc.clientId).select('assignedAgentId');
      await logAudit(doc.consultancyId, 'Document', doc._id, 'DELETE', user._id, {
        description: `Document deleted: ${doc.type || doc.name || 'Document'}`,
        clientId: doc.clientId,
        applicationId: doc.applicationId,
        assignedAgentId: client?.assignedAgentId,
      });
    }

    await doc.deleteOne();
    if (doc.fileKey) {
      const filePath = path.join(uploadsDir, doc.fileKey);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    return { deleted: true };
  }

  static getChecklist(visaSubclass) {
    const checklists = {
      '500': ['CoE', 'OSHC', 'Passport', 'English Test', 'GTE/GS Statement', 'Financial Evidence'],
      '485': ['Passport', 'AFP Police Check', 'English Test', 'Skills Assessment', 'Completion Letter'],
      '190': ['Passport', 'Skills Assessment', 'English Test', 'Points Evidence', 'State Nomination'],
      '189': ['Passport', 'Skills Assessment', 'English Test', 'Points Evidence', 'EOI'],
      '491': ['Passport', 'Skills Assessment', 'English Test', 'Points Evidence', 'Regional Nomination'],
    };
    return (checklists[visaSubclass] || checklists['500']).map(name => ({ name, required: true, uploaded: false }));
  }
}
