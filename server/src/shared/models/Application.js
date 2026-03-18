import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy', required: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sponsor' }, // For 482, 186, training visas
  visaSubclass: { type: String, required: true }, // 500, 485, 190, 189, 491
  status: {
    type: String,
    enum: ['ONBOARDING', 'DRAFTING', 'PENDING_INFO', 'REVIEW', 'LODGED', 'DECISION', 'COMPLETED'],
    default: 'ONBOARDING',
  },
  stageDeadline: Date,
  documentChecklist: [{
    name: String,
    required: Boolean,
    uploaded: Boolean,
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    requestedAt: Date,
    dueDate: Date,
  }],
  immiAccountRef: String,
  lodgedAt: Date,
  decisionAt: Date,
  decisionOutcome: String, // Granted, Refused, Withdrawn
  coe: {
    number: String,
    institution: String,
    courseName: String,
    courseCode: String,
    issueDate: Date,
    expiryDate: Date,
    status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'RENEWED'], default: 'ACTIVE' },
  },
  notes: [{ text: String, addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, addedAt: Date, isLegalAdvice: Boolean }],
  form956Signed: { type: Boolean, default: false },
  form956SignedAt: Date,
}, { timestamps: true });

applicationSchema.index({ consultancyId: 1, status: 1 });
applicationSchema.index({ clientId: 1 });

export default mongoose.model('Application', applicationSchema);
