import AuditLog from '../../shared/models/AuditLog.js';

export class AuditService {
  static async getTodayLogs(user, queryCid) {
    const cid = user.profile?.consultancyId || user._id;
    let filter = user.role === 'SUPER_ADMIN' ? {} : { consultancyId: cid };
    if (user.role === 'SUPER_ADMIN' && queryCid) filter = { consultancyId: queryCid };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    filter.changedAt = { $gte: today, $lt: tomorrow };
    return AuditLog.find(filter)
      .populate('changedBy', 'profile')
      .sort({ changedAt: -1 })
      .limit(50);
  }

  static async getAllLogs(user, query) {
    const cid = user.profile?.consultancyId || user._id;
    const { clientId, entityType, userId, assignedAgentId, visaSubclass, dateFrom, dateTo, page = 1, limit = 50, consultancyId } = query;

    const filter = user.role === 'SUPER_ADMIN'
      ? (consultancyId ? { consultancyId } : {})
      : { consultancyId: cid };
    if (clientId) filter.clientId = clientId;
    if (entityType) filter.entityType = entityType;
    if (userId) filter.changedBy = userId;
    if (assignedAgentId) filter.assignedAgentId = assignedAgentId;
    if (visaSubclass) filter.visaSubclass = visaSubclass;
    
    if (dateFrom || dateTo) {
      filter.changedAt = filter.changedAt || {};
      if (dateFrom) filter.changedAt.$gte = new Date(dateFrom);
      if (dateTo) filter.changedAt.$lte = new Date(dateTo + 'T23:59:59');
    }

    const logs = await AuditLog.find(filter)
      .populate('changedBy', 'profile email')
      .populate('assignedAgentId', 'profile')
      .sort({ changedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    
    const total = await AuditLog.countDocuments(filter);
    return { logs, total, page: Number(page), limit: Number(limit) };
  }

  static async getLogsByDate(user, date) {
    const cid = user.profile?.consultancyId || user._id;
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    
    const filter = user.role === 'SUPER_ADMIN' ? {} : { consultancyId: cid };
    filter.changedAt = { $gte: start, $lte: end };
    
    return AuditLog.find(filter)
      .populate('changedBy', 'profile email')
      .sort({ changedAt: -1 });
  }
}
