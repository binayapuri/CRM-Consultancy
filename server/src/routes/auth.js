import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { authenticate, getUserPermissions } from '../middleware/auth.js';
import { sendEmail } from '../utils/email.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `avatar-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB

// Ensure .env is loaded before we read any process.env values in this module
dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'orivisa-secret-key-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// In-memory OTP store (use Redis in production)
const otpStore = new Map(); // phone -> { code, expires }

// --- Forgot Password ---
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const user = await User.findOne({ email, isActive: true });
    if (!user) return res.json({ message: 'If that email exists, we sent a reset link' }); // Don't reveal
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = token;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await sendEmail({
      to: email,
      subject: 'ORIVISA - Reset Your Password',
      html: `<p>Click to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Link expires in 1 hour.</p>`,
    });
    res.json({ message: 'If that email exists, we sent a reset link' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    if (!token || !email || !newPassword) return res.status(400).json({ error: 'Token, email and new password required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const user = await User.findOne({ email, passwordResetToken: token });
    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Google OAuth ---
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/auth/google/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.findOne({ email: profile.emails?.[0]?.value });
        if (user) {
          user.googleId = profile.id;
          await user.save();
        } else {
          user = await User.create({
            email: profile.emails?.[0]?.value || `google-${profile.id}@orivisa.oauth`,
            password: crypto.randomBytes(16).toString('hex'),
            role: 'STUDENT',
            googleId: profile.id,
            profile: { firstName: profile.name?.givenName, lastName: profile.name?.familyName },
          });
        }
      }
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }));

  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user) => {
      if (err) return res.redirect(`${FRONTEND_URL}/login?error=oauth`);
      if (!user) return res.redirect(`${FRONTEND_URL}/login?error=oauth`);
      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
    })(req, res, next);
  });
} else {
  router.get('/google', (req, res) => res.status(503).json({ error: 'Google login not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' }));
}

// --- Phone OTP ---
async function sendOtpSms(phone, code) {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = (await import('twilio')).default;
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: `Your ORIVISA verification code is: ${code}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone.startsWith('+') ? phone : `+61${phone.replace(/^0/, '')}`,
    });
  } else {
    console.log(`[OTP] ${phone} -> ${code}`);
  }
}

router.post('/send-otp', async (req, res) => {
  try {
    let { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });
    phone = phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '61' + phone.slice(1);
    else if (!phone.startsWith('61')) phone = '61' + phone;
    if (phone.length < 10) return res.status(400).json({ error: 'Invalid phone number' });
    const code = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(phone, { code, expires: Date.now() + 10 * 60 * 1000 });
    await sendOtpSms(`+${phone}`, code);
    res.json({ message: 'Verification code sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    let { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'Phone and code required' });
    phone = phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '61' + phone.slice(1);
    else if (!phone.startsWith('61')) phone = '61' + phone;
    const stored = otpStore.get(phone);
    if (!stored || stored.code !== String(code) || stored.expires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }
    otpStore.delete(phone);
    const phoneE164 = `+${phone}`;
    let user = await User.findOne({ $or: [{ phone: phoneE164 }, { phone }, { 'profile.phone': phoneE164 }] });
    if (!user) {
      user = await User.create({
        email: `${phone}@orivisa.phone`,
        password: crypto.randomBytes(16).toString('hex'),
        phone: phoneE164,
        phoneVerified: true,
        role: 'STUDENT',
        profile: {},
      });
    } else {
      user.phoneVerified = true;
      await user.save();
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user._id, _id: user._id, email: user.email, role: user.role, profile: user.profile }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student-only: clients self-register. Agents are created by consultancy admin.
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, profile } = req.body;
    if (role && role !== 'STUDENT') {
      return res.status(400).json({ error: 'Only student registration is available here. Consultancy admins must register at /register-consultancy. Agents are created by your consultancy admin.' });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const user = await User.create({ email, password, role: 'STUDENT', profile });
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
