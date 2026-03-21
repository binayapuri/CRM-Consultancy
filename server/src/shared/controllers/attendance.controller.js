import { AttendanceService } from '../services/attendance.service.js';

export class AttendanceController {
  static async checkIn(req, res) {
    const att = await AttendanceService.checkIn(req.user, req.ip, req.body.location);
    res.json(att);
  }

  static async checkOut(req, res) {
    const att = await AttendanceService.checkOut(req.user, req.body);
    res.json(att);
  }

  static async getMyToday(req, res) {
    const att = await AttendanceService.getMyToday(req.user);
    res.json(att || null);
  }

  static async getAll(req, res) {
    const list = await AttendanceService.getAll(req.user, req.query);
    res.json(list);
  }
}
