import express from 'express';
import { authenticate } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { TaskController } from '../shared/controllers/task.controller.js';
import * as schemas from '../shared/schemas/task.schema.js';

const router = express.Router();

router.get('/', authenticate, validate(schemas.getTasksSchema), asyncHandler(TaskController.getAll));
router.get('/daily', authenticate, validate(schemas.getDailyTasksSchema), asyncHandler(TaskController.getDaily));
router.get('/:id', authenticate, validate(schemas.getByIdSchema), asyncHandler(TaskController.getById));

router.post('/', authenticate, validate(schemas.createTaskSchema), asyncHandler(TaskController.create));
router.patch('/:id', authenticate, validate(schemas.updateTaskSchema), asyncHandler(TaskController.update));
router.delete('/:id', authenticate, validate(schemas.deleteTaskSchema), asyncHandler(TaskController.delete));

router.post('/:id/review', authenticate, validate(schemas.reviewTaskSchema), asyncHandler(TaskController.review));
router.post('/:id/comments', authenticate, validate(schemas.addCommentSchema), asyncHandler(TaskController.addComment));

export default router;
