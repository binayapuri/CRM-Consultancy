import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Sponsor from '../models/Sponsor.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { sendEmail } from '../utils/email.js';

const router = express.Router();
const getConsultancyId = (user) => user.profile?.consultancyId || user._id;
const JWT_SECRET = process.env.JWT_SECRET || 'orivisa-secret-key-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Sponsor portal: get my sponsor record (role=SPONSOR)
router.get('/me', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'SPONSOR') return res.status(403).json({ error: 'Sponsor access only' });
    const sponsor = await Sponsor.findOne({ userId: req.user._id }).populate('consultancyId', 'name displayName');
    if (!sponsor) return res.status(404).json({ error: 'No sponsor profile linked' });
    res.json(sponsor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// Invite sponsor to portal - creates User + sends login link
router.post('/:id/invite-portal', authenticate, async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id);
    if (!sponsor) return res.status(404).json({ error: 'Not found' });
    const cid = getConsultancyId(req.user);
    if (req.user.role !== 'SUPER_ADMIN' && sponsor.consultancyId?.toString() !== cid?.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const email = sponsor.contactPerson?.email || sponsor.email;
    if (!email) return res.status(400).json({ error: 'Sponsor must have contact email' });
    let user = await User.findOne({ email });
    if (user) {
      if (user.role === 'SPONSOR' && user.sponsorId?.toString() === sponsor._id.toString()) {
        return res.status(400).json({ error: 'Sponsor already has portal access' });
      }
      user.role = 'SPONSOR';
      user.sponsorId = sponsor._id;
      user.profile = user.profile || {};
      user.profile.firstName = sponsor.contactPerson?.firstName || user.profile?.firstName;
      user.profile.lastName = sponsor.contactPerson?.lastName || user.profile?.lastName;
      await user.save();
    } else {
      user = await User.create({
        email,
        password: crypto.randomBytes(16).toString('hex'),
        role: 'SPONSOR',
        sponsorId: sponsor._id,
        profile: {
          firstName: sponsor.contactPerson?.firstName,
          lastName: sponsor.contactPerson?.lastName,
        },
      });
    }
    sponsor.userId = user._id;
    await sponsor.save();
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    const loginUrl = `${FRONTEND_URL}/auth/callback?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'ORIVISA - Your Sponsor Portal Access',
      html: `<p>Your sponsor portal is ready for ${sponsor.companyName}.</p><p><a href="${loginUrl}">Click here to sign in</a></p><p>Link valid for 7 days. You can reset your password after logging in.</p>`,
    });
    res.json({ success: true, message: 'Invitation sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
