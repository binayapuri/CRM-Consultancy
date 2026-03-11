import mongoose from 'mongoose';

const universitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    city: String,
    state: String,
    country: { type: String, default: 'Australia' }
  },
  ranking: String,
  description: String,
  images: [String],
  logoUrl: String,
  website: String,
  facilities: [String],
  partnerStatus: { type: String, enum: ['VERIFIED', 'PREMIUM', 'STANDARD', 'UNVERIFIED'], default: 'UNVERIFIED' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('University', universitySchema);
