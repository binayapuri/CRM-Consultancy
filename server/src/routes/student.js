/**
 * /api/student/* — Student self-service API
 * All routes require STUDENT role, scoped to the authenticated user only.
 * No consultancyId dependency — students own their data.
 */
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate, requireRole } from '../middleware/auth.js';
import User from '../models/User.js';
import Client from '../models/Client.js';
import Document from '../models/Document.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `student-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router();

// All routes require STUDENT role
router.use(authenticate);
router.use((req, res, next) => {
  if (req.user.role !== 'STUDENT' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Student portal only' });
  }
  next();
});

// ─── Helper: Get or create the student's self-owned Client record ────────────
async function getOrCreateStudentClient(userId, userProfile) {
  let client = await Client.findOne({ userId });
  if (!client) {
    // Create a minimal self-owned client record.
    // consultancyId is a placeholder ObjectId (student-owned)
    const mongoose = (await import('mongoose')).default;
    const STUDENT_OWNED_CONSULTANCY = new mongoose.Types.ObjectId('000000000000000000000000');
    client = await Client.create({
      userId,
      consultancyId: STUDENT_OWNED_CONSULTANCY,
      profile: {
        firstName: userProfile?.firstName || '',
        lastName: userProfile?.lastName || '',
        email: userProfile?.email || '',
        phone: userProfile?.phone || '',
      },
    });
  }
  return client;
}

// ─── GET /api/student/profile ─────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const client = await Client.findOne({ userId: req.user._id });
    res.json({ user, client });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/student/profile — Update User.profile ────────────────────────
