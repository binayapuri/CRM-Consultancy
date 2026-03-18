import crypto from 'crypto';
import Client from '../../shared/models/Client.js';
import User from '../../shared/models/User.js';
import Consultancy from '../../shared/models/Consultancy.js';
import Application from '../../shared/models/Application.js';
import Notification from '../../shared/models/Notification.js';
import AuditLog from '../../shared/models/AuditLog.js';
import Task from '../../shared/models/Task.js';
import { logAudit } from '../../shared/utils/audit.js';
import { notifyUsers } from '../../shared/utils/notify.js';
import { sendEmail } from '../../shared/utils/email.js';

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

const getConsultancyId = (user) => user.profile?.consultancyId || user._id;

export class ClientService {
  static async getAll(user, queryCid) {
    const cid = getConsultancyId(user);
    if (user.role === 'STUDENT') {
      return Client.find({ userId: user._id }).populate('assignedAgentId', 'profile');
    }
    let filter = user.role === 'SUPER_ADMIN' ? {} : { consultancyId: cid };
    if (user.role === 'SUPER_ADMIN' && queryCid) {
      filter = { consultancyId: queryCid };
    }
    return Client.find(filter).populate('assignedAgentId', 'profile').sort({ lastActivityAt: -1 });
  }

  static async getTasks(clientId, user) {
    if (user.role === 'STUDENT') {
      const client = await Client.findById(clientId).select('userId');
      if (!client || client.userId?.toString() !== user._id.toString()) throw Object.assign(new Error('Not authorized'), { status: 403 });
    }
    return Task.find({ clientId })
      .populate('assignedTo', 'profile').populate('createdBy', 'profile')
      .populate('comments.addedBy', 'profile').populate('reviewedBy', 'profile')
      .sort({ createdAt: -1 });
  }

