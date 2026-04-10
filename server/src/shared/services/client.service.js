import crypto from 'crypto';
import Client from '../../shared/models/Client.js';
import User from '../../shared/models/User.js';
import Consultancy from '../../shared/models/Consultancy.js';
import Application from '../../shared/models/Application.js';
import AuditLog from '../../shared/models/AuditLog.js';
import Task from '../../shared/models/Task.js';
import Document from '../../shared/models/Document.js';
import ConsultancyCampaignLog from '../../shared/models/ConsultancyCampaignLog.js';
import ConsultancyCampaignRecipientLog from '../../shared/models/ConsultancyCampaignRecipientLog.js';
import { logAudit } from '../../shared/utils/audit.js';
import { createNotification, notifyUsers } from '../../shared/utils/notify.js';
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

function assertConsultancyClientAccess(client, user) {
  if (!user || user.role === 'STUDENT') return;
  if (user.role === 'SUPER_ADMIN') return;
  const cid = getConsultancyId(user);
  if (!client.consultancyId || client.consultancyId.toString() !== cid?.toString()) {
    throw Object.assign(new Error('Not authorized'), { status: 403 });
  }
  const ub = user.profile?.branchId;
  // Only enforce branch scoping when the client is assigned to a branch. Unassigned
  // clients (no branch) remain visible to all staff of the consultancy.
  if (ub && client.branchId && client.branchId.toString() !== ub.toString()) {
    throw Object.assign(new Error('Not authorized for this branch'), { status: 403 });
  }
}

const addYears = (date, years) => {
  const next = new Date(date || Date.now());
  next.setFullYear(next.getFullYear() + years);
  return next;
};

function normalizeComplianceFields(data = {}, existingClient = null) {
  const next = { ...data };
  const existingPrivacy = existingClient?.privacyConsent?.toObject?.() || existingClient?.privacyConsent || {};
  const existingRetention = existingClient?.retention?.toObject?.() || existingClient?.retention || {};

  if (data.privacyConsent || existingClient?.privacyConsent) {
    const privacyConsent = { ...existingPrivacy, ...(data.privacyConsent || {}) };
    if ((privacyConsent.dataCollection || privacyConsent.dataSharing || privacyConsent.marketing) && !privacyConsent.consentedAt) {
      privacyConsent.consentedAt = new Date();
    }
    if ((privacyConsent.dataCollection || privacyConsent.dataSharing || privacyConsent.marketing) && !privacyConsent.consentSource) {
      privacyConsent.consentSource = 'PORTAL';
    }
    next.privacyConsent = privacyConsent;
  }

  if (data.retention || existingClient?.retention || data.status === 'ARCHIVED') {
    const retention = { ...existingRetention, ...(data.retention || {}) };
    const lastTouch = existingClient?.lastActivityAt || existingClient?.updatedAt || new Date();
    if (!retention.archiveEligibleAt) retention.archiveEligibleAt = addYears(lastTouch, 7);
    if (data.retention) retention.lastReviewedAt = retention.lastReviewedAt || new Date();
    if (retention.archiveStatus === 'ARCHIVED' || data.status === 'ARCHIVED') {
      retention.archiveStatus = 'ARCHIVED';
      retention.archivedAt = retention.archivedAt || new Date();
      next.status = 'ARCHIVED';
    } else if (retention.archiveStatus && retention.archiveStatus !== 'ARCHIVED' && existingClient?.status === 'ARCHIVED') {
      next.status = 'ACTIVE';
      retention.archivedAt = undefined;
    }
    next.retention = retention;
  }

  return next;
}

function renderMergeTemplate(template = '', context = {}) {
  return String(template).replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key) => {
    const value = key.split('.').reduce((acc, part) => acc?.[part], context);
    return value == null ? '' : String(value);
  });
}

