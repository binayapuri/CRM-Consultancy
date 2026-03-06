import express from 'express';
import OSHC from '../models/OSHC.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const getConsultancyId = (user) => user.profile?.consultancyId || user._id;

router.get('/', authenticate, async (req, res) => {
  try {
    const { coverageType, applicationType, consultancyId } = req.query;
    const cid = getConsultancyId(req.user);
    const conditions = [];
    if (req.user.role === 'SUPER_ADMIN' && consultancyId) {
      conditions.push({ $or: [{ consultancyId }, { consultancyIds: consultancyId }] });
    } else if (req.user.role !== 'SUPER_ADMIN') {
      conditions.push({ $or: [{ consultancyId: cid }, { consultancyIds: cid }, { consultancyId: null }, { consultancyId: { $exists: false } }] });
    }
    if (coverageType) conditions.push({ coverageType });
    if (applicationType) conditions.push({ $or: [{ applicationType }, { applicationType: 'BOTH' }] });
    const filter = conditions.length ? { $and: conditions } : {};
    const providers = await OSHC.find(filter).sort({ provider: 1, pricePerMonth: 1 });
    res.json(providers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    const oshc = await OSHC.create({ ...req.body, consultancyId: cid });
    res.status(201).json(oshc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const oshc = await OSHC.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!oshc) return res.status(404).json({ error: 'Not found' });
    res.json(oshc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const oshc = await OSHC.findByIdAndDelete(req.params.id);
    if (!oshc) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
