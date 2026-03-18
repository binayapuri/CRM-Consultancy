import express from 'express';
import { authenticate, requireRole } from '../../shared/middleware/auth.js';
import { validate } from '../../shared/middleware/validate.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';

import { NewsCategoryController } from './controllers/newsCategory.controller.js';
import { 
  createCategorySchema, 
  updateCategorySchema, 
  deleteCategorySchema 
} from './schemas/newsCategory.schema.js';

const router = express.Router();

// Apply auth to all admin news routes automatically
router.use(authenticate, requireRole('SUPER_ADMIN'));

// --- CATEGORIES --- //
router.get('/categories', 
  asyncHandler(NewsCategoryController.getAll)
);

router.post('/categories', 
  validate(createCategorySchema), 
  asyncHandler(NewsCategoryController.create)
);

router.patch('/categories/:id', 
  validate(updateCategorySchema), 
  asyncHandler(NewsCategoryController.update)
);

router.delete('/categories/:id', 
  validate(deleteCategorySchema), 
  asyncHandler(NewsCategoryController.remove)
);

export default router;