export const CAMPAIGN_TEMPLATES = {
  VISA_EXPIRY_30: {
    label: 'Visa Expiry Reminder',
    description: 'Remind clients whose current visa is expiring within 30 days.',
    subject: 'Important: your visa is expiring on {{dueDate}}',
    body: 'Hi {{firstName}},\n\nOur records show your current visa is due to expire on {{dueDate}}.\nPlease reply with any updates and book time with {{agentName}} if you need help preparing the next steps.\n\nCurrent visa: {{currentVisa}}\n\nKind regards,\n{{agentName}}\n{{consultancyName}}',
  },
  DOCUMENT_EXPIRY_30: {
    label: 'Document Expiry Reminder',
    description: 'Contact clients with key documents expiring soon.',
    subject: 'Action needed: {{deadlineType}} expires on {{dueDate}}',
    body: 'Hi {{firstName}},\n\nThis is a reminder that your {{deadlineType}} is due to expire on {{dueDate}}.\nPlease upload the renewed document to the portal or reply to this email if you need support.\n\nKind regards,\n{{agentName}}\n{{consultancyName}}',
  },
  RFI_RESPONSE_7: {
    label: 'RFI Response Reminder',
    description: 'Remind clients with an information request due within 7 days.',
    subject: 'Urgent: response due by {{dueDate}}',
    body: 'Hi {{firstName}},\n\nWe have an outstanding {{deadlineType}} that requires your response by {{dueDate}}.\nPlease review the request and send the required information as soon as possible so we can respond on time.\n\n{{deadlineNote}}\n\nKind regards,\n{{agentName}}\n{{consultancyName}}',
  },
  PRIVACY_CONSENT_GAP: {
    label: 'Privacy Consent Follow-up',
    description: 'Follow up with clients who still need consent captured.',
    subject: 'Please confirm your privacy consent with {{consultancyName}}',
    body: 'Hi {{firstName}},\n\nBefore we proceed with further casework, we need to confirm your consent for data collection and case-related information sharing.\nPlease reply to this email or confirm through the portal so we can keep your file compliant.\n\nKind regards,\n{{agentName}}\n{{consultancyName}}',
  },
};

function formatDisplayDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getTrackingBaseUrl() {
  return String(
    process.env.BACKEND_PUBLIC_URL ||
    process.env.API_PUBLIC_URL ||
    process.env.APP_BASE_URL ||
    process.env.FRONTEND_URL ||
    `http://localhost:${process.env.PORT || 4000}`
  ).replace(/\/$/, '');
}

