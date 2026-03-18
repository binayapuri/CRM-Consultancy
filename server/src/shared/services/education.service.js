import College from '../../shared/models/College.js';
import University from '../../shared/models/University.js';
import Course from '../../shared/models/Course.js';

export class EducationService {
  // --- Colleges ---
  static async getColleges(user, query) {
    const { q, type, state, city, feeMin, feeMax, consultancyId } = query;
    const filter = {};
    const andParts = [];
    
    if (user.role === 'SUPER_ADMIN' && consultancyId) {
      andParts.push({ $or: [{ consultancyId }, { consultancyIds: consultancyId }] });
    } else if (user.role !== 'SUPER_ADMIN') {
      const cid = user.profile?.consultancyId || user._id;
      andParts.push({ $or: [{ consultancyId: cid }, { consultancyIds: cid }] });
    }
    
    if (q) andParts.push({ $or: [{ name: new RegExp(q, 'i') }, { cricosCode: new RegExp(q, 'i') }] });
    if (andParts.length) filter.$and = andParts;
    if (type) filter.type = type;
    if (state) filter['location.state'] = new RegExp(String(state), 'i');
    if (city) filter['location.city'] = new RegExp(String(city), 'i');
    
    if (feeMin || feeMax) {
      const feeQ = {};
      if (feeMin) feeQ.$gte = parseFloat(feeMin);
      if (feeMax) feeQ.$lte = parseFloat(feeMax);
      if (Object.keys(feeQ).length) filter['courses.feePerYear'] = feeQ;
    }
    
    return College.find(filter).limit(100).sort({ name: 1 });
  }

  static async compareColleges(idsStr) {
    const ids = (idsStr || '').split(',').filter(Boolean).slice(0, 5);
    if (!ids.length) return [];
    return College.find({ _id: { $in: ids } });
  }

  static async createCollege(data, user) {
    const cid = user.profile?.consultancyId || user._id;
    return College.create({ ...data, consultancyId: cid });
  }

  static async getCollegeById(id) {
    const college = await College.findById(id);
    if (!college) throw Object.assign(new Error('Not found'), { status: 404 });
    return college;
  }

  static async updateCollege(id, data) {
    const college = await College.findByIdAndUpdate(id, data, { new: true });
    if (!college) throw Object.assign(new Error('Not found'), { status: 404 });
    return college;
  }

  static async deleteCollege(id) {
    const college = await College.findByIdAndDelete(id);
    if (!college) throw Object.assign(new Error('Not found'), { status: 404 });
    return { deleted: true };
  }

  // --- Universities ---
  static async getUniversities(isAdmin) {
    const filter = isAdmin ? {} : { isActive: true };
    return University.find(filter).sort('name');
  }

  static async createUniversity(data) {
    return University.create(data);
  }

  static async updateUniversity(id, data) {
    const uni = await University.findByIdAndUpdate(id, data, { new: true });
    if (!uni) throw Object.assign(new Error('Not found'), { status: 404 });
    return uni;
  }

  // --- Courses ---
  static async getCoursesByUniversity(universityId, isAdmin) {
    const filter = { universityId };
    if (!isAdmin) filter.isActive = true;
    return Course.find(filter).sort('name');
  }

  static async getCourseById(courseId) {
    return Course.findById(courseId);
  }

  static async createCourse(universityId, data) {
    return Course.create({ ...data, universityId });
  }

  static async updateCourse(courseId, data) {
    const course = await Course.findByIdAndUpdate(courseId, data, { new: true });
    if (!course) throw Object.assign(new Error('Not found'), { status: 404 });
    return course;
  }

  static async getUniversityForPartner(user) {
    const universityId = user?.profile?.universityId;
    if (!universityId) throw Object.assign(new Error('No university assigned'), { status: 404 });
    const uni = await University.findById(universityId);
    if (!uni) throw Object.assign(new Error('University not found'), { status: 404 });
    return uni;
  }

  static async updateUniversityForPartner(user, data) {
    const universityId = user?.profile?.universityId;
    if (!universityId) throw Object.assign(new Error('No university assigned'), { status: 404 });
    const uni = await University.findByIdAndUpdate(universityId, data, { new: true });
    if (!uni) throw Object.assign(new Error('University not found'), { status: 404 });
    return uni;
  }
}
