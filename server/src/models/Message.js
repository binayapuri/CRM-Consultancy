import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  channel: { type: String, default: 'team' }, // team = all agents in consultancy
}, { timestamps: true });

messageSchema.index({ consultancyId: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
