import Consultancy from '../../../shared/models/Consultancy.js';
import Client from '../../../shared/models/Client.js';
import Application from '../../../shared/models/Application.js';
import Task from '../../../shared/models/Task.js';
import Lead from '../../../shared/models/Lead.js';
import Document from '../../../shared/models/Document.js';
import TrustLedger from '../../../shared/models/TrustLedger.js';
import Sponsor from '../../../shared/models/Sponsor.js';
import User from '../../../shared/models/User.js';
import College from '../../../shared/models/College.js';
import OSHC from '../../../shared/models/OSHC.js';
import Attendance from '../../../shared/models/Attendance.js';
import { isBusinessEmail } from '../../../shared/utils/emailValidation.js';
import jwt from 'jsonwebtoken';

export class ConsultancyService {
  static async uploadSignature(consultancyId, fileUrl) {
    if (!consultancyId) throw Object.assign(new Error('No consultancy assigned'), { status: 404 });
    const c = await Consultancy.findByIdAndUpdate(consultancyId, {
      'form956Details.signatureUrl': fileUrl,
      'miaAgreementDetails.signatureUrl': fileUrl,
    }, { new: true });
    if (!c) throw Object.assign(new Error('Not found'), { status: 404 });
    return { signatureUrl: fileUrl, consultancy: c };
  }

  static async uploadConsumerGuide(consultancyId, fileUrl) {
    if (!consultancyId) throw Object.assign(new Error('No consultancy assigned'), { status: 404 });
    const c = await Consultancy.findByIdAndUpdate(consultancyId, {
      'form956Details.consumerGuideUrl': fileUrl,
    }, { new: true });
    if (!c) throw Object.assign(new Error('Not found'), { status: 404 });
    return { consumerGuideUrl: fileUrl, consultancy: c };
  }

  static async getAllConsultancies(user) {
    const filter = user.role === 'SUPER_ADMIN' ? {} : { _id: user.profile?.consultancyId };
    const consultancies = await Consultancy.find(filter || {});
    return user.role === 'SUPER_ADMIN' ? consultancies : (consultancies[0] ? [consultancies[0]] : []);
  }

