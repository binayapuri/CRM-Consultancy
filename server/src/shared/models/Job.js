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
  recruiterEmployerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecruiterEmployerProfile' },
  postedByRole: { type: String, enum: ['SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'AGENT', 'SPONSOR', 'EMPLOYER', 'RECRUITER'], default: 'EMPLOYER' },
  salaryMin: Number,
  salaryMax: Number,
  workRights: [String], // e.g. ['STUDENT_VISA_24_HOURS', 'FULL_WORK_RIGHTS']
  experienceLevel: { type: String, enum: ['ENTRY', 'MID', 'SENIOR', 'LEAD'] },
  moderationState: { type: String, enum: ['ACTIVE', 'FLAGGED', 'REMOVED'], default: 'ACTIVE' },
  views: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  tags: [String] // e.g., 'hospitality', 'IT', 'warehouse'
}, { timestamps: true });

export default mongoose.model('Job', jobSchema);
