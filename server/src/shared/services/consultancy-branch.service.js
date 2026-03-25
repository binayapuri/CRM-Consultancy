import ConsultancyBranch from '../models/ConsultancyBranch.js';

const getConsultancyId = (user) => user.profile?.consultancyId || null;

export class ConsultancyBranchService {
  static async list(user, queryConsultancyId) {
    if (user.role === 'SUPER_ADMIN' && queryConsultancyId) {
      return ConsultancyBranch.find({ consultancyId: queryConsultancyId }).sort({ name: 1 }).lean();
    }
    const cid = getConsultancyId(user);
    if (!cid && user.role !== 'SUPER_ADMIN') throw Object.assign(new Error('No consultancy'), { status: 400 });
    const q = user.role === 'SUPER_ADMIN' ? {} : { consultancyId: cid };
    return ConsultancyBranch.find(q).sort({ name: 1 }).lean();
  }

  static async create(user, body) {
    const cid = getConsultancyId(user);
    if (!cid) throw Object.assign(new Error('No consultancy'), { status: 400 });
    if (user.role !== 'CONSULTANCY_ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw Object.assign(new Error('Only consultancy admin can manage branches'), { status: 403 });
    }
    return ConsultancyBranch.create({
      consultancyId: cid,
      name: String(body.name || '').trim(),
      code: String(body.code || '').trim(),
      address: body.address || '',
      phone: body.phone || '',
      isActive: body.isActive !== false,
    });
  }

  static async update(user, id, body) {
    const row = await ConsultancyBranch.findById(id);
    if (!row) throw Object.assign(new Error('Branch not found'), { status: 404 });
    const cid = getConsultancyId(user);
    if (user.role !== 'SUPER_ADMIN' && String(row.consultancyId) !== String(cid)) {
      throw Object.assign(new Error('Not authorized'), { status: 403 });
    }
    if (user.role !== 'CONSULTANCY_ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw Object.assign(new Error('Only consultancy admin can update branches'), { status: 403 });
    }
    if (body.name !== undefined) row.name = String(body.name).trim();
    if (body.code !== undefined) row.code = String(body.code || '').trim();
    if (body.address !== undefined) row.address = body.address;
    if (body.phone !== undefined) row.phone = body.phone;
    if (body.isActive !== undefined) row.isActive = !!body.isActive;
    await row.save();
    return row;
  }
}
