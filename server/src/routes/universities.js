import express from 'express';
import { authenticate, requireRole } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { EducationController } from '../shared/controllers/education.controller.js';
import * as schemas from '../shared/schemas/education.schema.js';

const router = express.Router();

// Public: Get all active universities
router.get('/', asyncHandler(EducationController.getUniversities));

// Admin: Get all universities (even inactive)
router.get('/admin', authenticate, requireRole('SUPER_ADMIN'), asyncHandler(EducationController.getUniversities));

// Admin: Create University
router.post('/', authenticate, requireRole('SUPER_ADMIN'), validate(schemas.createUniversitySchema), asyncHandler(EducationController.createUniversity));

// Admin: Update University
router.patch('/:id', authenticate, requireRole('SUPER_ADMIN'), validate(schemas.updateUniversitySchema), asyncHandler(EducationController.updateUniversity));

// Public: Get courses for a university
router.get('/:id/courses', asyncHandler(EducationController.getCoursesByUniversity));

// Admin: Get all courses for a uni
router.get('/:id/courses/admin', authenticate, requireRole('SUPER_ADMIN'), asyncHandler(EducationController.getCoursesByUniversity));

// Admin: Create Course
router.post('/:id/courses', authenticate, requireRole('SUPER_ADMIN'), validate(schemas.createCourseSchema), asyncHandler(EducationController.createCourse));

// Admin: Update Course
router.patch('/courses/:courseId', authenticate, requireRole('SUPER_ADMIN'), validate(schemas.updateCourseSchema), asyncHandler(EducationController.updateCourse));

export default router;
