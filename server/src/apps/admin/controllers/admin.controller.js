import { AdminService } from '../services/admin.service.js';

export class AdminController {
  
  static async getVerifications(req, res) {
    const data = await AdminService.getPendingVerifications();
    res.json(data);
  }

  static async processVerification(req, res) {
    const { type, id } = req.params;
    const { action } = req.body;
    const result = await AdminService.processVerification(type, id, action);
    res.json(result);
  }

  static async getStudents(req, res) {
    const data = await AdminService.getAllStudents();
    res.json(data);
  }

  static async getEmployers(req, res) {
    const data = await AdminService.getAllEmployers();
    res.json(data);
  }

  static async updateStudent(req, res) {
    const { id } = req.params;
    const data = await AdminService.updateStudent(id, req.body);
    res.json(data);
  }

  static async getStats(req, res) {
    const data = await AdminService.getDashboardStats();
    res.json(data);
  }

  static async getSettings(req, res) {
    const data = await AdminService.getPlatformSettings();
    res.json(data);
  }

  static async updateSettings(req, res) {
    const data = await AdminService.updatePlatformSettings(req.body);
    res.json(data);
  }
}
