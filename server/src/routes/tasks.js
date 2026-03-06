import express from 'express';
import Task from '../models/Task.js';
import Client from '../models/Client.js';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import { notifyUsers } from '../utils/notify.js';

const router = express.Router();

const getConsultancyId = (user) => user.profile?.consultancyId || user._id;

router.get('/', authenticate, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'STUDENT') {
      const Client = (await import('../models/Client.js')).default;
      const myClient = await Client.findOne({ userId: req.user._id }).select('_id');
      if (!myClient) return res.json([]);
      filter.clientId = myClient._id;
    } else {
      const cid = getConsultancyId(req.user);
      filter = req.user.role === 'SUPER_ADMIN' ? {} : { consultancyId: cid };
      if (req.user.role === 'SUPER_ADMIN' && req.query.consultancyId) {
        filter = { consultancyId: req.query.consultancyId };
      }
    }
    const { date, assignedTo, status } = req.query;
    if (date) filter.dailyTaskDate = new Date(date);
    if (assignedTo) filter.assignedTo = assignedTo;
    if (status) filter.status = status;
    const tasks = await Task.find(filter).populate('assignedTo', 'profile').populate('clientId', 'profile').populate('comments.addedBy', 'profile').sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/daily', authenticate, async (req, res) => {
  try {
    let cid = getConsultancyId(req.user);
    if (req.user.role === 'SUPER_ADMIN' && req.query.consultancyId) cid = req.query.consultancyId;
    const d = req.query.date ? new Date(req.query.date + 'T00:00:00') : new Date();
    const startOfDay = new Date(d);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    const tasks = await Task.find({
      consultancyId: cid,
      dailyTaskDate: { $gte: startOfDay, $lt: endOfDay },
      status: { $ne: 'COMPLETED' },
    }).populate('assignedTo', 'profile').populate('clientId', 'profile').populate('createdBy', 'profile').populate('comments.addedBy', 'profile').sort({ priority: -1, dueDate: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    let cid = getConsultancyId(req.user);
    if (req.user.role === 'SUPER_ADMIN' && req.body.consultancyId) cid = req.body.consultancyId;
    const body = { ...req.body };
    delete body.consultancyId;
    if (body.dailyTaskDate) {
      const d = new Date(body.dailyTaskDate);
      d.setHours(0, 0, 0, 0);
      body.dailyTaskDate = d;
    }
    const task = await Task.create({
      ...body,
      consultancyId: cid,
      createdBy: req.user._id,
    });
    const toNotify = [];
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) toNotify.push(task.assignedTo);
    if (task.clientId) {
      const client = await Client.findById(task.clientId).select('userId');
      if (client?.userId && client.userId.toString() !== req.user._id.toString()) toNotify.push(client.userId);
    }
    if (toNotify.length) {
      await notifyUsers({
        consultancyId: cid,
        userIds: toNotify,
        excludeUserId: req.user._id,
        type: 'TASK_ASSIGNED',
        title: 'New Task',
        message: `${req.user.profile?.firstName || 'Someone'} assigned you: ${task.title}`,
        relatedEntityType: 'Task',
        relatedEntityId: task._id,
      });
    }
    await logAudit(cid, 'Task', task._id, 'CREATE', req.user._id, {
      description: `Task created: ${task.title}`,
      metadata: { taskTitle: task.title, userName: `${req.user.profile?.firstName} ${req.user.profile?.lastName}` },
      clientId: task.clientId,
      applicationId: task.applicationId,
      assignedAgentId: task.assignedTo,
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'profile').populate('clientId', 'profile').populate('createdBy', 'profile').populate('comments.addedBy', 'profile').populate('reviewedBy', 'profile');
    if (!task) return res.status(404).json({ error: 'Not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const oldTask = await Task.findById(req.params.id).populate('clientId', 'profile');
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignedTo', 'profile').populate('clientId', 'profile').populate('createdBy', 'profile').populate('reviewedBy', 'profile');
    if (!task) return res.status(404).json({ error: 'Not found' });
    const meta = { clientId: task.clientId?._id || task.clientId, applicationId: task.applicationId, assignedAgentId: task.assignedTo?._id || task.assignedTo };
    if (req.body.status !== undefined && oldTask?.status !== req.body.status) {
      await logAudit(task.consultancyId, 'Task', task._id, 'UPDATE', req.user._id, {
        description: `Task moved: ${task.title} (${oldTask?.status || '—'} → ${req.body.status})`,
        field: 'status',
        oldValue: oldTask?.status,
        newValue: req.body.status,
        metadata: { taskTitle: task.title, clientName: task.clientId ? `${task.clientId.profile?.firstName} ${task.clientId.profile?.lastName}` : '—', userName: `${req.user.profile?.firstName} ${req.user.profile?.lastName}` },
        ...meta,
      });
    }
    if (req.body.reviewedBy !== undefined) {
      await logAudit(task.consultancyId, 'Task', task._id, 'UPDATE', req.user._id, {
        description: `Task reviewed by ${req.user.profile?.firstName} ${req.user.profile?.lastName}`,
        ...meta,
      });
    }
    const otherChanges = ['title', 'description', 'tags', 'priority', 'assignedTo', 'dueDate'].filter(k => req.body[k] !== undefined);
    if (otherChanges.length && req.body.status === undefined && req.body.reviewedBy === undefined) {
      const desc = req.body.tags ? `Task tags updated: ${(req.body.tags || []).join(', ')}` : `Task updated: ${otherChanges.join(', ')}`;
      await logAudit(task.consultancyId, 'Task', task._id, 'UPDATE', req.user._id, { description: desc, ...meta });
    }
    if (req.body.assignedTo !== undefined && req.body.assignedTo && req.body.assignedTo.toString() !== req.user._id.toString()) {
      await notifyUsers({
        consultancyId: task.consultancyId,
        userIds: [req.body.assignedTo],
        excludeUserId: req.user._id,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned',
        message: `${req.user.profile?.firstName || 'Someone'} assigned you: ${task.title}`,
        relatedEntityType: 'Task',
        relatedEntityId: task._id,
      });
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/review', authenticate, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, { reviewedBy: req.user._id, reviewedAt: new Date() }, { new: true })
      .populate('assignedTo', 'profile').populate('clientId', 'profile').populate('createdBy', 'profile').populate('reviewedBy', 'profile').populate('comments.addedBy', 'profile');
    if (!task) return res.status(404).json({ error: 'Not found' });
    await logAudit(task.consultancyId, 'Task', task._id, 'UPDATE', req.user._id, {
      description: `Task reviewed: ${task.title}`,
      metadata: { userName: `${req.user.profile?.firstName} ${req.user.profile?.lastName}` },
      clientId: task.clientId?._id || task.clientId,
      applicationId: task.applicationId,
      assignedAgentId: task.assignedTo?._id || task.assignedTo,
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('clientId', 'profile userId');
    if (!task) return res.status(404).json({ error: 'Not found' });
    if (req.user.role === 'STUDENT') {
      if (!task.clientId || task.clientId.userId?.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not authorized' });
    }
    task.comments = task.comments || [];
    task.comments.push({ text: req.body.text, addedBy: req.user._id });
    await task.save();
    if (task.clientId) {
      await logAudit(task.consultancyId, 'Task', task._id, 'UPDATE', req.user._id, {
        description: `Comment on task: ${task.title}`,
        metadata: { taskTitle: task.title, clientName: `${task.clientId.profile?.firstName} ${task.clientId.profile?.lastName}`, userName: `${req.user.profile?.firstName} ${req.user.profile?.lastName}` },
        clientId: task.clientId?._id || task.clientId,
        applicationId: task.applicationId,
        assignedAgentId: task.assignedTo?._id || task.assignedTo,
      });
    }
    const updated = await Task.findById(req.params.id).populate('assignedTo', 'profile').populate('clientId', 'profile').populate('comments.addedBy', 'profile');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('clientId', 'profile');
    if (!task) return res.status(404).json({ error: 'Not found' });
    await logAudit(task.consultancyId, 'Task', task._id, 'DELETE', req.user._id, {
      description: `Task deleted: ${task.title}`,
      clientId: task.clientId?._id || task.clientId,
      applicationId: task.applicationId,
      assignedAgentId: task.assignedTo,
    });
    await Task.findByIdAndDelete(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
