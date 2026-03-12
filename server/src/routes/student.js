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
    const safeFirstName = (userProfile?.firstName && String(userProfile.firstName).trim()) ? String(userProfile.firstName).trim() : 'Student';
    const safeLastName = (userProfile?.lastName && String(userProfile.lastName).trim()) ? String(userProfile.lastName).trim() : 'User';
    const safeEmail = (userProfile?.email && String(userProfile.email).trim())
      ? String(userProfile.email).trim()
      : `${String(userId)}@orivisa.local`;
    client = await Client.create({
      userId,
      consultancyId: STUDENT_OWNED_CONSULTANCY,
      profile: {
        firstName: safeFirstName,
        lastName: safeLastName,
        email: safeEmail,
        phone: userProfile?.phone || '',
      },
    });
  } else {
    // Keep client profile basics in sync (non-destructive)
    const patch = {};
    if (userProfile?.firstName && !client.profile?.firstName) patch['profile.firstName'] = userProfile.firstName;
    if (userProfile?.lastName && !client.profile?.lastName) patch['profile.lastName'] = userProfile.lastName;
    if (userProfile?.phone && !client.profile?.phone) patch['profile.phone'] = userProfile.phone;
    if (userProfile?.email && !client.profile?.email) patch['profile.email'] = userProfile.email;
    if (Object.keys(patch).length) {
      client = await Client.findByIdAndUpdate(client._id, { $set: patch }, { new: true });
    }
  }
  return client;
}

// ─── GET /api/student/profile ─────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const baseProfile = { ...(user?.profile || {}), email: user?.email || user?.profile?.email || '' };
    const client = await getOrCreateStudentClient(req.user._id, baseProfile);
    // Ensure client.profile.email is populated for the UI
    if (user?.email && (!client?.profile?.email || client.profile.email !== user.email)) {
      const updatedClient = await Client.findByIdAndUpdate(
        client._id,
        { $set: { 'profile.email': user.email } },
        { new: true }
      );
      return res.json({ user, client: updatedClient });
    }
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
    const baseProfile = { ...(user?.profile || {}), email: user?.email || user?.profile?.email || '' };
    const client = await getOrCreateStudentClient(req.user._id, baseProfile);
    const clientUpdate = {};
    const pFields = ['firstName', 'lastName', 'phone', 'dob', 'gender', 'nationality', 'countryOfBirth', 'maritalStatus', 'passportNumber', 'passportExpiry', 'passportCountry', 'address'];
    pFields.forEach(f => {
      if (req.body[f] !== undefined) {
        if (f === 'dob' || f === 'passportExpiry') clientUpdate[`profile.${f}`] = req.body[f] ? new Date(req.body[f]) : null;
        else clientUpdate[`profile.${f}`] = req.body[f];
      }
    });
    // Always keep email available on client.profile for the UI
    if (user?.email) clientUpdate['profile.email'] = user.email;

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
    const update = {};
    const eFields = ['testType', 'score', 'listening', 'reading', 'writing', 'speaking', 'trf', 'testDate', 'expiryDate'];
    eFields.forEach(f => {
      if (req.body[f] !== undefined) {
        if (f === 'testDate' || f === 'expiryDate') update[`englishTest.${f}`] = req.body[f] ? new Date(req.body[f]) : null;
        else update[`englishTest.${f}`] = req.body[f];
      }
    });
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

