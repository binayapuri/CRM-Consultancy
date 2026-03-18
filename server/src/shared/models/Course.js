import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true },
  name: { type: String, required: true },
  faculty: String,
  level: { type: String, enum: ['CERTIFICATE', 'DIPLOMA', 'BACHELORS', 'MASTERS', 'PHD', 'OTHER'], required: true },
  duration: String,
  tuitionFee: Number,
  cricosCode: String,
  intakeDates: [String],
  intakeMonths: [String],
  prPathwayPotential: { type: Boolean, default: false },
  requirements: {
    english: String,
    academic: String
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure we index university for fast queries
courseSchema.index({ universityId: 1 });

export default mongoose.model('Course', courseSchema);
