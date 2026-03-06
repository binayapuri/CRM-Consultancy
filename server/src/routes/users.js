import express from 'express';
import User from '../models/User.js';
import Consultancy from '../models/Consultancy.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Super Admin: create test accounts (student, agent, admin)
router.post('/test-account', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { email, password, role, profile, consultancyId } = req.body;
    if (!email || !password || !role) return res.status(400).json({ error: 'Email, password, and role required' });
    if (!['STUDENT', 'AGENT', 'MANAGER', 'CONSULTANCY_ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Role must be STUDENT, AGENT, MANAGER, or CONSULTANCY_ADMIN' });
    }
    if (await User.findOne({ email })) return res.status(400).json({ error: 'Email already exists' });
    const needsConsultancy = ['AGENT', 'MANAGER', 'CONSULTANCY_ADMIN'].includes(role);
    let cid = consultancyId;
    if (needsConsultancy && !cid) {
      const first = await Consultancy.findOne();
      if (!first) return res.status(400).json({ error: 'No consultancy exists. Create one first.' });
      cid = first._id;
    }
    const user = await User.create({
      email,
      password,
      role,
      profile: { ...profile, consultancyId: cid },
      isTestAccount: true,
    });
    res.status(201).json({ id: user._id, email: user.email, role: user.role, profile: user.profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const filter = req.user.role === 'SUPER_ADMIN' ? {} : { 'profile.consultancyId': req.user.profile?.consultancyId };
    const users = await User.find(filter).select('-password').populate('profile.consultancyId', 'name displayName');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/agents', authenticate, async (req, res) => {
  try {
    const filter = req.user.role === 'SUPER_ADMIN' ? {} : { 'profile.consultancyId': req.user.profile?.consultancyId };
    const agents = await User.find({ ...filter, role: 'AGENT' }).select('-password');
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', authenticate, requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (req.user.role === 'SUPER_ADMIN') {
      const { password, profile, role, isActive, isTestAccount, ...rest } = req.body;
      const update = { ...rest };
      if (profile) update.profile = { ...(target.profile?.toObject?.() || target.profile || {}), ...profile };
      if (role !== undefined) update.role = role;
      if (isActive !== undefined) update.isActive = isActive;
      if (isTestAccount !== undefined) update.isTestAccount = isTestAccount;
      let user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
      if (password && user) {
        user.password = password;
        await user.save();
      }
      return res.json(await User.findById(req.params.id).select('-password'));
    }
    const cid = req.user.profile?.consultancyId;
    if (!cid || target.profile?.consultancyId?.toString() !== cid?.toString()) {
      return res.status(403).json({ error: 'Can only edit users in your consultancy' });
    }
    const { password, profile, role, ...rest } = req.body;
    const update = { ...rest };
    if (profile) update.profile = { ...(target.profile?.toObject?.() || target.profile || {}), ...profile };
    if (role && ['AGENT', 'MANAGER'].includes(role)) update.role = role;
    let user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (password && user) {
      user.password = password;
      await user.save();
    }
    res.json(await User.findById(req.params.id).select('-password'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'SUPER_ADMIN') return res.status(403).json({ error: 'Cannot delete Super Admin' });
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, deactivated: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
