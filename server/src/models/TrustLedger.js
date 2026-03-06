import mongoose from 'mongoose';

const trustLedgerSchema = new mongoose.Schema({
  consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy', required: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  transactionId: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  direction: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
  balanceSnapshot: Number,
  description: String,
  category: String, // Client Deposit, Fee Transfer, Refund
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

trustLedgerSchema.index({ consultancyId: 1, createdAt: -1 });

export default mongoose.model('TrustLedger', trustLedgerSchema);
