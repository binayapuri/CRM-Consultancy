import express from 'express';
import Application from '../models/Application.js';
import Client from '../models/Client.js';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import { notifyUsers } from '../utils/notify.js';

const router = express.Router();

const getConsultancyId = (user) => user.profile?.consultancyId || user._id;

router.get('/my', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT') return res.json([]);
    const Client = (await import('../models/Client.js')).default;
    const myClient = await Client.findOne({ userId: req.user._id }).select('_id');
    if (!myClient) return res.json([]);
    const apps = await Application.find({ clientId: myClient._id })
      .populate('agentId', 'profile')
      .populate('notes.addedBy', 'profile')
      .sort({ updatedAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    let filter = req.user.role === 'SUPER_ADMIN' ? {} : { consultancyId: cid };
    if (req.user.role === 'SUPER_ADMIN' && req.query.consultancyId) filter = { consultancyId: req.query.consultancyId };
    if (req.user.role === 'AGENT') filter.agentId = req.user._id;
    const apps = await Application.find(filter)
      .populate('clientId', 'profile')
      .populate('agentId', 'profile')
      .populate('sponsorId')
      .sort({ updatedAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/kanban', authenticate, async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    let filter = req.user.role === 'SUPER_ADMIN' ? {} : { consultancyId: cid };
    if (req.user.role === 'SUPER_ADMIN' && req.query.consultancyId) filter = { consultancyId: req.query.consultancyId };
    const apps = await Application.find(filter)
      .populate('clientId', 'profile')
      .populate('agentId', 'profile');
    const columns = {
      ONBOARDING: apps.filter(a => a.status === 'ONBOARDING'),
      DRAFTING: apps.filter(a => a.status === 'DRAFTING'),
      PENDING_INFO: apps.filter(a => a.status === 'PENDING_INFO'),
      REVIEW: apps.filter(a => a.status === 'REVIEW'),
      LODGED: apps.filter(a => a.status === 'LODGED'),
      DECISION: apps.filter(a => a.status === 'DECISION'),
    };
    res.json(columns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const app = await Application.findById(req.params.id)
      .populate('clientId', 'profile pointsData userId')
      .populate('agentId', 'profile')
      .populate('sponsorId')
      .populate('notes.addedBy', 'profile');
    if (!app) return res.status(404).json({ error: 'Not found' });
    if (req.user.role === 'STUDENT') {
      const client = app.clientId;
      if (!client || client.userId?.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not authorized' });
    }
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const VISA_CHECKLISTS = {
  '500': ['CoE', 'OSHC', 'Passport', 'English Test', 'GTE/GS Statement', 'Financial Evidence'],
  '485': ['Passport', 'AFP Police Check', 'English Test', 'Skills Assessment', 'Completion Letter'],
  '189': ['Passport', 'Skills Assessment', 'English Test', 'Points Evidence', 'EOI'],
  '190': ['Passport', 'Skills Assessment', 'English Test', 'Points Evidence', 'State Nomination'],
  '491': ['Passport', 'Skills Assessment', 'English Test', 'Points Evidence', 'Regional Nomination'],
  '482': ['Passport', 'Skills Assessment', 'English Test', 'Employment Evidence'],
  '600': ['Passport', 'Financial Evidence', 'Travel Itinerary'],
};

router.post('/', authenticate, async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    const items = VISA_CHECKLISTS[req.body.visaSubclass] || VISA_CHECKLISTS['500'];
    const documentChecklist = items.map(name => ({ name, required: true, uploaded: false }));
    const agentId = req.body.agentId || req.user._id;
    const app = await Application.create({
      ...req.body,
      consultancyId: cid,
      agentId,
      documentChecklist: req.body.documentChecklist || documentChecklist,
      sponsorId: req.body.sponsorId || undefined,
    });
    await notifyUsers({
      consultancyId: cid,
      userIds: [agentId],
      excludeUserId: req.user._id,
      type: 'APPLICATION_CREATED',
      title: 'New Application Assigned',
      message: `Subclass ${app.visaSubclass} application created and assigned to you`,
      relatedEntityType: 'Application',
      relatedEntityId: app._id,
    });
    await logAudit(cid, 'Application', app._id, 'CREATE', req.user._id, {
      description: `Application created: Subclass ${app.visaSubclass}`,
      clientId: app.clientId,
      applicationId: app._id,
      visaSubclass: app.visaSubclass,
      assignedAgentId: app.agentId,
    });
    res.status(201).json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const oldApp = await Application.findById(req.params.id).populate('clientId', 'profile');
    const app = await Application.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('clientId', 'profile')
      .populate('agentId', 'profile')
      .populate('sponsorId');
    if (!app) return res.status(404).json({ error: 'Not found' });
    const changes = [];
    if (req.body.status && oldApp?.status !== req.body.status) changes.push(`status: ${oldApp?.status} → ${req.body.status}`);
    if (req.body.visaSubclass && oldApp?.visaSubclass !== req.body.visaSubclass) changes.push(`visa: ${oldApp?.visaSubclass} → ${req.body.visaSubclass}`);
    if (req.body.agentId && String(oldApp?.agentId) !== String(req.body.agentId)) {
      changes.push('agent reassigned');
      await notifyUsers({
        consultancyId: app.consultancyId,
        userIds: [req.body.agentId],
        excludeUserId: req.user._id,
        type: 'APPLICATION_ASSIGNED',
        title: 'Application Assigned to You',
        message: `Subclass ${app.visaSubclass} application reassigned to you`,
        relatedEntityType: 'Application',
        relatedEntityId: app._id,
      });
    }
    const otherFields = Object.keys(req.body).filter(k => !['status', 'visaSubclass', 'agentId', 'updatedAt'].includes(k));
    if (otherFields.length) changes.push(`${otherFields.join(', ')} updated`);
    if (changes.length) {
      await logAudit(app.consultancyId, 'Application', app._id, 'UPDATE', req.user._id, {
        description: changes.join('; ') || 'Application updated',
        clientId: app.clientId?._id || app.clientId,
        applicationId: app._id,
        visaSubclass: app.visaSubclass,
        assignedAgentId: app.agentId?._id || app.agentId,
      });
    }
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/checklist', authenticate, async (req, res) => {
  try {
    const { index, documentId, uploaded } = req.body;
    const app = await Application.findById(req.params.id).populate('clientId', 'profile').populate('agentId', 'profile');
    if (!app) return res.status(404).json({ error: 'Not found' });
    if (req.user.role === 'STUDENT') {
      const client = app.clientId;
      if (!client || client.userId?.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not authorized' });
    }
    const checklist = app.documentChecklist || [];
    const idx = typeof index === 'number' ? index : parseInt(index, 10);
    if (idx < 0 || idx >= checklist.length) return res.status(400).json({ error: 'Invalid checklist index' });
    checklist[idx].uploaded = uploaded !== undefined ? !!uploaded : true;
    if (documentId !== undefined) checklist[idx].documentId = documentId || null;
    app.documentChecklist = checklist;
    await app.save();
    await logAudit(app.consultancyId, 'Application', app._id, 'UPDATE', req.user._id, {
      description: `Checklist item "${checklist[idx].name}" ${checklist[idx].uploaded ? 'marked uploaded' : 'unmarked'}`,
      clientId: app.clientId?._id || app.clientId,
      applicationId: app._id,
      visaSubclass: app.visaSubclass,
      assignedAgentId: app.agentId?._id || app.agentId,
    });
    const updated = await Application.findById(req.params.id).populate('clientId', 'profile').populate('agentId', 'profile').populate('notes.addedBy', 'profile');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const oldApp = await Application.findById(req.params.id).populate('clientId', 'profile');
    const app = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('clientId', 'profile').populate('agentId', 'profile');
    if (!app) return res.status(404).json({ error: 'Not found' });
    if (oldApp?.status !== status) {
      await logAudit(app.consultancyId, 'Application', app._id, 'UPDATE', req.user._id, {
        description: `Application status: ${oldApp?.status} → ${status}`,
        metadata: { clientName: app.clientId ? `${app.clientId.profile?.firstName} ${app.clientId.profile?.lastName}` : '—', visaSubclass: app.visaSubclass, userName: `${req.user.profile?.firstName} ${req.user.profile?.lastName}` },
        clientId: app.clientId?._id || app.clientId,
        applicationId: app._id,
        visaSubclass: app.visaSubclass,
        assignedAgentId: app.agentId?._id || app.agentId,
      });
      if (app.agentId && app.agentId._id?.toString() !== req.user._id.toString()) {
        await Notification.create({
          consultancyId: app.consultancyId,
          userId: app.agentId._id,
          type: 'APPLICATION_UPDATE',
          title: 'Application status updated',
          message: `${app.clientId?.profile?.firstName} ${app.clientId?.profile?.lastName} — Subclass ${app.visaSubclass}: ${status}`,
          relatedEntityType: 'Application',
          relatedEntityId: app._id,
        });
      }
    }
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/notes', authenticate, async (req, res) => {
  try {
    const app = await Application.findById(req.params.id).populate('clientId', 'profile userId').populate('agentId', 'profile');
    if (!app) return res.status(404).json({ error: 'Not found' });
    app.notes = app.notes || [];
    app.notes.push({ text: req.body.text, addedBy: req.user._id, addedAt: new Date(), isLegalAdvice: !!req.body.isLegalAdvice });
    await app.save();
    if (app.agentId && app.agentId._id?.toString() !== req.user._id.toString()) {
      await notifyUsers({
        consultancyId: app.consultancyId,
        userIds: [app.agentId._id],
        excludeUserId: req.user._id,
        type: 'APPLICATION_NOTE',
        title: 'Note added to application',
        message: `${req.user.profile?.firstName || 'Someone'} added a note to Subclass ${app.visaSubclass}`,
        relatedEntityType: 'Application',
        relatedEntityId: app._id,
      });
    }
    await logAudit(app.consultancyId, 'Application', app._id, 'UPDATE', req.user._id, {
      description: `Note added: ${(req.body.text || '').slice(0, 50)}${(req.body.text || '').length > 50 ? '...' : ''}`,
      clientId: app.clientId?._id || app.clientId,
      applicationId: app._id,
      visaSubclass: app.visaSubclass,
      assignedAgentId: app.agentId?._id || app.agentId,
    });
    const updated = await Application.findById(req.params.id).populate('clientId', 'profile').populate('agentId', 'profile').populate('notes.addedBy', 'profile');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const app = await Application.findById(req.params.id).populate('clientId', 'profile');
    if (!app) return res.status(404).json({ error: 'Not found' });
    const cid = app.consultancyId;
    await logAudit(cid, 'Application', app._id, 'DELETE', req.user._id, {
      description: `Application deleted: Subclass ${app.visaSubclass}`,
      clientId: app.clientId?._id || app.clientId,
      applicationId: app._id,
      visaSubclass: app.visaSubclass,
      assignedAgentId: app.agentId,
    });
    await Application.findByIdAndDelete(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
