import mongoose from 'mongoose';

const insuranceApplicationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'InsurancePlan', required: true },
  status: { type: String, enum: ['APPLIED', 'PENDING_PAYMENT', 'APPROVED', 'ACTIVE', 'EXPIRED', 'REJECTED'], default: 'APPLIED' },
  policyNumber: String,
  startDate: Date,
  endDate: Date,
  notes: String,
  documents: [{
    title: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

insuranceApplicationSchema.index({ studentId: 1, status: 1 });

export default mongoose.model('InsuranceApplication', insuranceApplicationSchema);
