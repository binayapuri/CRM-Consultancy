import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { authenticate, requireRole } from '../../shared/middleware/auth.js';
import { validate } from '../../shared/middleware/validate.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';

import { ConsultancyController } from './controllers/consultancy.controller.js';
import { 
  signatureSchema, searchSchema, getByIdSchema, registerConsultancySchema, 
  createConsultancySchema, updateConsultancySchema, updateByIdSchema, deleteConsultancySchema 
} from './schemas/consultancy.schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `consultancy-sig-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB

const router = express.Router();

router.post('/me/signature', 
  authenticate, 
  requireRole('CONSULTANCY_ADMIN', 'MANAGER'), 
  upload.single('file'), 
  validate(signatureSchema),
  asyncHandler(ConsultancyController.uploadSignature)
);

router.get('/', 
  authenticate, 
  asyncHandler(ConsultancyController.getAll)
);

router.get('/search', 
  validate(searchSchema),
  asyncHandler(ConsultancyController.search)
);

router.get('/me', 
  authenticate, 
  asyncHandler(ConsultancyController.getMe)
);

router.get('/:id', 
  authenticate, 
  validate(getByIdSchema),
  asyncHandler(ConsultancyController.getById)
);

// Super Admin: full consultancy overview with stats and recent data
router.get('/:id/overview', 
  authenticate, 
  requireRole('SUPER_ADMIN'), 
  validate(getByIdSchema),
  asyncHandler(ConsultancyController.getOverview)
);

// Public: Consultancy registration (admin signup with business email + MARN)
router.post('/register', 
  validate(registerConsultancySchema),
  asyncHandler(ConsultancyController.register)
);

router.post('/', 
  authenticate, 
  requireRole('SUPER_ADMIN'), 
  validate(createConsultancySchema),
  asyncHandler(ConsultancyController.create)
);

router.patch('/me', 
  authenticate, 
  requireRole('CONSULTANCY_ADMIN', 'MANAGER', 'SUPER_ADMIN'), 
  validate(updateConsultancySchema),
  asyncHandler(ConsultancyController.updateMe)
);

router.patch('/:id', 
  authenticate, 
  requireRole('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER'), 
  validate(updateByIdSchema),
  asyncHandler(ConsultancyController.updateById)
);

router.delete('/:id', 
  authenticate, 
  requireRole('SUPER_ADMIN'), 
  validate(deleteConsultancySchema),
  asyncHandler(ConsultancyController.delete)
);

export default router;
