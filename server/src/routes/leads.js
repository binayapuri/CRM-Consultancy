import express from 'express';
import { authenticate } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { LeadController } from '../shared/controllers/lead.controller.js';
import * as schemas from '../shared/schemas/lead.schema.js';

const router = express.Router();

router.get('/', authenticate, validate(schemas.getLeadsSchema), asyncHandler(LeadController.getAll));
router.get('/:id', authenticate, asyncHandler(LeadController.getById));
router.post('/', authenticate, validate(schemas.createLeadSchema), asyncHandler(LeadController.create));
router.patch('/:id', authenticate, validate(schemas.updateLeadSchema), asyncHandler(LeadController.update));
router.delete('/:id', authenticate, validate(schemas.deleteLeadSchema), asyncHandler(LeadController.delete));
router.post('/:id/convert', authenticate, validate(schemas.convertLeadSchema), asyncHandler(LeadController.convertToClient));

export default router;
