import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import { authenticate, getUserPermissions } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `avatar-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'orivisa-secret-key-change-in-production';

router.post('/register', async (req, res) => {
  try {
    const { email, password, role, profile } = req.body;
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const user = await User.create({ email, password, role: role || 'STUDENT', profile });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user: { id: user._id, _id: user._id, email: user.email, role: user.role, profile: user.profile }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, isActive: true });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user._id, _id: user._id, email: user.email, role: user.role, profile: user.profile }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  res.json(req.user);
});

router.get('/permissions', authenticate, async (req, res) => {
  try {
    const perms = await getUserPermissions(req.user);
    res.json(perms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/me', authenticate, async (req, res) => {
  try {
    const { profile } = req.body;
    const allowed = ['firstName', 'lastName', 'phone', 'marnNumber', 'passportNumber', 'passportExpiry', 'passportCountry', 'address', 'preferredEmailProfileId'];
    const update = {};
    if (profile) {
      for (const k of allowed) {
        if (profile[k] !== undefined) update[`profile.${k}`] = profile[k];
      }
      if (profile.passportExpiry && typeof profile.passportExpiry === 'string') {
        update['profile.passportExpiry'] = new Date(profile.passportExpiry);
      }
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
    const user = await User.findById(req.user._id);
    if (!user || !(await user.comparePassword(currentPassword))) return res.status(401).json({ error: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/me/avatar', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, { 'profile.avatar': fileUrl }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
