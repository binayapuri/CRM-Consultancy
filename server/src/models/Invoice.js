import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, default: 'hours' }, // hours|items
    unitPrice: { type: Number, required: true, default: 0 },
    amount: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const partySnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    abn: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: {
      street: String,
      city: String,
      state: String,
      postcode: String,
      country: { type: String, default: 'Australia' },
    },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentEmployer', required: true, index: true },

    status: { type: String, enum: ['DRAFT', 'SENT', 'PAID', 'CANCELLED'], default: 'DRAFT' },

    invoiceNumber: { type: String, required: true, index: true, unique: true },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date },

    period: {
      from: Date,
      to: Date,
    },

    supplier: { type: partySnapshotSchema, default: () => ({}) },
    customer: { type: partySnapshotSchema, default: () => ({}) },

    currency: { type: String, default: 'AUD' },
    gstEnabled: { type: Boolean, default: false },
    gstRate: { type: Number, default: 0.1 }, // 10%

    lineItems: { type: [lineItemSchema], default: () => [] },
    subtotal: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    notes: { type: String, default: '' },
    emailLog: {
      to: String,
      subject: String,
      sentAt: Date,
    },
  },
  { timestamps: true }
);

invoiceSchema.index({ userId: 1, createdAt: -1 });
invoiceSchema.index({ userId: 1, employerId: 1, createdAt: -1 });
// Strong guarantee: never allow invoice number reuse (global uniqueness).
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });

export default mongoose.model('Invoice', invoiceSchema);

