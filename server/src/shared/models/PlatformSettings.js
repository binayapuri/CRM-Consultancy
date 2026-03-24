import mongoose from 'mongoose';

const smtpSchema = new mongoose.Schema({
  host: { type: String, default: '' },
  port: { type: Number, default: 587 },
  secure: { type: Boolean, default: false },
  user: { type: String, default: '' },
  pass: { type: String, default: '' },
  from: { type: String, default: '' },
  enabled: { type: Boolean, default: false },
}, { _id: false });

const googleAuthSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  clientId: { type: String, default: '' },
  clientSecret: { type: String, default: '' },
}, { _id: false });

const appleAuthSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  clientId: { type: String, default: '' },
  teamId: { type: String, default: '' },
  keyId: { type: String, default: '' },
  privateKey: { type: String, default: '' },
}, { _id: false });

const authSchema = new mongoose.Schema({
  google: { type: googleAuthSchema, default: () => ({}) },
  apple: { type: appleAuthSchema, default: () => ({}) },
}, { _id: false });

const notificationsSchema = new mongoose.Schema({
  emailEnabled: { type: Boolean, default: true },
  inAppEnabled: { type: Boolean, default: true },
  defaultChannels: [{ type: String }],
}, { _id: false });

const platformSettingsSchema = new mongoose.Schema({
  smtp: { type: smtpSchema, default: () => ({}) },
  auth: { type: authSchema, default: () => ({}) },
  notifications: { type: notificationsSchema, default: () => ({}) },
  /** Tunable weights for /api/student/pr-estimate (SkillSelect-style estimate) */
  prEstimator: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
}, { timestamps: true });

export default mongoose.model('PlatformSettings', platformSettingsSchema);
