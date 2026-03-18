import express from 'express';
import { authenticate } from '../shared/middleware/auth.js';
import { MetadataController } from '../shared/controllers/metadata.controller.js';

const router = express.Router();

router.get('/visa-types', authenticate, MetadataController.getConstants);
router.get('/checklist-doc-mapping', authenticate, MetadataController.getConstants);
router.get('/sample-documents', authenticate, MetadataController.getConstants);
router.get('/visa-checklists', authenticate, MetadataController.getConstants);
router.get('/services', authenticate, MetadataController.getConstants);
router.get('/document-types', authenticate, MetadataController.getConstants);
router.get('/document-templates', authenticate, MetadataController.getConstants);
router.get('/email-templates', authenticate, MetadataController.getConstants);
router.get('/sponsor-document-types', authenticate, MetadataController.getConstants);

export default router;
