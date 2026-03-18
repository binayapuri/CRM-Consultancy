import mongoose from 'mongoose';

// Fee per branch (branchId is subdoc _id from University.branches)
const feePerBranchSchema = new mongoose.Schema({
  branchId: { type: mongoose.Schema.Types.ObjectId, required: true },
  amount: { type: Number, required: true },
}, { _id: false });

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
  isActive: { type: Boolean, default: true },
  // Branch mapping: which branches offer this course
  branchIds: [{ type: mongoose.Schema.Types.ObjectId }],
  // Fee per branch (overrides tuitionFee when set). branchId = University.branches[]._id
  fees: [feePerBranchSchema],
}, { timestamps: true });

// Ensure we index university for fast queries
courseSchema.index({ universityId: 1 });

export default mongoose.model('Course', courseSchema);
