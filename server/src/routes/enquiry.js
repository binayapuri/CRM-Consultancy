import express from 'express';
import Lead from '../models/Lead.js';
import Consultancy from '../models/Consultancy.js';

const router = express.Router();

// Public enquiry - no auth required (creates lead for consultancy)
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, interest, message, consultancyId } = req.body;
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'First name, last name and email are required' });
    }
    let cid = consultancyId;
    if (!cid) {
      const first = await Consultancy.findOne({ verified: true }).select('_id');
      cid = first?._id;
    }
    if (!cid) return res.status(400).json({ error: 'No consultancy available. Please try again later.' });
    const lead = await Lead.create({
      consultancyId: cid,
      source: 'Website',
      status: 'NEW',
      profile: { firstName, lastName, email, phone, interest: interest || 'General Enquiry', notes: message },
    });
    res.status(201).json({ success: true, message: 'Thank you! We will contact you soon.', leadId: lead._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
