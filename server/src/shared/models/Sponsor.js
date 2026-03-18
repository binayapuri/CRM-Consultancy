import mongoose from 'mongoose';

const sponsorSchema = new mongoose.Schema({
  consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy', required: true },
  // Company details (for 482, 186, 494, 407 training visa sponsors)
  companyName: { type: String, required: true },
  abn: String,
  acn: String,
  address: {
    street: String,
    city: String,
    state: String,
    postcode: String,
    country: { type: String, default: 'Australia' },
  },
  phone: String,
  email: String,
  industry: String,
  website: String,
  // Nomination / sponsorship details
  nominationNumber: String,
  nominationStatus: { type: String, enum: ['PENDING', 'APPROVED', 'EXPIRED', 'WITHDRAWN'], default: 'PENDING' },
  nominationApprovedAt: Date,
  sbsStatus: String, // Standard Business Sponsorship
  // Primary contact (like client profile)
  contactPerson: {
    firstName: String,
    lastName: String,
    role: String,
    email: String,
    phone: String,
  },
  // Additional contacts for Form 956, MIA
  additionalContacts: [{ name: String, email: String, role: String }],
  // Business evidence
  businessRegistration: String,
  premisesEvidence: String,
  franchiseAgreement: String,
  accountantLetter: String,
  financialStatements: String,
  // Document checklist (LMT, GPR, AMSR, etc.)
  documentChecklist: [{
    name: String,
    type: { type: String },
    required: { type: Boolean, default: true },
    uploaded: { type: Boolean, default: false },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  }],
  form956Signed: { type: Boolean, default: false },
  form956SignedAt: Date,
  miaSigned: { type: Boolean, default: false },
  miaSignedAt: Date,
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'PENDING'], default: 'ACTIVE' },
  notes: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // portal login when invited
  inviteToken: String,
  inviteTokenExpires: Date,
}, { timestamps: true });

sponsorSchema.index({ consultancyId: 1 });
sponsorSchema.index({ companyName: 'text', abn: 'text' });

export default mongoose.model('Sponsor', sponsorSchema);
