import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Document from '../models/Document.js';
import Application from '../models/Application.js';
import Client from '../models/Client.js';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import { notifyUsers } from '../utils/notify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { applicationId, clientId } = req.query;
    const filter = {};
    if (applicationId) filter.applicationId = applicationId;
    if (clientId) filter.clientId = clientId;
    if (req.user.role === 'STUDENT') {
      if (!clientId) return res.json([]);
      const Client = (await import('../models/Client.js')).default;
      const myClient = await Client.findOne({ userId: req.user._id, _id: clientId });
      if (!myClient) return res.json([]);
    } else if (req.user.role === 'SUPER_ADMIN' && req.query.consultancyId) {
      filter.consultancyId = req.query.consultancyId;
    } else if (req.user.role !== 'SUPER_ADMIN') {
      filter.consultancyId = req.user.profile?.consultancyId || req.user._id;
    }
    const docs = await Document.find(filter).populate('uploadedBy', 'profile').populate('clientId', 'profile');
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const consultancyId = req.user.profile?.consultancyId || req.user._id;
    const doc = await Document.create({
      ...req.body,
      consultancyId,
      uploadedBy: req.user._id,
    });
    if (doc.clientId) {
      const client = await Client.findById(doc.clientId).select('assignedAgentId');
      await logAudit(consultancyId, 'Document', doc._id, 'CREATE', req.user._id, {
        description: `Document added: ${doc.type || doc.name || 'Document'}`,
        clientId: doc.clientId,
        applicationId: doc.applicationId,
        assignedAgentId: client?.assignedAgentId,
      });
    }
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { clientId, applicationId: applicationIdParam, type } = req.body;
    let consultancyId = req.user.profile?.consultancyId || req.user._id;
    if (req.user.role === 'STUDENT' && clientId) {
      const Client = (await import('../models/Client.js')).default;
      const myClient = await Client.findById(clientId);
      if (!myClient || myClient.userId?.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not authorized' });
      consultancyId = myClient.consultancyId;
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    const doc = await Document.create({
      name: req.file.originalname,
      type: type || 'Document',
      fileUrl,
      fileKey: req.file.filename,
      clientId: clientId || undefined,
      applicationId: applicationIdParam || undefined,
      consultancyId,
      uploadedBy: req.user._id,
      status: 'UPLOADED',
    });
    if (clientId && (type === 'PHOTO' || type === 'CLIENT_SIGNATURE')) {
      const update = type === 'PHOTO' ? { 'profile.photoUrl': fileUrl } : { 'profile.signatureUrl': fileUrl };
      await Client.findByIdAndUpdate(clientId, update);
    }
    if (clientId) {
      const client = await Client.findById(clientId).select('assignedAgentId consultancyId profile userId');
      await logAudit(consultancyId, 'Document', doc._id, 'CREATE', req.user._id, {
        description: `Document uploaded: ${type || doc.name || 'Document'}`,
        clientId: clientId,
        applicationId: doc.applicationId,
        assignedAgentId: client?.assignedAgentId,
      });
      const toNotify = [];
      if (req.user.role === 'STUDENT' && client?.assignedAgentId) {
        toNotify.push(client.assignedAgentId);
      } else if (req.user.role !== 'STUDENT' && client?.userId) {
        toNotify.push(client.userId);
      }
      if (toNotify.length) {
        await notifyUsers({
          consultancyId: client.consultancyId,
          userIds: toNotify,
          excludeUserId: req.user._id,
          type: 'DOCUMENT_UPLOADED',
          title: req.user.role === 'STUDENT' ? 'Client uploaded document' : 'New document from your agent',
          message: req.user.role === 'STUDENT'
            ? `${client.profile?.firstName} ${client.profile?.lastName} uploaded ${type}`
            : `Your agent uploaded ${type || doc.name || 'a document'}`,
          relatedEntityType: 'Document',
          relatedEntityId: doc._id,
        });
      }
    }
    // Link document to application checklist - doc type maps to checklist item names
    const DOC_TYPE_TO_CHECKLIST = {
      PASSPORT: 'Passport', COE: 'CoE', OSHC: 'OSHC', ENGLISH_TEST: 'English Test',
      GTE_STATEMENT: 'GTE/GS Statement', FINANCIAL_EVIDENCE: 'Financial Evidence',
      AFP_POLICE: 'AFP Police Check', SKILLS_ASSESSMENT: 'Skills Assessment',
      COMPLETION_LETTER: 'Completion Letter', TRANSCRIPT: 'Points Evidence',
      WORK_REFERENCE: 'Points Evidence', STATE_NOMINATION: 'State Nomination',
      FORM_956: 'Form 956', FORM_956A: 'Form 956A',
    };
    const checklistName = DOC_TYPE_TO_CHECKLIST[type];
    if (clientId && checklistName) {
      const appFilter = { clientId, status: { $nin: ['COMPLETED'] } };
      if (applicationIdParam) appFilter._id = applicationIdParam;
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
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const oldDoc = await Document.findById(req.params.id);
    const doc = await Document.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (doc.clientId && Object.keys(req.body).length) {
      const client = await Client.findById(doc.clientId).select('assignedAgentId');
      await logAudit(doc.consultancyId, 'Document', doc._id, 'UPDATE', req.user._id, {
        description: `Document updated: ${doc.type || doc.name || 'Document'}`,
        clientId: doc.clientId,
        applicationId: doc.applicationId,
        assignedAgentId: client?.assignedAgentId,
      });
    }
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (req.user.role === 'STUDENT' && doc.clientId) {
      const Client = (await import('../models/Client.js')).default;
      const myClient = await Client.findById(doc.clientId);
      if (!myClient || myClient.userId?.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not authorized' });
    }
    if (doc.clientId) {
      const client = await Client.findById(doc.clientId).select('assignedAgentId');
      await logAudit(doc.consultancyId, 'Document', doc._id, 'DELETE', req.user._id, {
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
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/checklist/:visaSubclass', async (req, res) => {
  const checklists = {
    '500': ['CoE', 'OSHC', 'Passport', 'English Test', 'GTE/GS Statement', 'Financial Evidence'],
    '485': ['Passport', 'AFP Police Check', 'English Test', 'Skills Assessment', 'Completion Letter'],
    '190': ['Passport', 'Skills Assessment', 'English Test', 'Points Evidence', 'State Nomination'],
    '189': ['Passport', 'Skills Assessment', 'English Test', 'Points Evidence', 'EOI'],
    '491': ['Passport', 'Skills Assessment', 'English Test', 'Points Evidence', 'Regional Nomination'],
  };
  const items = (checklists[req.params.visaSubclass] || checklists['500']).map(name => ({ name, required: true, uploaded: false }));
  res.json(items);
});

export default router;
