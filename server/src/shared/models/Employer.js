import mongoose from 'mongoose';

const employerSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  abn: String,
  website: String,
  industry: String,
  verificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The user account managing this employer
  address: {
    street: String,
    city: String,
    state: String,
    postcode: String,
    country: { type: String, default: 'Australia' }
  },
  logoUrl: String,
  description: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Employer', employerSchema);
