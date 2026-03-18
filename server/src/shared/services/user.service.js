import User from '../../shared/models/User.js';
import Consultancy from '../../shared/models/Consultancy.js';

export class UserService {
  static async createTestAccount(data) {
    const { email, password, role, profile, consultancyId } = data;
    if (await User.findOne({ email })) throw Object.assign(new Error('Email already exists'), { status: 400 });
    
    const needsConsultancy = ['AGENT', 'MANAGER', 'CONSULTANCY_ADMIN'].includes(role);
    let cid = consultancyId;
    if (needsConsultancy && !cid) {
      const first = await Consultancy.findOne();
      if (!first) throw Object.assign(new Error('No consultancy exists'), { status: 400 });
      cid = first._id;
    }
    
    const user = await User.create({
      email, password, role,
      profile: { ...profile, consultancyId: cid },
      isTestAccount: true,
    });
    return { id: user._id, email: user.email, role: user.role, profile: user.profile };
  }

  static async getAll(user, queryCid) {
    const filter = user.role === 'SUPER_ADMIN' ? {} : { 'profile.consultancyId': user.profile?.consultancyId };
    if (user.role === 'SUPER_ADMIN' && queryCid) filter['profile.consultancyId'] = queryCid;
    
    return User.find(filter).select('-password').populate('profile.consultancyId', 'name displayName');
  }

  static async getAgents(user) {
    const filter = user.role === 'SUPER_ADMIN' ? {} : { 'profile.consultancyId': user.profile?.consultancyId };
    return User.find({ ...filter, role: 'AGENT' }).select('-password');
  }

  static async update(id, data, currentUser) {
    const target = await User.findById(id);
    if (!target) throw Object.assign(new Error('User not found'), { status: 404 });
    
    if (currentUser.role === 'SUPER_ADMIN') {
      const { password, profile, role, isActive, isTestAccount, ...rest } = data;
      const update = { ...rest };
      if (profile) update.profile = { ...(target.profile?.toObject?.() || target.profile || {}), ...profile };
      if (role !== undefined) update.role = role;
      if (isActive !== undefined) update.isActive = isActive;
      if (isTestAccount !== undefined) update.isTestAccount = isTestAccount;
      
      let updatedUser = await User.findByIdAndUpdate(id, update, { new: true });
      if (password && updatedUser) {
        updatedUser.password = password;
        await updatedUser.save();
      }
      return User.findById(id).select('-password');
    }
    
    const cid = currentUser.profile?.consultancyId;
    if (!cid || target.profile?.consultancyId?.toString() !== cid?.toString()) {
      throw Object.assign(new Error('Can only edit users in your consultancy'), { status: 403 });
    }
    
    const { password, profile, role, ...rest } = data;
    const update = { ...rest };
    if (profile) update.profile = { ...(target.profile?.toObject?.() || target.profile || {}), ...profile };
    if (role && ['AGENT', 'MANAGER'].includes(role)) update.role = role;
    
    let updatedUser = await User.findByIdAndUpdate(id, update, { new: true });
    if (password && updatedUser) {
      updatedUser.password = password;
      await updatedUser.save();
    }
    return User.findById(id).select('-password');
  }

  static async delete(id, currentUser) {
    const user = await User.findById(id);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    if (user.role === 'SUPER_ADMIN') throw Object.assign(new Error('Cannot delete Super Admin'), { status: 403 });
    
    await User.findByIdAndUpdate(id, { isActive: false });
    return { success: true, deactivated: true };
  }
}
