import { TaskService } from '../services/task.service.js';

export class TaskController {
  static async getAll(req, res) {
    const data = await TaskService.getAll(req.user, req.query);
    res.json(data);
  }

  static async getDaily(req, res) {
    const data = await TaskService.getDailyOptions(req.user, req.query.consultancyId, req.query.date);
    res.json(data);
  }

  static async create(req, res) {
    const data = await TaskService.create(req.body, req.user);
    res.status(201).json(data);
  }

  static async getById(req, res) {
    const data = await TaskService.getById(req.params.id);
    res.json(data);
  }

  static async update(req, res) {
    const data = await TaskService.update(req.params.id, req.body, req.user);
    res.json(data);
  }

  static async review(req, res) {
    const data = await TaskService.review(req.params.id, req.user);
    res.json(data);
  }

  static async addComment(req, res) {
    const data = await TaskService.addComment(req.params.id, req.body.text, req.user);
    res.json(data);
  }

  static async delete(req, res) {
    const data = await TaskService.delete(req.params.id, req.user);
    res.json(data);
  }
}
