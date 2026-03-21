import { v4 as uuidv4 } from 'uuid';
import TrustLedger from '../../shared/models/TrustLedger.js';

export class TrustService {
  static async getLedger(user, query) {
    let cid = user.profile?.consultancyId || user._id;
    if (user.role === 'SUPER_ADMIN' && query.consultancyId) cid = query.consultancyId;
    
    const { applicationId } = query;
    const filter = { consultancyId: cid };
    if (applicationId) filter.applicationId = applicationId;
    
    const entries = await TrustLedger.find(filter).sort({ createdAt: -1 });
    const balance = entries.reduce((acc, e) => acc + (e.direction === 'CREDIT' ? e.amount : -e.amount), 0);
    return { entries, balance };
  }

  static async createEntry(user, data) {
    const cid = user.profile?.consultancyId || user._id;
    const { amount, direction, applicationId, clientId, description, category } = data;
    
    const entries = await TrustLedger.find({ consultancyId: cid }).sort({ createdAt: -1 });
    const balance = entries.reduce((acc, e) => acc + (e.direction === 'CREDIT' ? e.amount : -e.amount), 0);
    const newBalance = balance + (direction === 'CREDIT' ? amount : -amount);
    
    return TrustLedger.create({
      consultancyId: cid,
      applicationId,
      clientId,
      transactionId: uuidv4(),
      amount,
      direction,
      balanceSnapshot: newBalance,
      description,
      category: category || 'Client Deposit',
      createdBy: user._id,
    });
  }

  static async updateEntry(id, user, data) {
    const cid = user.profile?.consultancyId || user._id;
    const entry = await TrustLedger.findOne({ _id: id, consultancyId: cid });
    if (!entry) throw Object.assign(new Error('Not found'), { status: 404 });
    
    const { description, category } = data;
    if (description !== undefined) entry.description = description;
    if (category !== undefined) entry.category = category;
    return entry.save();
  }

  static async deleteEntry(id, user) {
    const cid = user.profile?.consultancyId || user._id;
    const entry = await TrustLedger.findOneAndDelete({ _id: id, consultancyId: cid });
    if (!entry) throw Object.assign(new Error('Not found'), { status: 404 });
    return { deleted: true };
  }
}
