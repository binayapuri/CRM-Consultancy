import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import NewsCategory from '../models/NewsCategory.js';

const router = express.Router();

// GET all categories (admin)
router.get('/categories', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const categories = await NewsCategory.find().sort({ order: 1, name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create category
router.post('/categories', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, slug, order } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    const category = await NewsCategory.create({
      name: name.trim(),
      slug: slug?.trim() || undefined,
      order: order != null ? Number(order) : undefined,
    });
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH category
router.patch('/categories/:id', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, slug, order } = req.body || {};
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (slug !== undefined) update.slug = slug.trim() || undefined;
    if (order !== undefined) update.order = Number(order);
    const category = await NewsCategory.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE category
router.delete('/categories/:id', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const Article = (await import('../models/Article.js')).default;
    const inUse = await Article.countDocuments({ categoryId: req.params.id });
    if (inUse > 0) {
      return res.status(400).json({ error: `Category is used by ${inUse} article(s). Remove or reassign them first.` });
    }
    const category = await NewsCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
