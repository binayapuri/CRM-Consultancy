import express from 'express';
import { authenticate } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { OfferController } from '../shared/controllers/offer.controller.js';
import * as schemas from '../shared/schemas/offer.schema.js';

const router = express.Router();

router.get('/', authenticate, validate(schemas.getOshcSchema), asyncHandler(OfferController.getOshcProviders));
router.post('/', authenticate, validate(schemas.createOshcSchema), asyncHandler(OfferController.createOshc));
router.patch('/:id', authenticate, validate(schemas.updateOshcSchema), asyncHandler(OfferController.updateOshc));
router.delete('/:id', authenticate, asyncHandler(OfferController.deleteOshc));

export default router;
