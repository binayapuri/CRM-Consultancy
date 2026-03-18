import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../shared/models/User.js';
import Employer from '../shared/models/Employer.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

const router = express.Router();

/**
 * POST /api/employers/register
 * Register a new employer (company) + EMPLOYER user account.
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, companyName, abn, website, industry } = req.body;
  if (!email || !password || !companyName) {
    return res.status(400).json({ error: 'Email, password, and company name are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const user = await User.create({
    email,
    password,
    role: 'EMPLOYER',
    profile: { firstName: firstName || '', lastName: lastName || '' },
  });

  const employer = await Employer.create({
    companyName,
    abn: abn || undefined,
    website: website || undefined,
    industry: industry || undefined,
    userId: user._id,
    verificationStatus: 'PENDING',
  });

  const updated = await User.findByIdAndUpdate(
    user._id,
    { $set: { 'profile.employerId': employer._id } },
    { new: true }
  ).select('email role profile').lean();

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || 'orivisa-secret-key-change-in-production',
    { expiresIn: '7d' }
  );

  res.status(201).json({
    user: updated,
    token,
    employer: { id: employer._id, companyName: employer.companyName },
  });
}));

export default router;
