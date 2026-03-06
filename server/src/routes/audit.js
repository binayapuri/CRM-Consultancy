import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

const getConsultancyId = (user) => user.profile?.consultancyId || user._id;

router.get('/today', authenticate, async (req, res) => {
  try {
    const cid = req.user.profile?.consultancyId || req.user._id;
    let filter = req.user.role === 'SUPER_ADMIN' ? {} : { consultancyId: cid };
    if (req.user.role === 'SUPER_ADMIN' && req.query.consultancyId) filter = { consultancyId: req.query.consultancyId };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    filter.changedAt = { $gte: today, $lt: tomorrow };
    const logs = await AuditLog.find(filter)
      .populate('changedBy', 'profile').sort({ changedAt: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN'), async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    const { clientId, entityType, userId, assignedAgentId, visaSubclass, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
    const filter = req.user.role === 'SUPER_ADMIN' ? {} : { consultancyId: cid };
    if (clientId) filter.clientId = clientId;
    if (entityType) filter.entityType = entityType;
    if (userId) filter.changedBy = userId;
    if (assignedAgentId) filter.assignedAgentId = assignedAgentId;
    if (visaSubclass) filter.visaSubclass = visaSubclass;
    if (dateFrom || dateTo) {
      filter.changedAt = filter.changedAt || {};
      if (dateFrom) filter.changedAt.$gte = new Date(dateFrom);
      if (dateTo) filter.changedAt.$lte = new Date(dateTo + 'T23:59:59');
    }
    const logs = await AuditLog.find(filter)
      .populate('changedBy', 'profile email')
      .populate('assignedAgentId', 'profile')
      .sort({ changedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await AuditLog.countDocuments(filter);
    res.json({ logs, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/by-date', authenticate, requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN'), async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    const { date } = req.query;
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const filter = req.user.role === 'SUPER_ADMIN' ? {} : { consultancyId: cid };
    filter.changedAt = { $gte: start, $lte: end };
    const logs = await AuditLog.find(filter)
      .populate('changedBy', 'profile email')
      .sort({ changedAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
