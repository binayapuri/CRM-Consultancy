import { NotificationService } from '../services/notification.service.js';

export class NotificationController {
  static async sendToClient(req, res) {
    const notif = await NotificationService.sendToClient(req.user, req.body);
    res.status(201).json(notif);
  }

  static async getUserNotifications(req, res) {
    const notifications = await NotificationService.getUserNotifications(req.user._id);
    res.json(notifications);
  }

  static async readAll(req, res) {
    const result = await NotificationService.readAll(req.user._id);
    res.json(result);
  }

  static async readOne(req, res) {
    const notif = await NotificationService.readOne(req.user._id, req.params.id);
    res.json(notif);
  }
}
