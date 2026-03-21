import mongoose from 'mongoose';

const consultancyBillingCounterSchema = new mongoose.Schema(
  {
    consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy', required: true, index: true },
    year: { type: Number, required: true },
    documentType: { type: String, enum: ['QUOTE', 'INVOICE'], required: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true }
);

consultancyBillingCounterSchema.index({ consultancyId: 1, year: 1, documentType: 1 }, { unique: true });

export default mongoose.model('ConsultancyBillingCounter', consultancyBillingCounterSchema);
