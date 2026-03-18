import express from 'express';
import { authenticate, requireRole } from '../../shared/middleware/auth.js';
import { validate } from '../../shared/middleware/validate.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';

import { AdminController } from './controllers/admin.controller.js';
import { verifySchema, updateStudentSchema, updateSettingsSchema } from './schemas/admin.schema.js';

const router = express.Router();

// Apply auth to all generic admin routes automatically
router.use(authenticate, requireRole('SUPER_ADMIN'));

// --- VERIFICATIONS --- //
router.get('/verifications', 
  asyncHandler(AdminController.getVerifications)
);
router.post('/verify/:type/:id', 
  validate(verifySchema), 
  asyncHandler(AdminController.processVerification)
);

// --- STUDENTS --- //
router.get('/students', 
  asyncHandler(AdminController.getStudents)
);
router.patch('/students/:id', 
  validate(updateStudentSchema), 
  asyncHandler(AdminController.updateStudent)
);

// --- PLATFORM STATS & SETTINGS --- //
router.get('/stats', 
  asyncHandler(AdminController.getStats)
);
router.get('/settings', 
  asyncHandler(AdminController.getSettings)
);
router.patch('/settings', 
  validate(updateSettingsSchema), 
  asyncHandler(AdminController.updateSettings)
);

export default router;
