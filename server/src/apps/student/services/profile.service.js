import User from '../../../shared/models/User.js';
import Client from '../../../shared/models/Client.js';
import mongoose from 'mongoose';

export class StudentProfileService {
  static async getOrCreateClient(userId, userProfile) {
    let client = await Client.findOne({ userId });
    if (!client) {
      const STUDENT_OWNED_CONSULTANCY = new mongoose.Types.ObjectId('000000000000000000000000');
      const safeFirstName = userProfile?.firstName?.trim() || 'Student';
      const safeLastName = userProfile?.lastName?.trim() || 'User';
      const safeEmail = userProfile?.email?.trim() || `${userId}@orivisa.local`;
      
      client = await Client.create({
        userId,
        consultancyId: STUDENT_OWNED_CONSULTANCY,
        profile: {
          firstName: safeFirstName,
          lastName: safeLastName,
          email: safeEmail,
          phone: userProfile?.phone || '',
        },
      });
    } else {
      const patch = {};
      if (userProfile?.firstName && !client.profile?.firstName) patch['profile.firstName'] = userProfile.firstName;
      if (userProfile?.lastName && !client.profile?.lastName) patch['profile.lastName'] = userProfile.lastName;
      if (userProfile?.phone && !client.profile?.phone) patch['profile.phone'] = userProfile.phone;
      if (userProfile?.email && (!client.profile?.email || client.profile.email !== userProfile.email)) patch['profile.email'] = userProfile.email;
      
      if (Object.keys(patch).length) {
        client = await Client.findByIdAndUpdate(client._id, { $set: patch }, { new: true });
      }
    }
    return client;
  }

  static async getProfile(userId) {
    const user = await User.findById(userId).select('-password');
    const baseProfile = { ...(user?.profile || {}), email: user?.email || user?.profile?.email || '' };
    const client = await this.getOrCreateClient(userId, baseProfile);
    return { user, client };
  }

