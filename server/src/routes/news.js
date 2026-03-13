import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Article from '../models/Article.js';

const router = express.Router();

// Get all published news
router.get('/', async (req, res) => {
  try {
    const articles = await Article.find({ isPublished: true }).sort({ publishedAt: -1 });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single article by slug
router.get('/:slug', async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug });
    if (!article) return res.status(404).json({ error: 'Article not found' });
    article.views += 1;
    await article.save();
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create article (Admin only)
router.post('/', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const article = new Article({ ...req.body, authorId: req.user.id });
    if (req.body.isPublished) article.publishedAt = new Date();
    await article.save();
    res.status(201).json(article);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
