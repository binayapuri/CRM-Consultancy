import express from 'express';
import { authenticate } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { AttendanceController } from '../shared/controllers/attendance.controller.js';
import * as schemas from '../shared/schemas/attendance.schema.js';

const router = express.Router();

// Employee: check-in
router.post('/check-in', authenticate, validate(schemas.checkInSchema), asyncHandler(AttendanceController.checkIn));

// Employee: check-out
router.post('/check-out', authenticate, validate(schemas.checkOutSchema), asyncHandler(AttendanceController.checkOut));

// Employee: my today's attendance
router.get('/me/today', authenticate, asyncHandler(AttendanceController.getMyToday));

// Admin: list attendance for date range
router.get('/', authenticate, validate(schemas.getAttendanceSchema), asyncHandler(AttendanceController.getAll));

export default router;
