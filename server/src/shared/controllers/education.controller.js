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

  static async createUniversity(req, res) {
    const uni = await EducationService.createUniversity(req.body);
    res.status(201).json(uni);
  }

  static async updateUniversity(req, res) {
    const uni = await EducationService.updateUniversity(req.params.id, req.body);
    res.json(uni);
  }

  static async getCoursesByUniversity(req, res) {
    const isAdmin = req.user?.role === 'SUPER_ADMIN';
    const courses = await EducationService.getCoursesByUniversity(req.params.id, isAdmin);
    res.json(courses);
  }

  static async createCourse(req, res) {
    const course = await EducationService.createCourse(req.params.id, req.body);
    res.status(201).json(course);
  }

  static async updateCourse(req, res) {
    const course = await EducationService.updateCourse(req.params.courseId, req.body);
    res.json(course);
  }
}
