import mongoose from 'mongoose';

const oshcSchema = new mongoose.Schema({
  consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy' },
  provider: { type: String, required: true },
  planName: String,
  coverageType: { type: String, enum: ['SINGLE', 'COUPLE', 'FAMILY'], default: 'SINGLE' },
  applicationType: { type: String, enum: ['AGENT', 'DIRECT', 'BOTH'], default: 'BOTH' },
  pricePerMonth: Number,
  pricePerYear: Number,
  excessAmount: Number,
  website: String,
  phone: String,
  agentContact: { name: String, email: String, phone: String },
  directApplyUrl: String,
  partnershipStatus: { type: String, enum: ['ACTIVE', 'PENDING', 'INACTIVE'], default: 'PENDING' },
  consultancyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy' }],
}, { timestamps: true });

oshcSchema.index({ consultancyId: 1 });
oshcSchema.index({ provider: 1, coverageType: 1 });

export default mongoose.model('OSHC', oshcSchema);
