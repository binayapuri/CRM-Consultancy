import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy', required: true },
  source: String, // Website, Referral, Walk-in
  status: { type: String, enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'], default: 'NEW' },
  profile: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    interest: String, // Student Visa, PR, 485
    notes: String,
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  convertedToClientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  lastContactAt: Date,
}, { timestamps: true });

leadSchema.index({ consultancyId: 1, status: 1 });

export default mongoose.model('Lead', leadSchema);
