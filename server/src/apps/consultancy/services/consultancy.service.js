import Consultancy from '../../../shared/models/Consultancy.js';
import Client from '../../../shared/models/Client.js';
import Application from '../../../shared/models/Application.js';
import Task from '../../../shared/models/Task.js';
import Lead from '../../../shared/models/Lead.js';
import Document from '../../../shared/models/Document.js';
import TrustLedger from '../../../shared/models/TrustLedger.js';
import Sponsor from '../../../shared/models/Sponsor.js';
import User from '../../../shared/models/User.js';
import College from '../../../shared/models/College.js';
import OSHC from '../../../shared/models/OSHC.js';
import Attendance from '../../../shared/models/Attendance.js';
import AuditLog from '../../../shared/models/AuditLog.js';
import ConsultancyBilling from '../../../shared/models/ConsultancyBilling.js';
import { isBusinessEmail } from '../../../shared/utils/emailValidation.js';
import { normalizeCampaignAutomation } from '../../../shared/services/campaign-scheduler.service.js';
import jwt from 'jsonwebtoken';

export class ConsultancyService {
  static async uploadSignature(consultancyId, fileUrl) {
    if (!consultancyId) throw Object.assign(new Error('No consultancy assigned'), { status: 404 });
    const c = await Consultancy.findByIdAndUpdate(consultancyId, {
      'form956Details.signatureUrl': fileUrl,
      'miaAgreementDetails.signatureUrl': fileUrl,
    }, { new: true });
    if (!c) throw Object.assign(new Error('Not found'), { status: 404 });
    return { signatureUrl: fileUrl, consultancy: c };
  }

  static async uploadConsumerGuide(consultancyId, fileUrl) {
    if (!consultancyId) throw Object.assign(new Error('No consultancy assigned'), { status: 404 });
    const c = await Consultancy.findByIdAndUpdate(consultancyId, {
      'form956Details.consumerGuideUrl': fileUrl,
    }, { new: true });
    if (!c) throw Object.assign(new Error('Not found'), { status: 404 });
    return { consumerGuideUrl: fileUrl, consultancy: c };
  }

  static async getAllConsultancies(user) {
    const filter = user.role === 'SUPER_ADMIN' ? {} : { _id: user.profile?.consultancyId };
    const consultancies = await Consultancy.find(filter || {});
    return user.role === 'SUPER_ADMIN' ? consultancies : (consultancies[0] ? [consultancies[0]] : []);
  }

