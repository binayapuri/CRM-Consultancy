import express from 'express';
import { asyncHandler } from '../shared/utils/asyncHandler.js';
import { CampaignTrackingController } from '../shared/controllers/campaign-tracking.controller.js';

const router = express.Router();

router.get('/email-open/:token.gif', asyncHandler(CampaignTrackingController.emailOpen));

export default router;
