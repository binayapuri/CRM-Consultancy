import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { authenticate, requireRole } from '../middleware/auth.js';
import Article from '../models/Article.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `news-cover-${Date.now()}-${(file.originalname || 'image').replace(/[^a-zA-Z0-9.-]/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

const router = express.Router();

// Admin: get all articles (published + draft) – must be before /:slug
router.get('/admin', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const articles = await Article.find()
      .sort({ updatedAt: -1 })
      .populate('categoryId', 'name slug')
      .lean();
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: get single article by id (for edit page)
router.get('/admin/:id', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate('categoryId', 'name slug');
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: upload cover image
router.post('/upload-cover', authenticate, requireRole('SUPER_ADMIN'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (req.file.mimetype && !req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'File must be an image' });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get categories (public, for filter UI)
router.get('/categories', async (req, res) => {
  try {
    const NewsCategory = (await import('../models/NewsCategory.js')).default;
    const categories = await NewsCategory.find().sort({ order: 1, name: 1 }).select('name slug').lean();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all published news (public)
router.get('/', async (req, res) => {
  try {
    const query = { isPublished: true };
    const categorySlug = req.query.category;
    if (categorySlug) {
      const NewsCategory = (await import('../models/NewsCategory.js')).default;
      const cat = await NewsCategory.findOne({ slug: categorySlug });
      if (cat) query.categoryId = cat._id;
    }
    const articles = await Article.find(query)
      .sort({ publishedAt: -1 })
      .populate('categoryId', 'name slug')
      .lean();
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single article by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug })
      .populate('categoryId', 'name slug');
    if (!article) return res.status(404).json({ error: 'Article not found' });
    article.views += 1;
    await article.save();
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create article (Admin only)
router.post('/', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const article = new Article({
      ...req.body,
      authorId: req.user._id,
      categoryId: req.body.categoryId || undefined,
      category: req.body.category || undefined,
    });
    if (req.body.isPublished) article.publishedAt = new Date();
    await article.save();
    await article.populate('categoryId', 'name slug');
    res.status(201).json(article);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update article (Admin only)
router.patch('/:id', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    const allowed = ['title', 'slug', 'content', 'summary', 'coverImage', 'categoryId', 'tags', 'isPublished'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) article[key] = req.body[key];
    }
    if (req.body.isPublished && !article.publishedAt) article.publishedAt = new Date();
    await article.save();
    await article.populate('categoryId', 'name slug');
    res.json(article);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete article (Admin only)
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
