import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../../shared/models/User.js';
import { sendEmail } from '../../shared/utils/email.js';
import { getUserPermissions } from '../../shared/middleware/auth.js';
import { JWT_SECRET, JWT_EXPIRES } from '../../config/jwt.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive exact match on stored email string. */
function emailExactFilter(email) {
  if (!email || typeof email !== 'string') return { _id: null };
  return { email: new RegExp(`^${escapeRegex(email.trim())}$`, 'i') };
}

const otpStore = new Map();

export class AuthService {
  static async forgotPassword(email) {
    const user = await User.findOne({ email, isActive: true });
    if (!user) return { message: 'If that email exists, we sent a reset link' };
    
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = token;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await sendEmail({
      to: email,
      subject: 'ORIVISA - Reset Your Password',
      html: `<p>Click to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Link expires in 1 hour.</p>`,
    });
    return { message: 'If that email exists, we sent a reset link' };
  }

  static async resetPassword(email, token, newPassword) {
    const user = await User.findOne({ email, passwordResetToken: token });
    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw Object.assign(new Error('Invalid or expired reset link'), { status: 400 });
    }
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    return { success: true };
  }

  static async sendOtp(phone) {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '61' + cleanPhone.slice(1);
    else if (!cleanPhone.startsWith('61')) cleanPhone = '61' + cleanPhone;
    
    if (cleanPhone.length < 10) throw Object.assign(new Error('Invalid phone number'), { status: 400 });
    
    const code = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(cleanPhone, { code, expires: Date.now() + 10 * 60 * 1000 });
    
    await this._sendOtpSms(`+${cleanPhone}`, code);
    return { message: 'Verification code sent' };
  }

  static async _sendOtpSms(phone, code) {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilio = (await import('twilio')).default;
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: `Your ORIVISA verification code is: ${code}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
    } else {
      console.log(`[OTP] ${phone} -> ${code}`);
    }
  }

  static async verifyOtp(phone, code) {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '61' + cleanPhone.slice(1);
    else if (!cleanPhone.startsWith('61')) cleanPhone = '61' + cleanPhone;
    
    const stored = otpStore.get(cleanPhone);
    if (!stored || stored.code !== String(code) || stored.expires < Date.now()) {
      throw Object.assign(new Error('Invalid or expired code'), { status: 400 });
    }
    otpStore.delete(cleanPhone);
    
    const phoneE164 = `+${cleanPhone}`;
    let user = await User.findOne({ $or: [{ phone: phoneE164 }, { phone: cleanPhone }, { 'profile.phone': phoneE164 }] });
    
    if (!user) {
      user = await User.create({
        email: `${cleanPhone}@orivisa.phone`,
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
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    const linkedAccounts = await AuthService._linkedAccountsForEmail(user.email, user._id);
    return {
      user: { id: user._id, _id: user._id, email: user.email, role: user.role, profile: user.profile },
      token,
      ...(linkedAccounts.length ? { linkedAccounts } : {}),
    };
  }

  static async register(data) {
    const { email, password, role, profile } = data;
    if (role && role !== 'STUDENT') {
      throw Object.assign(new Error('Only student registration is available here'), { status: 400 });
    }
    if (await User.findOne({ email })) {
      throw Object.assign(new Error('Email already registered'), { status: 400 });
    }
    const user = await User.create({ email, password, role: 'STUDENT', profile });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    return { user: { id: user._id, _id: user._id, email: user.email, role: user.role, profile: user.profile }, token };
  }

  /** Other user rows sharing the same email (case-insensitive), excluding one id. */
  static async _linkedAccountsForEmail(email, excludeUserId) {
    if (!email) return [];
    const filter = emailExactFilter(email);
    const rows = await User.find({
      ...filter,
      _id: { $ne: excludeUserId },
    })
      .select('_id role profile.firstName profile.lastName email')
      .lean();
    return rows.map((u) => ({
      _id: u._id,
      role: u.role,
      label: [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(' ') || u.email || 'Account',
    }));
  }

  static async getLinkedAccountsForUser(user) {
    return AuthService._linkedAccountsForEmail(user.email, user._id);
  }

  static async login(email, password) {
    const filter = emailExactFilter(email);
    const candidates = await User.find(filter);
    if (candidates.length === 0) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }
    let user = null;
    for (const u of candidates) {
      if (await u.comparePassword(password)) {
        user = u;
        break;
      }
    }
    if (!user) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }
    if (!user.isActive) {
      const pendingRoles = new Set(['UNIVERSITY_PARTNER', 'INSURANCE_PARTNER', 'EMPLOYER', 'RECRUITER']);
      const msg = pendingRoles.has(user.role)
        ? 'Your partner account is pending verification. Please wait for consultancy/super-admin approval.'
        : 'Your account is inactive. Contact support.';
      throw Object.assign(new Error(msg), { status: 403 });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    const linkedAccounts = await AuthService._linkedAccountsForEmail(user.email, user._id);
    return {
      user: { id: user._id, _id: user._id, email: user.email, role: user.role, profile: user.profile },
      token,
      ...(linkedAccounts.length ? { linkedAccounts } : {}),
    };
  }

  /** Switch to another user row that shares the same email (already authenticated). */
  static async switchToUser(currentUser, targetUserId) {
    const target = await User.findById(targetUserId).select('-password');
    if (!target || !target.isActive) {
      throw Object.assign(new Error('Account not found'), { status: 404 });
    }
    if (!currentUser.email || !target.email) {
      throw Object.assign(new Error('Switch account is not available for this login'), { status: 403 });
    }
    const re = new RegExp(`^${escapeRegex(String(currentUser.email).trim())}$`, 'i');
    if (!re.test(String(target.email).trim())) {
      throw Object.assign(new Error('Invalid account switch'), { status: 403 });
    }
    const token = jwt.sign({ userId: target._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    const linkedAccounts = await AuthService._linkedAccountsForEmail(target.email, target._id);
    return {
      user: { id: target._id, _id: target._id, email: target.email, role: target.role, profile: target.profile },
      token,
      ...(linkedAccounts.length ? { linkedAccounts } : {}),
    };
  }

  static async updateMe(user, data) {
    const { profile } = data;
    const allowed = ['firstName', 'lastName', 'phone', 'marnNumber', 'passportNumber', 'passportExpiry', 'passportCountry', 'address', 'preferredEmailProfileId', 'notificationPreferences'];
    const update = {};
    if (profile) {
      for (const k of allowed) {
        if (profile[k] !== undefined) update[`profile.${k}`] = profile[k];
      }
      if (profile.passportExpiry && typeof profile.passportExpiry === 'string') {
        update['profile.passportExpiry'] = new Date(profile.passportExpiry);
      }
    }
    const updatedUser = await User.findByIdAndUpdate(user._id, { $set: update }, { new: true }).select('-password');
    if (!updatedUser) throw Object.assign(new Error('User not found'), { status: 404 });
    return updatedUser;
  }

  static async changePassword(user, currentPassword, newPassword) {
    const target = await User.findById(user._id);
    if (!target || !(await target.comparePassword(currentPassword))) {
      throw Object.assign(new Error('Current password is incorrect'), { status: 401 });
    }
    target.password = newPassword;
    await target.save();
    return { success: true };
  }

  static async updateAvatar(user, file) {
    if (!file) throw Object.assign(new Error('No file uploaded'), { status: 400 });
    const fileUrl = `/uploads/${file.filename}`;
    const updatedUser = await User.findByIdAndUpdate(user._id, { 'profile.avatar': fileUrl }, { new: true }).select('-password');
    if (!updatedUser) throw Object.assign(new Error('User not found'), { status: 404 });
    return updatedUser;
  }

  static async getPermissions(user) {
    return getUserPermissions(user);
  }
}
