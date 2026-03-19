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

function parseBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
}

function normalizeMetadata(body = {}, existing = {}) {
  const metadata = { ...(existing || {}) };
  if (body.expiryDate !== undefined) metadata.expiryDate = body.expiryDate ? new Date(body.expiryDate) : undefined;
  if (body.issueDate !== undefined) metadata.issueDate = body.issueDate ? new Date(body.issueDate) : undefined;
  if (body.metadata && typeof body.metadata === 'object') {
    Object.assign(metadata, body.metadata);
    if (body.metadata.expiryDate !== undefined) metadata.expiryDate = body.metadata.expiryDate ? new Date(body.metadata.expiryDate) : undefined;
    if (body.metadata.issueDate !== undefined) metadata.issueDate = body.metadata.issueDate ? new Date(body.metadata.issueDate) : undefined;
  }
  return metadata;
}

function normalizeVisibility(body = {}, existing = {}) {
  const input = body.visibility && typeof body.visibility === 'object' ? body.visibility : {};
  const clientVisible = parseBoolean(
    body.shareWithClient !== undefined ? body.shareWithClient : input.client,
    existing.client !== undefined ? existing.client : true
  );
  const sponsorVisible = parseBoolean(
    body.shareWithSponsor !== undefined ? body.shareWithSponsor : input.sponsor,
    existing.sponsor !== undefined ? existing.sponsor : false
  );
  const internalOnly = parseBoolean(body.internalOnly, false);
  return {
    client: internalOnly ? false : clientVisible,
    sponsor: internalOnly ? false : sponsorVisible,
    internal: internalOnly ? true : (existing.internal !== undefined ? existing.internal : true),
  };
}

function deriveDocumentStatus(currentStatus, metadata = {}) {
  const expiryDate = metadata?.expiryDate ? new Date(metadata.expiryDate) : null;
  if (expiryDate && !Number.isNaN(expiryDate.getTime()) && expiryDate < new Date()) return 'EXPIRED';
  if (currentStatus === 'EXPIRED') return 'UPLOADED';
  return currentStatus || 'UPLOADED';
}

export class DocumentService {
  static async syncExpiredStatuses(filter = {}) {
    const now = new Date();
    await Document.updateMany(
      {
        ...filter,
        'metadata.expiryDate': { $lt: now },
        status: { $ne: 'EXPIRED' },
      },
      { $set: { status: 'EXPIRED' } }
    );
    await Document.updateMany(
      {
        ...filter,
        $or: [
          { 'metadata.expiryDate': { $exists: false } },
          { 'metadata.expiryDate': null },
          { 'metadata.expiryDate': { $gte: now } },
        ],
        status: 'EXPIRED',
      },
      { $set: { status: 'UPLOADED' } }
    );
  }

  static async ensureDocumentAccess(doc, user, query = {}) {
    if (!doc) throw Object.assign(new Error('Not found'), { status: 404 });
    if (user.role === 'STUDENT') {
      if (!doc.clientId) throw Object.assign(new Error('Not authorized'), { status: 403 });
      const myClient = await Client.findById(doc.clientId);
      if (!myClient || myClient.userId?.toString() !== user._id.toString()) {
        throw Object.assign(new Error('Not authorized'), { status: 403 });
      }
      if (doc.visibility?.client === false) {
        throw Object.assign(new Error('This document is not shared with the client portal'), { status: 403 });
      }
      return;
    }
    if (user.role === 'SUPER_ADMIN') {
      if (query.consultancyId && doc.consultancyId?.toString() !== String(query.consultancyId)) {
        throw Object.assign(new Error('Not authorized'), { status: 403 });
      }
      return;
    }
    const cid = user.profile?.consultancyId || user._id;
    if (doc.consultancyId?.toString() !== String(cid)) {
      throw Object.assign(new Error('Not authorized'), { status: 403 });
    }
  }

  static async getAll(user, query) {
    const { applicationId, clientId, includeAllVersions } = query;
    const filter = {};
    if (applicationId) filter.applicationId = applicationId;
    if (clientId) filter.clientId = clientId;
    if (!(String(includeAllVersions) === 'true')) filter.isLatest = true;

    if (user.role === 'STUDENT') {
      if (!clientId) return [];
      const myClient = await Client.findOne({ userId: user._id, _id: clientId });
      if (!myClient) return [];
      filter['visibility.client'] = true;
    } else if (user.role === 'SUPER_ADMIN' && query.consultancyId) {
      filter.consultancyId = query.consultancyId;
    } else if (user.role !== 'SUPER_ADMIN') {
      filter.consultancyId = user.profile?.consultancyId || user._id;
    }
    await this.syncExpiredStatuses(filter);
    return Document.find(filter)
      .populate('uploadedBy', 'profile')
      .populate('clientId', 'profile')
      .sort({ createdAt: -1 });
  }

