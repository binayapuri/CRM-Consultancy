import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy', required: true },
  entityType: { type: String, required: true }, // 'Client', 'Application', 'Task', 'Document', etc.
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE', 'SEND'], required: true },
  field: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  description: String,
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changedAt: { type: Date, default: Date.now },
  metadata: { clientName: String, userName: String },
  // For Task Sheet, Trace History, Employee Job Sheet filtering
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  visaSubclass: String,
  assignedAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

auditLogSchema.index({ consultancyId: 1, entityType: 1, entityId: 1 });
auditLogSchema.index({ consultancyId: 1, changedAt: -1 });
auditLogSchema.index({ consultancyId: 1, changedBy: 1, changedAt: -1 });
auditLogSchema.index({ consultancyId: 1, clientId: 1, changedAt: -1 });
auditLogSchema.index({ consultancyId: 1, assignedAgentId: 1, changedAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
