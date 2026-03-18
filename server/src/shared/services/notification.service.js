import Notification from '../../shared/models/Notification.js';
import Client from '../../shared/models/Client.js';

export class NotificationService {
  static async sendToClient(user, data) {
    const { clientId, type, title, message } = data;
    const cid = user.profile?.consultancyId || user._id;
    
    const client = await Client.findById(clientId).select('userId consultancyId profile');
    if (!client || client.consultancyId?.toString() !== cid.toString()) {
      throw Object.assign(new Error('Client not found'), { status: 404 });
    }
    if (!client.userId) {
      throw Object.assign(new Error('Client has not activated their account yet'), { status: 400 });
    }

    return Notification.create({
      consultancyId: cid,
      userId: client.userId,
      type: type || 'CHECKLIST_SENT',
      title: title || 'Document from your migration agent',
      message: message || '',
      relatedEntityType: 'Checklist',
    });
  }

  static async getUserNotifications(userId) {
    return Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100);
  }

  static async readAll(userId) {
    await Notification.updateMany({ userId }, { read: true, readAt: new Date() });
    return { success: true };
  }

  static async readOne(userId, notificationId) {
    const notif = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true, readAt: new Date() },
      { new: true }
    );
    if (!notif) throw Object.assign(new Error('Not found'), { status: 404 });
    return notif;
  }
}
