import express from 'express';
import { authenticate, requireRole } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { OfferController } from '../shared/controllers/offer.controller.js';
import * as schemas from '../shared/schemas/offer.schema.js';

const router = express.Router();

// Student routes
router.get('/my-applications', authenticate, requireRole('STUDENT'), asyncHandler(OfferController.getMyApplications));
router.post('/apply', authenticate, requireRole('STUDENT'), validate(schemas.applyOfferSchema), asyncHandler(OfferController.applyForCourse));

// Management routes
router.get('/manage', authenticate, requireRole('SUPER_ADMIN', 'UNIVERSITY_PARTNER'), asyncHandler(OfferController.manageApplications));
router.patch('/:id/status', authenticate, requireRole('SUPER_ADMIN', 'UNIVERSITY_PARTNER'), validate(schemas.updateOfferStatusSchema), asyncHandler(OfferController.updateStatus));

export default router;
