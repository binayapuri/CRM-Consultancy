import express from 'express';
import { authenticate, authorize, requireRole } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { JobController } from '../shared/controllers/job.controller.js';
import * as schemas from '../shared/schemas/job.schema.js';

const router = express.Router();

// Public jobs - no auth (for landing, public /jobs page)
router.get('/public', asyncHandler(JobController.getPublicJobs));

// Get active jobs, sorted by ANZSCO match if student
router.get('/', authenticate, asyncHandler(JobController.getActiveJobs));

// Employer Dashboard: Get Jobs + Applications
router.get('/employer/dashboard', authenticate, requireRole('EMPLOYER', 'RECRUITER', 'SUPER_ADMIN'), asyncHandler(JobController.getEmployerDashboard));

// Recruiter employer profiles (multi-company management)
router.get('/recruiter/employers', authenticate, requireRole('RECRUITER', 'SUPER_ADMIN'), asyncHandler(JobController.listRecruiterEmployers));
router.post('/recruiter/employers', authenticate, requireRole('RECRUITER', 'SUPER_ADMIN'), asyncHandler(JobController.createRecruiterEmployer));
router.patch('/recruiter/employers/:id', authenticate, requireRole('RECRUITER', 'SUPER_ADMIN'), asyncHandler(JobController.updateRecruiterEmployer));
router.delete('/recruiter/employers/:id', authenticate, requireRole('RECRUITER', 'SUPER_ADMIN'), asyncHandler(JobController.deleteRecruiterEmployer));

// update application status
router.patch('/applications/:id/status', authenticate, requireRole('EMPLOYER', 'RECRUITER', 'SUPER_ADMIN'), validate(schemas.updateApplicationStatusSchema), asyncHandler(JobController.updateApplicationStatus));

// Student: Get my applications
router.get('/my-applications', authenticate, requireRole('STUDENT'), asyncHandler(JobController.getMyApplications));

// Student: Saved jobs
router.get('/saved', authenticate, requireRole('STUDENT'), asyncHandler(JobController.getSavedJobs));
router.post('/:id/save', authenticate, requireRole('STUDENT'), asyncHandler(JobController.saveJob));
router.delete('/:id/save', authenticate, requireRole('STUDENT'), asyncHandler(JobController.unsaveJob));

// Student: Job alerts
router.get('/alerts', authenticate, requireRole('STUDENT'), asyncHandler(JobController.getJobAlerts));
router.post('/alerts', authenticate, requireRole('STUDENT'), asyncHandler(JobController.createJobAlert));
router.delete('/alerts/:id', authenticate, requireRole('STUDENT'), asyncHandler(JobController.deleteJobAlert));

// Student: Apply to a job
router.post('/:id/apply', authenticate, requireRole('STUDENT'), validate(schemas.applyJobSchema), asyncHandler(JobController.applyToJob));

// Get single job
router.get('/:id', authenticate, asyncHandler(JobController.getJobById));

// Close job (must be before :id to match /:id/close)
router.patch('/:id/close', authenticate, authorize('SUPER_ADMIN', 'EMPLOYER', 'RECRUITER'), asyncHandler(JobController.closeJob));

// Update job (Employer/Recruiter/Admin)
router.patch('/:id', authenticate, authorize('SUPER_ADMIN', 'EMPLOYER', 'RECRUITER'), validate(schemas.updateJobSchema), asyncHandler(JobController.updateJob));

// Create job (Admin/Agent/Employer)
router.post('/', authenticate, authorize('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'AGENT', 'SPONSOR', 'EMPLOYER', 'RECRUITER'), validate(schemas.createJobSchema), asyncHandler(JobController.createJob));

export default router;
