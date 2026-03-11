import mongoose from 'mongoose';

const offerLetterApplicationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true },
  status: { type: String, enum: ['PENDING', 'UNDER_REVIEW', 'OFFERED', 'REJECTED', 'ACCEPTED'], default: 'PENDING' },
  documents: [{
    title: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  universityNotes: String,
  studentNotes: String,
}, { timestamps: true });

export default mongoose.model('OfferLetterApplication', offerLetterApplicationSchema);