  static async getActivity(clientId, user) {
    const cid = getConsultancyId(user);
    const baseFilter = user.role === 'SUPER_ADMIN' ? {} : { consultancyId: cid };
    const [appIds, taskIds, docIds] = await Promise.all([
      Application.find({ clientId }).select('_id').lean(),
      Task.find({ clientId }).select('_id').lean(),
      (await import('../../shared/models/Document.js')).default.find({ clientId }).select('_id').lean(),
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
      .populate('changedBy', 'profile').populate('assignedAgentId', 'profile')
      .sort({ changedAt: -1 }).limit(200);
    const ClientActivity = (await import('../../shared/models/ClientActivity.js')).default;
    const activities = await ClientActivity.find({ clientId })
      .populate('addedBy', 'profile').populate('editedBy', 'profile')
      .sort({ addedAt: -1 }).limit(100);
    const merged = [
      ...logs.map(l => ({ ...l.toObject(), source: 'audit', sortAt: l.changedAt })),
      ...activities.map(a => ({ ...a.toObject(), source: 'activity', sortAt: a.addedAt, description: a.text, changedBy: a.addedBy, changedAt: a.addedAt, entityType: a.type })),
    ].sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime()).slice(0, 250);
    return merged;
  }

  static async getById(id) {
    const client = await Client.findById(id)
      .populate('assignedAgentId', 'profile')
      .populate('consultancyId')
      .populate('notes.addedBy', 'profile')
      .populate('notes.editedBy', 'profile');
    if (!client) throw Object.assign(new Error('Not found'), { status: 404 });
    return client;
  }

  static async getApplications(clientId, user) {
    if (user.role === 'STUDENT') {
      const client = await Client.findById(clientId).select('userId');
      if (!client || client.userId?.toString() !== user._id.toString()) throw Object.assign(new Error('Not authorized'), { status: 403 });
    }
    return Application.find({ clientId }).populate('notes.addedBy', 'profile').populate('sponsorId').sort({ createdAt: -1 });
  }

  static async create(data, user) {
    const cid = user.role === 'SUPER_ADMIN' && data.consultancyId ? data.consultancyId : getConsultancyId(user);
    if (!cid) throw Object.assign(new Error('No consultancy assigned.'), { status: 400 });
    const enrollNote = { text: `Enrolled on ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}`, type: 'GENERAL', addedBy: user._id, addedAt: new Date() };
    const body = { ...data, consultancyId: cid };
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

    await logAudit(cid, 'Client', client._id, 'CREATE', user._id, {
      description: existingUser ? `Requested access to existing student ${client.profile?.firstName} ${client.profile?.lastName}` : `Client ${client.profile?.firstName} ${client.profile?.lastName} created`,
      metadata: { clientName: `${client.profile?.firstName} ${client.profile?.lastName}`, userName: `${user.profile?.firstName} ${user.profile?.lastName}` },
      clientId: client._id, assignedAgentId: client.assignedAgentId,
    });
    
    const toNotify = [user._id];
    if (client.assignedAgentId && client.assignedAgentId.toString() !== user._id.toString()) toNotify.push(client.assignedAgentId);
    await notifyUsers({
      consultancyId: cid,
      userIds: toNotify,
      type: 'CLIENT_ADDED',
      title: 'New Client Added',
      message: `${client.profile?.firstName} ${client.profile?.lastName} enrolled`,
      relatedEntityType: 'Client', relatedEntityId: client._id,
    });
    return client;
  }

  static async update(id, data, user) {
    const oldClient = await Client.findById(id);
    if (!oldClient) throw Object.assign(new Error('Not found'), { status: 404 });
    if (user.role === 'STUDENT' && oldClient.userId?.toString() !== user._id.toString()) {
      throw Object.assign(new Error('You can only edit your own profile'), { status: 403 });
    }
    const cid = user.role === 'STUDENT' ? oldClient.consultancyId : getConsultancyId(user);
    const body = user.role === 'STUDENT'
      ? { profile: data.profile, education: data.education, experience: data.experience, lastActivityAt: new Date() }
      : { ...data, lastActivityAt: new Date() };

    const client = await Client.findByIdAndUpdate(id, body, { new: true }).populate('assignedAgentId', 'profile');
    
    await logAudit(cid, 'Client', client._id, 'UPDATE', user._id, {
      description: `Client ${client.profile?.firstName} ${client.profile?.lastName} updated`,
      metadata: { clientName: `${client.profile?.firstName} ${client.profile?.lastName}`, userName: `${user.profile?.firstName} ${user.profile?.lastName}` },
      clientId: client._id, assignedAgentId: client.assignedAgentId,
    });
    
    if (data.assignedAgentId && data.assignedAgentId.toString() !== (oldClient.assignedAgentId?.toString() || '')) {
      await notifyUsers({
        consultancyId: cid,
        userIds: [data.assignedAgentId],
        excludeUserId: user._id,
        type: 'CLIENT_ASSIGNED',
        title: 'Client Assigned to You',
        message: `${client.profile?.firstName} ${client.profile?.lastName} has been assigned to you`,
        relatedEntityType: 'Client', relatedEntityId: client._id,
      });
    }
    return client;
  }

  static async delete(id, user) {
    const client = await Client.findById(id);
    if (!client) throw Object.assign(new Error('Not found'), { status: 404 });
    const cid = getConsultancyId(user);
    await logAudit(cid, 'Client', client._id, 'DELETE', user._id, {
      description: `Client ${client.profile?.firstName} ${client.profile?.lastName} deleted`,
      metadata: { clientName: `${client.profile?.firstName} ${client.profile?.lastName}`, userName: `${user.profile?.firstName} ${user.profile?.lastName}` },
      clientId: client._id,
    });
    await Client.findByIdAndDelete(id);
    return { success: true };
  }

  static async acceptAccess(id, user) {
    if (user.role !== 'STUDENT') throw Object.assign(new Error('Only students can accept access requests'), { status: 403 });
    const client = await Client.findById(id);
    if (!client) throw Object.assign(new Error('Not found'), { status: 404 });
    if (client.userId?.toString() !== user.id.toString()) throw Object.assign(new Error('Not authorized'), { status: 403 });
    client.status = 'ACTIVE';
    await client.save();
    return { success: true, client };
  }

  static async invite(id, user) {
    const client = await Client.findById(id);
    if (!client) throw Object.assign(new Error('Not found'), { status: 404 });
    const cid = getConsultancyId(user);
    if (client.consultancyId?.toString() !== cid?.toString()) throw Object.assign(new Error('Not authorized for this client'), { status: 403 });
    const clientEmail = client.profile?.email;
    if (!clientEmail) throw Object.assign(new Error('Client has no email address'), { status: 400 });

    const token = crypto.randomBytes(32).toString('hex');
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate?token=${token}&email=${encodeURIComponent(clientEmail)}`;
    const existingUser = await User.findOne({ email: clientEmail });
    if (existingUser) {
      existingUser.invitationToken = token;
      existingUser.mustChangePassword = true;
      await existingUser.save();
    }
    await Client.findByIdAndUpdate(id, { invitationToken: token, invitationSentAt: new Date() });

    const consultancy = await Consultancy.findById(cid);
    const companyName = consultancy?.displayName || consultancy?.name || 'Your Consultancy';
    const emailProfile = consultancy ? getEmailProfileForUser(consultancy, user) : null;
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
      to: clientEmail, subject: `Activate your client portal - ${companyName}`,
      html, emailProfile: emailProfile || undefined,
    });
    
    await Notification.create({
      consultancyId: client.consultancyId, userId: client.assignedAgentId,
      type: 'INVITATION_SENT', title: 'Invitation Sent',
      message: `Invitation emailed to ${client.profile?.firstName} ${client.profile?.lastName}`,
      relatedEntityType: 'Client', relatedEntityId: client._id,
    });
    await logAudit(cid, 'Client', client._id, 'SEND', user._id, { description: 'Invitation emailed to client', clientId: client._id });
    return { success: true, inviteLink, emailed: true };
  }

  static async disconnectAgent(id, user) {
    const client = await Client.findById(id);
    if (!client) throw Object.assign(new Error('Not found'), { status: 404 });
    const cid = getConsultancyId(user);
    const canDisconnect = (user.role === 'STUDENT' && client.userId?.toString() === user._id.toString()) ||
      ['SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER', 'AGENT'].includes(user.role);
    if (!canDisconnect) throw Object.assign(new Error('Not authorized'), { status: 403 });
    
    await Client.findByIdAndUpdate(id, {
      assignedAgentId: null, agentDisconnectedAt: new Date(),
      status: 'DISCONNECTED', lastActivityAt: new Date(),
    });
    await logAudit(cid, 'Client', client._id, 'UPDATE', user._id, {
      description: `Agent disconnected from client ${client.profile?.firstName} ${client.profile?.lastName}`,
      clientId: client._id,
    });
    return { success: true };
  }

  static async addSkillAssessment(id, data, user) {
    const client = await Client.findById(id);
    if (!client) throw Object.assign(new Error('Not found'), { status: 404 });
    const cid = getConsultancyId(user);
    client.skillAssessments = client.skillAssessments || [];
    client.skillAssessments.push({ ...data, requestedAt: new Date(), status: 'PENDING' });
    await client.save();
    await logAudit(cid, 'Client', client._id, 'UPDATE', user._id, {
      description: `Skill assessment added: ${data.body || 'N/A'} — ${data.occupation || 'N/A'}`,
      clientId: client._id, assignedAgentId: client.assignedAgentId,
    });
    return Client.findById(id).populate('assignedAgentId', 'profile');
  }

  static async updateSkillAssessment(id, idx, data, user) {
    const client = await Client.findById(id);
    if (!client) throw Object.assign(new Error('Not found'), { status: 404 });
    const idxNum = parseInt(idx, 10);
    if (idxNum < 0 || idxNum >= (client.skillAssessments?.length || 0)) throw Object.assign(new Error('Invalid index'), { status: 400 });
    const cid = getConsultancyId(user);
    const sa = client.skillAssessments[idxNum];
    Object.assign(sa, data);
    if (data.status === 'COMPLETED') sa.completedAt = new Date();
    await client.save();
    await logAudit(cid, 'Client', client._id, 'UPDATE', user._id, {
      description: `Skill assessment updated: ${sa.body} — ${data.status || sa.status}`,
      clientId: client._id, assignedAgentId: client.assignedAgentId,
    });
    return Client.findById(id).populate('assignedAgentId', 'profile');
  }

  static async addImmigrationHistory(id, data, user) {
    const client = await Client.findById(id);
    if (!client) throw Object.assign(new Error('Not found'), { status: 404 });
    const cid = getConsultancyId(user);
    client.immigrationHistory = client.immigrationHistory || [];
    client.immigrationHistory.push({ ...data, requestedAt: new Date(), status: 'PENDING' });
    await client.save();
    await logAudit(cid, 'Client', client._id, 'UPDATE', user._id, {
      description: `Immigration history entry added: ${data.type || 'RFI/S56'}`,
      clientId: client._id, assignedAgentId: client.assignedAgentId,
    });
    return Client.findById(id).populate('assignedAgentId', 'profile');
  }

  static async updateImmigrationHistory(id, idx, data, user) {
    const client = await Client.findById(id);
    if (!client) throw Object.assign(new Error('Not found'), { status: 404 });
    const idxNum = parseInt(idx, 10);
    if (idxNum < 0 || idxNum >= (client.immigrationHistory?.length || 0)) throw Object.assign(new Error('Invalid index'), { status: 400 });
    const cid = getConsultancyId(user);
    Object.assign(client.immigrationHistory[idxNum], data);
    if (data.status === 'RESPONDED' || data.status === 'CLOSED') client.immigrationHistory[idxNum].completedAt = new Date();
    await client.save();
    await logAudit(cid, 'Client', client._id, 'UPDATE', user._id, {
      description: `Immigration history updated: ${data.status || 'status change'}`,
      clientId: client._id, assignedAgentId: client.assignedAgentId,
    });
    return Client.findById(id).populate('assignedAgentId', 'profile');
  }

  static async addActivity(id, data, user) {
    const client = await Client.findById(id);
    if (!client) throw Object.assign(new Error('Not found'), { status: 404 });
    const cid = getConsultancyId(user);
    const ClientActivity = (await import('../../shared/models/ClientActivity.js')).default;
    const act = await ClientActivity.create({
      clientId: client._id, consultancyId: cid,
      type: data.type || 'NOTE', text: data.text,
      addedBy: user._id, metadata: data.metadata,
    });
    await logAudit(cid, 'Client', client._id, 'UPDATE', user._id, {
      description: `Activity added (${act.type}): ${(data.text || '').slice(0, 50)}...`,
      clientId: client._id, assignedAgentId: client.assignedAgentId,
    });
    return ClientActivity.findById(act._id).populate('addedBy', 'profile');
  }

  static async updateActivity(id, aid, data, user) {
    const ClientActivity = (await import('../../shared/models/ClientActivity.js')).default;
    const act = await ClientActivity.findOne({ _id: aid, clientId: id });
    if (!act) throw Object.assign(new Error('Not found'), { status: 404 });
    act.text = data.text ?? act.text;
    act.type = data.type ?? act.type;
    act.editedBy = user._id;
    act.editedAt = new Date();
    await act.save();
    return ClientActivity.findById(act._id).populate('addedBy', 'profile').populate('editedBy', 'profile');
  }

  static async deleteActivity(id, aid, user) {
    const ClientActivity = (await import('../../shared/models/ClientActivity.js')).default;
    const act = await ClientActivity.findOneAndDelete({ _id: aid, clientId: id });
    if (!act) throw Object.assign(new Error('Not found'), { status: 404 });
    return { deleted: true };
  }

  static async addNote(id, data, user) {
    const client = await Client.findById(id);
    if (!client) throw Object.assign(new Error('Not found'), { status: 404 });
    const cid = getConsultancyId(user);
    client.notes = client.notes || [];
    client.notes.push({
      text: data.text, type: data.type || 'GENERAL',
      addedBy: user._id, addedAt: new Date(), isLegalAdvice: !!data.isLegalAdvice,
    });
    await client.save();
    await logAudit(cid, 'Client', client._id, 'UPDATE', user._id, {
      description: `Note added (${data.type || 'GENERAL'}): ${(data.text || '').slice(0, 50)}`,
      clientId: client._id, assignedAgentId: client.assignedAgentId,
    });
    return Client.findById(id).populate('assignedAgentId', 'profile').populate('notes.addedBy', 'profile').populate('notes.editedBy', 'profile');
  }

  static async updateNote(id, idx, data, user) {
    const client = await Client.findById(id);
    if (!client) throw Object.assign(new Error('Not found'), { status: 404 });
    const idxNum = parseInt(idx, 10);
    if (idxNum < 0 || idxNum >= (client.notes?.length || 0)) throw Object.assign(new Error('Invalid note index'), { status: 400 });
    const cid = getConsultancyId(user);
    client.notes[idxNum].text = data.text ?? client.notes[idxNum].text;
    client.notes[idxNum].type = data.type ?? client.notes[idxNum].type;
    client.notes[idxNum].editedBy = user._id;
    client.notes[idxNum].editedAt = new Date();
    await client.save();
    await logAudit(cid, 'Client', client._id, 'UPDATE', user._id, {
      description: `Note edited`, clientId: client._id, assignedAgentId: client.assignedAgentId,
    });
    return Client.findById(id).populate('assignedAgentId', 'profile').populate('notes.addedBy', 'profile').populate('notes.editedBy', 'profile');
  }

  static async deleteNote(id, idx, user) {
    const client = await Client.findById(id);
    if (!client) throw Object.assign(new Error('Not found'), { status: 404 });
    const idxNum = parseInt(idx, 10);
    if (idxNum < 0 || idxNum >= (client.notes?.length || 0)) throw Object.assign(new Error('Invalid note index'), { status: 400 });
    const cid = getConsultancyId(user);
    client.notes.splice(idxNum, 1);
    await client.save();
    await logAudit(cid, 'Client', client._id, 'UPDATE', user._id, {
      description: 'Note deleted', clientId: client._id, assignedAgentId: client.assignedAgentId,
    });
    return Client.findById(id).populate('assignedAgentId', 'profile').populate('notes.addedBy', 'profile').populate('notes.editedBy', 'profile');
  }

  static async updateNestedProfile(id, data, key) {
    const client = await Client.findById(id);
    if (!client) throw Object.assign(new Error('Client not found'), { status: 404 });
    if (key) {
      client[key] = { ...(client[key] || {}), ...data };
    } else {
      Object.assign(client, data);
    }
    await client.save();
    return key ? client[key] : client;
  }

  static async appendArrayItem(id, data, arrayKey) {
    const client = await Client.findById(id);
    if (!client) throw Object.assign(new Error('Client not found'), { status: 404 });
    client[arrayKey] = client[arrayKey] || [];
    client[arrayKey].push(data);
    await client.save();
    return arrayKey === 'profile.address' ? client.profile.address : (client[arrayKey].length === 1 ? client : client[arrayKey]);
  }

  static async deleteArrayItem(id, itemId, arrayKey) {
    const client = await Client.findById(id);
    if (!client) throw Object.assign(new Error('Client not found'), { status: 404 });
    client[arrayKey] = (client[arrayKey] || []).filter(e => e._id.toString() !== itemId);
    await client.save();
    return client[arrayKey];
  }
}
