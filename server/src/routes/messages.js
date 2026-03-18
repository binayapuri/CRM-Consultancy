import express from 'express';
import { authenticate } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { CollaborationController } from '../shared/controllers/collaboration.controller.js';
import * as schemas from '../shared/schemas/collaboration.schema.js';

const router = express.Router();

router.get('/conversations', authenticate, asyncHandler(CollaborationController.getConversations));

router.get('/', authenticate, asyncHandler(CollaborationController.getMessages));

router.post('/', authenticate, validate(schemas.sendMessageSchema), asyncHandler(CollaborationController.sendMessage));

export default router;
