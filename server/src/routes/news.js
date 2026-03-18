import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { authenticate, requireRole } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { NewsController } from '../shared/controllers/news.controller.js';
import * as schemas from '../shared/schemas/news.schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `news-cover-${Date.now()}-${(file.originalname || 'image').replace(/[^a-zA-Z0-9.-]/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

// Admin routes
router.get('/admin', authenticate, requireRole('SUPER_ADMIN'), asyncHandler(NewsController.getAdminArticles));
router.get('/admin/:id', authenticate, requireRole('SUPER_ADMIN'), asyncHandler(NewsController.getAdminArticleById));
router.post('/upload-cover', authenticate, requireRole('SUPER_ADMIN'), upload.single('file'), asyncHandler(NewsController.uploadCover));

// Public routes
router.get('/categories', asyncHandler(NewsController.getCategories));
router.get('/', validate(schemas.getNewsSchema), asyncHandler(NewsController.getPublishedArticles));
router.get('/:slug', asyncHandler(NewsController.getArticleBySlug));

// Admin CRUD
router.post('/', authenticate, requireRole('SUPER_ADMIN'), validate(schemas.createArticleSchema), asyncHandler(NewsController.createArticle));
router.patch('/:id', authenticate, requireRole('SUPER_ADMIN'), validate(schemas.updateArticleSchema), asyncHandler(NewsController.updateArticle));
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN'), asyncHandler(NewsController.deleteArticle));

export default router;
