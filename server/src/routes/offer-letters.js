import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import OfferLetterApplication from '../models/OfferLetterApplication.js';
import Course from '../models/Course.js';
import University from '../models/University.js';

const router = express.Router();

// Student: Get their own applications
router.get('/my-applications', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const apps = await OfferLetterApplication.find({ studentId: req.user._id })
      .populate('universityId', 'name logoUrl')
      .populate('courseId', 'name level duration tuitionFee')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student: Apply for a course
router.post('/apply', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const { courseId, documents, studentNotes } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    
    // Check if already applied
    const existing = await OfferLetterApplication.findOne({ studentId: req.user._id, courseId });
    if (existing) return res.status(400).json({ error: 'Already applied for this course' });

    const app = await OfferLetterApplication.create({
      studentId: req.user._id,
      courseId,
      universityId: course.universityId,
      documents,
      studentNotes
    });
    res.status(201).json(app);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// University Partner / Super Admin: Get applications for their university (or all for Super Admin)
router.get('/manage', authenticate, requireRole('SUPER_ADMIN', 'UNIVERSITY_PARTNER'), async (req, res) => {
  try {
    const filter = req.user.role === 'SUPER_ADMIN' ? {} : { universityId: req.user.profile?.universityId };
    if (!filter.universityId && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'No university linked to your account' });
    }
    const apps = await OfferLetterApplication.find(filter)
      .populate('studentId', 'profile.firstName profile.lastName email')
      .populate('courseId', 'name level')
      .populate('universityId', 'name')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update application status
router.patch('/:id/status', authenticate, requireRole('SUPER_ADMIN', 'UNIVERSITY_PARTNER'), async (req, res) => {
  try {
    const { status, universityNotes } = req.body;
    const app = await OfferLetterApplication.findByIdAndUpdate(req.params.id, { status, universityNotes }, { new: true });
    if (!app) return res.status(404).json({ error: 'Not found' });
    res.json(app);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
