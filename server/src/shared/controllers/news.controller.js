import { NewsService } from '../services/news.service.js';

export class NewsController {
  static async getAdminArticles(req, res) {
    const articles = await NewsService.getAdminArticles();
    res.json(articles);
  }

  static async getAdminArticleById(req, res) {
    const article = await NewsService.getArticleById(req.params.id);
    res.json(article);
  }

  static async uploadCover(req, res) {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (req.file.mimetype && !req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'File must be an image' });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  }

  static async getCategories(req, res) {
    const categories = await NewsService.getCategories();
    res.json(categories);
  }

  static async getPublishedArticles(req, res) {
    const articles = await NewsService.getPublishedArticles(req.query.category);
    res.json(articles);
  }

  static async getArticleBySlug(req, res) {
    const article = await NewsService.getArticleBySlug(req.params.slug);
    res.json(article);
  }

  static async createArticle(req, res) {
    const article = await NewsService.createArticle(req.body, req.user._id);
    res.status(201).json(article);
  }

  static async updateArticle(req, res) {
    const article = await NewsService.updateArticle(req.params.id, req.body);
    res.json(article);
  }

  static async deleteArticle(req, res) {
    const result = await NewsService.deleteArticle(req.params.id);
    res.json(result);
  }
}
