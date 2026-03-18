import express from 'express';
import { authenticate, requireRole } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { MetadataController } from '../shared/controllers/metadata.controller.js';
import * as schemas from '../shared/schemas/metadata.schema.js';

const router = express.Router();

// Get all active templates
router.get('/', authenticate, asyncHandler(MetadataController.getTemplates));

// Super Admin: Add new template
router.post('/', authenticate, requireRole('SUPER_ADMIN'), validate(schemas.createTemplateSchema), asyncHandler(MetadataController.createTemplate));

// Super Admin: Delete template
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN'), asyncHandler(MetadataController.deleteTemplate));

export default router;
