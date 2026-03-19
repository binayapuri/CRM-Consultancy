import express from 'express';
import { authenticate } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';
import { ConsultancyOpsController } from '../shared/controllers/consultancy-ops.controller.js';
import * as schemas from '../shared/schemas/consultancy-ops.schema.js';

const router = express.Router();

router.get('/search', authenticate, validate(schemas.consultancySearchSchema), asyncHandler(ConsultancyOpsController.search));

export default router;
