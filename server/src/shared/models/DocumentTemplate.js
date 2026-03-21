import mongoose from 'mongoose';

const documentTemplateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['GOVERNMENT', 'EMPLOYER_REF', 'FINANCIAL', 'GS_GTE', 'OTHER'], default: 'OTHER' },
  description: String,
  fileUrl: { type: String, required: true },
  applicableVisas: [String], // e.g. ['500', '485', '190']
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Super Admin
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('DocumentTemplate', documentTemplateSchema);
