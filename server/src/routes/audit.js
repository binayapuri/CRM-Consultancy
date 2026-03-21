import express from 'express';
import { authenticate, requireRole } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { AuditController } from '../shared/controllers/audit.controller.js';
import * as schemas from '../shared/schemas/audit.schema.js';

const router = express.Router();

router.get('/today', authenticate, asyncHandler(AuditController.getTodayLogs));

router.get('/', authenticate, requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER'), validate(schemas.getAuditLogsSchema), asyncHandler(AuditController.getAllLogs));

router.get('/by-date', authenticate, requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER'), validate(schemas.getAuditLogsByDateSchema), asyncHandler(AuditController.getLogsByDate));

export default router;
