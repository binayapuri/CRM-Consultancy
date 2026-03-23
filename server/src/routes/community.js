import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { authenticate, optionalAuthenticate } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { CollaborationController } from '../shared/controllers/collaboration.controller.js';
import * as schemas from '../shared/schemas/collaboration.schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) =>
    cb(
      null,
      `community-${Date.now()}-${(file.originalname || 'image').replace(/[^a-zA-Z0-9.-]/g, '_')}`
    ),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

router.post(
  '/upload-image',
  authenticate,
  upload.single('file'),
  asyncHandler(CollaborationController.uploadPostImage)
);

router.post(
  '/link-preview',
  authenticate,
  validate(schemas.linkPreviewRequestSchema),
  asyncHandler(CollaborationController.previewLink)
);

router.get(
  '/posts',
  optionalAuthenticate,
  validate(schemas.getPostsSchema),
  asyncHandler(CollaborationController.getPosts)
);

router.post(
  '/posts',
  authenticate,
  validate(schemas.createPostSchema),
  asyncHandler(CollaborationController.createPost)
);

router.get(
  '/posts/:id',
  optionalAuthenticate,
  asyncHandler(CollaborationController.getPostById)
);

router.post(
  '/posts/:id/comments',
  authenticate,
  validate(schemas.createCommentSchema),
  asyncHandler(CollaborationController.addComment)
);

router.post('/posts/:id/upvote', authenticate, asyncHandler(CollaborationController.upvotePost));

router.post('/posts/:id/message', authenticate, asyncHandler(CollaborationController.sendMessageToPostAuthor));

router.post(
  '/posts/:id/save',
  authenticate,
  asyncHandler(CollaborationController.savePost)
);

router.delete(
  '/posts/:id/save',
  authenticate,
  asyncHandler(CollaborationController.unsavePost)
);

router.post(
  '/follow/:userId',
  authenticate,
  validate(schemas.followUserParamSchema),
  asyncHandler(CollaborationController.toggleFollowUser)
);

router.get('/following', authenticate, asyncHandler(CollaborationController.getFollowing));

export default router;
