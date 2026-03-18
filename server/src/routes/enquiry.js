import express from 'express';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { LeadController } from '../shared/controllers/lead.controller.js';
import * as schemas from '../shared/schemas/lead.schema.js';

const router = express.Router();

// Public enquiry - no auth required
router.post('/', validate(schemas.publicEnquirySchema), asyncHandler(LeadController.publicEnquiry));

export default router;
