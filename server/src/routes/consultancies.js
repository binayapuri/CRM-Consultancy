import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Consultancy from '../models/Consultancy.js';
import Client from '../models/Client.js';
import Application from '../models/Application.js';
import Task from '../models/Task.js';
import Lead from '../models/Lead.js';
import Document from '../models/Document.js';
import TrustLedger from '../models/TrustLedger.js';
import Sponsor from '../models/Sponsor.js';
import User from '../models/User.js';
import College from '../models/College.js';
import OSHC from '../models/OSHC.js';
import Attendance from '../models/Attendance.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `consultancy-sig-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB

const router = express.Router();

router.post('/me/signature', authenticate, requireRole('CONSULTANCY_ADMIN', 'MANAGER'), upload.single('file'), async (req, res) => {
  try {
    const cid = req.user.profile?.consultancyId;
    if (!cid) return res.status(404).json({ error: 'No consultancy assigned' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileUrl = `/uploads/${req.file.filename}`;
    const c = await Consultancy.findByIdAndUpdate(cid, {
      'form956Details.signatureUrl': fileUrl,
      'miaAgreementDetails.signatureUrl': fileUrl,
    }, { new: true });
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json({ signatureUrl: fileUrl, consultancy: c });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const filter = req.user.role === 'SUPER_ADMIN' ? {} : { _id: req.user.profile?.consultancyId };
    const consultancies = await Consultancy.find(filter || {});
    res.json(req.user.role === 'SUPER_ADMIN' ? consultancies : (consultancies[0] ? [consultancies[0]] : []));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q, specialization, state } = req.query;
    const filter = { verified: true };
    if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { specializations: new RegExp(q, 'i') }];
    if (specialization) filter.specializations = new RegExp(specialization, 'i');
    if (state) filter['address.state'] = state;
    const consultancies = await Consultancy.find(filter).limit(20);
    res.json(consultancies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    let cid = req.user.profile?.consultancyId;
    if (req.user.role === 'SUPER_ADMIN' && req.query.consultancyId) cid = req.query.consultancyId;
    if (!cid) return res.status(404).json({ error: 'No consultancy assigned' });
    const c = await Consultancy.findById(cid);
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json(c);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const c = await Consultancy.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json(c);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Super Admin: full consultancy overview with stats and recent data
router.get('/:id/overview', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const cid = req.params.id;
    const consultancy = await Consultancy.findById(cid);
    if (!consultancy) return res.status(404).json({ error: 'Not found' });

    const [clients, employees, applications, tasks, leads, documents, trustEntries, sponsors, colleges, oshc, attendanceToday] = await Promise.all([
      Client.countDocuments({ consultancyId: cid }),
      User.countDocuments({ 'profile.consultancyId': cid }),
      Application.countDocuments({ consultancyId: cid }),
      Task.countDocuments({ consultancyId: cid }),
      Lead.countDocuments({ consultancyId: cid }),
      Document.countDocuments({ consultancyId: cid }),
      TrustLedger.countDocuments({ consultancyId: cid }),
      Sponsor.countDocuments({ consultancyId: cid }),
      College.countDocuments({ $or: [{ consultancyId: cid }, { consultancyIds: cid }] }),
      OSHC.countDocuments({ $or: [{ consultancyId: cid }, { consultancyIds: cid }] }),
      Attendance.countDocuments({ consultancyId: cid, date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
    ]);

    const trustBalance = await TrustLedger.aggregate([
      { $match: { consultancyId: consultancy._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const recentClients = await Client.find({ consultancyId: cid })
      .populate('assignedAgentId', 'profile')
      .sort({ lastActivityAt: -1 })
      .limit(10)
      .select('profile status assignedAgentId lastActivityAt');

    const recentApplications = await Application.find({ consultancyId: cid })
      .populate('clientId', 'profile')
      .populate('agentId', 'profile')
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('visaSubclass status clientId agentId updatedAt');

    const employeesList = await User.find({ 'profile.consultancyId': cid })
      .select('-password')
      .select('email role profile isActive');

    const appStatusBreakdown = await Application.aggregate([
      { $match: { consultancyId: consultancy._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      consultancy,
      stats: {
        clients,
        employees,
        applications,
        tasks,
        leads,
        documents,
        trustEntries,
        sponsors,
        colleges,
        oshc,
        attendanceToday,
        trustBalance: trustBalance[0]?.total ?? 0,
      },
      recentClients,
      recentApplications,
      employeesList,
      appStatusBreakdown: appStatusBreakdown.reduce((acc, x) => { acc[x._id] = x.count; return acc; }, {}),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: Consultancy registration (admin signup with business email + MARN)
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, marnNumber, consultancyName, abn, phone } = req.body;
    if (!email || !password || !firstName || !lastName || !marnNumber || !consultancyName) {
      return res.status(400).json({ error: 'Email, password, name, MARN number, and consultancy name are required' });
    }
    const { isBusinessEmail } = await import('../utils/emailValidation.js');
    if (!isBusinessEmail(email)) {
      return res.status(400).json({ error: 'Consultancy admin must use a business email (e.g. @orivisa.com, @yourcompany.com.au). Personal emails like Gmail, Yahoo are not allowed.' });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const existingConsultancy = await Consultancy.findOne({ $or: [{ email }, { 'form956Details.email': email }] });
    if (existingConsultancy) {
      return res.status(400).json({ error: 'A consultancy with this email already exists' });
    }
    const consultancy = await Consultancy.create({
      name: consultancyName,
      displayName: consultancyName,
      abn: abn || undefined,
      email,
      phone: phone || undefined,
      marnNumbers: [String(marnNumber).trim()],
      verified: false,
      form956Details: {
        agentName: `${firstName} ${lastName}`,
        marnNumber: String(marnNumber).trim(),
        email,
        phone: phone || undefined,
      },
      miaAgreementDetails: {
        agentName: `${firstName} ${lastName}`,
        marnNumber: String(marnNumber).trim(),
      },
      rolePermissions: [
        { role: 'CONSULTANCY_ADMIN', permissions: { clients: { view: true, create: true, edit: true, delete: true }, applications: { view: true, create: true, edit: true, delete: true }, tasks: { view: true, create: true, edit: true, delete: true }, kanban: { view: true, edit: true }, leads: { view: true, create: true, edit: true, delete: true }, documents: { view: true, upload: true, delete: true }, trustLedger: { view: true, edit: true }, employees: { view: true, manage: true }, traceHistory: { view: true }, settings: { view: true, edit: true }, colleges: { view: true, manage: true }, oshc: { view: true, manage: true }, sponsors: { view: true, create: true, edit: true, delete: true }, sendDocuments: true, sendAdvice: true } },
        { role: 'MANAGER', permissions: { clients: { view: true, create: true, edit: true, delete: true }, applications: { view: true, create: true, edit: true, delete: true }, tasks: { view: true, create: true, edit: true, delete: true }, kanban: { view: true, edit: true }, leads: { view: true, create: true, edit: true, delete: true }, documents: { view: true, upload: true, delete: true }, trustLedger: { view: true, edit: true }, employees: { view: true, manage: true }, traceHistory: { view: true }, settings: { view: true, edit: true }, colleges: { view: true, manage: true }, oshc: { view: true, manage: true }, sponsors: { view: true, create: true, edit: true, delete: true }, sendDocuments: true, sendAdvice: true } },
        { role: 'AGENT', permissions: { clients: { view: true, create: true, edit: true, delete: false }, applications: { view: true, create: true, edit: true, delete: false }, tasks: { view: true, create: true, edit: true, delete: false }, kanban: { view: true, edit: true }, leads: { view: true, create: true, edit: true, delete: false }, documents: { view: true, upload: true, delete: false }, trustLedger: { view: false, edit: false }, employees: { view: true, manage: false }, traceHistory: { view: false }, settings: { view: false, edit: false }, colleges: { view: true, manage: false }, oshc: { view: true, manage: false }, sponsors: { view: true, create: true, edit: true, delete: false }, sendDocuments: true, sendAdvice: true } },
        { role: 'SUPPORT', permissions: { clients: { view: true, create: false, edit: true, delete: false }, applications: { view: true, create: false, edit: true, delete: false }, tasks: { view: true, create: true, edit: true, delete: false }, kanban: { view: true, edit: true }, leads: { view: true, create: true, edit: true, delete: false }, documents: { view: true, upload: true, delete: false }, trustLedger: { view: false, edit: false }, employees: { view: false, manage: false }, traceHistory: { view: false }, settings: { view: false, edit: false }, colleges: { view: true, manage: false }, oshc: { view: true, manage: false }, sponsors: { view: true, create: false, edit: true, delete: false }, sendDocuments: true, sendAdvice: false } },
      ],
    });
    const user = await User.create({
      email,
      password,
      role: 'CONSULTANCY_ADMIN',
      profile: { firstName, lastName, consultancyId: consultancy._id },
    });
    const jwt = (await import('jsonwebtoken')).default;
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'orivisa-secret-key-change-in-production', { expiresIn: '7d' });
    res.status(201).json({
      user: { id: user._id, _id: user._id, email: user.email, role: user.role, profile: user.profile },
      token,
      consultancy: { id: consultancy._id, name: consultancy.name },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const consultancy = await Consultancy.create(req.body);
    res.status(201).json(consultancy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/me', authenticate, requireRole('CONSULTANCY_ADMIN', 'MANAGER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    let cid = req.user.profile?.consultancyId;
    if (req.user.role === 'SUPER_ADMIN' && req.body.consultancyId) {
      cid = req.body.consultancyId;
      delete req.body.consultancyId;
    }
    if (!cid) return res.status(404).json({ error: 'No consultancy assigned. Use consultancyId in body when Super Admin.' });
    if (Array.isArray(req.body.emailProfiles) && req.body.emailProfiles.length > 0) {
      const existing = await Consultancy.findById(cid).select('emailProfiles').lean();
      const existingProfiles = existing?.emailProfiles || [];
      req.body.emailProfiles = req.body.emailProfiles.map((p) => {
        if (p._id && (!p.pass || String(p.pass).trim() === '' || p.pass === '••••••••')) {
          const old = existingProfiles.find((ep) => String(ep._id) === String(p._id));
          if (old?.pass) return { ...p, pass: old.pass };
        }
        return p;
      });
    }
    const c = await Consultancy.findByIdAndUpdate(cid, req.body, { new: true });
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json(c);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', authenticate, requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const cid = req.user.profile?.consultancyId;
    if (['CONSULTANCY_ADMIN', 'MANAGER'].includes(req.user.role) && cid?.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Can only update your own consultancy' });
    }
    const c = await Consultancy.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json(c);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const c = await Consultancy.findByIdAndDelete(req.params.id);
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
