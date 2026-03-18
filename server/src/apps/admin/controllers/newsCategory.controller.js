import { NewsCategoryService } from '../services/newsCategory.service.js';

export class NewsCategoryController {
  
  static async getAll(req, res) {
    const categories = await NewsCategoryService.getAllCategories();
    res.json(categories);
  }

  static async create(req, res) {
    // req.body is already validated and stripped by Zod
    const category = await NewsCategoryService.createCategory(req.body);
    res.status(201).json(category);
  }

  static async update(req, res) {
    const { id } = req.params;
    const category = await NewsCategoryService.updateCategory(id, req.body);
    res.json(category);
  }

  static async remove(req, res) {
    const { id } = req.params;
    const result = await NewsCategoryService.deleteCategory(id);
    res.json(result);
  }

}
