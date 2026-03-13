import express from 'express';
import crypto from 'crypto';
import Client from '../models/Client.js';
import User from '../models/User.js';
import Consultancy from '../models/Consultancy.js';
import Application from '../models/Application.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import Task from '../models/Task.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import { notifyUsers } from '../utils/notify.js';
import { sendEmail } from '../utils/email.js';

function getEmailProfileForUser(consultancy, user) {
  const profiles = consultancy.emailProfiles || [];
  const active = profiles.filter(p => p.active);
  if (!active.length) return null;
  const preferredId = user?.profile?.preferredEmailProfileId;
  if (preferredId) {
    const p = active.find(ep => String(ep._id) === String(preferredId));
    if (p) return p;
  }
  const def = active.find(p => p.isDefault);
  return def || active[0];
}

const router = express.Router();

const getConsultancyId = (user) => user.profile?.consultancyId || user._id;

router.get('/', authenticate, async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    if (req.user.role === 'STUDENT') {
      const clients = await Client.find({ userId: req.user._id }).populate('assignedAgentId', 'profile');
      return res.json(clients);
    }
    let filter = req.user.role === 'SUPER_ADMIN' ? {} : { consultancyId: cid };
    if (req.user.role === 'SUPER_ADMIN' && req.query.consultancyId) {
      filter = { consultancyId: req.query.consultancyId };
    }
    const clients = await Client.find(filter).populate('assignedAgentId', 'profile').sort({ lastActivityAt: -1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/tasks', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'STUDENT') {
      const client = await Client.findById(req.params.id).select('userId');
      if (!client || client.userId?.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not authorized' });
    }
    const tasks = await Task.find({ clientId: req.params.id })
      .populate('assignedTo', 'profile').populate('createdBy', 'profile').populate('comments.addedBy', 'profile').populate('reviewedBy', 'profile')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/activity', authenticate, async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    const clientId = req.params.id;
    const baseFilter = req.user.role === 'SUPER_ADMIN' ? {} : { consultancyId: cid };
    const [appIds, taskIds, docIds] = await Promise.all([
      Application.find({ clientId }).select('_id').lean(),
      Task.find({ clientId }).select('_id').lean(),
      (await import('../models/Document.js')).default.find({ clientId }).select('_id').lean(),
    ]);
    const activityFilter = {
      ...baseFilter,
      $or: [
        { clientId },
        { entityType: 'Client', entityId: clientId },
        { entityType: 'Application', entityId: { $in: appIds.map(a => a._id) } },
        { entityType: 'Task', entityId: { $in: taskIds.map(t => t._id) } },
        { entityType: 'Document', entityId: { $in: docIds.map(d => d._id) } },
      ],
    };
    const logs = await AuditLog.find(activityFilter)
      .populate('changedBy', 'profile')
      .populate('assignedAgentId', 'profile')
      .sort({ changedAt: -1 })
      .limit(200);
    const ClientActivity = (await import('../models/ClientActivity.js')).default;
    const activities = await ClientActivity.find({ clientId })
      .populate('addedBy', 'profile')
      .populate('editedBy', 'profile')
      .sort({ addedAt: -1 })
      .limit(100);
    const merged = [
      ...logs.map(l => ({ ...l.toObject(), source: 'audit', sortAt: l.changedAt })),
      ...activities.map(a => ({ ...a.toObject(), source: 'activity', sortAt: a.addedAt, description: a.text, changedBy: a.addedBy, changedAt: a.addedAt, entityType: a.type })),
    ].sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime()).slice(0, 250);
    res.json(merged);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('assignedAgentId', 'profile')
      .populate('consultancyId')
      .populate('notes.addedBy', 'profile')
      .populate('notes.editedBy', 'profile');
    if (!client) return res.status(404).json({ error: 'Not found' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const cid = req.user.role === 'SUPER_ADMIN' && req.body.consultancyId ? req.body.consultancyId : getConsultancyId(req.user);
    if (!cid) {
      return res.status(400).json({ error: 'No consultancy assigned. Please contact admin to assign you to a consultancy.' });
    }
    const enrollNote = { text: `Enrolled on ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}`, type: 'GENERAL', addedBy: req.user._id, addedAt: new Date() };
    const body = { ...req.body, consultancyId: cid };
    if (!body.notes || !Array.isArray(body.notes)) body.notes = [];
    body.notes.unshift(enrollNote);

    const clientEmail = body.profile?.email;
    let existingUser = null;
    if (clientEmail) {
      existingUser = await User.findOne({ email: clientEmail, role: 'STUDENT' });
    }

    if (existingUser) {
      body.status = 'PENDING_ACCESS';
      body.userId = existingUser._id;
    }

    const client = await Client.create(body);

    if (existingUser) {
      await Notification.create({
        userId: existingUser._id,
        consultancyId: cid,
        type: 'ACCESS_REQUEST',
        title: 'Consultancy Access Request',
        message: 'A consultancy has requested access to your profile. Review in your dashboard.',
        relatedEntityType: 'Client',
        relatedEntityId: client._id
      });
    }

    await logAudit(cid, 'Client', client._id, 'CREATE', req.user._id, {
      description: existingUser ? `Requested access to existing student ${client.profile?.firstName} ${client.profile?.lastName}` : `Client ${client.profile?.firstName} ${client.profile?.lastName} created`,
      metadata: { clientName: `${client.profile?.firstName} ${client.profile?.lastName}`, userName: `${req.user.profile?.firstName} ${req.user.profile?.lastName}` },
      clientId: client._id,
      assignedAgentId: client.assignedAgentId,
    });
    const toNotify = [req.user._id];
    if (client.assignedAgentId && client.assignedAgentId.toString() !== req.user._id.toString()) toNotify.push(client.assignedAgentId);
    await notifyUsers({
      consultancyId: cid,
      userIds: toNotify,
      type: 'CLIENT_ADDED',
      title: 'New Client Added',
      message: `${client.profile?.firstName} ${client.profile?.lastName} enrolled`,
      relatedEntityType: 'Client',
      relatedEntityId: client._id,
    });
    res.status(201).json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const oldClient = await Client.findById(req.params.id);
    if (!oldClient) return res.status(404).json({ error: 'Not found' });
    if (req.user.role === 'STUDENT' && oldClient.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only edit your own profile' });
    }
    const cid = req.user.role === 'STUDENT' ? oldClient.consultancyId : getConsultancyId(req.user);
    const body = req.user.role === 'STUDENT'
      ? { profile: req.body.profile, education: req.body.education, experience: req.body.experience, lastActivityAt: new Date() }
      : { ...req.body, lastActivityAt: new Date() };
    const client = await Client.findByIdAndUpdate(req.params.id, body, { new: true })
      .populate('assignedAgentId', 'profile');
    await logAudit(cid, 'Client', client._id, 'UPDATE', req.user._id, {
      description: `Client ${client.profile?.firstName} ${client.profile?.lastName} updated`,
      metadata: { clientName: `${client.profile?.firstName} ${client.profile?.lastName}`, userName: `${req.user.profile?.firstName} ${req.user.profile?.lastName}` },
      clientId: client._id,
      assignedAgentId: client.assignedAgentId,
    });
    // Notify new assigned agent when assignment changes
    if (req.body.assignedAgentId && req.body.assignedAgentId.toString() !== (oldClient.assignedAgentId?.toString() || '')) {
      await notifyUsers({
        consultancyId: cid,
        userIds: [req.body.assignedAgentId],
        excludeUserId: req.user._id,
        type: 'CLIENT_ASSIGNED',
        title: 'Client Assigned to You',
        message: `${client.profile?.firstName} ${client.profile?.lastName} has been assigned to you`,
        relatedEntityType: 'Client',
        relatedEntityId: client._id,
      });
    }
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Not found' });
    const cid = getConsultancyId(req.user);
    await logAudit(cid, 'Client', client._id, 'DELETE', req.user._id, {
      description: `Client ${client.profile?.firstName} ${client.profile?.lastName} deleted`,
      metadata: { clientName: `${client.profile?.firstName} ${client.profile?.lastName}`, userName: `${req.user.profile?.firstName} ${req.user.profile?.lastName}` },
      clientId: client._id,
    });
    await Client.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/accept-access', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT') return res.status(403).json({ error: 'Only students can accept access requests' });
    
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Not found' });
    
    if (client.userId?.toString() !== req.user.id) {
       return res.status(403).json({ error: 'Not authorized for this client record' });
    }

    client.status = 'ACTIVE';
    await client.save();

    res.json({ success: true, client });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/invite', authenticate, requireRole('CONSULTANCY_ADMIN', 'MANAGER', 'AGENT', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Not found' });
    const cid = getConsultancyId(req.user);
    if (client.consultancyId?.toString() !== cid?.toString()) return res.status(403).json({ error: 'Not authorized for this client' });
    const clientEmail = client.profile?.email;
    if (!clientEmail) return res.status(400).json({ error: 'Client has no email address' });

    const token = crypto.randomBytes(32).toString('hex');
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate?token=${token}&email=${encodeURIComponent(clientEmail)}`;
    const existingUser = await User.findOne({ email: clientEmail });
    if (existingUser) {
      existingUser.invitationToken = token;
      existingUser.mustChangePassword = true;
      await existingUser.save();
    }
    await Client.findByIdAndUpdate(req.params.id, { invitationToken: token, invitationSentAt: new Date() });

    const consultancy = await Consultancy.findById(cid);
    const companyName = consultancy?.displayName || consultancy?.name || 'Your Consultancy';
    const emailProfile = consultancy ? getEmailProfileForUser(consultancy, req.user) : null;
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Client Portal Invitation</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #0d9488;">You're invited to the ${companyName} Client Portal</h2>
  <p>Dear ${client.profile?.firstName || 'Client'},</p>
  <p>${companyName} has invited you to access your migration case online. Set your password and log in to view your applications, upload documents, and track progress.</p>
  <p><a href="${inviteLink}" style="display: inline-block; background: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Activate Account</a></p>
  <p style="font-size: 12px; color: #64748b;">Or copy this link: ${inviteLink}</p>
  <p>This link is for your use only. If you did not expect this invitation, please ignore this email.</p>
  <p>Kind regards,<br/>${companyName}</p>
</body>
</html>`;
    await sendEmail({
      to: clientEmail,
      subject: `Activate your client portal - ${companyName}`,
      html,
      emailProfile: emailProfile || undefined,
    });

    await Notification.create({
      consultancyId: client.consultancyId,
      userId: client.assignedAgentId,
      type: 'INVITATION_SENT',
      title: 'Invitation Sent',
      message: `Invitation emailed to ${client.profile?.firstName} ${client.profile?.lastName}`,
      relatedEntityType: 'Client',
      relatedEntityId: client._id,
    });
    await logAudit(cid, 'Client', client._id, 'SEND', req.user._id, { description: 'Invitation emailed to client', clientId: client._id });
    res.json({ success: true, inviteLink, emailed: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/disconnect-agent', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Not found' });
    const cid = getConsultancyId(req.user);
    const canDisconnect = req.user.role === 'STUDENT' && client.userId?.toString() === req.user._id.toString() ||
      ['SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER', 'AGENT'].includes(req.user.role);
    if (!canDisconnect) return res.status(403).json({ error: 'Not authorized' });
    await Client.findByIdAndUpdate(req.params.id, {
      assignedAgentId: null,
      agentDisconnectedAt: new Date(),
      status: 'DISCONNECTED',
      lastActivityAt: new Date(),
    });
    await logAudit(cid, 'Client', client._id, 'UPDATE', req.user._id, {
      description: `Agent disconnected from client ${client.profile?.firstName} ${client.profile?.lastName}`,
      clientId: client._id,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/skill-assessments', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Not found' });
    const cid = getConsultancyId(req.user);
    client.skillAssessments = client.skillAssessments || [];
    client.skillAssessments.push({ ...req.body, requestedAt: new Date(), status: 'PENDING' });
    await client.save();
    await logAudit(cid, 'Client', client._id, 'UPDATE', req.user._id, {
      description: `Skill assessment added: ${req.body.body || 'N/A'} — ${req.body.occupation || 'N/A'}`,
      clientId: client._id,
      assignedAgentId: client.assignedAgentId,
    });
    const updated = await Client.findById(req.params.id).populate('assignedAgentId', 'profile');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/skill-assessments/:idx', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Not found' });
    const cid = getConsultancyId(req.user);
    const idx = parseInt(req.params.idx, 10);
    if (idx < 0 || idx >= (client.skillAssessments?.length || 0)) return res.status(400).json({ error: 'Invalid index' });
    const sa = client.skillAssessments[idx];
    Object.assign(sa, req.body);
    if (req.body.status === 'COMPLETED') sa.completedAt = new Date();
    await client.save();
    await logAudit(cid, 'Client', client._id, 'UPDATE', req.user._id, {
      description: `Skill assessment updated: ${sa.body} — ${req.body.status || sa.status}`,
      clientId: client._id,
      assignedAgentId: client.assignedAgentId,
    });
    const updated = await Client.findById(req.params.id).populate('assignedAgentId', 'profile');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/immigration-history', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Not found' });
    const cid = getConsultancyId(req.user);
    client.immigrationHistory = client.immigrationHistory || [];
    client.immigrationHistory.push({ ...req.body, requestedAt: new Date(), status: 'PENDING' });
    await client.save();
    await logAudit(cid, 'Client', client._id, 'UPDATE', req.user._id, {
      description: `Immigration history entry added: ${req.body.type || 'RFI/S56'}`,
      clientId: client._id,
      assignedAgentId: client.assignedAgentId,
    });
    const updated = await Client.findById(req.params.id).populate('assignedAgentId', 'profile');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/immigration-history/:idx', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Not found' });
    const cid = getConsultancyId(req.user);
    const idx = parseInt(req.params.idx, 10);
    if (idx < 0 || idx >= (client.immigrationHistory?.length || 0)) return res.status(400).json({ error: 'Invalid index' });
    Object.assign(client.immigrationHistory[idx], req.body);
    if (req.body.status === 'RESPONDED' || req.body.status === 'CLOSED') client.immigrationHistory[idx].completedAt = new Date();
    await client.save();
    await logAudit(cid, 'Client', client._id, 'UPDATE', req.user._id, {
      description: `Immigration history updated: ${req.body.status || 'status change'}`,
      clientId: client._id,
      assignedAgentId: client.assignedAgentId,
    });
    const updated = await Client.findById(req.params.id).populate('assignedAgentId', 'profile');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/notes', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Not found' });
    const cid = getConsultancyId(req.user);
    client.notes = client.notes || [];
    client.notes.push({
      text: req.body.text,
      type: req.body.type || 'GENERAL',
      addedBy: req.user._id,
      addedAt: new Date(),
      isLegalAdvice: !!req.body.isLegalAdvice,
    });
    await client.save();
    await logAudit(cid, 'Client', client._id, 'UPDATE', req.user._id, {
      description: `Note added (${req.body.type || 'GENERAL'}): ${(req.body.text || '').slice(0, 50)}${(req.body.text || '').length > 50 ? '...' : ''}`,
      clientId: client._id,
      assignedAgentId: client.assignedAgentId,
    });
    const updated = await Client.findById(req.params.id).populate('assignedAgentId', 'profile').populate('notes.addedBy', 'profile').populate('notes.editedBy', 'profile');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/notes/:idx', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Not found' });
    const cid = getConsultancyId(req.user);
    const idx = parseInt(req.params.idx, 10);
    if (idx < 0 || idx >= (client.notes?.length || 0)) return res.status(400).json({ error: 'Invalid note index' });
    client.notes[idx].text = req.body.text ?? client.notes[idx].text;
    client.notes[idx].type = req.body.type ?? client.notes[idx].type;
    client.notes[idx].editedBy = req.user._id;
    client.notes[idx].editedAt = new Date();
    await client.save();
    await logAudit(cid, 'Client', client._id, 'UPDATE', req.user._id, {
      description: `Note edited`,
      clientId: client._id,
      assignedAgentId: client.assignedAgentId,
    });
    const updated = await Client.findById(req.params.id).populate('assignedAgentId', 'profile').populate('notes.addedBy', 'profile').populate('notes.editedBy', 'profile');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/notes/:idx', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Not found' });
    const cid = getConsultancyId(req.user);
    const idx = parseInt(req.params.idx, 10);
    if (idx < 0 || idx >= (client.notes?.length || 0)) return res.status(400).json({ error: 'Invalid note index' });
    client.notes.splice(idx, 1);
    await client.save();
    await logAudit(cid, 'Client', client._id, 'UPDATE', req.user._id, {
      description: 'Note deleted',
      clientId: client._id,
      assignedAgentId: client.assignedAgentId,
    });
    const updated = await Client.findById(req.params.id).populate('assignedAgentId', 'profile').populate('notes.addedBy', 'profile').populate('notes.editedBy', 'profile');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/activities', authenticate, async (req, res) => {
  try {
    if (!req.body?.text?.trim()) return res.status(400).json({ error: 'Activity text is required' });
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Not found' });
    const cid = getConsultancyId(req.user);
    const ClientActivity = (await import('../models/ClientActivity.js')).default;
    const act = await ClientActivity.create({
      clientId: client._id,
      consultancyId: cid,
      type: req.body.type || 'NOTE',
      text: req.body.text,
      addedBy: req.user._id,
      metadata: req.body.metadata,
    });
    await logAudit(cid, 'Client', client._id, 'UPDATE', req.user._id, {
      description: `Activity added (${act.type}): ${(req.body.text || '').slice(0, 50)}...`,
      clientId: client._id,
      assignedAgentId: client.assignedAgentId,
    });
    const populated = await ClientActivity.findById(act._id).populate('addedBy', 'profile');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/activities/:aid', authenticate, async (req, res) => {
  try {
    const ClientActivity = (await import('../models/ClientActivity.js')).default;
    const act = await ClientActivity.findOne({ _id: req.params.aid, clientId: req.params.id });
    if (!act) return res.status(404).json({ error: 'Not found' });
    act.text = req.body.text ?? act.text;
    act.type = req.body.type ?? act.type;
    act.editedBy = req.user._id;
    act.editedAt = new Date();
    await act.save();
    const populated = await ClientActivity.findById(act._id).populate('addedBy', 'profile').populate('editedBy', 'profile');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/activities/:aid', authenticate, async (req, res) => {
  try {
    const ClientActivity = (await import('../models/ClientActivity.js')).default;
    const act = await ClientActivity.findOneAndDelete({ _id: req.params.aid, clientId: req.params.id });
    if (!act) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/applications', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'STUDENT') {
      const client = await Client.findById(req.params.id).select('userId');
      if (!client || client.userId?.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not authorized' });
    }
    const apps = await Application.find({ clientId: req.params.id })
      .populate('notes.addedBy', 'profile')
      .populate('sponsorId')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- NEW CRUD ROUTES FOR STUDENT DATA (CONSULTANCY/ADMIN USE) ---

// Personal / Profile
router.patch('/:id/profile', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    client.profile = { ...(client.profile || {}), ...req.body };
    await client.save();
    res.json(client);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/profile/statement', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    client.initialStatement = req.body.initialStatement;
    await client.save();
    res.json({ initialStatement: client.initialStatement });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Immigration & English
router.patch('/:id/immigration', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    client.profile = { ...(client.profile || {}), ...req.body };
    await client.save();
    res.json(client);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/english-test', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    client.englishTest = { ...(client.englishTest || {}), ...req.body };
    await client.save();
    res.json(client);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Addresses
router.patch('/:id/addresses/current', authenticate, async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, { 'profile.address': req.body }, { new: true });
    res.json(client.profile.address);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/addresses', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    client.previousAddresses = client.previousAddresses || [];
    client.previousAddresses.push(req.body);
    await client.save();
    res.json(client.previousAddresses);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/addresses/:addrId', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    client.previousAddresses = (client.previousAddresses || []).filter(a => a._id.toString() !== req.params.addrId);
    await client.save();
    res.json(client.previousAddresses);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Education
router.post('/:id/education', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    client.education.push(req.body);
    await client.save();
    res.json(client);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/education/:eduId', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    client.education = client.education.filter(e => e._id.toString() !== req.params.eduId);
    await client.save();
    res.json(client);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Work Experience
router.post('/:id/experience', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    client.experience.push(req.body);
    await client.save();
    res.json(client);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/experience/:expId', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    client.experience = client.experience.filter(e => e._id.toString() !== req.params.expId);
    await client.save();
    res.json(client);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Travel History
router.post('/:id/travel-history', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    client.travelHistory.push(req.body);
    await client.save();
    res.json(client);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/travel-history/:travId', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    client.travelHistory = client.travelHistory.filter(e => e._id.toString() !== req.params.travId);
    await client.save();
    res.json(client);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Family Members
router.post('/:id/family-members', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    client.familyMembers.push(req.body);
    await client.save();
    res.json(client.familyMembers);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/family-members/:memId', authenticate, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    client.familyMembers = client.familyMembers.filter(m => m._id.toString() !== req.params.memId);
    await client.save();
    res.json(client.familyMembers);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Skills & Health
router.patch('/:id/skills', authenticate, async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, { skillsData: req.body }, { new: true });
    res.json(client);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/health', authenticate, async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, { healthData: req.body }, { new: true });
    res.json(client);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
