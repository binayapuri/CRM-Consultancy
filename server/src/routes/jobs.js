import express from 'express';
import { authenticate, authorize, requireRole } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { JobController } from '../shared/controllers/job.controller.js';
import * as schemas from '../shared/schemas/job.schema.js';

const router = express.Router();

// Get active jobs, sorted by ANZSCO match if student
router.get('/', authenticate, asyncHandler(JobController.getActiveJobs));

// Employer Dashboard: Get Jobs + Applications
router.get('/employer/dashboard', authenticate, requireRole('EMPLOYER', 'SUPER_ADMIN'), asyncHandler(JobController.getEmployerDashboard));

// update application status
router.patch('/applications/:id/status', authenticate, requireRole('EMPLOYER', 'SUPER_ADMIN'), validate(schemas.updateApplicationStatusSchema), asyncHandler(JobController.updateApplicationStatus));

// Student: Get my applications
router.get('/my-applications', authenticate, requireRole('STUDENT'), asyncHandler(JobController.getMyApplications));

// Student: Apply to a job
router.post('/:id/apply', authenticate, requireRole('STUDENT'), validate(schemas.applyJobSchema), asyncHandler(JobController.applyToJob));

// Get single job
router.get('/:id', authenticate, asyncHandler(JobController.getJobById));

// Create job (Admin/Agent/Employer)
router.post('/', authenticate, authorize('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'AGENT', 'SPONSOR', 'EMPLOYER'), validate(schemas.createJobSchema), asyncHandler(JobController.createJob));

export default router;
