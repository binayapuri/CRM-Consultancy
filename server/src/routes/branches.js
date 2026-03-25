import express from 'express';
import { authenticate, requireRole } from '../shared/middleware/auth.js';
import { asyncHandler } from '../shared/utils/asyncHandler.js';
import { ConsultancyBranchService } from '../shared/services/consultancy-branch.service.js';

const router = express.Router();

router.get('/', authenticate, requireRole('CONSULTANCY_ADMIN', 'MANAGER', 'AGENT', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const rows = await ConsultancyBranchService.list(req.user, req.query.consultancyId);
  res.json(rows);
}));

router.post('/', authenticate, requireRole('CONSULTANCY_ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const row = await ConsultancyBranchService.create(req.user, req.body);
  res.status(201).json(row);
}));

router.patch('/:id', authenticate, requireRole('CONSULTANCY_ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const row = await ConsultancyBranchService.update(req.user, req.params.id, req.body);
  res.json(row);
}));

export default router;
