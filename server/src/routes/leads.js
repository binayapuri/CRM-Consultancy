import express from 'express';
import Lead from '../models/Lead.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const getConsultancyId = (user) => user.profile?.consultancyId || user._id;

router.get('/', authenticate, async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    let filter = req.user.role === 'SUPER_ADMIN' ? {} : { consultancyId: cid };
    if (req.user.role === 'SUPER_ADMIN' && req.query.consultancyId) filter = { consultancyId: req.query.consultancyId };
    const leads = await Lead.find(filter).populate('assignedTo', 'profile').sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assignedTo', 'profile');
    if (!lead) return res.status(404).json({ error: 'Not found' });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    const lead = await Lead.create({ ...req.body, consultancyId: cid });
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    const filter = req.user.role === 'SUPER_ADMIN' ? { _id: req.params.id } : { _id: req.params.id, consultancyId: cid };
    const lead = await Lead.findOne(filter);
    if (!lead) return res.status(404).json({ error: 'Not found' });
    const updated = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('assignedTo', 'profile');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    const filter = req.user.role === 'SUPER_ADMIN' ? { _id: req.params.id } : { _id: req.params.id, consultancyId: cid };
    const lead = await Lead.findOne(filter);
    if (!lead) return res.status(404).json({ error: 'Not found' });
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/convert', authenticate, async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    const Client = (await import('../models/Client.js')).default;
    const client = await Client.create({
      consultancyId: cid,
      leadId: lead._id,
      profile: {
        firstName: lead.profile?.firstName || 'Unknown',
        lastName: lead.profile?.lastName || 'Lead',
        email: lead.profile?.email || `lead-${lead._id}@temp.local`,
        phone: lead.profile?.phone,
        notes: lead.profile?.notes,
      },
      assignedAgentId: lead.assignedTo,
      status: 'ACTIVE',
    });
    await Lead.findByIdAndUpdate(lead._id, { status: 'CONVERTED', convertedToClientId: client._id });
    res.status(201).json({ client, lead });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
