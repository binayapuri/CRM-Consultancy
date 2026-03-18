import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, // CLIENT_ADDED, APPROVAL, REFUSAL, TASK_ASSIGNED, etc.
  title: { type: String, required: true },
  message: String,
  relatedEntityType: String,
  relatedEntityId: mongoose.Schema.Types.ObjectId,
  read: { type: Boolean, default: false },
  readAt: Date,
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ consultancyId: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
