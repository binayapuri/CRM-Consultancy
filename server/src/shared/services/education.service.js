import College from '../../shared/models/College.js';
import University from '../../shared/models/University.js';
import Course from '../../shared/models/Course.js';
import OfferLetterApplication from '../../shared/models/OfferLetterApplication.js';
import User from '../../shared/models/User.js';

/** Best single annual fee in AUD: top-level tuitionFee or minimum branch fee. */
function effectiveAnnualFeeAUD(course) {
  if (course.tuitionFee != null && Number.isFinite(Number(course.tuitionFee))) {
    return Number(course.tuitionFee);
  }
  if (Array.isArray(course.fees) && course.fees.length) {
    const nums = course.fees.map((f) => Number(f.amount)).filter((n) => Number.isFinite(n));
    if (nums.length) return Math.min(...nums);
  }
  return null;
}

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

  static async getUniversityById(id) {
    const uni = await University.findById(id);
    if (!uni) throw Object.assign(new Error('University not found'), { status: 404 });
    return uni;
  }

  static async getOfferApplicationsByUniversity(universityId) {
    return OfferLetterApplication.find({ universityId })
      .populate('studentId', 'email profile')
      .populate('courseId', 'name level')
      .sort({ createdAt: -1 })
      .limit(500);
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

  /** Public catalog: active courses at active universities with filters. */
  static async getCourseCatalog(query) {
    const {
      q,
      level,
      feeMin,
      feeMax,
      state,
      prPathway,
      sort = 'updated',
      limit: limitStr,
    } = query;
    const limit = Math.min(Math.max(parseInt(String(limitStr || '120'), 10) || 120, 1), 500);

    const fm = feeMin ? Number(feeMin) : null;
    const fM = feeMax ? Number(feeMax) : null;
    const hasFeeRange = Number.isFinite(fm) || Number.isFinite(fM);
    const feeSort = sort === 'fee_asc' || sort === 'fee_desc';

    const filter = { isActive: true };

    if (level && ['CERTIFICATE', 'DIPLOMA', 'BACHELORS', 'MASTERS', 'PHD', 'OTHER'].includes(level)) {
      filter.level = level;
    }
    if (prPathway === '1' || prPathway === 'true') {
      filter.prPathwayPotential = true;
    }
    if (q && String(q).trim()) {
      const rx = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { faculty: rx }, { cricosCode: rx }];
    }

    if (state && String(state).trim()) {
      const st = String(state).trim();
      const rx = new RegExp(st.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const uniIds = await University.find({
        isActive: true,
        $or: [{ 'location.state': rx }, { 'branches.state': rx }],
      }).distinct('_id');
      filter.universityId = { $in: uniIds };
    }

    const fetchCap = hasFeeRange || feeSort ? 2000 : Math.min(limit * 3, 600);

    let rows = await Course.find(filter)
      .populate('universityId', 'name location branches logoUrl website partnerStatus isActive')
      .sort({ updatedAt: -1 })
      .limit(fetchCap)
      .lean();

    rows = rows.filter((c) => c.universityId && c.universityId.isActive !== false);

    if (hasFeeRange) {
      rows = rows.filter((c) => {
        const ef = effectiveAnnualFeeAUD(c);
        if (ef == null) return false;
        if (Number.isFinite(fm) && ef < fm) return false;
        if (Number.isFinite(fM) && ef > fM) return false;
        return true;
      });
    }

    if (sort === 'name') {
      rows.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    } else if (sort === 'uni') {
      rows.sort((a, b) => {
        const na = a.universityId?.name || '';
        const nb = b.universityId?.name || '';
        const u = String(na).localeCompare(String(nb));
        if (u !== 0) return u;
        return String(a.name || '').localeCompare(String(b.name || ''));
      });
    } else if (feeSort) {
      const dir = sort === 'fee_asc' ? 1 : -1;
      rows.sort((a, b) => {
        const ea = effectiveAnnualFeeAUD(a);
        const eb = effectiveAnnualFeeAUD(b);
        if (ea == null && eb == null) return 0;
        if (ea == null) return 1;
        if (eb == null) return -1;
        if (ea === eb) return String(a.name || '').localeCompare(String(b.name || ''));
        return (ea - eb) * dir;
      });
    } else {
      rows.sort((a, b) => {
        const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return tb - ta;
      });
    }

    return rows.slice(0, limit);
  }

  /** Side-by-side compare (max 4 courses). */
  static async compareCoursesByIds(idsStr) {
    const ids = (idsStr || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4);
    if (!ids.length) return [];
    const courses = await Course.find({ _id: { $in: ids }, isActive: true })
      .populate('universityId', 'name location branches logoUrl website partnerStatus cricosProviderCode')
      .lean();
    const order = new Map(ids.map((id, i) => [id, i]));
    return courses.sort((a, b) => (order.get(String(a._id)) ?? 0) - (order.get(String(b._id)) ?? 0));
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

  /** Super admin: permanently remove university, courses, and offer-app links; unlinks partner users. */
  static async deleteUniversity(id) {
    const uni = await University.findById(id);
    if (!uni) throw Object.assign(new Error('University not found'), { status: 404 });
    await OfferLetterApplication.deleteMany({ universityId: id });
    await Course.deleteMany({ universityId: id });
    await User.updateMany({ 'profile.universityId': id }, { $unset: { 'profile.universityId': 1 } });
    await University.findByIdAndDelete(id);
    return { success: true };
  }
}