  static async searchConsultancies({ q, specialization, state }) {
    const filter = { verified: true };
    if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { specializations: new RegExp(q, 'i') }];
    if (specialization) filter.specializations = new RegExp(specialization, 'i');
    if (state) filter['address.state'] = state;
    return Consultancy.find(filter).limit(20);
  }

  static async getConsultancyById(id) {
    const c = await Consultancy.findById(id);
    if (!c) throw Object.assign(new Error('Not found'), { status: 404 });
    return c;
  }

  static async getOverview(cid) {
    const consultancy = await Consultancy.findById(cid);
    if (!consultancy) throw Object.assign(new Error('Not found'), { status: 404 });
    const now = new Date();
    const inNinetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const [clients, employees, applications, tasks, leads, documents, trustEntries, sponsors, colleges, oshc, attendanceToday, clientRecords, applicationRecords, overdueTasks, expiringDocuments, recentAudit] = await Promise.all([
      Client.countDocuments({ consultancyId: cid }),
      User.countDocuments({ 'profile.consultancyId': cid }),
      Application.countDocuments({ consultancyId: cid }),
      Task.countDocuments({ consultancyId: cid }),
      Lead.countDocuments({ consultancyId: cid }),
      Document.countDocuments({ consultancyId: cid }),
      TrustLedger.countDocuments({ consultancyId: cid }),
      Sponsor.countDocuments({ consultancyId: cid }),
      College.countDocuments({ $or: [{ consultancyId: cid }, { consultancyIds: cid }] }),
      OSHC.countDocuments({ $or: [{ consultancyId: cid }, { consultancyIds: cid }] }),
      Attendance.countDocuments({ consultancyId: cid, date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      Client.find({ consultancyId: cid }).select('profile notes immigrationHistory lastActivityAt updatedAt status assignedAgentId').lean(),
      Application.find({ consultancyId: cid })
        .populate('clientId', 'profile')
        .populate('sponsorId', 'companyName')
        .populate('agentId', 'profile')
        .select('visaSubclass status stageDeadline documentChecklist notes coe form956Signed form956SignedAt communicationDraft compliance clientId sponsorId agentId updatedAt createdAt')
        .lean(),
      Task.find({ consultancyId: cid, dueDate: { $exists: true, $ne: null }, status: { $in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] } })
        .populate('clientId', 'profile')
        .populate('assignedTo', 'profile')
        .sort({ dueDate: 1 })
        .limit(10)
        .lean(),
      Document.find({ consultancyId: cid, 'metadata.expiryDate': { $gte: now, $lte: inNinetyDays } })
        .populate('clientId', 'profile')
        .sort({ 'metadata.expiryDate': 1 })
        .limit(10)
        .lean(),
      AuditLog.find({ consultancyId: cid })
        .populate('changedBy', 'profile')
        .sort({ changedAt: -1 })
        .limit(12)
        .lean(),
    ]);

    const trustBalance = await TrustLedger.aggregate([
      { $match: { consultancyId: consultancy._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const recentClients = await Client.find({ consultancyId: cid })
      .populate('assignedAgentId', 'profile')
      .sort({ lastActivityAt: -1 })
      .limit(10)
      .select('profile status assignedAgentId lastActivityAt');

    const recentApplications = await Application.find({ consultancyId: cid })
      .populate('clientId', 'profile')
      .populate('agentId', 'profile')
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('visaSubclass status clientId agentId updatedAt');

    const employeesList = await User.find({ 'profile.consultancyId': cid })
      .select('-password').select('email role profile isActive');

    const appStatusBreakdown = await Application.aggregate([
      { $match: { consultancyId: consultancy._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const visaDeadlines = clientRecords
      .filter((client) => client.profile?.visaExpiry)
      .map((client) => ({
        type: 'VISA_EXPIRY',
        dueDate: client.profile.visaExpiry,
        title: `Visa expiry - ${client.profile?.firstName || ''} ${client.profile?.lastName || ''}`.trim(),
        clientId: client._id,
        clientName: `${client.profile?.firstName || ''} ${client.profile?.lastName || ''}`.trim(),
        subtitle: client.profile?.currentVisa ? `Current visa ${client.profile.currentVisa}` : 'Visa expiry approaching',
        severity: new Date(client.profile.visaExpiry) < now ? 'OVERDUE' : 'HIGH',
      }))
      .filter((item) => new Date(item.dueDate) <= inNinetyDays);

    const applicationDeadlines = applicationRecords.flatMap((application) => {
      const deadlines = [];
      if (application.stageDeadline) {
        deadlines.push({
          type: 'APPLICATION_STAGE',
          dueDate: application.stageDeadline,
          title: `Stage deadline - Subclass ${application.visaSubclass}`,
          applicationId: application._id,
          clientId: application.clientId?._id || application.clientId,
          clientName: `${application.clientId?.profile?.firstName || ''} ${application.clientId?.profile?.lastName || ''}`.trim(),
          subtitle: `Status ${application.status}`,
          severity: new Date(application.stageDeadline) < now ? 'OVERDUE' : 'MEDIUM',
        });
      }
      if (application.coe?.expiryDate) {
        deadlines.push({
          type: 'COE_EXPIRY',
          dueDate: application.coe.expiryDate,
          title: `CoE expiry - Subclass ${application.visaSubclass}`,
          applicationId: application._id,
          clientId: application.clientId?._id || application.clientId,
          clientName: `${application.clientId?.profile?.firstName || ''} ${application.clientId?.profile?.lastName || ''}`.trim(),
          subtitle: application.coe?.institution || 'CoE record',
          severity: new Date(application.coe.expiryDate) < now ? 'OVERDUE' : 'MEDIUM',
        });
      }
      return deadlines;
    }).filter((item) => new Date(item.dueDate) <= inNinetyDays);

    const immigrationDeadlineItems = clientRecords.flatMap((client) => (
      Array.isArray(client.immigrationHistory) ? client.immigrationHistory.map((entry) => ({
        entry,
        client,
      })) : []
    )).filter(({ entry }) => entry?.responseDue && new Date(entry.responseDue) <= inNinetyDays && entry.status !== 'RESPONDED' && entry.status !== 'CLOSED')
      .map(({ entry, client }) => ({
        type: 'RFI_RESPONSE',
        dueDate: entry.responseDue,
        title: `${entry.type || 'Request'} response due`,
        clientId: client._id,
        clientName: `${client.profile?.firstName || ''} ${client.profile?.lastName || ''}`.trim(),
        subtitle: entry.description || entry.requestedBy || 'Immigration request',
        severity: new Date(entry.responseDue) < now ? 'OVERDUE' : 'HIGH',
      }));

    const taskDeadlineItems = overdueTasks.map((task) => ({
      type: 'TASK_DUE',
      dueDate: task.dueDate,
      title: task.title,
      clientId: task.clientId?._id || task.clientId,
      clientName: `${task.clientId?.profile?.firstName || ''} ${task.clientId?.profile?.lastName || ''}`.trim(),
      subtitle: task.assignedTo?.profile?.firstName ? `Assigned to ${task.assignedTo.profile.firstName} ${task.assignedTo.profile.lastName || ''}`.trim() : task.status,
      severity: new Date(task.dueDate) < now ? 'OVERDUE' : task.priority === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
    }));

    const documentDeadlineItems = expiringDocuments.map((document) => ({
      type: 'DOCUMENT_EXPIRY',
      dueDate: document.metadata?.expiryDate,
      title: `${document.type || 'Document'} expiry`,
      clientId: document.clientId?._id || document.clientId,
      clientName: `${document.clientId?.profile?.firstName || ''} ${document.clientId?.profile?.lastName || ''}`.trim(),
      subtitle: document.name,
      severity: new Date(document.metadata?.expiryDate) < now ? 'OVERDUE' : 'MEDIUM',
    }));

    const upcomingDeadlines = [...visaDeadlines, ...applicationDeadlines, ...immigrationDeadlineItems, ...taskDeadlineItems, ...documentDeadlineItems]
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 20);

    const appsMissingChecklist = applicationRecords.filter((app) => (app.documentChecklist || []).some((item) => item.required && !item.uploaded));
    const form956Sent = applicationRecords.filter((app) => app.compliance?.form956SentAt).length;
    const miaSent = applicationRecords.filter((app) => app.compliance?.miaSentAt).length;
    const initialAdviceSent = applicationRecords.filter((app) => app.compliance?.initialAdviceSentAt).length;
    const sponsorshipPackageSent = applicationRecords.filter((app) => app.compliance?.sponsorshipPackageSentAt).length;
    const consumerGuideAcknowledged = applicationRecords.filter((app) => app.communicationDraft?.consumerGuideAcknowledged || app.compliance?.consumerGuideAcknowledgedAt).length;
    const clientsWithNotes = clientRecords.filter((client) => Array.isArray(client.notes) && client.notes.length > 0).length;
    const applicationsWithNotes = applicationRecords.filter((app) => Array.isArray(app.notes) && app.notes.length > 0).length;
    const notesCoverage = clients > 0 ? Math.round((clientsWithNotes / clients) * 100) : 0;
    const communicationCoverage = applications > 0 ? Math.round((initialAdviceSent / applications) * 100) : 0;
    const privacyCompliantClients = clientRecords.filter((client) => client.privacyConsent?.dataCollection && client.privacyConsent?.dataSharing).length;
    const privacyConsentCoverage = clients > 0 ? Math.round((privacyCompliantClients / clients) * 100) : 0;
    const privacyMissingCount = clientRecords.filter((client) => !(client.privacyConsent?.dataCollection && client.privacyConsent?.dataSharing)).length;
    const archivedClients = clientRecords.filter((client) => client.status === 'ARCHIVED' || client.retention?.archiveStatus === 'ARCHIVED').length;
    const retentionCandidates = clientRecords
      .filter((client) => {
        const lastTouch = client.lastActivityAt || client.updatedAt;
        if (!lastTouch) return false;
        const ageMs = now.getTime() - new Date(lastTouch).getTime();
        return ageMs > 365 * 24 * 60 * 60 * 1000 || ['UNDER_REVIEW', 'READY_TO_ARCHIVE', 'ARCHIVED'].includes(client.retention?.archiveStatus);
      })
      .slice(0, 10)
      .map((client) => ({
        _id: client._id,
        name: `${client.profile?.firstName || ''} ${client.profile?.lastName || ''}`.trim(),
        email: client.profile?.email || '',
        lastActivityAt: client.lastActivityAt || client.updatedAt,
        status: client.status || 'ACTIVE',
        archiveStatus: client.retention?.archiveStatus || 'ACTIVE',
        archiveEligibleAt: client.retention?.archiveEligibleAt,
        privacyComplete: !!(client.privacyConsent?.dataCollection && client.privacyConsent?.dataSharing),
      }));

    return {
      consultancy,
      stats: { clients, employees, applications, tasks, leads, documents, trustEntries, sponsors, colleges, oshc, attendanceToday, trustBalance: trustBalance[0]?.total ?? 0 },
      recentClients, recentApplications, employeesList,
      appStatusBreakdown: appStatusBreakdown.reduce((acc, x) => { acc[x._id] = x.count; return acc; }, {}),
      complianceSummary: {
        form956Sent,
        form956Signed: applicationRecords.filter((app) => app.form956Signed || app.form956SignedAt).length,
        miaSent,
        initialAdviceSent,
        sponsorshipPackageSent,
        consumerGuideAcknowledged,
        missingDocumentApplications: appsMissingChecklist.length,
        clientNotesCoverage: notesCoverage,
        applicationNotesCoverage: applications > 0 ? Math.round((applicationsWithNotes / applications) * 100) : 0,
        communicationCoverage,
        privacyConsentCoverage,
      },
      deadlineTracker: {
        overdueCount: upcomingDeadlines.filter((item) => item.severity === 'OVERDUE').length,
        nextSevenDays: upcomingDeadlines.filter((item) => {
          const due = new Date(item.dueDate);
          return due >= now && due <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        }).length,
        items: upcomingDeadlines,
      },
      operationalInsights: {
        overdueTasks: overdueTasks.filter((task) => new Date(task.dueDate) < now).length,
        expiringDocuments: expiringDocuments.length,
        retentionCandidates,
        privacyMissingCount,
        archivedClients,
      },
      recentAudit,
    };
  }

  static async getReportExport(cid) {
    const overview = await this.getOverview(cid);
    const [clientRows, applicationRows, billingRows] = await Promise.all([
      Client.find({ consultancyId: cid })
        .populate('assignedAgentId', 'profile')
        .select('profile status assignedAgentId privacyConsent retention lastActivityAt updatedAt')
        .lean(),
      Application.find({ consultancyId: cid })
        .populate('clientId', 'profile')
        .populate('agentId', 'profile')
        .select('visaSubclass status stageDeadline coe compliance clientId agentId createdAt updatedAt')
        .lean(),
      ConsultancyBilling.find({ consultancyId: cid })
        .populate('clientId', 'profile')
        .sort({ createdAt: -1 })
        .lean(),
    ]);
    return { overview, clientRows, applicationRows, billingRows };
  }

  static async registerConsultancy(data) {
    const { email, password, firstName, lastName, marnNumber, consultancyName, abn, phone } = data;
    if (!isBusinessEmail(email)) throw Object.assign(new Error('Consultancy admin must use a business email.'), { status: 400 });
    
    if (await User.findOne({ email })) throw Object.assign(new Error('Email already registered'), { status: 400 });
    const existingConsultancy = await Consultancy.findOne({ $or: [{ email }, { 'form956Details.email': email }] });
    if (existingConsultancy) throw Object.assign(new Error('A consultancy with this email already exists'), { status: 400 });

    const consultancy = await Consultancy.create({
      name: consultancyName, displayName: consultancyName, abn: abn || undefined, email, phone: phone || undefined,
      marnNumbers: [String(marnNumber).trim()], verified: false,
      form956Details: { agentName: `${firstName} ${lastName}`, marnNumber: String(marnNumber).trim(), email, phone: phone || undefined },
      miaAgreementDetails: { agentName: `${firstName} ${lastName}`, marnNumber: String(marnNumber).trim() },
      rolePermissions: [
        { role: 'CONSULTANCY_ADMIN', permissions: { clients: { view: true, create: true, edit: true, delete: true }, applications: { view: true, create: true, edit: true, delete: true }, tasks: { view: true, create: true, edit: true, delete: true }, kanban: { view: true, edit: true }, leads: { view: true, create: true, edit: true, delete: true }, documents: { view: true, upload: true, delete: true }, trustLedger: { view: true, edit: true }, billing: { view: true, create: true, edit: true, delete: true }, employees: { view: true, manage: true }, traceHistory: { view: true }, settings: { view: true, edit: true }, colleges: { view: true, manage: true }, oshc: { view: true, manage: true }, sponsors: { view: true, create: true, edit: true, delete: true }, sendDocuments: true, sendAdvice: true } },
        { role: 'MANAGER', permissions: { clients: { view: true, create: true, edit: true, delete: true }, applications: { view: true, create: true, edit: true, delete: true }, tasks: { view: true, create: true, edit: true, delete: true }, kanban: { view: true, edit: true }, leads: { view: true, create: true, edit: true, delete: true }, documents: { view: true, upload: true, delete: true }, trustLedger: { view: true, edit: true }, billing: { view: true, create: true, edit: true, delete: false }, employees: { view: true, manage: true }, traceHistory: { view: true }, settings: { view: true, edit: true }, colleges: { view: true, manage: true }, oshc: { view: true, manage: true }, sponsors: { view: true, create: true, edit: true, delete: true }, sendDocuments: true, sendAdvice: true } },
        { role: 'AGENT', permissions: { clients: { view: true, create: true, edit: true, delete: false }, applications: { view: true, create: true, edit: true, delete: false }, tasks: { view: true, create: true, edit: true, delete: false }, kanban: { view: true, edit: true }, leads: { view: true, create: true, edit: true, delete: false }, documents: { view: true, upload: true, delete: false }, trustLedger: { view: false, edit: false }, billing: { view: true, create: true, edit: true, delete: false }, employees: { view: true, manage: false }, traceHistory: { view: false }, settings: { view: false, edit: false }, colleges: { view: true, manage: false }, oshc: { view: true, manage: false }, sponsors: { view: true, create: true, edit: true, delete: false }, sendDocuments: true, sendAdvice: true } },
        { role: 'SUPPORT', permissions: { clients: { view: true, create: false, edit: true, delete: false }, applications: { view: true, create: false, edit: true, delete: false }, tasks: { view: true, create: true, edit: true, delete: false }, kanban: { view: true, edit: true }, leads: { view: true, create: true, edit: true, delete: false }, documents: { view: true, upload: true, delete: false }, trustLedger: { view: false, edit: false }, billing: { view: true, create: false, edit: false, delete: false }, employees: { view: false, manage: false }, traceHistory: { view: false }, settings: { view: false, edit: false }, colleges: { view: true, manage: false }, oshc: { view: true, manage: false }, sponsors: { view: true, create: false, edit: true, delete: false }, sendDocuments: true, sendAdvice: false } },
      ],
      campaignAutomation: normalizeCampaignAutomation(),
    });

    const user = await User.create({ email, password, role: 'CONSULTANCY_ADMIN', profile: { firstName, lastName, consultancyId: consultancy._id } });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'orivisa-secret-key-change-in-production', { expiresIn: '7d' });
    return { user: { id: user._id, _id: user._id, email: user.email, role: user.role, profile: user.profile }, token, consultancy: { id: consultancy._id, name: consultancy.name } };
  }

  static async createConsultancy(data) {
    if (!data.campaignAutomation) data.campaignAutomation = normalizeCampaignAutomation();
    return Consultancy.create(data);
  }

  static async updateOwnConsultancy(cid, updateData) {
    if (Array.isArray(updateData.emailProfiles) && updateData.emailProfiles.length > 0) {
      const existing = await Consultancy.findById(cid).select('emailProfiles').lean();
      const existingProfiles = existing?.emailProfiles || [];
      updateData.emailProfiles = updateData.emailProfiles.map((p) => {
        if (p._id && (!p.pass || String(p.pass).trim() === '' || p.pass === '••••••••')) {
          const old = existingProfiles.find((ep) => String(ep._id) === String(p._id));
          if (old?.pass) return { ...p, pass: old.pass };
        }
        return p;
      });
    }
    if (updateData.campaignAutomation) {
      const existing = await Consultancy.findById(cid).select('campaignAutomation').lean();
      updateData.campaignAutomation = normalizeCampaignAutomation({
        ...(existing?.campaignAutomation || {}),
        ...(updateData.campaignAutomation || {}),
        schedules: {
          ...((existing?.campaignAutomation || {}).schedules || {}),
          ...((updateData.campaignAutomation || {}).schedules || {}),
        },
      });
    }
    const c = await Consultancy.findByIdAndUpdate(cid, updateData, { new: true });
    if (!c) throw Object.assign(new Error('Not found'), { status: 404 });
    return c;
  }

  static async updateConsultancyById(id, updateData) {
    if (updateData.campaignAutomation) {
      const existing = await Consultancy.findById(id).select('campaignAutomation').lean();
      updateData.campaignAutomation = normalizeCampaignAutomation({
        ...(existing?.campaignAutomation || {}),
        ...(updateData.campaignAutomation || {}),
        schedules: {
          ...((existing?.campaignAutomation || {}).schedules || {}),
          ...((updateData.campaignAutomation || {}).schedules || {}),
        },
      });
    }
    const c = await Consultancy.findByIdAndUpdate(id, updateData, { new: true });
    if (!c) throw Object.assign(new Error('Not found'), { status: 404 });
    return c;
  }

  static async deleteConsultancy(id) {
    const c = await Consultancy.findByIdAndDelete(id);
    if (!c) throw Object.assign(new Error('Not found'), { status: 404 });
    return { deleted: true };
  }
}
