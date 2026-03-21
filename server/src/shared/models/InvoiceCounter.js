import mongoose from 'mongoose';

const invoiceCounterSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    year: { type: Number, required: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true }
);

invoiceCounterSchema.index({ userId: 1, year: 1 }, { unique: true });

export default mongoose.model('InvoiceCounter', invoiceCounterSchema);

