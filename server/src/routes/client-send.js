import express from 'express';
import { authenticate, requireRole } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { PortalController } from '../shared/controllers/portal.controller.js';
import * as schemas from '../shared/schemas/portal.schema.js';

const router = express.Router();

router.post('/:clientId/preview-form956', authenticate, requireRole('CONSULTANCY_ADMIN', 'MANAGER', 'AGENT', 'SUPER_ADMIN'), validate(schemas.previewClientDraftSchema), asyncHandler(PortalController.previewForm956ToClient));

router.post('/:clientId/send-form956', authenticate, requireRole('CONSULTANCY_ADMIN', 'MANAGER', 'AGENT', 'SUPER_ADMIN'), validate(schemas.previewClientDraftSchema), asyncHandler(PortalController.sendForm956ToClient));

router.post('/:clientId/preview-mia', authenticate, requireRole('CONSULTANCY_ADMIN', 'MANAGER', 'AGENT', 'SUPER_ADMIN'), validate(schemas.previewClientDraftSchema), asyncHandler(PortalController.previewMiaToClient));

router.post('/:clientId/send-mia', authenticate, requireRole('CONSULTANCY_ADMIN', 'MANAGER', 'AGENT', 'SUPER_ADMIN'), validate(schemas.previewClientDraftSchema), asyncHandler(PortalController.sendMiaToClient));

router.post('/:clientId/preview-initial-advice', authenticate, requireRole('CONSULTANCY_ADMIN', 'MANAGER', 'AGENT', 'SUPER_ADMIN'), validate(schemas.previewClientDraftSchema), asyncHandler(PortalController.previewInitialAdvice));

router.post('/:clientId/send-initial-advice', authenticate, requireRole('CONSULTANCY_ADMIN', 'MANAGER', 'AGENT', 'SUPER_ADMIN'), validate(schemas.sendAdviceSchema), asyncHandler(PortalController.sendInitialAdvice));

export default router;
