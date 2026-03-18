import OfferLetterApplication from '../../shared/models/OfferLetterApplication.js';
import OSHC from '../../shared/models/OSHC.js';
import Course from '../../shared/models/Course.js';

export class OfferService {
  // --- Offer Letters ---
  static async getMyApplications(studentId) {
    return OfferLetterApplication.find({ studentId })
      .populate('universityId', 'name logoUrl')
      .populate('courseId', 'name level duration tuitionFee')
      .sort({ createdAt: -1 });
  }

  static async applyForCourse(studentId, data) {
    const { courseId, documents, studentNotes } = data;
    const course = await Course.findById(courseId);
    if (!course) throw Object.assign(new Error('Course not found'), { status: 404 });
    
    const existing = await OfferLetterApplication.findOne({ studentId, courseId });
    if (existing) throw Object.assign(new Error('Already applied for this course'), { status: 400 });

    return OfferLetterApplication.create({
      studentId,
      courseId,
      universityId: course.universityId,
      documents,
      studentNotes
    });
  }

  static async manageApplications(user) {
    const filter = user.role === 'SUPER_ADMIN' ? {} : { universityId: user.profile?.universityId };
    if (!filter.universityId && user.role !== 'SUPER_ADMIN') {
      throw Object.assign(new Error('No university linked to your account'), { status: 403 });
    }
    return OfferLetterApplication.find(filter)
      .populate('studentId', 'profile.firstName profile.lastName email')
      .populate('courseId', 'name level')
      .populate('universityId', 'name')
      .sort({ createdAt: -1 });
  }

  static async updateStatus(id, data) {
    const { status, universityNotes } = data;
    const app = await OfferLetterApplication.findByIdAndUpdate(id, { status, universityNotes }, { new: true });
    if (!app) throw Object.assign(new Error('Not found'), { status: 404 });
    return app;
  }

  // --- OSHC ---
  static async getOshcProviders(user, query) {
    const { coverageType, applicationType, consultancyId } = query;
    const cid = user.profile?.consultancyId || user._id;
    const conditions = [];

    if (user.role === 'SUPER_ADMIN' && consultancyId) {
      conditions.push({ $or: [{ consultancyId }, { consultancyIds: consultancyId }] });
    } else if (user.role !== 'SUPER_ADMIN') {
      conditions.push({ $or: [{ consultancyId: cid }, { consultancyIds: cid }, { consultancyId: null }, { consultancyId: { $exists: false } }] });
    }

    if (coverageType) conditions.push({ coverageType });
    if (applicationType) conditions.push({ $or: [{ applicationType }, { applicationType: 'BOTH' }] });
    
    const filter = conditions.length ? { $and: conditions } : {};
    return OSHC.find(filter).sort({ provider: 1, pricePerMonth: 1 });
  }

  static async createOshc(data, user) {
    const cid = user.profile?.consultancyId || user._id;
    return OSHC.create({ ...data, consultancyId: cid });
  }

  static async updateOshc(id, data) {
    const oshc = await OSHC.findByIdAndUpdate(id, data, { new: true });
    if (!oshc) throw Object.assign(new Error('Not found'), { status: 404 });
    return oshc;
  }

  static async deleteOshc(id) {
    const oshc = await OSHC.findByIdAndDelete(id);
    if (!oshc) throw Object.assign(new Error('Not found'), { status: 404 });
    return { deleted: true };
  }
}
