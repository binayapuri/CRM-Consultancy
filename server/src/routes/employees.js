import express from 'express';
import { authenticate, requireRole } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { EmployeeController } from '../shared/controllers/employee.controller.js';
import * as schemas from '../shared/schemas/employee.schema.js';

const router = express.Router();

router.get('/:id/job-sheet', authenticate, validate(schemas.getJobSheetSchema), asyncHandler(EmployeeController.getJobSheet));

router.get('/', authenticate, requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER', 'AGENT'), validate(schemas.getEmployeesSchema), asyncHandler(EmployeeController.getAll));

router.get('/:id', authenticate, asyncHandler(EmployeeController.getById));

router.post('/', authenticate, requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER'), validate(schemas.createEmployeeSchema), asyncHandler(EmployeeController.create));

router.patch('/:id', authenticate, requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER', 'AGENT'), validate(schemas.updateEmployeeSchema), asyncHandler(EmployeeController.update));

router.delete('/:id', authenticate, requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER'), asyncHandler(EmployeeController.delete));

export default router;