  static async create(data, user) {
    const consultancyId = user.profile?.consultancyId || user._id;
    const doc = await Document.create({
      ...data,
      metadata: normalizeMetadata(data),
      visibility: normalizeVisibility(data),
      consultancyId,
      uploadedBy: user._id,
      status: deriveDocumentStatus(data.status, normalizeMetadata(data)),
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
    const { clientId, applicationId, type, replaceDocumentId } = body;
    let consultancyId = user.profile?.consultancyId || user._id;

    if (user.role === 'STUDENT' && clientId) {
      const myClient = await Client.findById(clientId);
      if (!myClient || myClient.userId?.toString() !== user._id.toString()) {
        throw Object.assign(new Error('Not authorized'), { status: 403 });
      }
      consultancyId = myClient.consultancyId;
    }

    let replacement = null;
    if (replaceDocumentId) {
      replacement = await Document.findById(replaceDocumentId);
      await this.ensureDocumentAccess(replacement, user);
    }

    const fileUrl = `/uploads/${file.filename}`;
    const versionGroupId = replacement?.versionGroupId || replacement?._id || undefined;
    const version = replacement ? Number(replacement.version || 1) + 1 : 1;
    const metadata = normalizeMetadata(body, replacement?.metadata || {});
    const visibility = normalizeVisibility(body, replacement?.visibility || {});
    const doc = await Document.create({
      name: file.originalname,
      type: type || replacement?.type || 'Document',
      fileUrl,
      fileKey: file.filename,
      clientId: clientId || replacement?.clientId || undefined,
      applicationId: applicationId || replacement?.applicationId || undefined,
      sponsorId: replacement?.sponsorId || undefined,
      consultancyId: replacement?.consultancyId || consultancyId,
      versionGroupId,
      previousVersionId: replacement?._id || undefined,
      metadata,
      visibility,
      version,
      isLatest: true,
      uploadedBy: user._id,
      status: deriveDocumentStatus('UPLOADED', metadata),
    });

    if (replacement) {
      await Document.findByIdAndUpdate(replacement._id, { isLatest: false });
    }

    const effectiveClientId = clientId || replacement?.clientId;
    const effectiveApplicationId = applicationId || replacement?.applicationId;
    const effectiveType = type || replacement?.type;

    if (effectiveClientId && (effectiveType === 'PHOTO' || effectiveType === 'CLIENT_SIGNATURE')) {
      const update = effectiveType === 'PHOTO' ? { 'profile.photoUrl': fileUrl } : { 'profile.signatureUrl': fileUrl };
      await Client.findByIdAndUpdate(effectiveClientId, update);
    }

    if (effectiveClientId) {
      const client = await Client.findById(effectiveClientId).select('assignedAgentId consultancyId profile userId');
      await logAudit(doc.consultancyId, 'Document', doc._id, 'CREATE', user._id, {
        description: replacement ? `Document new version uploaded: ${effectiveType || doc.name || 'Document'} v${version}` : `Document uploaded: ${effectiveType || doc.name || 'Document'}`,
        clientId: effectiveClientId,
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
          type: replacement ? 'DOCUMENT_VERSION_UPLOADED' : 'DOCUMENT_UPLOADED',
          title: replacement ? 'Document updated with a new version' : user.role === 'STUDENT' ? 'Client uploaded document' : 'New document from your agent',
          message: user.role === 'STUDENT'
            ? `${client.profile?.firstName} ${client.profile?.lastName} uploaded ${effectiveType}`
            : replacement ? `A new version of ${effectiveType || doc.name || 'a document'} was uploaded` : `Your agent uploaded ${effectiveType || doc.name || 'a document'}`,
          relatedEntityType: 'Document',
          relatedEntityId: doc._id,
        });
      }
    }

    const checklistName = DOC_TYPE_TO_CHECKLIST[effectiveType];
    if (effectiveClientId && checklistName) {
      const appFilter = { clientId: effectiveClientId, status: { $nin: ['COMPLETED'] } };
      if (effectiveApplicationId) appFilter._id = effectiveApplicationId;
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

  static async bulkUpload(files, body, user) {
    const uploads = Array.isArray(files) ? files : [];
    if (!uploads.length) throw Object.assign(new Error('No files uploaded'), { status: 400 });
    const created = [];
    for (const file of uploads) {
      const doc = await this.upload(file, body, user);
      created.push(doc);
    }
    return created;
  }

  static async update(id, data, user) {
    const existing = await Document.findById(id);
    await this.ensureDocumentAccess(existing, user);
    const metadata = normalizeMetadata(data, existing?.metadata || {});
    const visibility = normalizeVisibility(data, existing?.visibility || {});
    const patch = {
      ...data,
      metadata,
      visibility,
      status: data.status ? deriveDocumentStatus(data.status, metadata) : deriveDocumentStatus(existing?.status, metadata),
    };
    delete patch.expiryDate;
    delete patch.issueDate;
    delete patch.shareWithClient;
    delete patch.shareWithSponsor;
    delete patch.internalOnly;
    const doc = await Document.findByIdAndUpdate(id, patch, { new: true });
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
    await this.ensureDocumentAccess(doc, user);

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
    if (doc.isLatest && doc.previousVersionId) {
      await Document.findByIdAndUpdate(doc.previousVersionId, { isLatest: true });
    }
    if (doc.fileKey) {
      const filePath = path.join(uploadsDir, doc.fileKey);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    return { deleted: true };
  }

  static async getVersions(id, user) {
    const doc = await Document.findById(id);
    await this.ensureDocumentAccess(doc, user);
    const groupId = doc.versionGroupId || doc._id;
    return Document.find({
      $or: [
        { _id: groupId },
        { versionGroupId: groupId },
      ],
    })
      .populate('uploadedBy', 'profile')
      .sort({ version: -1, createdAt: -1 });
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
