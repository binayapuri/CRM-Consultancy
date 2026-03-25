import mongoose from 'mongoose';

/** Office / branch under a consultancy — clients and staff can be scoped for data isolation */
const consultancyBranchSchema = new mongoose.Schema(
  {
    consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

consultancyBranchSchema.index({ consultancyId: 1, name: 1 }, { unique: true });

export default mongoose.model('ConsultancyBranch', consultancyBranchSchema);
