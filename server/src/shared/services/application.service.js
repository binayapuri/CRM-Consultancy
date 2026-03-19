import Application from '../../shared/models/Application.js';
import { createNotification } from '../utils/notify.js';
import { logAudit } from '../../shared/utils/audit.js';
import { notifyUsers } from '../../shared/utils/notify.js';
import { WorkflowAutomationService } from './workflow-automation.service.js';

const getConsultancyId = (user) => user.profile?.consultancyId || user._id;

const VISA_CHECKLISTS = {
  '500': ['CoE', 'OSHC', 'Passport', 'English Test', 'GTE/GS Statement', 'Financial Evidence'],
  '485': ['Passport', 'AFP Police Check', 'English Test', 'Skills Assessment', 'Completion Letter'],
  '189': ['Passport', 'Skills Assessment', 'English Test', 'Points Evidence', 'EOI'],
  '190': ['Passport', 'Skills Assessment', 'English Test', 'Points Evidence', 'State Nomination'],
  '491': ['Passport', 'Skills Assessment', 'English Test', 'Points Evidence', 'Regional Nomination'],
  '482': ['Passport', 'Skills Assessment', 'English Test', 'Employment Evidence'],
  '600': ['Passport', 'Financial Evidence', 'Travel Itinerary'],
};

export class ApplicationService {
  static async getMyApplications(user) {
    if (user.role !== 'STUDENT') return [];
    const Client = (await import('../../shared/models/Client.js')).default;
    const myClient = await Client.findOne({ userId: user._id }).select('_id');
    if (!myClient) return [];
    return Application.find({ clientId: myClient._id })
      .populate('agentId', 'profile')
      .populate('notes.addedBy', 'profile')
      .sort({ updatedAt: -1 });
  }

  static async getAll(user, queryCid) {
    const cid = getConsultancyId(user);
    let filter = user.role === 'SUPER_ADMIN' ? {} : { consultancyId: cid };
    if (user.role === 'SUPER_ADMIN' && queryCid) filter = { consultancyId: queryCid };
    if (user.role === 'AGENT') filter.agentId = user._id;
    return Application.find(filter)
      .populate('clientId', 'profile')
      .populate('agentId', 'profile')
      .populate('sponsorId')
      .sort({ updatedAt: -1 });
  }

  static async getKanban(user, queryCid) {
    const apps = await this.getAll(user, queryCid);
    return {
      ONBOARDING: apps.filter(a => a.status === 'ONBOARDING'),
      DRAFTING: apps.filter(a => a.status === 'DRAFTING'),
      PENDING_INFO: apps.filter(a => a.status === 'PENDING_INFO'),
      REVIEW: apps.filter(a => a.status === 'REVIEW'),
      LODGED: apps.filter(a => a.status === 'LODGED'),
      DECISION: apps.filter(a => a.status === 'DECISION'),
    };
  }

  static async getById(id, user) {
    const app = await Application.findById(id)
      .populate('clientId', 'profile pointsData userId')
      .populate('agentId', 'profile')
      .populate('sponsorId')
      .populate('notes.addedBy', 'profile');
    if (!app) throw Object.assign(new Error('Not found'), { status: 404 });
    if (user.role === 'STUDENT') {
      const client = app.clientId;
      if (!client || client.userId?.toString() !== user._id.toString()) throw Object.assign(new Error('Not authorized'), { status: 403 });
    }
    return app;
  }

  static async create(data, user) {
    const cid = getConsultancyId(user);
    const items = VISA_CHECKLISTS[data.visaSubclass] || VISA_CHECKLISTS['500'];
    const documentChecklist = items.map(name => ({ name, required: true, uploaded: false }));
    const agentId = data.agentId || user._id;
    const app = await Application.create({
      ...data,
      consultancyId: cid,
      agentId,
      documentChecklist: data.documentChecklist || documentChecklist,
      sponsorId: data.sponsorId || undefined,
    });
    
    await notifyUsers({
      consultancyId: cid, userIds: [agentId], excludeUserId: user._id,
      type: 'APPLICATION_CREATED', title: 'New Application Assigned',
      message: `Subclass ${app.visaSubclass} application created and assigned to you`,
      relatedEntityType: 'Application', relatedEntityId: app._id,
    });
    
    await logAudit(cid, 'Application', app._id, 'CREATE', user._id, {
      description: `Application created: Subclass ${app.visaSubclass}`,
      clientId: app.clientId, applicationId: app._id,
      visaSubclass: app.visaSubclass, assignedAgentId: app.agentId,
    });
    await WorkflowAutomationService.onApplicationCreated(app, user._id);
    return app;
  }

  static async update(id, data, user) {
    const oldApp = await Application.findById(id).populate('clientId', 'profile');
    const app = await Application.findByIdAndUpdate(id, data, { new: true })
      .populate('clientId', 'profile').populate('agentId', 'profile').populate('sponsorId');
    if (!app) throw Object.assign(new Error('Not found'), { status: 404 });
    
    const changes = [];
    if (data.status && oldApp?.status !== data.status) changes.push(`status: ${oldApp?.status} → ${data.status}`);
    if (data.visaSubclass && oldApp?.visaSubclass !== data.visaSubclass) changes.push(`visa: ${oldApp?.visaSubclass} → ${data.visaSubclass}`);
    if (data.agentId && String(oldApp?.agentId) !== String(data.agentId)) {
      changes.push('agent reassigned');
      await notifyUsers({
        consultancyId: app.consultancyId, userIds: [data.agentId], excludeUserId: user._id,
        type: 'APPLICATION_ASSIGNED', title: 'Application Assigned to You',
        message: `Subclass ${app.visaSubclass} application reassigned to you`,
        relatedEntityType: 'Application', relatedEntityId: app._id,
      });
    }
    const otherFields = Object.keys(data).filter(k => !['status', 'visaSubclass', 'agentId', 'updatedAt'].includes(k));
    if (otherFields.length) changes.push(`${otherFields.join(', ')} updated`);
    
    if (changes.length) {
      await logAudit(app.consultancyId, 'Application', app._id, 'UPDATE', user._id, {
        description: changes.join('; ') || 'Application updated',
        clientId: app.clientId?._id || app.clientId, applicationId: app._id,
        visaSubclass: app.visaSubclass, assignedAgentId: app.agentId?._id || app.agentId,
      });
    }
    await WorkflowAutomationService.onApplicationUpdated(app, {
      status: data.status,
      stageDeadline: data.stageDeadline,
    }, user._id);
    return app;
  }

