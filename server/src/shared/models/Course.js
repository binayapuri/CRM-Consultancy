import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true },
  name: { type: String, required: true },
  faculty: String,
  level: { type: String, enum: ['CERTIFICATE', 'DIPLOMA', 'BACHELORS', 'MASTERS', 'PHD', 'OTHER'], required: true },
  duration: String, // e.g., "3 Years"
  tuitionFee: Number, // Annual or total fee
  intakeDates: [String], // e.g., ["February", "July"]
  prPathwayPotential: { type: Boolean, default: false },
  requirements: {
    english: String, // e.g., "IELTS 6.5"
    academic: String // e.g., "High School 70%"
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure we index university for fast queries
courseSchema.index({ universityId: 1 });

export default mongoose.model('Course', courseSchema);
