import mongoose from 'mongoose';

const recruiterEmployerProfileSchema = new mongoose.Schema({
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  companyName: { type: String, required: true },
  abn: String,
  contactName: String,
  contactEmail: String,
  contactPhone: String,
  website: String,
  address: String,
  logoUrl: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

recruiterEmployerProfileSchema.index({ recruiterId: 1, companyName: 1 }, { unique: true });

export default mongoose.model('RecruiterEmployerProfile', recruiterEmployerProfileSchema);

