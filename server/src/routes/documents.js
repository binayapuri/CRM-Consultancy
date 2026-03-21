import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { authenticate } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { DocumentController } from '../shared/controllers/document.controller.js';
import * as schemas from '../shared/schemas/document.schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

const router = express.Router();

router.get('/', authenticate, validate(schemas.getDocsSchema), asyncHandler(DocumentController.getAll));
router.post('/', authenticate, validate(schemas.createDocSchema), asyncHandler(DocumentController.create));
router.post('/upload', authenticate, upload.single('file'), validate(schemas.uploadDocSchema), asyncHandler(DocumentController.upload));
router.post('/bulk-upload', authenticate, upload.array('files', 20), validate(schemas.bulkUploadDocSchema), asyncHandler(DocumentController.bulkUpload));
router.patch('/:id', authenticate, validate(schemas.updateDocSchema), asyncHandler(DocumentController.update));
router.delete('/:id', authenticate, validate(schemas.deleteDocSchema), asyncHandler(DocumentController.delete));
router.get('/:id/versions', authenticate, validate(schemas.documentVersionsSchema), asyncHandler(DocumentController.getVersions));

router.get('/checklist/:visaSubclass', validate(schemas.getChecklistSchema), asyncHandler(DocumentController.getChecklist));

export default router;
