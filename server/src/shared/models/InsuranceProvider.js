import mongoose from 'mongoose';

const insuranceProviderSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  logoUrl: String,
  contactDetails: {
    email: String,
    phone: String,
    website: String,
  },
  verificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The user account managing this provider
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('InsuranceProvider', insuranceProviderSchema);
