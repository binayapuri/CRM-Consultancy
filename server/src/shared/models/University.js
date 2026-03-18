import mongoose from 'mongoose';

const campusSchema = new mongoose.Schema({
  city: String,
  state: String,
  country: { type: String, default: 'Australia' },
  address: String,
  facilities: [String],
}, { _id: false });

// Branch/campus with full location and contact
const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  city: String,
  state: String,
  country: { type: String, default: 'Australia' },
  postcode: String,
  phone: String,
  email: String,
  facilities: [String],
  isActive: { type: Boolean, default: true },
}, { _id: true });

// SMTP email profile (like consultancy)
const emailProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  host: { type: String, required: true },
  port: { type: Number, default: 587 },
  secure: { type: Boolean, default: false },
  user: { type: String, required: true },
  pass: String,
  from: String,
  isDefault: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
}, { _id: true });

// Discount rule (super admin manages)
const discountRuleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
  value: { type: Number, required: true },
  maxAmount: Number,
  applicableTo: { type: String, enum: ['ALL', 'BRANCH', 'COURSE'], default: 'ALL' },
  branchIds: [{ type: mongoose.Schema.Types.ObjectId }],
  courseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  validFrom: Date,
  validTo: Date,
  isActive: { type: Boolean, default: true },
}, { _id: true });

const universitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    city: String,
    state: String,
    country: { type: String, default: 'Australia' }
  },
  campuses: [campusSchema],
  branches: [branchSchema],
  ranking: String,
  description: String,
  images: [String],
  logoUrl: String,
  website: String,
  facilities: [String],
  cricosProviderCode: String,
  contactEmail: String,
  contactPhone: String,
  intakeMonths: [String],
  tuitionRange: String,
  partnerStatus: { type: String, enum: ['VERIFIED', 'PREMIUM', 'STANDARD', 'UNVERIFIED'], default: 'UNVERIFIED' },
  isActive: { type: Boolean, default: true },
  // Email/SMTP profiles for offer letters, communications
  emailProfiles: [emailProfileSchema],
  settings: {
    timezone: { type: String, default: 'Australia/Sydney' },
    currency: { type: String, default: 'AUD' },
  },
  // Discount rules (super admin manages)
  discountRules: [discountRuleSchema],
}, { timestamps: true });

export default mongoose.model('University', universitySchema);
