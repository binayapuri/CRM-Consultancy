import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import DocumentTemplate from '../models/DocumentTemplate.js';

const router = express.Router();

// Get all active templates
router.get('/', authenticate, async (req, res) => {
  try {
    const templates = await DocumentTemplate.find({ isActive: true }).sort('title');
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Super Admin: Add new template
router.post('/', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const template = await DocumentTemplate.create({ ...req.body, addedBy: req.user._id });
    res.status(201).json(template);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Super Admin: Delete template
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    await DocumentTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