function appendTrackingPixel(html = '', openToken) {
  if (!openToken) return html;
  const trackingUrl = `${getTrackingBaseUrl()}/api/tracking/email-open/${openToken}.gif`;
  return `${html}<img src="${trackingUrl}" alt="" width="1" height="1" style="display:none;" />`;
}

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
    const ub = user.profile?.branchId;
    if (ub && user.role !== 'SUPER_ADMIN') {
      filter = { ...filter, branchId: ub };
    }
    return Client.find(filter).populate('assignedAgentId', 'profile').populate('branchId').sort({ lastActivityAt: -1 });
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

  static async getById(id, user) {
    const client = await Client.findById(id)
      .populate('assignedAgentId', 'profile')
      .populate('consultancyId')
      .populate('branchId')
      .populate('notes.addedBy', 'profile')
      .populate('notes.editedBy', 'profile');
    if (!client) throw Object.assign(new Error('Not found'), { status: 404 });
    if (user) assertConsultancyClientAccess(client, user);
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
    const body = normalizeComplianceFields({ ...data, consultancyId: cid });
    if (!body.branchId && user.profile?.branchId) {
      body.branchId = user.profile.branchId;
    }
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
      await createNotification({
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
    if (user.role !== 'STUDENT') assertConsultancyClientAccess(oldClient, user);
    const cid = user.role === 'STUDENT' ? oldClient.consultancyId : getConsultancyId(user);
    const body = user.role === 'STUDENT'
      ? { profile: data.profile, education: data.education, experience: data.experience, lastActivityAt: new Date() }
      : { ...data, lastActivityAt: new Date() };
    const normalizedBody = user.role === 'STUDENT' ? body : normalizeComplianceFields(body, oldClient);

    const client = await Client.findByIdAndUpdate(id, normalizedBody, { new: true }).populate('assignedAgentId', 'profile');
    
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
    if (user.role !== 'SUPER_ADMIN') {
      assertConsultancyClientAccess(client, user);
      if (user.role !== 'CONSULTANCY_ADMIN') {
        throw Object.assign(new Error('Only consultancy admin can delete a client record'), { status: 403 });
      }
    }
    const cid = getConsultancyId(user);
    await logAudit(cid, 'Client', client._id, 'DELETE', user._id, {
      description: `Client ${client.profile?.firstName} ${client.profile?.lastName} deleted`,
      metadata: { clientName: `${client.profile?.firstName} ${client.profile?.lastName}`, userName: `${user.profile?.firstName} ${user.profile?.lastName}` },
      clientId: client._id,
    });
    await Client.findByIdAndDelete(id);
    return { success: true };
  }

  /**
   * Disconnect linked student user from the CRM client record — they lose portal access;
   * consultancy keeps the file. Super admin or consultancy staff (admin/manager/agent).
   */
  static async removeFromPortal(id, user) {
    const client = await Client.findById(id);
    if (!client) throw Object.assign(new Error('Not found'), { status: 404 });
    if (user.role !== 'SUPER_ADMIN') {
      assertConsultancyClientAccess(client, user);
      if (!['CONSULTANCY_ADMIN', 'MANAGER', 'AGENT'].includes(user.role)) {
        throw Object.assign(new Error('Only admins or agents can remove portal access'), { status: 403 });
      }
    }
    client.userId = null;
    client.status = 'DISCONNECTED';
    client.invitationToken = undefined;
    await client.save();
    if (client.consultancyId) {
      await logAudit(client.consultancyId, 'Client', client._id, 'PORTAL_REMOVED', user._id, {
        description: `Portal access removed for ${client.profile?.firstName} ${client.profile?.lastName}`,
        clientId: client._id,
      });
    }
    return client;
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
    
    await createNotification({
      consultancyId: client.consultancyId, userId: client.assignedAgentId,
      type: 'INVITATION_SENT', title: 'Invitation Sent',
      message: `Invitation emailed to ${client.profile?.firstName} ${client.profile?.lastName}`,
      relatedEntityType: 'Client', relatedEntityId: client._id,
    });
    await logAudit(cid, 'Client', client._id, 'SEND', user._id, { description: 'Invitation emailed to client', clientId: client._id });
    return { success: true, inviteLink, emailed: true };
  }

  static async previewBulkEmail(payload, user) {
    const cid = user.role === 'SUPER_ADMIN' && payload.consultancyId ? payload.consultancyId : getConsultancyId(user);
    const clients = await Client.find({
      _id: { $in: payload.clientIds || [] },
      consultancyId: cid,
    })
      .populate('assignedAgentId', 'profile')
      .limit(5);
    const consultancy = await Consultancy.findById(cid).select('name displayName');
    const consultancyName = consultancy?.displayName || consultancy?.name || 'Your Consultancy';
    const agentName = `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim();

    const recipients = clients.map((client) => {
      const extra = payload.mergeData?.[String(client._id)] || {};
      const context = {
        firstName: client.profile?.firstName || '',
        lastName: client.profile?.lastName || '',
        fullName: `${client.profile?.firstName || ''} ${client.profile?.lastName || ''}`.trim(),
        email: client.profile?.email || '',
        currentVisa: client.profile?.currentVisa || '',
        targetVisa: client.profile?.targetVisa || '',
        agentName,
        consultancyName,
        ...extra,
      };
      return {
        clientId: client._id,
        name: context.fullName,
        email: context.email,
        subject: renderMergeTemplate(payload.subject, context),
        body: renderMergeTemplate(payload.body, context),
      };
    });

    return {
      totalRecipients: payload.clientIds?.length || 0,
      previewRecipients: recipients,
      placeholders: ['{{firstName}}', '{{lastName}}', '{{fullName}}', '{{email}}', '{{currentVisa}}', '{{targetVisa}}', '{{agentName}}', '{{consultancyName}}', '{{dueDate}}', '{{deadlineType}}', '{{deadlineNote}}'],
    };
  }

  static async sendBulkEmail(payload, user) {
    const cid = user.role === 'SUPER_ADMIN' && payload.consultancyId ? payload.consultancyId : getConsultancyId(user);
    const clients = await Client.find({
      _id: { $in: payload.clientIds || [] },
      consultancyId: cid,
      'profile.email': { $exists: true, $ne: '' },
    }).populate('assignedAgentId', 'profile');
    const consultancy = await Consultancy.findById(cid);
    const consultancyName = consultancy?.displayName || consultancy?.name || 'Your Consultancy';
    const agentName = `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim();
    const emailProfile = consultancy ? getEmailProfileForUser(consultancy, user) : null;

    let sent = 0;
    let failed = 0;
    const recipientClientIds = [];
    const recipientEmails = [];
    const campaignLog = await ConsultancyCampaignLog.create({
      consultancyId: cid,
      createdBy: user._id,
      campaignKey: payload.campaignKey || 'CUSTOM_BULK_EMAIL',
      campaignLabel: payload.campaignLabel || (payload.campaignKey ? String(payload.campaignKey).replace(/_/g, ' ') : 'Custom Bulk Email'),
      audienceCount: payload.clientIds?.length || clients.length,
      sentCount: 0,
      failedCount: 0,
      openedCount: 0,
      subject: payload.subject || '',
      bodySnapshot: payload.body || '',
      recipientClientIds: [],
      recipientEmails: [],
      metadata: {
        mergeFieldsUsed: Object.keys(payload.mergeData || {}).length,
        mergeData: payload.mergeData || {},
        triggerSource: payload.triggerSource || 'MANUAL',
        scheduledRun: !!payload.scheduledRun,
        scheduleKey: payload.scheduleKey || null,
        audienceSnapshot: Array.isArray(payload.audience) && payload.audience.length
          ? payload.audience
          : clients.map((client) => ({
            clientId: String(client._id),
            name: `${client.profile?.firstName || ''} ${client.profile?.lastName || ''}`.trim(),
            email: client.profile?.email || '',
          })),
      },
    });

    for (const client of clients) {
      const extra = payload.mergeData?.[String(client._id)] || {};
      const context = {
        firstName: client.profile?.firstName || '',
        lastName: client.profile?.lastName || '',
        fullName: `${client.profile?.firstName || ''} ${client.profile?.lastName || ''}`.trim(),
        email: client.profile?.email || '',
        currentVisa: client.profile?.currentVisa || '',
        targetVisa: client.profile?.targetVisa || '',
        agentName,
        consultancyName,
        ...extra,
      };
      const subject = renderMergeTemplate(payload.subject, context);
      const openToken = crypto.randomBytes(24).toString('hex');
      const htmlBody = appendTrackingPixel(
        renderMergeTemplate(payload.body, context).replace(/\n/g, '<br/>'),
        openToken
      );
      try {
        const info = await sendEmail({
          to: client.profile?.email,
          subject,
          html: htmlBody,
          emailProfile: emailProfile || undefined,
        });
        await ConsultancyCampaignRecipientLog.create({
          campaignLogId: campaignLog._id,
          consultancyId: cid,
          clientId: client._id,
          email: client.profile?.email,
          subject,
          messageId: info?.messageId || '',
          openToken,
          status: 'SENT',
          sentAt: new Date(),
        });
        await logAudit(cid, 'Client', client._id, 'SEND', user._id, {
          description: `Bulk email sent to ${context.fullName || client.profile?.email}`,
          clientId: client._id,
          assignedAgentId: client.assignedAgentId,
          metadata: { subject, channel: 'EMAIL_BULK', campaignKey: payload.campaignKey || 'CUSTOM_BULK_EMAIL' },
        });
        recipientClientIds.push(client._id);
        recipientEmails.push(client.profile?.email);
        sent += 1;
      } catch (error) {
        await ConsultancyCampaignRecipientLog.create({
          campaignLogId: campaignLog._id,
          consultancyId: cid,
          clientId: client._id,
          email: client.profile?.email,
          subject,
          openToken,
          status: 'FAILED',
          errorMessage: error?.message || 'Unknown email delivery error',
        });
        failed += 1;
      }
    }

    await ConsultancyCampaignLog.updateOne({ _id: campaignLog._id }, {
      $set: {
        sentCount: sent,
        failedCount: failed,
        recipientClientIds,
        recipientEmails: recipientEmails.filter(Boolean),
      },
    });

    return {
      success: true,
      sent,
      sentCount: sent,
      failed,
      requested: payload.clientIds?.length || 0,
      campaignLogId: campaignLog._id,
    };
  }

  static async getCampaignAudience(payload, user) {
    const cid = user.role === 'SUPER_ADMIN' && payload.consultancyId ? payload.consultancyId : getConsultancyId(user);
    const template = CAMPAIGN_TEMPLATES[payload.campaignKey];
    if (!template) throw Object.assign(new Error('Invalid campaign'), { status: 400 });

    const now = new Date();
    const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    let audience = [];

    if (payload.campaignKey === 'VISA_EXPIRY_30') {
      const clients = await Client.find({
        consultancyId: cid,
        'profile.visaExpiry': { $gte: now, $lte: inThirtyDays },
        'profile.email': { $exists: true, $ne: '' },
      }).select('profile assignedAgentId');
      audience = clients.map((client) => ({
        clientId: String(client._id),
        name: `${client.profile?.firstName || ''} ${client.profile?.lastName || ''}`.trim(),
        email: client.profile?.email || '',
        dueDate: formatDisplayDate(client.profile?.visaExpiry),
        deadlineType: client.profile?.currentVisa || 'visa',
        deadlineNote: `Current visa: ${client.profile?.currentVisa || 'Unknown'}`,
      }));
    }

    if (payload.campaignKey === 'DOCUMENT_EXPIRY_30') {
      const docs = await Document.find({
        consultancyId: cid,
        isLatest: true,
        'metadata.expiryDate': { $gte: now, $lte: inThirtyDays },
      }).populate('clientId', 'profile');
      const byClient = new Map();
      for (const doc of docs) {
        const client = doc.clientId;
        if (!client?._id || !client.profile?.email || byClient.has(String(client._id))) continue;
        byClient.set(String(client._id), {
          clientId: String(client._id),
          name: `${client.profile?.firstName || ''} ${client.profile?.lastName || ''}`.trim(),
          email: client.profile?.email || '',
          dueDate: formatDisplayDate(doc.metadata?.expiryDate),
          deadlineType: doc.type || doc.name || 'document',
          deadlineNote: doc.name || '',
        });
      }
      audience = Array.from(byClient.values());
    }

    if (payload.campaignKey === 'RFI_RESPONSE_7') {
      const clients = await Client.find({
        consultancyId: cid,
        'profile.email': { $exists: true, $ne: '' },
      }).select('profile immigrationHistory');
      audience = clients.flatMap((client) => (
        Array.isArray(client.immigrationHistory) ? client.immigrationHistory
          .filter((entry) => entry?.responseDue && new Date(entry.responseDue) >= now && new Date(entry.responseDue) <= inSevenDays && !['RESPONDED', 'CLOSED'].includes(entry.status))
          .slice(0, 1)
          .map((entry) => ({
            clientId: String(client._id),
            name: `${client.profile?.firstName || ''} ${client.profile?.lastName || ''}`.trim(),
            email: client.profile?.email || '',
            dueDate: formatDisplayDate(entry.responseDue),
            deadlineType: entry.type || 'response request',
            deadlineNote: entry.description || entry.requestedBy || '',
          })) : []
      ));
    }

    if (payload.campaignKey === 'PRIVACY_CONSENT_GAP') {
      const clients = await Client.find({
        consultancyId: cid,
        'profile.email': { $exists: true, $ne: '' },
        $or: [
          { 'privacyConsent.dataCollection': { $ne: true } },
          { 'privacyConsent.dataSharing': { $ne: true } },
        ],
      }).select('profile privacyConsent');
      audience = clients.map((client) => ({
        clientId: String(client._id),
        name: `${client.profile?.firstName || ''} ${client.profile?.lastName || ''}`.trim(),
        email: client.profile?.email || '',
        dueDate: '',
        deadlineType: 'privacy consent',
        deadlineNote: 'Consent for data collection and/or sharing is still pending.',
      }));
    }

    const clientIds = audience.map((row) => row.clientId);
    const mergeData = Object.fromEntries(audience.map((row) => [row.clientId, {
      dueDate: row.dueDate,
      deadlineType: row.deadlineType,
      deadlineNote: row.deadlineNote,
    }]));

    return {
      campaignKey: payload.campaignKey,
      label: template.label,
      description: template.description,
      clientIds,
      audience,
      subject: template.subject,
      body: template.body,
      mergeData,
      placeholders: ['{{firstName}}', '{{currentVisa}}', '{{dueDate}}', '{{deadlineType}}', '{{deadlineNote}}', '{{agentName}}', '{{consultancyName}}'],
    };
  }

  static async getCampaignHistory(user, query = {}) {
    const cid = user.role === 'SUPER_ADMIN' && query.consultancyId ? query.consultancyId : getConsultancyId(user);
    const limit = Math.min(Number(query.limit || 10), 50);
    const rows = await ConsultancyCampaignLog.find({ consultancyId: cid })
      .populate('createdBy', 'profile')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const stats = {
      totalCampaigns: rows.length,
      totalRecipients: rows.reduce((sum, row) => sum + Number(row.sentCount || 0), 0),
      totalFailed: rows.reduce((sum, row) => sum + Number(row.failedCount || 0), 0),
      totalOpened: rows.reduce((sum, row) => sum + Number(row.openedCount || 0), 0),
      reminderCampaigns: rows.filter((row) => row.campaignKey && row.campaignKey !== 'CUSTOM_BULK_EMAIL').length,
      customCampaigns: rows.filter((row) => !row.campaignKey || row.campaignKey === 'CUSTOM_BULK_EMAIL').length,
    };

    const enrichedRows = rows.map((row) => ({
      ...row,
      openRate: row.sentCount ? Math.round((Number(row.openedCount || 0) / Number(row.sentCount || 1)) * 100) : 0,
    }));
    const openRate = stats.totalRecipients ? Math.round((stats.totalOpened / stats.totalRecipients) * 100) : 0;

    return { rows: enrichedRows, stats: { ...stats, openRate } };
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