  static async searchConsultancies({ q, specialization, state }) {
    const filter = { verified: true };
    if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { specializations: new RegExp(q, 'i') }];
    if (specialization) filter.specializations = new RegExp(specialization, 'i');
    if (state) filter['address.state'] = state;
    return Consultancy.find(filter).limit(20);
  }

  static async getConsultancyById(id) {
    const c = await Consultancy.findById(id);
    if (!c) throw Object.assign(new Error('Not found'), { status: 404 });
    return c;
  }

  static async getOverview(cid) {
    const consultancy = await Consultancy.findById(cid);
    if (!consultancy) throw Object.assign(new Error('Not found'), { status: 404 });

    const [clients, employees, applications, tasks, leads, documents, trustEntries, sponsors, colleges, oshc, attendanceToday] = await Promise.all([
      Client.countDocuments({ consultancyId: cid }),
      User.countDocuments({ 'profile.consultancyId': cid }),
      Application.countDocuments({ consultancyId: cid }),
      Task.countDocuments({ consultancyId: cid }),
      Lead.countDocuments({ consultancyId: cid }),
      Document.countDocuments({ consultancyId: cid }),
      TrustLedger.countDocuments({ consultancyId: cid }),
      Sponsor.countDocuments({ consultancyId: cid }),
      College.countDocuments({ $or: [{ consultancyId: cid }, { consultancyIds: cid }] }),
      OSHC.countDocuments({ $or: [{ consultancyId: cid }, { consultancyIds: cid }] }),
      Attendance.countDocuments({ consultancyId: cid, date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
    ]);

    const trustBalance = await TrustLedger.aggregate([
      { $match: { consultancyId: consultancy._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const recentClients = await Client.find({ consultancyId: cid })
      .populate('assignedAgentId', 'profile')
      .sort({ lastActivityAt: -1 })
      .limit(10)
      .select('profile status assignedAgentId lastActivityAt');

    const recentApplications = await Application.find({ consultancyId: cid })
      .populate('clientId', 'profile')
      .populate('agentId', 'profile')
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('visaSubclass status clientId agentId updatedAt');

    const employeesList = await User.find({ 'profile.consultancyId': cid })
      .select('-password').select('email role profile isActive');

    const appStatusBreakdown = await Application.aggregate([
      { $match: { consultancyId: consultancy._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    return {
      consultancy,
      stats: { clients, employees, applications, tasks, leads, documents, trustEntries, sponsors, colleges, oshc, attendanceToday, trustBalance: trustBalance[0]?.total ?? 0 },
      recentClients, recentApplications, employeesList,
      appStatusBreakdown: appStatusBreakdown.reduce((acc, x) => { acc[x._id] = x.count; return acc; }, {}),
    };
  }

  static async registerConsultancy(data) {
    const { email, password, firstName, lastName, marnNumber, consultancyName, abn, phone } = data;
    if (!isBusinessEmail(email)) throw Object.assign(new Error('Consultancy admin must use a business email.'), { status: 400 });
    
    if (await User.findOne({ email })) throw Object.assign(new Error('Email already registered'), { status: 400 });
    const existingConsultancy = await Consultancy.findOne({ $or: [{ email }, { 'form956Details.email': email }] });
    if (existingConsultancy) throw Object.assign(new Error('A consultancy with this email already exists'), { status: 400 });

    const consultancy = await Consultancy.create({
      name: consultancyName, displayName: consultancyName, abn: abn || undefined, email, phone: phone || undefined,
      marnNumbers: [String(marnNumber).trim()], verified: false,
      form956Details: { agentName: `${firstName} ${lastName}`, marnNumber: String(marnNumber).trim(), email, phone: phone || undefined },
      miaAgreementDetails: { agentName: `${firstName} ${lastName}`, marnNumber: String(marnNumber).trim() },
      rolePermissions: [
        { role: 'CONSULTANCY_ADMIN', permissions: { clients: { view: true, create: true, edit: true, delete: true }, applications: { view: true, create: true, edit: true, delete: true }, tasks: { view: true, create: true, edit: true, delete: true }, kanban: { view: true, edit: true }, leads: { view: true, create: true, edit: true, delete: true }, documents: { view: true, upload: true, delete: true }, trustLedger: { view: true, edit: true }, employees: { view: true, manage: true }, traceHistory: { view: true }, settings: { view: true, edit: true }, colleges: { view: true, manage: true }, oshc: { view: true, manage: true }, sponsors: { view: true, create: true, edit: true, delete: true }, sendDocuments: true, sendAdvice: true } },
        { role: 'MANAGER', permissions: { clients: { view: true, create: true, edit: true, delete: true }, applications: { view: true, create: true, edit: true, delete: true }, tasks: { view: true, create: true, edit: true, delete: true }, kanban: { view: true, edit: true }, leads: { view: true, create: true, edit: true, delete: true }, documents: { view: true, upload: true, delete: true }, trustLedger: { view: true, edit: true }, employees: { view: true, manage: true }, traceHistory: { view: true }, settings: { view: true, edit: true }, colleges: { view: true, manage: true }, oshc: { view: true, manage: true }, sponsors: { view: true, create: true, edit: true, delete: true }, sendDocuments: true, sendAdvice: true } },
        { role: 'AGENT', permissions: { clients: { view: true, create: true, edit: true, delete: false }, applications: { view: true, create: true, edit: true, delete: false }, tasks: { view: true, create: true, edit: true, delete: false }, kanban: { view: true, edit: true }, leads: { view: true, create: true, edit: true, delete: false }, documents: { view: true, upload: true, delete: false }, trustLedger: { view: false, edit: false }, employees: { view: true, manage: false }, traceHistory: { view: false }, settings: { view: false, edit: false }, colleges: { view: true, manage: false }, oshc: { view: true, manage: false }, sponsors: { view: true, create: true, edit: true, delete: false }, sendDocuments: true, sendAdvice: true } },
        { role: 'SUPPORT', permissions: { clients: { view: true, create: false, edit: true, delete: false }, applications: { view: true, create: false, edit: true, delete: false }, tasks: { view: true, create: true, edit: true, delete: false }, kanban: { view: true, edit: true }, leads: { view: true, create: true, edit: true, delete: false }, documents: { view: true, upload: true, delete: false }, trustLedger: { view: false, edit: false }, employees: { view: false, manage: false }, traceHistory: { view: false }, settings: { view: false, edit: false }, colleges: { view: true, manage: false }, oshc: { view: true, manage: false }, sponsors: { view: true, create: false, edit: true, delete: false }, sendDocuments: true, sendAdvice: false } },
      ],
    });

    const user = await User.create({ email, password, role: 'CONSULTANCY_ADMIN', profile: { firstName, lastName, consultancyId: consultancy._id } });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'orivisa-secret-key-change-in-production', { expiresIn: '7d' });
    return { user: { id: user._id, _id: user._id, email: user.email, role: user.role, profile: user.profile }, token, consultancy: { id: consultancy._id, name: consultancy.name } };
  }

  static async createConsultancy(data) {
    return Consultancy.create(data);
  }

  static async updateOwnConsultancy(cid, updateData) {
    if (Array.isArray(updateData.emailProfiles) && updateData.emailProfiles.length > 0) {
      const existing = await Consultancy.findById(cid).select('emailProfiles').lean();
      const existingProfiles = existing?.emailProfiles || [];
      updateData.emailProfiles = updateData.emailProfiles.map((p) => {
        if (p._id && (!p.pass || String(p.pass).trim() === '' || p.pass === '••••••••')) {
          const old = existingProfiles.find((ep) => String(ep._id) === String(p._id));
          if (old?.pass) return { ...p, pass: old.pass };
        }
        return p;
      });
    }
    const c = await Consultancy.findByIdAndUpdate(cid, updateData, { new: true });
    if (!c) throw Object.assign(new Error('Not found'), { status: 404 });
    return c;
  }

  static async updateConsultancyById(id, updateData) {
    const c = await Consultancy.findByIdAndUpdate(id, updateData, { new: true });
    if (!c) throw Object.assign(new Error('Not found'), { status: 404 });
    return c;
  }

  static async deleteConsultancy(id) {
    const c = await Consultancy.findByIdAndDelete(id);
    if (!c) throw Object.assign(new Error('Not found'), { status: 404 });
    return { deleted: true };
  }
}