  static async updateProfile(userId, data) {
    const update = {};
    if (data.firstName !== undefined) update['profile.firstName'] = data.firstName;
    if (data.lastName !== undefined) update['profile.lastName'] = data.lastName;
    if (data.phone !== undefined) update['profile.phone'] = data.phone;

    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true }).select('-password');
    const baseProfile = { ...(user?.profile || {}), email: user?.email || user?.profile?.email || '' };
    const client = await this.getOrCreateClient(userId, baseProfile);

    const clientUpdate = {};
    const pFields = [
      'firstName', 'lastName', 'phone', 'dob', 'gender', 'nationality', 'countryOfBirth',
      'maritalStatus', 'passportNumber', 'passportExpiry', 'passportCountry', 'address',
      'businessName', 'abn', 'gstRegistered'
    ];
    
    pFields.forEach(f => {
      if (data[f] !== undefined) {
        if (f === 'dob' || f === 'passportExpiry') clientUpdate[`profile.${f}`] = data[f] ? new Date(data[f]) : null;
        else clientUpdate[`profile.${f}`] = data[f];
      }
    });
    if (user?.email) clientUpdate['profile.email'] = user.email;

    const updatedClient = await Client.findByIdAndUpdate(client._id, { $set: clientUpdate }, { new: true });
    return { user, client: updatedClient };
  }

  static async updateAvatar(userId, filename) {
    const fileUrl = `/uploads/${filename}`;
    const user = await User.findByIdAndUpdate(userId, { 'profile.avatar': fileUrl }, { new: true }).select('-password');
    return { user, avatarUrl: fileUrl };
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (currentPassword && !(await user.comparePassword(currentPassword))) {
      throw Object.assign(new Error('Current password is incorrect'), { status: 401 });
    }
    user.password = newPassword;
    await user.save();
    return { success: true };
  }

  static async updateStatement(userId, initialStatement) {
    const client = await Client.findOneAndUpdate({ userId }, { $set: { initialStatement } }, { new: true });
    return client;
  }

  // Family Members
  static async getFamilyMembers(userId) {
    const client = await Client.findOne({ userId }).select('familyMembers');
    return client?.familyMembers || [];
  }

  static async addFamilyMember(userId, data) {
    const entry = { ...data };
    if (data.dob) entry.dob = new Date(data.dob);
    if (data.passportExpiry) entry.passportExpiry = new Date(data.passportExpiry);
    
    const client = await Client.findOneAndUpdate({ userId }, { $push: { familyMembers: entry } }, { new: true });
    return client.familyMembers;
  }

  static async updateFamilyMember(userId, memberId, data) {
    const client = await Client.findOne({ userId });
    const member = client.familyMembers.id(memberId);
    if (!member) throw Object.assign(new Error('Family member not found'), { status: 404 });
    
    Object.assign(member, data);
    if (data.dob) member.dob = new Date(data.dob);
    if (data.passportExpiry) member.passportExpiry = new Date(data.passportExpiry);
    
    await client.save();
    return client.familyMembers;
  }

  static async deleteFamilyMember(userId, memberId) {
    const client = await Client.findOne({ userId });
    client.familyMembers = client.familyMembers.filter(m => m._id.toString() !== memberId);
    await client.save();
    return client.familyMembers;
  }

  // Addresses
  static async getAddresses(userId) {
    const client = await Client.findOne({ userId }).select('previousAddresses profile');
    return {
      current: client?.profile?.address || null,
      previous: client?.previousAddresses || [],
    };
  }

  static async updateCurrentAddress(userId, address) {
    const client = await Client.findOneAndUpdate({ userId }, { $set: { 'profile.address': address } }, { new: true });
    return { current: client.profile?.address, previous: client.previousAddresses };
  }

  static async addPreviousAddress(userId, data) {
    const entry = { ...data };
    if (data.from) entry.from = new Date(data.from);
    if (data.to) entry.to = new Date(data.to);
    
    const client = await Client.findOneAndUpdate({ userId }, { $push: { previousAddresses: entry } }, { new: true });
    return { current: client.profile?.address, previous: client.previousAddresses };
  }

  static async updatePreviousAddress(userId, entryId, data) {
    const client = await Client.findOne({ userId });
    const entry = client.previousAddresses.id(entryId);
    if (!entry) throw Object.assign(new Error('Address not found'), { status: 404 });
    
    Object.assign(entry, data);
    if (data.from) entry.from = new Date(data.from);
    if (data.to) entry.to = new Date(data.to);
    
    await client.save();
    return { current: client.profile?.address, previous: client.previousAddresses };
  }

  static async deletePreviousAddress(userId, entryId) {
    const client = await Client.findOne({ userId });
    client.previousAddresses = client.previousAddresses.filter(e => e._id.toString() !== entryId);
    await client.save();
    return { current: client.profile?.address, previous: client.previousAddresses };
  }

  // Notes
  static async getNotes(userId) {
    const client = await Client.findOne({ userId }).select('studentNotes initialStatement');
    return {
      notes: client?.studentNotes || [],
      initialStatement: client?.initialStatement || '',
    };
  }

  static async addNote(userId, data) {
    const note = { ...data, addedAt: new Date(), isPrivate: data.isPrivate !== false };
    const client = await Client.findOneAndUpdate({ userId }, { $push: { studentNotes: note } }, { new: true });
    return client.studentNotes;
  }

  static async updateNote(userId, noteId, data) {
    const client = await Client.findOne({ userId });
    const note = client.studentNotes.id(noteId);
    if (!note) throw Object.assign(new Error('Note not found'), { status: 404 });
    
    Object.assign(note, data);
    note.editedAt = new Date();
    await client.save();
    return client.studentNotes;
  }

  static async deleteNote(userId, noteId) {
    const client = await Client.findOne({ userId });
    client.studentNotes = client.studentNotes.filter(n => n._id.toString() !== noteId);
    await client.save();
    return client.studentNotes;
  }
}
