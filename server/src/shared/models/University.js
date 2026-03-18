import mongoose from 'mongoose';

const campusSchema = new mongoose.Schema({
  city: String,
  state: String,
  country: { type: String, default: 'Australia' },
  address: String,
  facilities: [String],
}, { _id: false });

const universitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    city: String,
    state: String,
    country: { type: String, default: 'Australia' }
  },
  campuses: [campusSchema],
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
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('University', universitySchema);
