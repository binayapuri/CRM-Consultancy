import mongoose from 'mongoose';

const clientActivitySchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy', required: true },
  type: {
    type: String,
    enum: ['NOTE', 'DAILY_UPDATE', 'TASK_STATUS', 'COMMUNICATION', 'EXTERNAL_WORK', 'DOCUMENT', 'APPLICATION', 'OTHER'],
    default: 'NOTE',
  },
  text: { type: String, required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  addedAt: { type: Date, default: Date.now },
  editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  editedAt: Date,
  metadata: {
    taskId: mongoose.Schema.Types.ObjectId,
    taskTitle: String,
    fromStatus: String,
    toStatus: String,
    applicationId: mongoose.Schema.Types.ObjectId,
    visaSubclass: String,
  },
}, { timestamps: true });

clientActivitySchema.index({ clientId: 1, addedAt: -1 });
clientActivitySchema.index({ consultancyId: 1, addedAt: -1 });

export default mongoose.model('ClientActivity', clientActivitySchema);
