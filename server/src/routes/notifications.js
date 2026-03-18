import express from 'express';
import { authenticate } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { NotificationController } from '../shared/controllers/notification.controller.js';
import * as schemas from '../shared/schemas/notification.schema.js';

const router = express.Router();

router.post('/send-to-client', authenticate, validate(schemas.sendNotificationSchema), asyncHandler(NotificationController.sendToClient));
router.get('/', authenticate, asyncHandler(NotificationController.getUserNotifications));
router.patch('/read-all', authenticate, asyncHandler(NotificationController.readAll));
router.patch('/:id/read', authenticate, validate(schemas.readNotificationSchema), asyncHandler(NotificationController.readOne));

export default router;
