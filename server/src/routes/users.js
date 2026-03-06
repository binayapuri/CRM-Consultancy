import express from 'express';
import User from '../models/User.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN'), async (req, res) => {
  try {
    const filter = req.user.role === 'SUPER_ADMIN' ? {} : { 'profile.consultancyId': req.user.profile?.consultancyId };
    const users = await User.find(filter).select('-password').populate('profile.consultancyId');
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

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
