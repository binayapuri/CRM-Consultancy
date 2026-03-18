import express from 'express';
import { authenticate } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { AIController } from '../shared/controllers/ai.controller.js';
import * as schemas from '../shared/schemas/ai.schema.js';

const router = express.Router();

router.post('/compass', authenticate, validate(schemas.compassSchema), asyncHandler(AIController.compass));

router.get('/history', authenticate, asyncHandler(AIController.getHistory));

router.get('/history/:id', authenticate, asyncHandler(AIController.getChatById));

router.post('/document-suggestions', authenticate, validate(schemas.documentSuggestionsSchema), asyncHandler(AIController.getDocumentSuggestions));

export default router;
