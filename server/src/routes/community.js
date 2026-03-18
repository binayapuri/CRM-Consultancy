import express from 'express';
import { authenticate } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { CollaborationController } from '../shared/controllers/collaboration.controller.js';
import * as schemas from '../shared/schemas/collaboration.schema.js';

const router = express.Router();

// Get all posts
router.get('/posts', validate(schemas.getPostsSchema), asyncHandler(CollaborationController.getPosts));

// Create post
router.post('/posts', authenticate, validate(schemas.createPostSchema), asyncHandler(CollaborationController.createPost));

// Get single post with comments
router.get('/posts/:id', asyncHandler(CollaborationController.getPostById));

// Add comment
router.post('/posts/:id/comments', authenticate, validate(schemas.createCommentSchema), asyncHandler(CollaborationController.addComment));

// Upvote post
router.post('/posts/:id/upvote', authenticate, asyncHandler(CollaborationController.upvotePost));

export default router;
