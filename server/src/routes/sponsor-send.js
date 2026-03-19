import express from 'express';
import { authenticate, requireRole } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { PortalController } from '../shared/controllers/portal.controller.js';
import * as schemas from '../shared/schemas/portal.schema.js';

const router = express.Router();

router.post('/:sponsorId/preview-form956', authenticate, requireRole('CONSULTANCY_ADMIN', 'AGENT', 'SUPER_ADMIN'), validate(schemas.previewSponsorDraftSchema), asyncHandler(PortalController.previewForm956ToSponsor));

router.post('/:sponsorId/send-form956', authenticate, requireRole('CONSULTANCY_ADMIN', 'AGENT', 'SUPER_ADMIN'), validate(schemas.previewSponsorDraftSchema), asyncHandler(PortalController.sendForm956ToSponsor));

router.post('/:sponsorId/preview-mia', authenticate, requireRole('CONSULTANCY_ADMIN', 'AGENT', 'SUPER_ADMIN'), validate(schemas.previewSponsorDraftSchema), asyncHandler(PortalController.previewMiaToSponsor));

router.post('/:sponsorId/send-mia', authenticate, requireRole('CONSULTANCY_ADMIN', 'AGENT', 'SUPER_ADMIN'), validate(schemas.previewSponsorDraftSchema), asyncHandler(PortalController.sendMiaToSponsor));

router.post('/:sponsorId/preview-sponsorship-package', authenticate, requireRole('CONSULTANCY_ADMIN', 'AGENT', 'SUPER_ADMIN'), validate(schemas.previewSponsorDraftSchema), asyncHandler(PortalController.previewSponsorshipPackage));

router.post('/:sponsorId/send-sponsorship-package', authenticate, requireRole('CONSULTANCY_ADMIN', 'AGENT', 'SUPER_ADMIN'), validate(schemas.previewSponsorDraftSchema), asyncHandler(PortalController.sendSponsorshipPackage));

export default router;
