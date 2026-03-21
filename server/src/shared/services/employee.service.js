import User from '../../shared/models/User.js';
import AuditLog from '../../shared/models/AuditLog.js';
import { logAudit } from '../../shared/utils/audit.js';

export class EmployeeService {
  static async getJobSheet(empId, user) {
    const cid = user.profile?.consultancyId || user._id;
    const canView = user.role === 'SUPER_ADMIN' || user.role === 'CONSULTANCY_ADMIN' || user.role === 'MANAGER' ||
      (user.role === 'AGENT' && user._id.toString() === empId);
    if (!canView) throw Object.assign(new Error('Not authorized'), { status: 403 });

    const filter = user.role === 'SUPER_ADMIN' ? {} : { consultancyId: cid };
    filter.assignedAgentId = empId;
    return AuditLog.find(filter)
      .populate('changedBy', 'profile')
      .populate('assignedAgentId', 'profile')
      .sort({ changedAt: -1 })
      .limit(200);
  }

  static async getAll(user, queryCid) {
    const cid = user.profile?.consultancyId || user._id;
    let filter = user.role === 'SUPER_ADMIN' ? {} : { 'profile.consultancyId': cid };
    if (user.role === 'SUPER_ADMIN' && queryCid) {
      filter = { 'profile.consultancyId': queryCid };
    }
    return User.find({ ...filter, role: { $in: ['CONSULTANCY_ADMIN', 'MANAGER', 'AGENT'] } })
      .select('-password')
      .populate('profile.consultancyId', 'name');
  }

  static async getById(id) {
    const employee = await User.findById(id).select('-password');
    if (!employee) throw Object.assign(new Error('Not found'), { status: 404 });
    return employee;
  }

  static async create(data, user) {
    const cid = user.profile?.consultancyId || user._id;
    const { email, password, role, profile } = data;
    
    if (await User.findOne({ email })) throw Object.assign(new Error('Email already exists'), { status: 400 });
    
    const employee = await User.create({
      email,
      password: password || 'temp123',
      role: role || 'AGENT',
      profile: { ...profile, consultancyId: cid },
      mustChangePassword: !password,
    });

    await logAudit(cid, 'User', employee._id, 'CREATE', user._id, {
      description: `Employee ${employee.profile?.firstName} ${employee.profile?.lastName} added`,
    });

    return { id: employee._id, email: employee.email, role: employee.role, profile: employee.profile };
  }

  static async update(id, data, user) {
    const target = await User.findById(id);
    if (!target) throw Object.assign(new Error('Not found'), { status: 404 });

    const cid = user.profile?.consultancyId || user._id;
    const canEdit = user.role === 'SUPER_ADMIN' || user.role === 'CONSULTANCY_ADMIN' || user.role === 'MANAGER' ||
      (user.role === 'AGENT' && id === user._id.toString());
    if (!canEdit) throw Object.assign(new Error('Not authorized'), { status: 403 });

    const employee = await User.findByIdAndUpdate(id, data, { new: true }).select('-password');
    await logAudit(cid, 'User', employee._id, 'UPDATE', user._id, {
      description: `Employee ${employee.profile?.firstName} ${employee.profile?.lastName} updated`,
    });
    return employee;
  }

  static async delete(id, user) {
    const target = await User.findById(id);
    if (!target) throw Object.assign(new Error('Not found'), { status: 404 });

    const cid = user.profile?.consultancyId || user._id;
    if (user.role === 'AGENT') throw Object.assign(new Error('Only admin can delete employees'), { status: 403 });

    await logAudit(cid, 'User', target._id, 'DELETE', user._id, {
      description: `Employee ${target.profile?.firstName} ${target.profile?.lastName} removed`,
    });
    await User.findByIdAndUpdate(id, { isActive: false });
    return { success: true };
  }
}
