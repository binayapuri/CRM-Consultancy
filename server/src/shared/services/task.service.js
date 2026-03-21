import Task from '../../shared/models/Task.js';
import Client from '../../shared/models/Client.js';
import { logAudit } from '../../shared/utils/audit.js';
import { notifyUsers } from '../../shared/utils/notify.js';

const getConsultancyId = (user) => user.profile?.consultancyId || user._id;

export class TaskService {
  static async getAll(user, query) {
    let filter = {};
    if (user.role === 'STUDENT') {
      const myClient = await Client.findOne({ userId: user._id }).select('_id');
      if (!myClient) return [];
      filter.clientId = myClient._id;
    } else {
      const cid = getConsultancyId(user);
      filter = user.role === 'SUPER_ADMIN' ? {} : { consultancyId: cid };
      if (user.role === 'SUPER_ADMIN' && query.consultancyId) {
        filter = { consultancyId: query.consultancyId };
      }
    }
    const { date, assignedTo, status } = query;
    if (date) filter.dailyTaskDate = new Date(date);
    if (assignedTo) filter.assignedTo = assignedTo;
    if (status) filter.status = status;
    return Task.find(filter)
      .populate('assignedTo', 'profile').populate('clientId', 'profile').populate('comments.addedBy', 'profile')
      .sort({ dueDate: 1 });
  }

  static async getDailyOptions(user, queryCid, dateQuery) {
    let cid = getConsultancyId(user);
    if (user.role === 'SUPER_ADMIN' && queryCid) cid = queryCid;
    const d = dateQuery ? new Date(dateQuery + 'T00:00:00') : new Date();
    const startOfDay = new Date(d);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    return Task.find({
      consultancyId: cid,
      dailyTaskDate: { $gte: startOfDay, $lt: endOfDay },
      status: { $ne: 'COMPLETED' },
    })
      .populate('assignedTo', 'profile').populate('clientId', 'profile')
      .populate('createdBy', 'profile').populate('comments.addedBy', 'profile')
      .sort({ priority: -1, dueDate: 1 });
  }

  static async create(data, user) {
    let cid = getConsultancyId(user);
    if (user.role === 'SUPER_ADMIN' && data.consultancyId) cid = data.consultancyId;
    const body = { ...data };
    delete body.consultancyId;
    
    if (body.dailyTaskDate) {
      const d = new Date(body.dailyTaskDate);
      d.setHours(0, 0, 0, 0);
      body.dailyTaskDate = d;
    }
    
    const task = await Task.create({
      ...body, consultancyId: cid, createdBy: user._id,
    });
    
    const toNotify = [];
    if (task.assignedTo && task.assignedTo.toString() !== user._id.toString()) toNotify.push(task.assignedTo);
    if (task.clientId) {
      const client = await Client.findById(task.clientId).select('userId');
      if (client?.userId && client.userId.toString() !== user._id.toString()) toNotify.push(client.userId);
    }
    if (toNotify.length) {
      await notifyUsers({
        consultancyId: cid, userIds: toNotify, excludeUserId: user._id,
        type: 'TASK_ASSIGNED', title: 'New Task',
        message: `${user.profile?.firstName || 'Someone'} assigned you: ${task.title}`,
        relatedEntityType: 'Task', relatedEntityId: task._id,
      });
    }
    await logAudit(cid, 'Task', task._id, 'CREATE', user._id, {
      description: `Task created: ${task.title}`,
      metadata: { taskTitle: task.title, userName: `${user.profile?.firstName} ${user.profile?.lastName}` },
      clientId: task.clientId, applicationId: task.applicationId, assignedAgentId: task.assignedTo,
    });
    return task;
  }

  static async getById(id) {
    const task = await Task.findById(id)
      .populate('assignedTo', 'profile').populate('clientId', 'profile')
      .populate('createdBy', 'profile').populate('comments.addedBy', 'profile').populate('reviewedBy', 'profile');
    if (!task) throw Object.assign(new Error('Not found'), { status: 404 });
    return task;
  }

