import express from 'express';
import College from '../models/College.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const getConsultancyId = (user) => user.profile?.consultancyId || user._id;

router.get('/', authenticate, async (req, res) => {
  try {
    const { q, type, state, city, feeMin, feeMax } = req.query;
    const filter = {};
    const andParts = [];
    if (req.user.role === 'SUPER_ADMIN' && req.query.consultancyId) {
      andParts.push({ $or: [{ consultancyId: req.query.consultancyId }, { consultancyIds: req.query.consultancyId }] });
    } else if (req.user.role !== 'SUPER_ADMIN') {
      const cid = getConsultancyId(req.user);
      andParts.push({ $or: [{ consultancyId: cid }, { consultancyIds: cid }] });
    }
    if (q) andParts.push({ $or: [{ name: new RegExp(q, 'i') }, { cricosCode: new RegExp(q, 'i') }] });
    if (andParts.length) filter.$and = andParts;
    if (type) filter.type = type;
    if (state) filter['location.state'] = new RegExp(String(state), 'i');
    if (city) filter['location.city'] = new RegExp(String(city), 'i');
    if (feeMin || feeMax) {
      const feeQ = {};
      if (feeMin) feeQ.$gte = parseFloat(feeMin);
      if (feeMax) feeQ.$lte = parseFloat(feeMax);
      if (Object.keys(feeQ).length) filter['courses.feePerYear'] = feeQ;
    }
    const colleges = await College.find(filter).limit(100).sort({ name: 1 });
    res.json(colleges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/compare', authenticate, async (req, res) => {
  try {
    const ids = (req.query.ids || '').split(',').filter(Boolean).slice(0, 5);
    if (!ids.length) return res.json([]);
    const colleges = await College.find({ _id: { $in: ids } });
    res.json(colleges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    const college = await College.create({ ...req.body, consultancyId: cid });
    res.status(201).json(college);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) return res.status(404).json({ error: 'Not found' });
    res.json(college);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const college = await College.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!college) return res.status(404).json({ error: 'Not found' });
    res.json(college);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const college = await College.findByIdAndDelete(req.params.id);
    if (!college) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
