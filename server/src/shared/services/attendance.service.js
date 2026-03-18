import Attendance from '../../shared/models/Attendance.js';

export class AttendanceService {
  static async checkIn(user, ip, location) {
    const cid = user.profile?.consultancyId || user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existing = await Attendance.findOne({ consultancyId: cid, userId: user._id, date: today });
    if (existing?.checkIn) throw Object.assign(new Error('Already checked in today'), { status: 400 });
    
    if (existing) {
      return Attendance.findByIdAndUpdate(existing._id, { checkIn: new Date(), ipAddress: ip, location }, { new: true });
    }
    return Attendance.create({ consultancyId: cid, userId: user._id, date: today, checkIn: new Date(), ipAddress: ip, location });
  }

  static async checkOut(user, data) {
    const cid = user.profile?.consultancyId || user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const att = await Attendance.findOneAndUpdate(
      { consultancyId: cid, userId: user._id, date: today, checkIn: { $exists: true } },
      { checkOut: new Date(), breakMinutes: data.breakMinutes || 0, notes: data.notes },
      { new: true }
    );
    if (!att) throw Object.assign(new Error('No check-in found for today'), { status: 400 });
    return att;
  }

  static async getMyToday(user) {
    const cid = user.profile?.consultancyId || user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Attendance.findOne({ consultancyId: cid, userId: user._id, date: today });
  }

  static async getAll(user, query) {
    const { from, to, userId, consultancyId } = query;
    const cid = user.role === 'SUPER_ADMIN' && consultancyId ? consultancyId : (user.profile?.consultancyId || user._id);
    
    if (!['SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER'].includes(user.role)) {
      throw Object.assign(new Error('Insufficient permissions'), { status: 403 });
    }

    const filter = { consultancyId: cid };
    if (userId) filter.userId = userId;
    
    const start = from ? new Date(from) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = to ? new Date(to) : new Date(start);
    end.setDate(end.getDate() + 1);
    filter.date = { $gte: start, $lt: end };
    
    return Attendance.find(filter)
      .populate('userId', 'email profile.firstName profile.lastName')
      .sort({ date: -1, checkIn: -1 });
  }
}