  static async update(id, data, user) {
    const oldTask = await Task.findById(id).populate('clientId', 'profile');
    const task = await Task.findByIdAndUpdate(id, data, { new: true })
      .populate('assignedTo', 'profile').populate('clientId', 'profile')
      .populate('createdBy', 'profile').populate('reviewedBy', 'profile');
    if (!task) throw Object.assign(new Error('Not found'), { status: 404 });
    const meta = { clientId: task.clientId?._id || task.clientId, applicationId: task.applicationId, assignedAgentId: task.assignedTo?._id || task.assignedTo };
    
    if (data.status !== undefined && oldTask?.status !== data.status) {
      await logAudit(task.consultancyId, 'Task', task._id, 'UPDATE', user._id, {
        description: `Task moved: ${task.title} (${oldTask?.status || '—'} → ${data.status})`,
        field: 'status', oldValue: oldTask?.status, newValue: data.status,
        metadata: { taskTitle: task.title, clientName: task.clientId ? `${task.clientId.profile?.firstName} ${task.clientId.profile?.lastName}` : '—', userName: `${user.profile?.firstName} ${user.profile?.lastName}` },
        ...meta,
      });
    }
    if (data.reviewedBy !== undefined) {
      await logAudit(task.consultancyId, 'Task', task._id, 'UPDATE', user._id, {
        description: `Task reviewed by ${user.profile?.firstName} ${user.profile?.lastName}`,
        ...meta,
      });
    }
    const otherChanges = ['title', 'description', 'tags', 'priority', 'assignedTo', 'dueDate'].filter(k => data[k] !== undefined);
    if (otherChanges.length && data.status === undefined && data.reviewedBy === undefined) {
      const desc = data.tags ? `Task tags updated: ${(data.tags || []).join(', ')}` : `Task updated: ${otherChanges.join(', ')}`;
      await logAudit(task.consultancyId, 'Task', task._id, 'UPDATE', user._id, { description: desc, ...meta });
    }
    
    if (data.assignedTo && data.assignedTo.toString() !== user._id.toString()) {
      await notifyUsers({
        consultancyId: task.consultancyId, userIds: [data.assignedTo], excludeUserId: user._id,
        type: 'TASK_ASSIGNED', title: 'Task Assigned',
        message: `${user.profile?.firstName || 'Someone'} assigned you: ${task.title}`,
        relatedEntityType: 'Task', relatedEntityId: task._id,
      });
    }
    return task;
  }

  static async review(id, user) {
    const task = await Task.findByIdAndUpdate(id, { reviewedBy: user._id, reviewedAt: new Date() }, { new: true })
      .populate('assignedTo', 'profile').populate('clientId', 'profile').populate('createdBy', 'profile')
      .populate('reviewedBy', 'profile').populate('comments.addedBy', 'profile');
    if (!task) throw Object.assign(new Error('Not found'), { status: 404 });
    
    await logAudit(task.consultancyId, 'Task', task._id, 'UPDATE', user._id, {
      description: `Task reviewed: ${task.title}`,
      metadata: { userName: `${user.profile?.firstName} ${user.profile?.lastName}` },
      clientId: task.clientId?._id || task.clientId,
      applicationId: task.applicationId,
      assignedAgentId: task.assignedTo?._id || task.assignedTo,
    });
    return task;
  }

  static async addComment(id, text, user) {
    const task = await Task.findById(id).populate('clientId', 'profile userId');
    if (!task) throw Object.assign(new Error('Not found'), { status: 404 });
    if (user.role === 'STUDENT') {
      if (!task.clientId || task.clientId.userId?.toString() !== user._id.toString()) throw Object.assign(new Error('Not authorized'), { status: 403 });
    }
    task.comments = task.comments || [];
    task.comments.push({ text, addedBy: user._id });
    await task.save();
    
    if (task.clientId) {
      await logAudit(task.consultancyId, 'Task', task._id, 'UPDATE', user._id, {
        description: `Comment on task: ${task.title}`,
        metadata: { taskTitle: task.title, clientName: `${task.clientId.profile?.firstName} ${task.clientId.profile?.lastName}`, userName: `${user.profile?.firstName} ${user.profile?.lastName}` },
        clientId: task.clientId?._id || task.clientId,
        applicationId: task.applicationId,
        assignedAgentId: task.assignedTo?._id || task.assignedTo,
      });
    }
    return Task.findById(id).populate('assignedTo', 'profile').populate('clientId', 'profile').populate('comments.addedBy', 'profile');
  }

  static async delete(id, user) {
    const task = await Task.findById(id).populate('clientId', 'profile');
    if (!task) throw Object.assign(new Error('Not found'), { status: 404 });
    await logAudit(task.consultancyId, 'Task', task._id, 'DELETE', user._id, {
      description: `Task deleted: ${task.title}`,
      clientId: task.clientId?._id || task.clientId, applicationId: task.applicationId,
      assignedAgentId: task.assignedTo,
    });
    await Task.findByIdAndDelete(id);
    return { deleted: true };
  }
}
