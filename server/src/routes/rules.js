import express from 'express';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { MetadataController } from '../shared/controllers/metadata.controller.js';
import * as schemas from '../shared/schemas/metadata.schema.js';

const router = express.Router();

router.get('/points', MetadataController.getPointsRules);

router.post('/calculate', validate(schemas.calculatePointsSchema), asyncHandler(MetadataController.calculatePoints));

export default router;