  static async updateChecklist(id, index, documentId, uploaded, user) {
    const app = await Application.findById(id).populate('clientId', 'profile').populate('agentId', 'profile');
    if (!app) throw Object.assign(new Error('Not found'), { status: 404 });
    if (user.role === 'STUDENT') {
      const client = app.clientId;
      if (!client || client.userId?.toString() !== user._id.toString()) throw Object.assign(new Error('Not authorized'), { status: 403 });
    }
    const checklist = app.documentChecklist || [];
    const idx = typeof index === 'number' ? index : parseInt(index, 10);
    if (idx < 0 || idx >= checklist.length) throw Object.assign(new Error('Invalid checklist index'), { status: 400 });
    
    checklist[idx].uploaded = uploaded !== undefined ? !!uploaded : true;
    if (documentId !== undefined) checklist[idx].documentId = documentId || null;
    app.documentChecklist = checklist;
    await app.save();
    
    await logAudit(app.consultancyId, 'Application', app._id, 'UPDATE', user._id, {
      description: `Checklist item "${checklist[idx].name}" ${checklist[idx].uploaded ? 'marked uploaded' : 'unmarked'}`,
      clientId: app.clientId?._id || app.clientId, applicationId: app._id,
      visaSubclass: app.visaSubclass, assignedAgentId: app.agentId?._id || app.agentId,
    });
    return Application.findById(id).populate('clientId', 'profile').populate('agentId', 'profile').populate('notes.addedBy', 'profile');
  }

  static async updateStatus(id, status, user) {
    const oldApp = await Application.findById(id).populate('clientId', 'profile');
    const app = await Application.findByIdAndUpdate(id, { status }, { new: true })
      .populate('clientId', 'profile').populate('agentId', 'profile');
    if (!app) throw Object.assign(new Error('Not found'), { status: 404 });
    
    if (oldApp?.status !== status) {
      await logAudit(app.consultancyId, 'Application', app._id, 'UPDATE', user._id, {
        description: `Application status: ${oldApp?.status} → ${status}`,
        metadata: { clientName: app.clientId ? `${app.clientId.profile?.firstName} ${app.clientId.profile?.lastName}` : '—', visaSubclass: app.visaSubclass, userName: `${user.profile?.firstName} ${user.profile?.lastName}` },
        clientId: app.clientId?._id || app.clientId, applicationId: app._id,
        visaSubclass: app.visaSubclass, assignedAgentId: app.agentId?._id || app.agentId,
      });
      if (app.agentId && app.agentId._id?.toString() !== user._id.toString()) {
        await createNotification({
          consultancyId: app.consultancyId, userId: app.agentId._id,
          type: 'APPLICATION_UPDATE', title: 'Application status updated',
          message: `${app.clientId?.profile?.firstName} ${app.clientId?.profile?.lastName} — Subclass ${app.visaSubclass}: ${status}`,
          relatedEntityType: 'Application', relatedEntityId: app._id,
        });
      }
    }
    return app;
  }

  static async addNote(id, data, user) {
    const app = await Application.findById(id).populate('clientId', 'profile userId').populate('agentId', 'profile');
    if (!app) throw Object.assign(new Error('Not found'), { status: 404 });
    app.notes = app.notes || [];
    app.notes.push({ text: data.text, addedBy: user._id, addedAt: new Date(), isLegalAdvice: !!data.isLegalAdvice });
    await app.save();
    
    if (app.agentId && app.agentId._id?.toString() !== user._id.toString()) {
      await notifyUsers({
        consultancyId: app.consultancyId, userIds: [app.agentId._id], excludeUserId: user._id,
        type: 'APPLICATION_NOTE', title: 'Note added to application',
        message: `${user.profile?.firstName || 'Someone'} added a note to Subclass ${app.visaSubclass}`,
        relatedEntityType: 'Application', relatedEntityId: app._id,
      });
    }
    await logAudit(app.consultancyId, 'Application', app._id, 'UPDATE', user._id, {
      description: `Note added: ${(data.text || '').slice(0, 50)}${(data.text || '').length > 50 ? '...' : ''}`,
      clientId: app.clientId?._id || app.clientId, applicationId: app._id,
      visaSubclass: app.visaSubclass, assignedAgentId: app.agentId?._id || app.agentId,
    });
    return Application.findById(id).populate('clientId', 'profile').populate('agentId', 'profile').populate('notes.addedBy', 'profile');
  }

  static async delete(id, user) {
    const app = await Application.findById(id).populate('clientId', 'profile');
    if (!app) throw Object.assign(new Error('Not found'), { status: 404 });
    await logAudit(app.consultancyId, 'Application', app._id, 'DELETE', user._id, {
      description: `Application deleted: Subclass ${app.visaSubclass}`,
      clientId: app.clientId?._id || app.clientId, applicationId: app._id,
      visaSubclass: app.visaSubclass, assignedAgentId: app.agentId,
    });
    await Application.findByIdAndDelete(id);
    return { deleted: true };
  }
}
