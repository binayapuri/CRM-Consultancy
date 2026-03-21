import express from 'express';
import { authenticate, requireRole } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { VisaController } from '../shared/controllers/visa.controller.js';
import * as schemas from '../shared/schemas/visa.schema.js';

const router = express.Router();

// Get the student's timeline
router.get('/my-timeline', authenticate, requireRole('STUDENT'), asyncHandler(VisaController.getMyTimeline));

// Update milestone status (Student or Agent)
router.patch('/milestones/:milestoneId', authenticate, validate(schemas.updateMilestoneSchema), asyncHandler(VisaController.updateMilestone));

export default router;
