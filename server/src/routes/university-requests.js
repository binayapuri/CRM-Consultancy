import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../shared/models/User.js';
import University from '../shared/models/University.js';
import UniversityRequest from '../shared/models/UniversityRequest.js';
import { authenticate, requireRole } from '../shared/middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'orivisa-secret-key-change-in-production';

router.post('/public/register', async (req, res) => {
  try {
    const body = req.body || {};
    const institutionName = String(body.institutionName || '').trim();
    const contactName = String(body.contactName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!institutionName) return res.status(400).json({ error: 'Institution name is required' });
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const user = await User.create({
      email,
      password,
      role: 'UNIVERSITY_PARTNER',
      isActive: false,
      profile: { firstName: contactName || 'University', lastName: 'Partner', phone: body.phone || '' },
    });

    await UniversityRequest.create({
      institutionName,
      website: body.website || '',
      cricosProviderCode: body.cricosProviderCode || '',
      contactName,
      email,
      phone: body.phone || '',
      campuses: Array.isArray(body.campuses) ? body.campuses : [],
      courseSummary: Array.isArray(body.courseSummary) ? body.courseSummary.map((x) => String(x)) : [],
      intakeMonths: Array.isArray(body.intakeMonths) ? body.intakeMonths.map((x) => String(x)) : [],
      tuitionRange: body.tuitionRange || '',
      notes: body.notes || '',
      requestedByUserId: user._id,
      status: 'PENDING',
    });

    return res.status(201).json({
      success: true,
      message: 'University request submitted. A consultancy and super admin will verify your account before login is enabled.',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/public/:email/status', async (req, res) => {
  try {
    const email = String(req.params.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const doc = await UniversityRequest.findOne({ email }).sort({ createdAt: -1 });
    if (!doc) return res.status(404).json({ error: 'No request found for this email' });
    return res.json({
      institutionName: doc.institutionName,
      status: doc.status,
      updatedAt: doc.updatedAt,
      rejectionReason: doc.rejectionReason || '',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.use(authenticate);

router.get('/', requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER', 'AGENT'), async (req, res) => {
  try {
    const status = req.query.status ? String(req.query.status) : '';
    const q = {};
    if (status && status !== 'ALL') q.status = status;
    const rows = await UniversityRequest.find(q).sort({ createdAt: -1 }).limit(300);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/consultancy-review', requireRole('CONSULTANCY_ADMIN', 'MANAGER', 'AGENT', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const row = await UniversityRequest.findById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Request not found' });
    if (row.status === 'SUPER_APPROVED') return res.status(400).json({ error: 'Request already approved by super admin' });

    const decision = String(req.body?.decision || '').toUpperCase();
    if (!['RECOMMEND', 'REVIEWED', 'REJECT'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be RECOMMEND, REVIEWED, or REJECT' });
    }

    row.consultancyReview = {
      byUserId: req.user._id,
      consultancyId: req.user.profile?.consultancyId,
      decision,
      notes: String(req.body?.notes || ''),
      reviewedAt: new Date(),
    };
    row.status =
      decision === 'RECOMMEND'
        ? 'CONSULTANCY_RECOMMENDED'
        : decision === 'REVIEWED'
        ? 'CONSULTANCY_REVIEWED'
        : 'REJECTED';
    if (decision === 'REJECT') row.rejectionReason = String(req.body?.notes || 'Rejected during consultancy review');
    await row.save();
    return res.json(row);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/super-review', requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const row = await UniversityRequest.findById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Request not found' });

    const decision = String(req.body?.decision || '').toUpperCase();
    if (!['APPROVE', 'REJECT'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be APPROVE or REJECT' });
    }

    row.superAdminReview = {
      byUserId: req.user._id,
      decision,
      notes: String(req.body?.notes || ''),
      reviewedAt: new Date(),
    };

    const user = await User.findById(row.requestedByUserId);
    if (!user) return res.status(404).json({ error: 'University user account not found' });

    if (decision === 'APPROVE') {
      let university = await University.findOne({ name: row.institutionName });
      if (!university) {
        const firstCampus = Array.isArray(row.campuses) && row.campuses[0] ? row.campuses[0] : {};
        university = await University.create({
          name: row.institutionName,
          website: row.website || '',
          description: row.notes || '',
          location: {
            city: firstCampus.city || '',
            state: firstCampus.state || '',
            country: firstCampus.country || 'Australia',
          },
          partnerStatus: 'VERIFIED',
          isActive: true,
        });
      }
      row.universityId = university._id;
      row.status = 'SUPER_APPROVED';
      row.rejectionReason = '';

      user.isActive = true;
      user.profile = user.profile || {};
      user.profile.universityId = university._id;
      await user.save();
    } else {
      row.status = 'REJECTED';
      row.rejectionReason = String(req.body?.notes || 'Rejected by super admin');
      user.isActive = false;
      await user.save();
    }

    await row.save();
    return res.json(row);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/:id/impersonation-token', requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const row = await UniversityRequest.findById(req.params.id);
    if (!row?.requestedByUserId) return res.status(404).json({ error: 'University request not found' });
    const token = jwt.sign({ userId: row.requestedByUserId }, JWT_SECRET, { expiresIn: '15m' });
    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

