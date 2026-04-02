import { EducationService } from '../services/education.service.js';

export class EducationController {
  static async getColleges(req, res) {
    const colleges = await EducationService.getColleges(req.user, req.query);
    res.json(colleges);
  }

  static async compareColleges(req, res) {
    const colleges = await EducationService.compareColleges(req.query.ids);
    res.json(colleges);
  }

  static async createCollege(req, res) {
    const college = await EducationService.createCollege(req.body, req.user);
    res.status(201).json(college);
  }

  static async getCollegeById(req, res) {
    const college = await EducationService.getCollegeById(req.params.id);
    res.json(college);
  }

  static async updateCollege(req, res) {
    const college = await EducationService.updateCollege(req.params.id, req.body);
    res.json(college);
  }

  static async deleteCollege(req, res) {
    const result = await EducationService.deleteCollege(req.params.id);
    res.json(result);
  }

  static async getUniversities(req, res) {
    const isAdmin = req.user?.role === 'SUPER_ADMIN'; // Optional auth in some cases, handling carefully
    const unis = await EducationService.getUniversities(isAdmin);
    res.json(unis);
  }

  static async getUniversityById(req, res) {
    const uni = await EducationService.getUniversityById(req.params.id);
    res.json(uni);
  }

  static async getOfferApplicationsByUniversity(req, res) {
    const apps = await EducationService.getOfferApplicationsByUniversity(req.params.id);
    res.json(apps);
  }

  static async createUniversity(req, res) {
    const uni = await EducationService.createUniversity(req.body);
    res.status(201).json(uni);
  }

  static async updateUniversity(req, res) {
    const uni = await EducationService.updateUniversity(req.params.id, req.body);
    res.json(uni);
  }

  static async deleteUniversity(req, res) {
    const result = await EducationService.deleteUniversity(req.params.id);
    res.json(result);
  }

  static async getCoursesByUniversity(req, res) {
    const isAdmin = req.user?.role === 'SUPER_ADMIN';
    const courses = await EducationService.getCoursesByUniversity(req.params.id, isAdmin);
    res.json(courses);
  }

  static async createCourse(req, res) {
    if (req.user?.role === 'UNIVERSITY_PARTNER') {
      const userUniId = req.user?.profile?.universityId?.toString();
      if (userUniId !== req.params.id) {
        return res.status(403).json({ error: 'You can only add courses to your own university' });
      }
    }
    const course = await EducationService.createCourse(req.params.id, req.body);
    res.status(201).json(course);
  }

  static async updateCourse(req, res) {
    if (req.user?.role === 'UNIVERSITY_PARTNER') {
      const existing = await EducationService.getCourseById(req.params.courseId);
      if (!existing) return res.status(404).json({ error: 'Course not found' });
      const userUniId = req.user?.profile?.universityId?.toString();
      if (userUniId !== existing.universityId?.toString()) {
        return res.status(403).json({ error: 'You can only update courses for your own university' });
      }
    }
    const course = await EducationService.updateCourse(req.params.courseId, req.body);
    res.json(course);
  }

  static async getUniversityMe(req, res) {
    const uni = await EducationService.getUniversityForPartner(req.user);
    const courses = await EducationService.getCoursesByUniversity(uni._id.toString(), true);
    res.json({ university: uni, courses });
  }

  static async updateUniversityMe(req, res) {
    const uni = await EducationService.updateUniversityForPartner(req.user, req.body);
    res.json(uni);
  }

  static async uploadLogoMe(req, res) {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileUrl = `/uploads/${req.file.filename}`;
    const uni = await EducationService.updateUniversityForPartner(req.user, { logoUrl: fileUrl });
    res.json(uni);
  }
}
