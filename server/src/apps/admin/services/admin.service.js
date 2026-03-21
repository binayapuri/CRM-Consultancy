import Consultancy from '../../../shared/models/Consultancy.js';
import Employer from '../../../shared/models/Employer.js';
import InsuranceProvider from '../../../shared/models/InsuranceProvider.js';
import User from '../../../shared/models/User.js';
import Client from '../../../shared/models/Client.js';
import Application from '../../../shared/models/Application.js';
import PlatformSettings from '../../../shared/models/PlatformSettings.js';

const MASK = '••••••••';

export class AdminService {
  static async getPendingVerifications() {
    const consultancies = await Consultancy.find({ verified: false }).select('name email abn phone createdAt marnNumbers');
    const employers = await Employer.find({ verificationStatus: 'PENDING' }).populate('userId', 'email').select('companyName abn industry website createdAt userId');
    const insurers = await InsuranceProvider.find({ verificationStatus: 'PENDING' }).select('companyName contactDetails createdAt');

    return {
      consultancies: consultancies.map(c => ({ id: c._id, type: 'CONSULTANCY', name: c.name, email: c.email, abn: c.abn, marn: c.marnNumbers?.[0], date: c.createdAt })),
      employers: employers.map(e => ({ id: e._id, type: 'EMPLOYER', name: e.companyName, email: e.userId?.email, abn: e.abn, industry: e.industry, date: e.createdAt })),
      insurers: insurers.map(i => ({ id: i._id, type: 'INSURER', name: i.companyName, email: i.contactDetails?.email, date: i.createdAt }))
    };
  }

  static async processVerification(type, id, action) {
    if (type === 'CONSULTANCY') {
      if (action === 'APPROVE') {
        const c = await Consultancy.findByIdAndUpdate(id, { verified: true }, { new: true });
        if (!c) throw Object.assign(new Error('Consultancy not found'), { status: 404 });
      } else {
        await Consultancy.findByIdAndDelete(id);
      }
    } else if (type === 'EMPLOYER') {
      const e = await Employer.findByIdAndUpdate(id, { verificationStatus: action === 'APPROVE' ? 'VERIFIED' : 'REJECTED' }, { new: true });
      if (!e) throw Object.assign(new Error('Employer not found'), { status: 404 });
    } else if (type === 'INSURER') {
      const i = await InsuranceProvider.findByIdAndUpdate(id, { verificationStatus: action === 'APPROVE' ? 'VERIFIED' : 'REJECTED' }, { new: true });
      if (!i) throw Object.assign(new Error('Insurer not found'), { status: 404 });
    }
    return { success: true, message: `${type} ${action}D successfully` };
  }

  static async getAllStudents() {
    const students = await User.find({ role: 'STUDENT' }).select('-password').sort({ createdAt: -1 });
    const studentIds = students.map(s => s._id);
    const clients = await Client.find({ userId: { $in: studentIds } });
    const clientMap = {};
    clients.forEach(c => { clientMap[String(c.userId)] = c; });
    return students.map(s => ({
      ...s.toObject(),
      client: clientMap[String(s._id)] || null,
    }));
  }

  static async updateStudent(id, updateData) {
    const user = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true }).select('-password');
    if (!user) throw Object.assign(new Error('Student not found'), { status: 404 });
    return user;
  }

  static async getAllEmployers() {
    const employers = await Employer.find()
      .populate('userId', 'email profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .lean();
    return employers;
  }

  static async getDashboardStats() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [totalStudents, totalConsultancies, totalApplications, activeThisWeek] = await Promise.all([
      User.countDocuments({ role: 'STUDENT' }),
      Consultancy.countDocuments(),
      Application.countDocuments(),
      User.countDocuments({ role: 'STUDENT', updatedAt: { $gte: oneWeekAgo } }),
    ]);
    return { totalStudents, totalConsultancies, totalApplications, activeThisWeek };
  }

  static maskSecrets(doc) {
    if (!doc) return doc;
    const d = doc.toObject ? doc.toObject() : { ...doc };
    if (d.smtp?.pass) d.smtp.pass = MASK;
    if (d.auth?.google?.clientSecret) d.auth.google.clientSecret = MASK;
    if (d.auth?.apple?.privateKey) d.auth.apple.privateKey = MASK;
    return d;
  }

  static async getPlatformSettings() {
    let doc = await PlatformSettings.findOne();
    if (!doc) doc = await PlatformSettings.create({});
    return this.maskSecrets(doc);
  }

  static async updatePlatformSettings(body) {
    let doc = await PlatformSettings.findOne();
    if (!doc) doc = await PlatformSettings.create({});
    
    const update = {};
    if (body.smtp != null) {
      update.smtp = { ...doc.smtp?.toObject?.() ?? doc.smtp ?? {}, ...body.smtp };
      if (update.smtp.pass === MASK || update.smtp.pass === '') {
        update.smtp.pass = doc.smtp?.pass ?? '';
      }
    }
    if (body.auth != null) {
      update.auth = { ...doc.auth?.toObject?.() ?? doc.auth ?? {}, ...body.auth };
      if (body.auth.google != null) {
        update.auth.google = { ...doc.auth?.google?.toObject?.() ?? doc.auth?.google ?? {}, ...body.auth.google };
        if (update.auth.google.clientSecret === MASK || update.auth.google.clientSecret === '') {
          update.auth.google.clientSecret = doc.auth?.google?.clientSecret ?? '';
        }
      }
      if (body.auth.apple != null) {
        update.auth.apple = { ...doc.auth?.apple?.toObject?.() ?? doc.auth?.apple ?? {}, ...body.auth.apple };
        if (update.auth.apple.privateKey === MASK || update.auth.apple.privateKey === '') {
          update.auth.apple.privateKey = doc.auth?.apple?.privateKey ?? '';
        }
      }
    }
    if (body.notifications != null) {
      update.notifications = { ...doc.notifications?.toObject?.() ?? doc.notifications ?? {}, ...body.notifications };
    }

    Object.keys(update).forEach(key => doc.set(key, update[key]));
    await doc.save();
    return this.maskSecrets(doc);
  }
}
