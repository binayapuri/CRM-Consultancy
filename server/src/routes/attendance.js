import express from 'express';
import Attendance from '../models/Attendance.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const getConsultancyId = (user) => user.profile?.consultancyId || user._id;

// Employee: check-in
router.post('/check-in', authenticate, async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await Attendance.findOne({ consultancyId: cid, userId: req.user._id, date: today });
    if (existing?.checkIn) return res.status(400).json({ error: 'Already checked in today' });
    const att = existing
      ? await Attendance.findByIdAndUpdate(existing._id, { checkIn: new Date(), ipAddress: req.ip, location: req.body?.location }, { new: true })
      : await Attendance.create({ consultancyId: cid, userId: req.user._id, date: today, checkIn: new Date(), ipAddress: req.ip, location: req.body?.location });
    res.json(att);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Employee: check-out
router.post('/check-out', authenticate, async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const att = await Attendance.findOneAndUpdate(
      { consultancyId: cid, userId: req.user._id, date: today, checkIn: { $exists: true } },
      { checkOut: new Date(), breakMinutes: req.body?.breakMinutes || 0, notes: req.body?.notes },
      { new: true }
    );
    if (!att) return res.status(400).json({ error: 'No check-in found for today' });
    res.json(att);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Employee: my today's attendance
router.get('/me/today', authenticate, async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const att = await Attendance.findOne({ consultancyId: cid, userId: req.user._id, date: today });
    res.json(att || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: list attendance for date range
router.get('/', authenticate, async (req, res) => {
  try {
    const { from, to, userId, consultancyId } = req.query;
    const cid = req.user.role === 'SUPER_ADMIN' && consultancyId ? consultancyId : getConsultancyId(req.user);
    if (!['SUPER_ADMIN', 'CONSULTANCY_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    const filter = { consultancyId: cid };
    if (userId) filter.userId = userId;
    const start = from ? new Date(from) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = to ? new Date(to) : new Date(start);
    end.setDate(end.getDate() + 1);
    filter.date = { $gte: start, $lt: end };
    const list = await Attendance.find(filter).populate('userId', 'email profile.firstName profile.lastName').sort({ date: -1, checkIn: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
