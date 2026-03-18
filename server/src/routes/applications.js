import express from 'express';
import { authenticate } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { ApplicationController } from '../shared/controllers/application.controller.js';
import * as schemas from '../shared/schemas/application.schema.js';

const router = express.Router();

router.get('/my', authenticate, asyncHandler(ApplicationController.getMyApplications));
router.get('/', authenticate, validate(schemas.getAppsSchema), asyncHandler(ApplicationController.getAll));
router.get('/kanban', authenticate, validate(schemas.getAppsSchema), asyncHandler(ApplicationController.getKanban));
router.get('/:id', authenticate, validate(schemas.getByIdSchema), asyncHandler(ApplicationController.getById));

router.post('/', authenticate, validate(schemas.createAppSchema), asyncHandler(ApplicationController.create));
router.patch('/:id', authenticate, validate(schemas.updateAppSchema), asyncHandler(ApplicationController.update));
router.delete('/:id', authenticate, validate(schemas.deleteAppSchema), asyncHandler(ApplicationController.delete));

router.patch('/:id/checklist', authenticate, validate(schemas.updateChecklistSchema), asyncHandler(ApplicationController.updateChecklist));
router.patch('/:id/status', authenticate, validate(schemas.updateStatusSchema), asyncHandler(ApplicationController.updateStatus));
router.post('/:id/notes', authenticate, validate(schemas.addNoteSchema), asyncHandler(ApplicationController.addNote));

export default router;
