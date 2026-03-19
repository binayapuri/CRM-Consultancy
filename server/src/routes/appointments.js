import express from 'express';
import { authenticate } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { AppointmentController } from '../shared/controllers/appointment.controller.js';
import * as schemas from '../shared/schemas/appointment.schema.js';

const router = express.Router();

// Get user appointments (student or agent)
router.get('/', authenticate, asyncHandler(AppointmentController.getUserAppointments));

// Book an appointment (Student)
router.post('/', authenticate, validate(schemas.createAppointmentSchema), asyncHandler(AppointmentController.bookAppointment));
router.patch('/:id', authenticate, validate(schemas.updateAppointmentSchema), asyncHandler(AppointmentController.updateAppointment));

export default router;
