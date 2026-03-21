import { AuditService } from '../services/audit.service.js';

export class AuditController {
  static async getTodayLogs(req, res) {
    const logs = await AuditService.getTodayLogs(req.user, req.query.consultancyId);
    res.json(logs);
  }

  static async getAllLogs(req, res) {
    const result = await AuditService.getAllLogs(req.user, req.query);
    res.json(result);
  }

  static async getLogsByDate(req, res) {
    const logs = await AuditService.getLogsByDate(req.user, req.query.date);
    res.json(logs);
  }
}