router.patch('/profile', async (req, res) => {
  try {
    const { firstName, lastName, phone, dob, gender, nationality, countryOfBirth,
      maritalStatus, passportNumber, passportExpiry, passportCountry, address } = req.body;

    const update = {};
    if (firstName !== undefined) update['profile.firstName'] = firstName;
    if (lastName !== undefined) update['profile.lastName'] = lastName;
    if (phone !== undefined) update['profile.phone'] = phone;

    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true }).select('-password');

    // Also sync client profile
    const client = await getOrCreateStudentClient(req.user._id, user?.profile);
    const clientUpdate = {};
    if (firstName !== undefined) clientUpdate['profile.firstName'] = firstName;
    if (lastName !== undefined) clientUpdate['profile.lastName'] = lastName;
    if (phone !== undefined) clientUpdate['profile.phone'] = phone;
    if (dob !== undefined) clientUpdate['profile.dob'] = dob ? new Date(dob) : null;
    if (gender !== undefined) clientUpdate['profile.gender'] = gender;
    if (nationality !== undefined) clientUpdate['profile.nationality'] = nationality;
    if (countryOfBirth !== undefined) clientUpdate['profile.countryOfBirth'] = countryOfBirth;
    if (maritalStatus !== undefined) clientUpdate['profile.maritalStatus'] = maritalStatus;
    if (passportNumber !== undefined) clientUpdate['profile.passportNumber'] = passportNumber;
    if (passportExpiry !== undefined) clientUpdate['profile.passportExpiry'] = passportExpiry ? new Date(passportExpiry) : null;
    if (passportCountry !== undefined) clientUpdate['profile.passportCountry'] = passportCountry;
    if (address !== undefined) clientUpdate['profile.address'] = address;

    const updatedClient = await Client.findByIdAndUpdate(client._id, { $set: clientUpdate }, { new: true });
    res.json({ user, client: updatedClient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/student/profile/avatar ─────────────────────────────────────────
router.post('/profile/avatar', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, { 'profile.avatar': fileUrl }, { new: true }).select('-password');
    res.json({ user, avatarUrl: fileUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/student/immigration ───────────────────────────────────────────
router.patch('/immigration', async (req, res) => {
  try {
    const { onshore, currentVisa, visaExpiry, targetVisa, anzscoCode, visaRefusalHistory } = req.body;
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const update = {};
    if (onshore !== undefined) update['profile.onshore'] = onshore;
    if (currentVisa !== undefined) update['profile.currentVisa'] = currentVisa;
    if (visaExpiry !== undefined) update['profile.visaExpiry'] = visaExpiry ? new Date(visaExpiry) : null;
    if (targetVisa !== undefined) update['profile.targetVisa'] = targetVisa;
    if (anzscoCode !== undefined) update['profile.anzscoCode'] = anzscoCode;
    if (visaRefusalHistory !== undefined) update['profile.visaRefusalHistory'] = visaRefusalHistory;
    const updated = await Client.findByIdAndUpdate(client._id, { $set: update }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/student/english-test ──────────────────────────────────────────
router.patch('/english-test', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const { testType, score, listening, reading, writing, speaking, trf, testDate, expiryDate } = req.body;
    const update = { englishTest: {
      testType, score, listening, reading, writing, speaking, trf,
      testDate: testDate ? new Date(testDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    }};
    const updated = await Client.findByIdAndUpdate(client._id, { $set: update }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/student/skills ─────────────────────────────────────────────────
router.patch('/skills', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const updated = await Client.findByIdAndUpdate(client._id, { $set: { skillsData: req.body } }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/student/health ─────────────────────────────────────────────────
router.patch('/health', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const updated = await Client.findByIdAndUpdate(client._id, { $set: { healthData: req.body } }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── EDUCATION CRUD ────────────────────────────────────────────────────────────

router.get('/education', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id }).select('education');
    res.json(client?.education || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/education', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const entry = { ...req.body };
    if (entry.startDate) entry.startDate = new Date(entry.startDate + '-01');
    if (entry.endDate) entry.endDate = new Date(entry.endDate + '-01');
    const updated = await Client.findByIdAndUpdate(
      client._id,
      { $push: { education: entry } },
      { new: true }
    );
    res.json(updated.education);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/education/:entryId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    const entry = client.education.id(req.params.entryId);
    if (!entry) return res.status(404).json({ error: 'Education entry not found' });
    Object.assign(entry, req.body);
    if (req.body.startDate) entry.startDate = new Date(req.body.startDate + '-01');
    if (req.body.endDate) entry.endDate = new Date(req.body.endDate + '-01');
    await client.save();
    res.json(client.education);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/education/:entryId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    client.education = client.education.filter(e => e._id.toString() !== req.params.entryId);
    await client.save();
    res.json(client.education);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── EXPERIENCE CRUD ───────────────────────────────────────────────────────────

router.get('/experience', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id }).select('experience');
    res.json(client?.experience || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/experience', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const entry = { ...req.body };
    if (entry.startDate) entry.startDate = new Date(entry.startDate + '-01');
    if (entry.endDate) entry.endDate = new Date(entry.endDate + '-01');
    const updated = await Client.findByIdAndUpdate(
      client._id,
      { $push: { experience: entry } },
      { new: true }
    );
    res.json(updated.experience);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/experience/:entryId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    const entry = client.experience.id(req.params.entryId);
    if (!entry) return res.status(404).json({ error: 'Experience entry not found' });
    Object.assign(entry, req.body);
    if (req.body.startDate) entry.startDate = new Date(req.body.startDate + '-01');
    if (req.body.endDate) entry.endDate = new Date(req.body.endDate + '-01');
    await client.save();
    res.json(client.experience);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/experience/:entryId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    client.experience = client.experience.filter(e => e._id.toString() !== req.params.entryId);
    await client.save();
    res.json(client.experience);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DOCUMENTS (student-scoped) ────────────────────────────────────────────────

router.get('/documents', async (req, res) => {
  try {
    const docs = await Document.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/documents', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const client = await Client.findOne({ userId: req.user._id });
    const doc = await Document.create({
      clientId: client?._id,
      consultancyId: client?.consultancyId,
      uploadedBy: req.user._id,
      name: req.body.name || req.file.originalname,
      type: req.body.type || 'OTHER',
      category: req.body.category || 'PERSONAL',
      fileUrl: `/uploads/${req.file.filename}`,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      description: req.body.description || '',
    });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/documents/:id', async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, uploadedBy: req.user._id });
    if (!doc) return res.status(404).json({ error: 'Document not found or access denied' });
    // Try to delete the physical file too
    try {
      const filePath = path.join(__dirname, '../../', doc.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) { /* ignore file deletion error */ }
    await doc.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CV GENERATOR ─────────────────────────────────────────────────────────────
router.get('/cv', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const client = await Client.findOne({ userId: req.user._id });

    const p = client?.profile || user?.profile || {};
    const cvData = {
      name: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
      email: user?.email || p.email || '',
      phone: p.phone || '',
      location: p.address ? [p.address.city, p.address.state, p.address.country].filter(Boolean).join(', ') : '',
      nationality: p.nationality || '',
      workRights: p.currentVisa ? `Australian Visa ${p.currentVisa}${p.visaExpiry ? ` (until ${new Date(p.visaExpiry).toLocaleDateString('en-AU')})` : ''}` : '',
      anzscoCode: p.anzscoCode || '',
      targetVisa: p.targetVisa || '',

      // English
      english: client?.englishTest ? {
        testType: client.englishTest.testType || '',
        overall: client.englishTest.score || '',
        listening: client.englishTest.listening || '',
        reading: client.englishTest.reading || '',
        writing: client.englishTest.writing || '',
        speaking: client.englishTest.speaking || '',
        testDate: client.englishTest.testDate ? new Date(client.englishTest.testDate).toLocaleDateString('en-AU') : '',
        expiryDate: client.englishTest.expiryDate ? new Date(client.englishTest.expiryDate).toLocaleDateString('en-AU') : '',
      } : null,

      // Skills
      skillsAssessment: client?.skillsData?.assessingBody ? {
        body: client.skillsData.assessingBody,
        referenceNumber: client.skillsData.referenceNumber || '',
        outcome: client.skillsData.outcome || '',
        outcomeDate: client.skillsData.outcomeDate ? new Date(client.skillsData.outcomeDate).toLocaleDateString('en-AU') : '',
      } : null,

      // Education
      education: (client?.education || []).map(e => ({
        institution: e.institution || '',
        qualification: e.qualification || '',
        fieldOfStudy: e.fieldOfStudy || '',
        country: e.country || '',
        cricos: e.cricos || '',
        startDate: e.startDate ? `${new Date(e.startDate).getFullYear()}` : '',
        endDate: e.completed ? (e.endDate ? `${new Date(e.endDate).getFullYear()}` : 'Present') : 'Ongoing',
        completed: !!e.completed,
      })),

      // Experience
      experience: (client?.experience || []).map(e => ({
        employer: e.employer || '',
        role: e.role || '',
        country: e.country || '',
        hoursPerWeek: e.hoursPerWeek || '',
        startDate: e.startDate ? new Date(e.startDate).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }) : '',
        endDate: e.isCurrent ? 'Present' : (e.endDate ? new Date(e.endDate).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }) : ''),
        isCurrent: !!e.isCurrent,
        description: e.description || '',
      })),
    };

    res.json(cvData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CHANGE PASSWORD ────────────────────────────────────────────────────────────
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const user = await User.findById(req.user._id);
    if (currentPassword && !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
