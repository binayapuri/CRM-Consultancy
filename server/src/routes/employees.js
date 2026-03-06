import express from 'express';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

const getConsultancyId = (user) => user.profile?.consultancyId || user._id;

router.get('/:id/job-sheet', authenticate, async (req, res) => {
  try {
    const empId = req.params.id;
    const cid = getConsultancyId(req.user);
    const canView = req.user.role === 'SUPER_ADMIN' || req.user.role === 'CONSULTANCY_ADMIN' || req.user.role === 'MANAGER' ||
      (req.user.role === 'AGENT' && req.user._id.toString() === empId);
    if (!canView) return res.status(403).json({ error: 'Not authorized' });
    const filter = req.user.role === 'SUPER_ADMIN' ? {} : { consultancyId: cid };
    filter.assignedAgentId = empId;
    const logs = await AuditLog.find(filter)
      .populate('changedBy', 'profile')
      .populate('assignedAgentId', 'profile')
      .sort({ changedAt: -1 })
      .limit(200);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER', 'AGENT'), async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    let filter = req.user.role === 'SUPER_ADMIN' ? {} : { 'profile.consultancyId': cid };
    if (req.user.role === 'SUPER_ADMIN' && req.query.consultancyId) {
      filter = { 'profile.consultancyId': req.query.consultancyId };
    }
    const employees = await User.find({ ...filter, role: { $in: ['CONSULTANCY_ADMIN', 'MANAGER', 'AGENT'] } })
      .select('-password')
      .populate('profile.consultancyId', 'name');
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    const { email, password, role, profile } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ error: 'Email already exists' });
    const user = await User.create({
      email,
      password: password || 'temp123',
      role: role || 'AGENT',
      profile: { ...profile, consultancyId: cid },
      mustChangePassword: !password,
    });
    await logAudit(cid, 'User', user._id, 'CREATE', req.user._id, {
      description: `Employee ${user.profile?.firstName} ${user.profile?.lastName} added`,
    });
    res.status(201).json({ id: user._id, email: user.email, role: user.role, profile: user.profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', authenticate, requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER', 'AGENT'), async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'Not found' });
    const cid = getConsultancyId(req.user);
    const canEdit = req.user.role === 'SUPER_ADMIN' || req.user.role === 'CONSULTANCY_ADMIN' || req.user.role === 'MANAGER' ||
      (req.user.role === 'AGENT' && req.params.id === req.user._id.toString());
    if (!canEdit) return res.status(403).json({ error: 'Not authorized' });
    const { password, ...rest } = req.body;
    const update = { ...rest };
    if (password) update.password = password;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    await logAudit(cid, 'User', user._id, 'UPDATE', req.user._id, {
      description: `Employee ${user.profile?.firstName} ${user.profile?.lastName} updated`,
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    const cid = getConsultancyId(req.user);
    if (req.user.role === 'AGENT') return res.status(403).json({ error: 'Only admin can delete employees' });
    await logAudit(cid, 'User', user._id, 'DELETE', req.user._id, {
      description: `Employee ${user.profile?.firstName} ${user.profile?.lastName} removed`,
    });
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
