import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy', required: true },
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['DOCUMENT_REQUEST', 'FOLLOW_UP', 'DEADLINE', 'GENERAL'], default: 'GENERAL' },
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'], default: 'PENDING' },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  dueDate: Date,
  completedAt: Date,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags: [String],
  dailyTaskDate: Date, // Links to daily task sheet
  comments: [{ text: String, addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, addedAt: { type: Date, default: Date.now } }],
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
}, { timestamps: true });

taskSchema.index({ consultancyId: 1, status: 1 });
taskSchema.index({ assignedTo: 1, dueDate: 1 });
taskSchema.index({ dailyTaskDate: 1, consultancyId: 1 });

export default mongoose.model('Task', taskSchema);
