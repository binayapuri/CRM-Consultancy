import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Sponsor from '../../shared/models/Sponsor.js';
import User from '../../shared/models/User.js';
import { sendEmail } from '../../shared/utils/email.js';

const JWT_SECRET = process.env.JWT_SECRET || 'orivisa-secret-key-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export class SponsorService {
  static async getMySponsorRecord(userId) {
    const sponsor = await Sponsor.findOne({ userId }).populate('consultancyId', 'name displayName');
    if (!sponsor) throw Object.assign(new Error('No sponsor profile linked'), { status: 404 });
    return sponsor;
  }

  static async getAll(user, queryCid) {
    const cid = user.profile?.consultancyId || user._id;
    let filter = user.role === 'SUPER_ADMIN' ? {} : { consultancyId: cid };
    if (user.role === 'SUPER_ADMIN' && queryCid) filter = { consultancyId: queryCid };
    return Sponsor.find(filter).sort({ companyName: 1 });
  }

  static async create(data, user) {
    const cid = user.profile?.consultancyId || user._id;
    if (!cid) throw Object.assign(new Error('No consultancy assigned'), { status: 400 });
    return Sponsor.create({ ...data, consultancyId: cid });
  }

  static async getById(id, user) {
    const sponsor = await Sponsor.findById(id);
    if (!sponsor) throw Object.assign(new Error('Not found'), { status: 404 });
    
    const cid = user.profile?.consultancyId || user._id;
    if (user.role !== 'SUPER_ADMIN' && sponsor.consultancyId?.toString() !== cid?.toString()) {
      throw Object.assign(new Error('Not authorized'), { status: 403 });
    }
    return sponsor;
  }

  static async update(id, data, user) {
    const sponsor = await Sponsor.findById(id);
    if (!sponsor) throw Object.assign(new Error('Not found'), { status: 404 });
    
    const cid = user.profile?.consultancyId || user._id;
    if (user.role !== 'SUPER_ADMIN' && sponsor.consultancyId?.toString() !== cid?.toString()) {
      throw Object.assign(new Error('Not authorized'), { status: 403 });
    }
    return Sponsor.findByIdAndUpdate(id, data, { new: true });
  }

  static async delete(id, user) {
    const sponsor = await Sponsor.findById(id);
    if (!sponsor) throw Object.assign(new Error('Not found'), { status: 404 });
    
    const cid = user.profile?.consultancyId || user._id;
    if (user.role !== 'SUPER_ADMIN' && sponsor.consultancyId?.toString() !== cid?.toString()) {
      throw Object.assign(new Error('Not authorized'), { status: 403 });
    }
    await Sponsor.findByIdAndDelete(id);
    return { deleted: true };
  }

  static async invitePortal(id, user) {
    const sponsor = await Sponsor.findById(id);
    if (!sponsor) throw Object.assign(new Error('Not found'), { status: 404 });
    
    const cid = user.profile?.consultancyId || user._id;
    if (user.role !== 'SUPER_ADMIN' && sponsor.consultancyId?.toString() !== cid?.toString()) {
      throw Object.assign(new Error('Not authorized'), { status: 403 });
    }

    const email = sponsor.contactPerson?.email || sponsor.email;
    if (!email) throw Object.assign(new Error('Sponsor must have contact email'), { status: 400 });

    let portalUser = await User.findOne({ email });
    if (portalUser) {
      if (portalUser.role === 'SPONSOR' && portalUser.sponsorId?.toString() === sponsor._id.toString()) {
        throw Object.assign(new Error('Sponsor already has portal access'), { status: 400 });
      }
      portalUser.role = 'SPONSOR';
      portalUser.sponsorId = sponsor._id;
      portalUser.profile = portalUser.profile || {};
      portalUser.profile.firstName = sponsor.contactPerson?.firstName || portalUser.profile?.firstName;
      portalUser.profile.lastName = sponsor.contactPerson?.lastName || portalUser.profile?.lastName;
      await portalUser.save();
    } else {
      portalUser = await User.create({
        email,
        password: crypto.randomBytes(16).toString('hex'),
        role: 'SPONSOR',
        sponsorId: sponsor._id,
        profile: {
          firstName: sponsor.contactPerson?.firstName,
          lastName: sponsor.contactPerson?.lastName,
        },
      });
    }

    sponsor.userId = portalUser._id;
    await sponsor.save();

    const token = jwt.sign({ userId: portalUser._id }, JWT_SECRET, { expiresIn: '7d' });
    const loginUrl = `${FRONTEND_URL}/auth/callback?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'ORIVISA - Your Sponsor Portal Access',
      html: `<p>Your sponsor portal is ready for ${sponsor.companyName}.</p><p><a href="${loginUrl}">Click here to sign in</a></p><p>Link valid for 7 days. You can reset your password after logging in.</p>`,
    });

    return { success: true, message: 'Invitation sent' };
  }
}
