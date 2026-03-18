import express from 'express';
import { authenticate, requirePermission } from '../shared/middleware/auth.js';
import { validate } from '../shared/middleware/validate.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';

import { TrustController } from '../shared/controllers/trust.controller.js';
import * as schemas from '../shared/schemas/trust.schema.js';

const router = express.Router();

router.get('/', authenticate, requirePermission('trustLedger', 'view'), validate(schemas.getTrustLedgerSchema), asyncHandler(TrustController.getLedger));

router.post('/', authenticate, requirePermission('trustLedger', 'edit'), validate(schemas.createTrustEntrySchema), asyncHandler(TrustController.createEntry));

router.patch('/:id', authenticate, requirePermission('trustLedger', 'edit'), validate(schemas.updateTrustEntrySchema), asyncHandler(TrustController.updateEntry));

router.delete('/:id', authenticate, requirePermission('trustLedger', 'edit'), asyncHandler(TrustController.deleteEntry));

export default router;
