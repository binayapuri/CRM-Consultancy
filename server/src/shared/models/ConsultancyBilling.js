import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, default: 'items' },
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
      suburb: String,
      city: String,
      state: String,
      postcode: String,
      country: { type: String, default: 'Australia' },
    },
  },
  { _id: false }
);

const consultancyBillingSchema = new mongoose.Schema(
  {
    consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy', required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    documentType: { type: String, enum: ['QUOTE', 'INVOICE'], required: true, index: true },
    status: { type: String, enum: ['DRAFT', 'SENT', 'ACCEPTED', 'PAID', 'CANCELLED'], default: 'DRAFT', index: true },
    documentNumber: { type: String, required: true, unique: true },
    title: { type: String, default: '' },
    issueDate: { type: Date, required: true },
    dueDate: Date,
    validUntil: Date,
    acceptedAt: Date,
    paidAt: Date,
    supplier: { type: partySnapshotSchema, default: () => ({}) },
    customer: { type: partySnapshotSchema, default: () => ({}) },
    payment: {
      bankName: { type: String, default: '' },
      bsb: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      accountName: { type: String, default: '' },
      reference: { type: String, default: '' },
    },
    currency: { type: String, default: 'AUD' },
    gstEnabled: { type: Boolean, default: false },
    gstRate: { type: Number, default: 0.1 },
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

consultancyBillingSchema.index({ consultancyId: 1, createdAt: -1 });
consultancyBillingSchema.index({ consultancyId: 1, clientId: 1, createdAt: -1 });
consultancyBillingSchema.index({ consultancyId: 1, documentType: 1, status: 1, createdAt: -1 });

export default mongoose.model('ConsultancyBilling', consultancyBillingSchema);
