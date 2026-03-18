import express from 'express';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { InvitationController } from '../shared/controllers/invitation.controller.js';
import * as schemas from '../shared/schemas/invitation.schema.js';

const router = express.Router();

router.get('/validate', validate(schemas.validateInvitationSchema), asyncHandler(InvitationController.validate));

router.post('/activate', validate(schemas.activateInvitationSchema), asyncHandler(InvitationController.activate));

export default router;
