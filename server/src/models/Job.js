import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true }, // e.g., 'Sydney, NSW'
  type: { type: String, enum: ['FULL_TIME', 'PART_TIME', 'CASUAL', 'CONTRACT', 'INTERNSHIP'], default: 'FULL_TIME' },
  description: { type: String, required: true },
  requirements: [String],
  salaryRange: String,
  applyUrl: String, // External link if any
  contactEmail: String,
  anzscoCode: String,
  visaSponsorshipAvailable: { type: Boolean, default: false },
  partTimeAllowed: { type: Boolean, default: false }, // Critical for student visas
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // e.g. Super Admin or verified employer
  isActive: { type: Boolean, default: true },
  tags: [String] // e.g., 'hospitality', 'IT', 'warehouse'
}, { timestamps: true });

export default mongoose.model('Job', jobSchema);
