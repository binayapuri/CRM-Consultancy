import mongoose from 'mongoose';

const insurancePlanSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'InsuranceProvider', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['OSHC', 'OVHC'], required: true }, // Overseas Student Health Cover, Overseas Visitor Health Cover
  monthlyPremium: { type: Number, required: true },
  coverageDetails: String,
  benefitsList: [String],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

insurancePlanSchema.index({ providerId: 1 });

export default mongoose.model('InsurancePlan', insurancePlanSchema);
