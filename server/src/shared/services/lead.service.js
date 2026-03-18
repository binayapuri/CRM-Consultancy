import Lead from '../../shared/models/Lead.js';
import Consultancy from '../../shared/models/Consultancy.js';
import Client from '../../shared/models/Client.js';
import { logAudit } from '../../shared/utils/audit.js';

export class LeadService {
  static async getAll(user, queryCid) {
    const cid = user.profile?.consultancyId || user._id;
    let filter = user.role === 'SUPER_ADMIN' ? {} : { consultancyId: cid };
    if (user.role === 'SUPER_ADMIN' && queryCid) filter = { consultancyId: queryCid };
    return Lead.find(filter).populate('assignedTo', 'profile').sort({ createdAt: -1 });
  }

  static async getById(id) {
    const lead = await Lead.findById(id).populate('assignedTo', 'profile');
    if (!lead) throw Object.assign(new Error('Not found'), { status: 404 });
    return lead;
  }

  static async create(data, user) {
    const cid = user.role === 'SUPER_ADMIN' && data.consultancyId ? data.consultancyId : (user.profile?.consultancyId || user._id);
    const lead = await Lead.create({ ...data, consultancyId: cid });
    await logAudit(cid, 'Lead', lead._id, 'CREATE', user._id, { description: `Lead created: ${lead.profile?.firstName} ${lead.profile?.lastName}` });
    return lead;
  }

  static async update(id, data, user) {
    const cid = user.profile?.consultancyId || user._id;
    const filter = user.role === 'SUPER_ADMIN' ? { _id: id } : { _id: id, consultancyId: cid };
    const lead = await Lead.findOne(filter);
    if (!lead) throw Object.assign(new Error('Not found'), { status: 404 });

    const updated = await Lead.findByIdAndUpdate(id, data, { new: true }).populate('assignedTo', 'profile');
    await logAudit(lead.consultancyId, 'Lead', lead._id, 'UPDATE', user._id, { description: `Lead updated: ${updated.profile?.firstName} ${updated.profile?.lastName}` });
    return updated;
  }

  static async delete(id, user) {
    const cid = user.profile?.consultancyId || user._id;
    const filter = user.role === 'SUPER_ADMIN' ? { _id: id } : { _id: id, consultancyId: cid };
    const lead = await Lead.findOne(filter);
    if (!lead) throw Object.assign(new Error('Not found'), { status: 404 });

    await logAudit(lead.consultancyId, 'Lead', lead._id, 'DELETE', user._id, { description: `Lead deleted: ${lead.profile?.firstName} ${lead.profile?.lastName}` });
    await Lead.findByIdAndDelete(id);
    return { success: true };
  }

  static async convertToClient(id, user) {
    const cid = user.profile?.consultancyId || user._id;
    const lead = await Lead.findById(id);
    if (!lead) throw Object.assign(new Error('Lead not found'), { status: 404 });
    if (lead.consultancyId?.toString() !== cid?.toString() && user.role !== 'SUPER_ADMIN') {
      throw Object.assign(new Error('Not authorized'), { status: 403 });
    }

    const convCid = lead.consultancyId || cid;
    const client = await Client.create({
      consultancyId: convCid,
      leadId: lead._id,
      profile: {
        firstName: lead.profile?.firstName || 'Unknown',
        lastName: lead.profile?.lastName || 'Lead',
        email: lead.profile?.email || `lead-${lead._id}@temp.local`,
        phone: lead.profile?.phone,
        notes: lead.profile?.notes,
      },
      assignedAgentId: lead.assignedTo,
      status: 'ACTIVE',
    });

    await Lead.findByIdAndUpdate(lead._id, { status: 'CONVERTED', convertedToClientId: client._id });
    await logAudit(convCid, 'Lead', lead._id, 'UPDATE', user._id, { description: `Lead converted to client: ${client.profile?.firstName} ${client.profile?.lastName}`, metadata: { clientId: client._id } });
    return { client, lead };
  }

  static async publicEnquiry(data) {
    const { firstName, lastName, email, phone, interest, message, consultancyId } = data;
    let cid = consultancyId;
    if (!cid) {
      const first = await Consultancy.findOne({ verified: true }).select('_id');
      cid = first?._id;
    }
    if (!cid) throw Object.assign(new Error('No consultancy available'), { status: 400 });

    const lead = await Lead.create({
      consultancyId: cid,
      source: 'Website',
      status: 'NEW',
      profile: { firstName, lastName, email, phone, interest: interest || 'General Enquiry', notes: message },
    });
    return { success: true, message: 'Thank you! We will contact you soon.', leadId: lead._id };
  }
}
