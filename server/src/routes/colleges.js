import express from 'express';
import { authenticate } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { EducationController } from '../shared/controllers/education.controller.js';
import * as schemas from '../shared/schemas/education.schema.js';

const router = express.Router();

router.get('/', authenticate, validate(schemas.getCollegesSchema), asyncHandler(EducationController.getColleges));
router.get('/compare', authenticate, validate(schemas.compareCollegesSchema), asyncHandler(EducationController.compareColleges));
router.post('/', authenticate, validate(schemas.createCollegeSchema), asyncHandler(EducationController.createCollege));
router.get('/:id', authenticate, asyncHandler(EducationController.getCollegeById));
router.patch('/:id', authenticate, validate(schemas.updateCollegeSchema), asyncHandler(EducationController.updateCollege));
router.delete('/:id', authenticate, asyncHandler(EducationController.deleteCollege));

export default router;
