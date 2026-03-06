import express from 'express';
import Notification from '../models/Notification.js';
import Client from '../models/Client.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const getConsultancyId = (user) => user.profile?.consultancyId || user._id;

router.post('/send-to-client', authenticate, async (req, res) => {
  try {
    const { clientId, type, title, message } = req.body;
    const cid = getConsultancyId(req.user);
    const client = await Client.findById(clientId).select('userId consultancyId profile');
    if (!client || client.consultancyId?.toString() !== cid.toString()) return res.status(404).json({ error: 'Client not found' });
    if (!client.userId) return res.status(400).json({ error: 'Client has not activated their account yet. Send them an invitation first.' });
    const notif = await Notification.create({
      consultancyId: cid,
      userId: client.userId,
      type: type || 'CHECKLIST_SENT',
      title: title || 'Document from your migration agent',
      message: message || '',
      relatedEntityType: 'Checklist',
    });
    res.status(201).json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    // Each user sees only their own notifications (related to their cases/tasks)
    const filter = { userId: req.user._id };
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/read-all', authenticate, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id }, { read: true, readAt: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true, readAt: new Date() },
      { new: true }
    );
    if (!notif) return res.status(404).json({ error: 'Not found' });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