// ─── PATCH /api/student/profile (enhanced with all fields) ──────────────────────
// Re-override the profile patch to include initialStatement
router.patch('/profile/statement', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const { initialStatement } = req.body;
    const updated = await Client.findByIdAndUpdate(
      client._id,
      { $set: { initialStatement } },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TRAVEL HISTORY CRUD ───────────────────────────────────────────────────────

router.get('/travel-history', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id }).select('travelHistory');
    res.json(client?.travelHistory || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/travel-history', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const entry = {
      country: req.body.country,
      city: req.body.city,
      purpose: req.body.purpose || 'OTHER',
      visaType: req.body.visaType,
      visaGranted: req.body.visaGranted,
      visaRefused: req.body.visaRefused,
      refusalReason: req.body.refusalReason,
      notes: req.body.notes,
      dateFrom: req.body.dateFrom ? new Date(req.body.dateFrom) : undefined,
      dateTo: req.body.dateTo ? new Date(req.body.dateTo) : undefined,
    };
    const updated = await Client.findByIdAndUpdate(
      client._id,
      { $push: { travelHistory: entry } },
      { new: true }
    );
    res.json(updated.travelHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/travel-history/:entryId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    const entry = client.travelHistory.id(req.params.entryId);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    Object.assign(entry, req.body);
    if (req.body.dateFrom) entry.dateFrom = new Date(req.body.dateFrom);
    if (req.body.dateTo) entry.dateTo = new Date(req.body.dateTo);
    await client.save();
    res.json(client.travelHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/travel-history/:entryId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    client.travelHistory = client.travelHistory.filter(e => e._id.toString() !== req.params.entryId);
    await client.save();
    res.json(client.travelHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADDRESS HISTORY CRUD ─────────────────────────────────────────────────────

router.get('/addresses', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id }).select('previousAddresses profile');
    res.json({
      current: client?.profile?.address || null,
      previous: client?.previousAddresses || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update current address
router.patch('/addresses/current', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const updated = await Client.findByIdAndUpdate(
      client._id,
      { $set: { 'profile.address': req.body } },
      { new: true }
    );
    res.json({ current: updated.profile?.address, previous: updated.previousAddresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a previous address
router.post('/addresses', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const entry = {
      ...req.body,
      from: req.body.from ? new Date(req.body.from) : undefined,
      to: req.body.to ? new Date(req.body.to) : undefined,
    };
    const updated = await Client.findByIdAndUpdate(
      client._id,
      { $push: { previousAddresses: entry } },
      { new: true }
    );
    res.json({ current: updated.profile?.address, previous: updated.previousAddresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/addresses/:entryId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    const entry = client.previousAddresses.id(req.params.entryId);
    if (!entry) return res.status(404).json({ error: 'Address not found' });
    Object.assign(entry, req.body);
    if (req.body.from) entry.from = new Date(req.body.from);
    if (req.body.to) entry.to = new Date(req.body.to);
    await client.save();
    res.json({ current: client.profile?.address, previous: client.previousAddresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/addresses/:entryId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    client.previousAddresses = client.previousAddresses.filter(e => e._id.toString() !== req.params.entryId);
    await client.save();
    res.json({ current: client.profile?.address, previous: client.previousAddresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── STUDENT NOTES CRUD ────────────────────────────────────────────────────────

router.get('/notes', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id }).select('studentNotes initialStatement');
    res.json({
      notes: client?.studentNotes || [],
      initialStatement: client?.initialStatement || '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notes', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const note = {
      title: req.body.title || '',
      text: req.body.text,
      category: req.body.category || 'GENERAL',
      isPinned: req.body.isPinned || false,
      isPrivate: req.body.isPrivate !== false, // default private
      templateUsed: req.body.templateUsed || '',
      tags: req.body.tags || [],
      addedAt: new Date(),
    };
    const updated = await Client.findByIdAndUpdate(
      client._id,
      { $push: { studentNotes: note } },
      { new: true }
    );
    res.json(updated.studentNotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/notes/:noteId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    const note = client.studentNotes.id(req.params.noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    const allowed = ['title', 'text', 'category', 'isPinned', 'isPrivate', 'tags'];
    for (const k of allowed) {
      if (req.body[k] !== undefined) note[k] = req.body[k];
    }
    note.editedAt = new Date();
    await client.save();
    res.json(client.studentNotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/notes/:noteId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    client.studentNotes = client.studentNotes.filter(n => n._id.toString() !== req.params.noteId);
    await client.save();
    res.json(client.studentNotes);
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
// ─── FAMILY MEMBERS CRUD ─────────────────────────────────────────────────────

router.get('/family-members', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id }).select('familyMembers');
    res.json(client?.familyMembers || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/family-members', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const entry = {
      relationship: req.body.relationship || 'OTHER',
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      dob: req.body.dob ? new Date(req.body.dob) : undefined,
      nationality: req.body.nationality,
      passportNumber: req.body.passportNumber,
      passportExpiry: req.body.passportExpiry ? new Date(req.body.passportExpiry) : undefined,
      includedInApplication: req.body.includedInApplication || false,
      visaStatus: req.body.visaStatus || '',
      notes: req.body.notes || '',
    };
    const updated = await Client.findByIdAndUpdate(
      client._id,
      { $push: { familyMembers: entry } },
      { new: true }
    );
    res.json(updated.familyMembers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/family-members/:memberId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    const member = client.familyMembers.id(req.params.memberId);
    if (!member) return res.status(404).json({ error: 'Family member not found' });
    const allowed = ['relationship','firstName','lastName','dob','nationality','passportNumber','passportExpiry','includedInApplication','visaStatus','notes'];
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        if ((k === 'dob' || k === 'passportExpiry') && req.body[k]) member[k] = new Date(req.body[k]);
        else member[k] = req.body[k];
      }
    }
    await client.save();
    res.json(client.familyMembers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/family-members/:memberId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    client.familyMembers = client.familyMembers.filter(m => m._id.toString() !== req.params.memberId);
    await client.save();
    res.json(client.familyMembers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

