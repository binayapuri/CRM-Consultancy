import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { VISA_TYPES, SERVICES, DOCUMENT_TYPES, DOCUMENT_TEMPLATES, CHECKLIST_TO_DOC_TYPE, SAMPLE_DOCUMENTS, VISA_CHECKLISTS, EMAIL_TEMPLATES, SPONSOR_DOCUMENT_TYPES } from '../constants.js';

const router = express.Router();

router.get('/visa-types', authenticate, (req, res) => res.json(VISA_TYPES));
router.get('/checklist-doc-mapping', authenticate, (req, res) => res.json(CHECKLIST_TO_DOC_TYPE));
router.get('/sample-documents', authenticate, (req, res) => res.json(SAMPLE_DOCUMENTS));
router.get('/visa-checklists', authenticate, (req, res) => res.json(VISA_CHECKLISTS));
router.get('/services', authenticate, (req, res) => res.json(SERVICES));
router.get('/document-types', authenticate, (req, res) => res.json(DOCUMENT_TYPES));
router.get('/document-templates', authenticate, (req, res) => res.json(DOCUMENT_TEMPLATES));
router.get('/email-templates', authenticate, (req, res) => res.json(EMAIL_TEMPLATES));
router.get('/sponsor-document-types', authenticate, (req, res) => res.json(SPONSOR_DOCUMENT_TYPES));

export default router;
