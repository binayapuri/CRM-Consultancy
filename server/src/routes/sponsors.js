import express from 'express';
import { authenticate } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { SponsorController } from '../shared/controllers/sponsor.controller.js';
import * as schemas from '../shared/schemas/sponsor.schema.js';

const router = express.Router();

router.get('/me', authenticate, asyncHandler(SponsorController.getMySponsorRecord));
router.get('/', authenticate, validate(schemas.getSponsorsSchema), asyncHandler(SponsorController.getAll));
router.post('/', authenticate, validate(schemas.createSponsorSchema), asyncHandler(SponsorController.create));
router.get('/:id', authenticate, asyncHandler(SponsorController.getById));
router.patch('/:id', authenticate, validate(schemas.updateSponsorSchema), asyncHandler(SponsorController.update));
router.delete('/:id', authenticate, asyncHandler(SponsorController.delete));
router.post('/:id/invite-portal', authenticate, asyncHandler(SponsorController.invitePortal));

export default router;
