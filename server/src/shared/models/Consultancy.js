import mongoose from 'mongoose';

const rolePermissionSchema = new mongoose.Schema({
  role: { type: String, enum: ['CONSULTANCY_ADMIN', 'MANAGER', 'AGENT', 'SUPPORT'], required: true },
  permissions: {
    clients: { view: { type: Boolean, default: true }, create: { type: Boolean, default: true }, edit: { type: Boolean, default: true }, delete: { type: Boolean, default: false } },
    applications: { view: { type: Boolean, default: true }, create: { type: Boolean, default: true }, edit: { type: Boolean, default: true }, delete: { type: Boolean, default: false } },
    tasks: { view: { type: Boolean, default: true }, create: { type: Boolean, default: true }, edit: { type: Boolean, default: true }, delete: { type: Boolean, default: false } },
    kanban: { view: { type: Boolean, default: true }, edit: { type: Boolean, default: true } },
    leads: { view: { type: Boolean, default: true }, create: { type: Boolean, default: true }, edit: { type: Boolean, default: true }, delete: { type: Boolean, default: false } },
    documents: { view: { type: Boolean, default: true }, upload: { type: Boolean, default: true }, delete: { type: Boolean, default: false } },
    trustLedger: { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    employees: { view: { type: Boolean, default: false }, manage: { type: Boolean, default: false } },
    traceHistory: { view: { type: Boolean, default: false } },
    settings: { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    colleges: { view: { type: Boolean, default: true }, manage: { type: Boolean, default: false } },
    oshc: { view: { type: Boolean, default: true }, manage: { type: Boolean, default: false } },
    sponsors: { view: { type: Boolean, default: true }, create: { type: Boolean, default: true }, edit: { type: Boolean, default: true }, delete: { type: Boolean, default: false } },
    sendDocuments: { type: Boolean, default: true },
    sendAdvice: { type: Boolean, default: true },
  },
}, { _id: false });

const consultancySchema = new mongoose.Schema({
  name: { type: String, required: true },
  displayName: String, // Shown in header - defaults to name if not set
  slug: { type: String, unique: true },
  abn: String,
  address: { street: String, city: String, state: String, postcode: String },
  phone: String,
  email: String,
  website: String,
  logo: String,
  description: String,
  specializations: [String],
  languages: [String],
  verified: { type: Boolean, default: false },
  marnNumbers: [String],
  settings: {
    timezone: { type: String, default: 'Australia/Sydney' },
    currency: { type: String, default: 'AUD' },
  },
  rolePermissions: [rolePermissionSchema],
  // Form 956 & MIA - for auto-send
  form956Details: {
    agentName: String,
    marnNumber: String,
    signatureUrl: String,
    companyName: String,
    address: String,
    phone: String,
    email: String,
  },
  miaAgreementDetails: {
    templateUrl: String,
    signatureUrl: String,
    agentName: String,
    marnNumber: String,
  },
  bankDetails: {
    accountName: String,
    bank: String,
    bsb: String,
    accountNumber: String,
  },
  initialAdviceTemplate: {
    subject: String,
    body: String,
    feeBlocks: [{ label: String, amount: String, description: String }],
  },
  // Multiple email profiles - admin adds, employees can choose which to use
  emailProfiles: [{
    name: { type: String, required: true },
    host: { type: String, required: true },
    port: { type: Number, default: 587 },
    secure: { type: Boolean, default: false },
    user: { type: String, required: true },
    pass: String,
    from: String,
    isDefault: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  }],
}, { timestamps: true });

consultancySchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

export default mongoose.model('Consultancy', consultancySchema);
