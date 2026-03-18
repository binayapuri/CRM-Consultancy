import express from 'express';
import { authenticate, requireRole } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { InsuranceController } from '../shared/controllers/insurance.controller.js';
import * as schemas from '../shared/schemas/insurance.schema.js';

const router = express.Router();

// Public routes
router.get('/marketplace', asyncHandler(InsuranceController.getMarketplace));

// Student routes
router.post('/apply', authenticate, requireRole('STUDENT'), validate(schemas.applyInsuranceSchema), asyncHandler(InsuranceController.applyForPlan));
router.get('/my-applications', authenticate, requireRole('STUDENT'), asyncHandler(InsuranceController.getMyApplications));

// Partner routes
router.get('/partner/applications', authenticate, requireRole('INSURANCE_PARTNER', 'SUPER_ADMIN'), asyncHandler(InsuranceController.manageApplications));
router.patch('/partner/applications/:id/status', authenticate, requireRole('INSURANCE_PARTNER', 'SUPER_ADMIN'), validate(schemas.updateInsuranceStatusSchema), asyncHandler(InsuranceController.updateApplicationStatus));

export default router;
