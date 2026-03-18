import Article from '../../shared/models/Article.js';
import NewsCategory from '../../shared/models/NewsCategory.js';

export class NewsService {
  static async getAdminArticles() {
    return Article.find()
      .sort({ updatedAt: -1 })
      .populate('categoryId', 'name slug')
      .lean();
  }

  static async getArticleById(id) {
    const article = await Article.findById(id).populate('categoryId', 'name slug');
    if (!article) throw Object.assign(new Error('Article not found'), { status: 404 });
    return article;
  }

  static async getCategories() {
    return NewsCategory.find().sort({ order: 1, name: 1 }).select('name slug').lean();
  }

  static async getPublishedArticles(categorySlug) {
    const query = { isPublished: true };
    if (categorySlug) {
      const cat = await NewsCategory.findOne({ slug: categorySlug });
      if (cat) query.categoryId = cat._id;
    }
    return Article.find(query)
      .sort({ publishedAt: -1 })
      .populate('categoryId', 'name slug')
      .lean();
  }

  static async getArticleBySlug(slug) {
    const article = await Article.findOne({ slug })
      .populate('categoryId', 'name slug');
    if (!article) throw Object.assign(new Error('Article not found'), { status: 404 });
    
    article.views += 1;
    await article.save();
    return article;
  }

  static async createArticle(data, authorId) {
    const article = new Article({
      ...data,
      authorId,
    });
    if (data.isPublished) article.publishedAt = new Date();
    await article.save();
    return article.populate('categoryId', 'name slug');
  }

  static async updateArticle(id, data) {
    const article = await Article.findById(id);
    if (!article) throw Object.assign(new Error('Article not found'), { status: 404 });

    const allowed = ['title', 'slug', 'content', 'summary', 'coverImage', 'categoryId', 'tags', 'isPublished'];
    for (const key of allowed) {
      if (data[key] !== undefined) article[key] = data[key];
    }
    if (data.isPublished && !article.publishedAt) article.publishedAt = new Date();
    
    await article.save();
    return article.populate('categoryId', 'name slug');
  }

  static async deleteArticle(id) {
    const article = await Article.findByIdAndDelete(id);
    if (!article) throw Object.assign(new Error('Article not found'), { status: 404 });
    return { success: true };
  }
}
