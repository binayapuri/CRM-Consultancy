import express from 'express';
import { authenticate, requirePermission } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';
import { ConsultancyBillingController } from '../shared/controllers/consultancy-billing.controller.js';
import * as schemas from '../shared/schemas/consultancy-billing.schema.js';

const router = express.Router();

router.get('/', authenticate, requirePermission('billing', 'view'), validate(schemas.getBillingSchema), asyncHandler(ConsultancyBillingController.getAll));
router.post('/', authenticate, requirePermission('billing', 'create'), validate(schemas.createBillingSchema), asyncHandler(ConsultancyBillingController.create));
router.patch('/:id', authenticate, requirePermission('billing', 'edit'), validate(schemas.updateBillingSchema), asyncHandler(ConsultancyBillingController.update));
router.delete('/:id', authenticate, requirePermission('billing', 'delete'), validate(schemas.billingIdSchema), asyncHandler(ConsultancyBillingController.delete));
router.get('/:id/pdf', authenticate, requirePermission('billing', 'view'), validate(schemas.billingIdSchema), asyncHandler(ConsultancyBillingController.pdf));
router.post('/:id/send', authenticate, requirePermission('billing', 'edit'), validate(schemas.sendBillingSchema), asyncHandler(ConsultancyBillingController.send));

export default router;
