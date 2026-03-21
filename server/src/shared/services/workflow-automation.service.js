import Task from '../models/Task.js';
import Client from '../models/Client.js';
import { logAudit } from '../utils/audit.js';
import { notifyUsers } from '../utils/notify.js';

function startOfDay(value) {
  const date = value ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value, days) {
  const date = startOfDay(value);
  date.setDate(date.getDate() + days);
  return date;
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

export class WorkflowAutomationService {
  static async ensureTask({
    automationKey,
    consultancyId,
    actorUserId,
    applicationId,
    clientId,
    assignedTo,
    title,
    description,
    dueDate,
    priority = 'MEDIUM',
    type = 'FOLLOW_UP',
    tags = [],
    notify = true,
  }) {
    if (!automationKey || !consultancyId || !title) return null;

    const automationTag = `AUTO:${automationKey}`;
    const finalTags = unique(['AUTOMATION', automationTag, ...tags]);
    const existing = await Task.findOne({ consultancyId, tags: automationTag });

    if (existing) {
      const updates = {};
      if (applicationId && String(existing.applicationId || '') !== String(applicationId)) updates.applicationId = applicationId;
      if (clientId && String(existing.clientId || '') !== String(clientId)) updates.clientId = clientId;
      if (assignedTo && String(existing.assignedTo || '') !== String(assignedTo)) updates.assignedTo = assignedTo;
      if (description && existing.description !== description) updates.description = description;
      if (priority && existing.priority !== priority) updates.priority = priority;
      if (type && existing.type !== type) updates.type = type;
      if (dueDate && String(existing.dueDate || '') !== String(new Date(dueDate))) updates.dueDate = new Date(dueDate);
      if (JSON.stringify(existing.tags || []) !== JSON.stringify(finalTags)) updates.tags = finalTags;
      if (Object.keys(updates).length) {
        await Task.findByIdAndUpdate(existing._id, updates);
      }
      return existing;
    }

    const task = await Task.create({
      consultancyId,
      applicationId: applicationId || undefined,
      clientId: clientId || undefined,
      assignedTo: assignedTo || undefined,
      createdBy: actorUserId || undefined,
      title,
      description: description || '',
      priority,
      type,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      dailyTaskDate: dueDate ? startOfDay(dueDate) : undefined,
      status: 'PENDING',
      tags: finalTags,
    });

    if (notify) {
      const toNotify = [];
      if (assignedTo && String(assignedTo) !== String(actorUserId || '')) toNotify.push(assignedTo);
      if (clientId) {
        const client = await Client.findById(clientId).select('userId');
        if (client?.userId && String(client.userId) !== String(actorUserId || '')) toNotify.push(client.userId);
      }
      if (toNotify.length) {
        await notifyUsers({
          consultancyId,
          userIds: toNotify,
          excludeUserId: actorUserId,
          type: 'AUTOMATION_TASK_CREATED',
          title: 'Automated follow-up created',
          message: title,
          relatedEntityType: 'Task',
          relatedEntityId: task._id,
        });
      }
    }

    if (actorUserId) {
      await logAudit(consultancyId, 'Task', task._id, 'CREATE', actorUserId, {
        description: `Automated workflow task created: ${title}`,
        clientId,
        applicationId,
        assignedAgentId: assignedTo,
      });
    }

    return task;
  }

  static async onApplicationCreated(app, actorUserId) {
    if (!app?.stageDeadline) return null;
    return this.ensureTask({
      automationKey: `application-stage-${app._id}`,
      consultancyId: app.consultancyId,
      actorUserId,
      applicationId: app._id,
      clientId: app.clientId,
      assignedTo: app.agentId,
      title: `Prepare for stage deadline - Subclass ${app.visaSubclass}`,
      description: `Workflow-generated reminder for the current application stage deadline.`,
      dueDate: app.stageDeadline,
      priority: new Date(app.stageDeadline) <= addDays(new Date(), 7) ? 'HIGH' : 'MEDIUM',
      type: 'DEADLINE',
      tags: ['APPLICATION_STAGE'],
    });
  }

  static async onApplicationUpdated(app, changes, actorUserId) {
    const jobs = [];
    if (app?.stageDeadline) {
      jobs.push(this.ensureTask({
        automationKey: `application-stage-${app._id}`,
        consultancyId: app.consultancyId,
        actorUserId,
        applicationId: app._id,
        clientId: app.clientId?._id || app.clientId,
        assignedTo: app.agentId?._id || app.agentId,
        title: `Prepare for stage deadline - Subclass ${app.visaSubclass}`,
        description: `Workflow-generated reminder for the current application stage deadline.`,
        dueDate: app.stageDeadline,
        priority: new Date(app.stageDeadline) <= addDays(new Date(), 7) ? 'HIGH' : 'MEDIUM',
        type: 'DEADLINE',
        tags: ['APPLICATION_STAGE'],
      }));
    }
    if (changes?.status === 'LODGED') {
      jobs.push(this.ensureTask({
        automationKey: `application-lodged-followup-${app._id}`,
        consultancyId: app.consultancyId,
        actorUserId,
        applicationId: app._id,
        clientId: app.clientId?._id || app.clientId,
        assignedTo: app.agentId?._id || app.agentId,
        title: `28-day follow-up after lodgement - Subclass ${app.visaSubclass}`,
        description: `Check post-lodgement progress, acknowledgements, and any new requests from the Department.`,
        dueDate: addDays(new Date(), 28),
        priority: 'MEDIUM',
        type: 'FOLLOW_UP',
        tags: ['APPLICATION_LODGED'],
      }));
    }
    return Promise.all(jobs);
  }

  static async onCommunicationSent({ communicationType, application, consultancyId, actorUserId, clientId, assignedTo, dueInDays, title, description, priority = 'MEDIUM' }) {
    if (!application?._id || !consultancyId) return null;
    return this.ensureTask({
      automationKey: `communication-${communicationType}-${application._id}`,
      consultancyId,
      actorUserId,
      applicationId: application._id,
      clientId: clientId || application.clientId?._id || application.clientId,
      assignedTo: assignedTo || application.agentId?._id || application.agentId,
      title,
      description,
      dueDate: addDays(new Date(), dueInDays),
      priority,
      type: 'FOLLOW_UP',
      tags: ['COMMUNICATION', communicationType],
    });
  }

  static async onBillingSent({ document, consultancyId, actorUserId }) {
    if (!document?._id || !consultancyId) return null;
    if (document.documentType === 'INVOICE') {
      return this.ensureTask({
        automationKey: `billing-invoice-${document._id}`,
        consultancyId,
        actorUserId,
        applicationId: document.applicationId,
        clientId: document.clientId,
        assignedTo: document.createdBy,
        title: `Follow up invoice ${document.documentNumber}`,
        description: `Check payment progress and chase any overdue balance if unpaid.`,
        dueDate: document.dueDate || addDays(new Date(), 7),
        priority: 'MEDIUM',
        type: 'FOLLOW_UP',
        tags: ['BILLING', 'INVOICE'],
      });
    }
    if (document.documentType === 'QUOTE' && document.validUntil) {
      return this.ensureTask({
        automationKey: `billing-quote-${document._id}`,
        consultancyId,
        actorUserId,
        applicationId: document.applicationId,
        clientId: document.clientId,
        assignedTo: document.createdBy,
        title: `Follow up quote ${document.documentNumber}`,
        description: `Check whether the client wants to accept the fee estimate before it expires.`,
        dueDate: addDays(document.validUntil, -2),
        priority: 'MEDIUM',
        type: 'FOLLOW_UP',
        tags: ['BILLING', 'QUOTE'],
      });
    }
    return null;
  }
}
