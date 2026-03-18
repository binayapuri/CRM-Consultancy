import mongoose from 'mongoose';

const campusSchema = new mongoose.Schema({
  city: String,
  state: String,
  country: { type: String, default: 'Australia' },
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  byUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy' },
  decision: String,
  notes: String,
  reviewedAt: Date,
}, { _id: false });

const universityRequestSchema = new mongoose.Schema({
  institutionName: { type: String, required: true },
  website: String,
  cricosProviderCode: String,
  contactName: String,
  email: { type: String, required: true },
  phone: String,
  campuses: [campusSchema],
  courseSummary: [String],
  intakeMonths: [String],
  tuitionRange: String,
  notes: String,

  requestedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },

  status: {
    type: String,
    enum: ['PENDING', 'CONSULTANCY_REVIEWED', 'CONSULTANCY_RECOMMENDED', 'SUPER_APPROVED', 'REJECTED'],
    default: 'PENDING',
    index: true,
  },
  consultancyReview: reviewSchema,
  superAdminReview: reviewSchema,
  rejectionReason: String,
}, { timestamps: true });

universityRequestSchema.index({ email: 1, status: 1 });

export default mongoose.model('UniversityRequest', universityRequestSchema);

