import NewsCategory from '../../../shared/models/NewsCategory.js';
// Dynamically import Article to avoid circular dependencies if ever present, exact same as old logic
const getArticleModel = async () => (await import('../../../shared/models/Article.js')).default;

export class NewsCategoryService {
  static async getAllCategories() {
    return NewsCategory.find().sort({ order: 1, name: 1 });
  }

  static async createCategory(data) {
    return NewsCategory.create(data);
  }

  static async updateCategory(id, data) {
    const category = await NewsCategory.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!category) {
      const err = new Error('Category not found');
      err.status = 404;
      throw err;
    }
    return category;
  }

  static async deleteCategory(id) {
    const Article = await getArticleModel();
    const inUse = await Article.countDocuments({ categoryId: id });
    if (inUse > 0) {
      const err = new Error(`Category is used by ${inUse} article(s). Remove or reassign them first.`);
      err.status = 400;
      throw err;
    }
    const category = await NewsCategory.findByIdAndDelete(id);
    if (!category) {
      const err = new Error('Category not found');
      err.status = 404;
      throw err;
    }
    return { success: true };
  }
}
