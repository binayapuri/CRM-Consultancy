import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  isApproved: { type: Boolean, default: true }, // For moderation if needed
  response: {
    text: String,
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: Date
  }
}, { timestamps: true });

export default mongoose.model('Review', reviewSchema);
