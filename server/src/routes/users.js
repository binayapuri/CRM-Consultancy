import express from 'express';
import { authenticate, requireRole } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { UserController } from '../shared/controllers/user.controller.js';
import * as schemas from '../shared/schemas/user.schema.js';

const router = express.Router();

router.post('/test-account', authenticate, requireRole('SUPER_ADMIN'), validate(schemas.createTestAccountSchema), asyncHandler(UserController.createTestAccount));
router.get('/', authenticate, requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER'), validate(schemas.getUsersSchema), asyncHandler(UserController.getAll));
router.get('/agents', authenticate, asyncHandler(UserController.getAgents));
router.patch('/:id', authenticate, requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER'), validate(schemas.updateUserSchema), asyncHandler(UserController.update));
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN'), validate(schemas.deleteUserSchema), asyncHandler(UserController.delete));

export default router;
