import express from 'express';
import { authenticate } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { ReviewController } from '../shared/controllers/review.controller.js';
import * as schemas from '../shared/schemas/review.schema.js';

const router = express.Router();

// Get reviews for a consultancy
router.get('/consultancy/:id', validate(schemas.getConsultancyReviewsSchema), asyncHandler(ReviewController.getConsultancyReviews));

// Post a review (Student)
router.post('/', authenticate, validate(schemas.createReviewSchema), asyncHandler(ReviewController.postReview));

export default router;
