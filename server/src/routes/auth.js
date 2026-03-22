import express from 'express';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { AuthController } from '../shared/controllers/auth.controller.js';
import * as schemas from '../shared/schemas/auth.schema.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

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
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// --- Password Management ---
router.post('/forgot-password', validate(schemas.forgotPasswordSchema), asyncHandler(AuthController.forgotPassword));
router.post('/reset-password', validate(schemas.resetPasswordSchema), asyncHandler(AuthController.resetPassword));
router.post('/change-password', authenticate, validate(schemas.changePasswordSchema), asyncHandler(AuthController.changePassword));

// --- Auth Flow (rate limited) ---
router.post('/register', authLimiter, validate(schemas.registerSchema), asyncHandler(AuthController.register));
router.post('/login', authLimiter, validate(schemas.loginSchema), asyncHandler(AuthController.login));
router.get('/me', authenticate, asyncHandler(AuthController.getMe));
router.patch('/me', authenticate, validate(schemas.updateMeSchema), asyncHandler(AuthController.updateMe));
router.post('/me/avatar', authenticate, upload.single('file'), asyncHandler(AuthController.updateAvatar));

// --- OTP Flow ---
router.post('/send-otp', validate(schemas.sendOtpSchema), asyncHandler(AuthController.sendOtp));
router.post('/verify-otp', validate(schemas.verifyOtpSchema), asyncHandler(AuthController.verifyOtp));

// --- Permissions ---
router.get('/permissions', authenticate, asyncHandler(AuthController.getPermissions));

// --- Google OAuth ---
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user) => {
      if (err || !user) {
        if (err) console.error('[auth/google/callback]', err.message || err);
        else console.error('[auth/google/callback] no user (check MongoDB + user creation)');
        return res.redirect(`${FRONTEND_URL}/login?error=oauth`);
      }
      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
    })(req, res, next);
  });
}

export default router;
