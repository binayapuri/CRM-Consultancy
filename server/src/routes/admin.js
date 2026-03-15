import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import Consultancy from '../models/Consultancy.js';
import Employer from '../models/Employer.js';
import InsuranceProvider from '../models/InsuranceProvider.js';

const router = express.Router();

// Get the verification queue
router.get('/verifications', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const consultancies = await Consultancy.find({ verified: false }).select('name email abn phone createdAt marnNumbers');
    const employers = await Employer.find({ verificationStatus: 'PENDING' }).select('companyName abn industry website createdAt');
    const insurers = await InsuranceProvider.find({ verificationStatus: 'PENDING' }).select('companyName contactDetails createdAt');

    res.json({
      consultancies: consultancies.map(c => ({ id: c._id, type: 'CONSULTANCY', name: c.name, email: c.email, abn: c.abn, marn: c.marnNumbers?.[0], date: c.createdAt })),
      employers: employers.map(e => ({ id: e._id, type: 'EMPLOYER', name: e.companyName, abn: e.abn, industry: e.industry, date: e.createdAt })),
      insurers: insurers.map(i => ({ id: i._id, type: 'INSURER', name: i.companyName, email: i.contactDetails?.email, date: i.createdAt }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Action on verification (Approve | Reject)
router.post('/verify/:type/:id', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { type, id } = req.params;
    const { action } = req.body; // 'APPROVE' or 'REJECT'

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ error: 'Action must be APPROVE or REJECT' });
    }

    if (type === 'CONSULTANCY') {
      if (action === 'APPROVE') {
        const c = await Consultancy.findByIdAndUpdate(id, { verified: true }, { new: true });
        if (!c) return res.status(404).json({ error: 'Consultancy not found' });
      } else {
        await Consultancy.findByIdAndDelete(id); // Or set to REJECTED if we refactor Consultancy
      }
    } else if (type === 'EMPLOYER') {
      const e = await Employer.findByIdAndUpdate(id, { verificationStatus: action === 'APPROVE' ? 'VERIFIED' : 'REJECTED' }, { new: true });
      if (!e) return res.status(404).json({ error: 'Employer not found' });
    } else if (type === 'INSURER') {
      const i = await InsuranceProvider.findByIdAndUpdate(id, { verificationStatus: action === 'APPROVE' ? 'VERIFIED' : 'REJECTED' }, { new: true });
      if (!i) return res.status(404).json({ error: 'Insurer not found' });
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

    res.json({ success: true, message: `${type} ${action}D successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

import User from '../models/User.js';
import Client from '../models/Client.js';
import Application from '../models/Application.js';
import PlatformSettings from '../models/PlatformSettings.js';

const MASK = '••••••••';

function maskSecrets(doc) {
  if (!doc) return doc;
  const d = doc.toObject ? doc.toObject() : { ...doc };
  if (d.smtp?.pass) d.smtp.pass = MASK;
  if (d.auth?.google?.clientSecret) d.auth.google.clientSecret = MASK;
  if (d.auth?.apple?.privateKey) d.auth.apple.privateKey = MASK;
  return d;
}

// ─── GET all students ───────────────────────────────────────────────────────
router.get('/students', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const students = await User.find({ role: 'STUDENT' }).select('-password').sort({ createdAt: -1 });
    const studentIds = students.map(s => s._id);
    const clients = await Client.find({ userId: { $in: studentIds } });
    const clientMap = {};
    clients.forEach(c => { clientMap[String(c.userId)] = c; });
    const result = students.map(s => ({
      ...s.toObject(),
      client: clientMap[String(s._id)] || null,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH student (toggle active, etc.) ───────────────────────────────────
router.patch('/students/:id', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const allowed = ['isActive'];
    const update = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    }
    const user = await User.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'Student not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Platform stats ─────────────────────────────────────────────────────────
router.get('/stats', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [totalStudents, totalConsultancies, totalApplications, activeThisWeek] = await Promise.all([
      User.countDocuments({ role: 'STUDENT' }),
      (await import('../models/Consultancy.js')).default.countDocuments(),
      Application.countDocuments(),
      User.countDocuments({ role: 'STUDENT', updatedAt: { $gte: oneWeekAgo } }),
    ]);
    res.json({ totalStudents, totalConsultancies, totalApplications, activeThisWeek });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Platform settings (singleton, lazy init) ────────────────────────────────
router.get('/settings', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    let doc = await PlatformSettings.findOne();
    if (!doc) {
      doc = await PlatformSettings.create({});
    }
    res.json(maskSecrets(doc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/settings', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    let doc = await PlatformSettings.findOne();
    if (!doc) {
      doc = await PlatformSettings.create({});
    }
    const body = req.body || {};
    const update = {};

    if (body.smtp != null) {
      update.smtp = { ...doc.smtp?.toObject?.() ?? doc.smtp ?? {}, ...body.smtp };
      if (update.smtp.pass === MASK || update.smtp.pass === '') {
        update.smtp.pass = doc.smtp?.pass ?? '';
      }
    }
    if (body.auth != null) {
      update.auth = { ...doc.auth?.toObject?.() ?? doc.auth ?? {}, ...body.auth };
      if (body.auth.google != null) {
        update.auth.google = { ...doc.auth?.google?.toObject?.() ?? doc.auth?.google ?? {}, ...body.auth.google };
        if (update.auth.google.clientSecret === MASK || update.auth.google.clientSecret === '') {
          update.auth.google.clientSecret = doc.auth?.google?.clientSecret ?? '';
        }
      }
      if (body.auth.apple != null) {
        update.auth.apple = { ...doc.auth?.apple?.toObject?.() ?? doc.auth?.apple ?? {}, ...body.auth.apple };
        if (update.auth.apple.privateKey === MASK || update.auth.apple.privateKey === '') {
          update.auth.apple.privateKey = doc.auth?.apple?.privateKey ?? '';
        }
      }
    }
    if (body.notifications != null) {
      update.notifications = { ...doc.notifications?.toObject?.() ?? doc.notifications ?? {}, ...body.notifications };
    }

    Object.keys(update).forEach(key => doc.set(key, update[key]));
    await doc.save();
    res.json(maskSecrets(doc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
