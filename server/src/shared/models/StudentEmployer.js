import mongoose from 'mongoose';

const studentEmployerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    companyName: { type: String, required: true },
    abn: String,
    contactName: String,
    email: { type: String, default: '' },
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      postcode: String,
      country: { type: String, default: 'Australia' },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

studentEmployerSchema.index({ userId: 1, companyName: 1 });

export default mongoose.model('StudentEmployer', studentEmployerSchema);

