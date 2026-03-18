import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { authenticate, requireRole } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { EducationController } from '../shared/controllers/education.controller.js';
import * as schemas from '../shared/schemas/education.schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `university-logo-${Date.now()}-${(file.originalname || '').replace(/[^a-zA-Z0-9.-]/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB

const router = express.Router();

// University partner: Get own university + courses
router.get('/me', authenticate, requireRole('UNIVERSITY_PARTNER'), asyncHandler(EducationController.getUniversityMe));

// University partner: Update own university
router.patch('/me', authenticate, requireRole('UNIVERSITY_PARTNER'), asyncHandler(EducationController.updateUniversityMe));

// University partner: Upload logo
router.post('/me/logo', authenticate, requireRole('UNIVERSITY_PARTNER'), upload.single('file'), asyncHandler(EducationController.uploadLogoMe));

// Public: Get all active universities
router.get('/', asyncHandler(EducationController.getUniversities));

// Admin: Get all universities (even inactive)
router.get('/admin', authenticate, requireRole('SUPER_ADMIN'), asyncHandler(EducationController.getUniversities));

// Admin: Get single university
router.get('/:id', authenticate, requireRole('SUPER_ADMIN'), asyncHandler(EducationController.getUniversityById));

// Admin: Create University
router.post('/', authenticate, requireRole('SUPER_ADMIN'), validate(schemas.createUniversitySchema), asyncHandler(EducationController.createUniversity));

// Admin: Update University
router.patch('/:id', authenticate, requireRole('SUPER_ADMIN'), validate(schemas.updateUniversitySchema), asyncHandler(EducationController.updateUniversity));

// Public: Get courses for a university
router.get('/:id/courses', asyncHandler(EducationController.getCoursesByUniversity));

// Admin: Get all courses for a uni
router.get('/:id/courses/admin', authenticate, requireRole('SUPER_ADMIN'), asyncHandler(EducationController.getCoursesByUniversity));

// Admin or University partner: Create Course (partner must own the university)
router.post('/:id/courses', authenticate, requireRole('SUPER_ADMIN', 'UNIVERSITY_PARTNER'), validate(schemas.createCourseSchema), asyncHandler(EducationController.createCourse));

// Admin or University partner: Update Course
router.patch('/courses/:courseId', authenticate, requireRole('SUPER_ADMIN', 'UNIVERSITY_PARTNER'), validate(schemas.updateCourseSchema), asyncHandler(EducationController.updateCourse));

export default router;
