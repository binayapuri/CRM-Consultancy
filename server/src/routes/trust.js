import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import TrustLedger from '../models/TrustLedger.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = express.Router();

const getConsultancyId = (user) => user.profile?.consultancyId || user._id;

router.get('/', authenticate, requirePermission('trustLedger', 'view'), async (req, res) => {
  try {
    let cid = getConsultancyId(req.user);
    if (req.user.role === 'SUPER_ADMIN' && req.query.consultancyId) cid = req.query.consultancyId;
    const { applicationId } = req.query;
    const filter = { consultancyId: cid };
    if (applicationId) filter.applicationId = applicationId;
    const entries = await TrustLedger.find(filter).sort({ createdAt: -1 });
    const balance = entries.reduce((acc, e) => acc + (e.direction === 'CREDIT' ? e.amount : -e.amount), 0);
    res.json({ entries, balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, requirePermission('trustLedger', 'edit'), async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    const { amount, direction, applicationId, clientId, description, category } = req.body;
    const entries = await TrustLedger.find({ consultancyId: cid }).sort({ createdAt: -1 });
    const balance = entries.reduce((acc, e) => acc + (e.direction === 'CREDIT' ? e.amount : -e.amount), 0);
    const newBalance = balance + (direction === 'CREDIT' ? amount : -amount);
    const entry = await TrustLedger.create({
      consultancyId: cid,
      applicationId,
      clientId,
      transactionId: uuidv4(),
      amount,
      direction,
      balanceSnapshot: newBalance,
      description,
      category: category || 'Client Deposit',
      createdBy: req.user._id,
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', authenticate, requirePermission('trustLedger', 'edit'), async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    const entry = await TrustLedger.findOne({ _id: req.params.id, consultancyId: cid });
    if (!entry) return res.status(404).json({ error: 'Not found' });
    const { description, category } = req.body;
    if (description !== undefined) entry.description = description;
    if (category !== undefined) entry.category = category;
    await entry.save();
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, requirePermission('trustLedger', 'edit'), async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    const entry = await TrustLedger.findOneAndDelete({ _id: req.params.id, consultancyId: cid });
    if (!entry) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
