import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import University from '../models/University.js';
import Course from '../models/Course.js';

const router = express.Router();

// Public: Get all active universities
router.get('/', async (req, res) => {
  try {
    const unis = await University.find({ isActive: true }).sort('name');
    res.json(unis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get all universities (even inactive)
router.get('/admin', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const unis = await University.find().sort('name');
    res.json(unis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create University
router.post('/', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const uni = await University.create(req.body);
    res.status(201).json(uni);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: Update University
router.patch('/:id', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const uni = await University.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!uni) return res.status(404).json({ error: 'Not found' });
    res.json(uni);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Public: Get courses for a university
router.get('/:id/courses', async (req, res) => {
  try {
    const courses = await Course.find({ universityId: req.params.id, isActive: true }).sort('name');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get all courses for a uni
router.get('/:id/courses/admin', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const courses = await Course.find({ universityId: req.params.id }).sort('name');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create Course
router.post('/:id/courses', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const course = await Course.create({ ...req.body, universityId: req.params.id });
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: Update Course
router.patch('/courses/:courseId', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, { new: true });
    if (!course) return res.status(404).json({ error: 'Not found' });
    res.json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
