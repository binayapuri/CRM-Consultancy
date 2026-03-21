import mongoose from 'mongoose';

const jobAlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  keywords: String,
  location: String,
  jobType: { type: String, enum: ['FULL_TIME', 'PART_TIME', 'CASUAL', 'CONTRACT', 'INTERNSHIP'] },
  visaSponsorship: Boolean,
  email: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  lastSentAt: Date,
}, { timestamps: true });

export default mongoose.model('JobAlert', jobAlertSchema);
