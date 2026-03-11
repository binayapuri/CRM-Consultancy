import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['APPLIED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED'], default: 'APPLIED' },
  resumeUrl: String,
  coverLetterUrl: String,
  employerNotes: String,
}, { timestamps: true });

jobApplicationSchema.index({ jobId: 1, status: 1 });
jobApplicationSchema.index({ studentId: 1 });

export default mongoose.model('JobApplication', jobApplicationSchema);
