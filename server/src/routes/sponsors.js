import express from 'express';
import Sponsor from '../models/Sponsor.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const getConsultancyId = (user) => user.profile?.consultancyId || user._id;

router.get('/', authenticate, async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    let filter = req.user.role === 'SUPER_ADMIN' ? {} : { consultancyId: cid };
    if (req.user.role === 'SUPER_ADMIN' && req.query.consultancyId) filter = { consultancyId: req.query.consultancyId };
    const sponsors = await Sponsor.find(filter).sort({ companyName: 1 });
    res.json(sponsors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    if (!cid) return res.status(400).json({ error: 'No consultancy assigned' });
    const sponsor = await Sponsor.create({ ...req.body, consultancyId: cid });
    res.status(201).json(sponsor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id);
    if (!sponsor) return res.status(404).json({ error: 'Not found' });
    const cid = getConsultancyId(req.user);
    if (req.user.role !== 'SUPER_ADMIN' && sponsor.consultancyId?.toString() !== cid?.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    res.json(sponsor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id);
    if (!sponsor) return res.status(404).json({ error: 'Not found' });
    const cid = getConsultancyId(req.user);
    if (req.user.role !== 'SUPER_ADMIN' && sponsor.consultancyId?.toString() !== cid?.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const updated = await Sponsor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id);
    if (!sponsor) return res.status(404).json({ error: 'Not found' });
    const cid = getConsultancyId(req.user);
    if (req.user.role !== 'SUPER_ADMIN' && sponsor.consultancyId?.toString() !== cid?.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await Sponsor.findByIdAndDelete(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
