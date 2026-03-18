import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sponsor' },
  consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy', required: true },
  name: { type: String, required: true },
  type: String, // Passport, CoE, OSHC, English Test, GTE/GS Statement, etc.
  category: String,
  fileUrl: String,
  fileKey: String, // S3 key for production
  metadata: {
    expiryDate: Date,
    issueDate: Date,
    testType: String, // PTE, IELTS
    score: String,
  },
  version: { type: Number, default: 1 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['PENDING', 'UPLOADED', 'VERIFIED', 'EXPIRED'], default: 'PENDING' },
}, { timestamps: true });

documentSchema.index({ applicationId: 1 });
documentSchema.index({ clientId: 1, type: 1 });

export default mongoose.model('Document', documentSchema);
