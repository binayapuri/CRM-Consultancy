import AuditLog from '../models/AuditLog.js';

export async function logAudit(consultancyId, entityType, entityId, action, changedBy, options = {}) {
  const { field, oldValue, newValue, description, metadata, clientId, applicationId, visaSubclass, assignedAgentId } = options;
  await AuditLog.create({
    consultancyId,
    entityType,
    entityId,
    action,
    field,
    oldValue,
    newValue,
    description,
    changedBy,
    metadata,
    clientId: clientId || metadata?.clientId,
    applicationId: applicationId || metadata?.applicationId,
    visaSubclass: visaSubclass || metadata?.visaSubclass,
    assignedAgentId: assignedAgentId || metadata?.assignedAgentId,
  });
}

export function getDiff(oldDoc, newDoc, fields) {
  const changes = [];
  for (const field of fields) {
    const oldVal = field.split('.').reduce((o, k) => o?.[k], oldDoc);
    const newVal = field.split('.').reduce((o, k) => o?.[k], newDoc);
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({ field, oldValue: oldVal, newValue: newVal });
    }
  }
  return changes;
}
