import express from 'express';
import { authenticate, getAuthenticatedUserFromToken } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { NotificationController } from '../shared/controllers/notification.controller.js';
import * as schemas from '../shared/schemas/notification.schema.js';

const router = express.Router();

async function authenticateNotificationStream(req, res, next) {
  try {
    const queryToken = typeof req.query?.token === 'string' ? req.query.token : '';
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : '';
    const user = await getAuthenticatedUserFromToken(headerToken || queryToken);
    if (!user) return res.status(401).json({ error: 'Invalid token. Please sign in again.' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token. Please sign in again.' });
  }
}

router.post('/send-to-client', authenticate, validate(schemas.sendNotificationSchema), asyncHandler(NotificationController.sendToClient));
router.get('/stream', authenticateNotificationStream, NotificationController.stream);
router.get('/', authenticate, asyncHandler(NotificationController.getUserNotifications));
router.patch('/read-all', authenticate, asyncHandler(NotificationController.readAll));
router.patch('/:id/read', authenticate, validate(schemas.readNotificationSchema), asyncHandler(NotificationController.readOne));

export default router;
