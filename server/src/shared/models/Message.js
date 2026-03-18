import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy' },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  contextPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost' },
  text: { type: String, required: true },
  channel: { type: String, enum: ['team', 'direct'], default: 'team' }, // team = all agents in consultancy
}, { timestamps: true });

messageSchema.index({ consultancyId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });
messageSchema.index({ contextPostId: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
