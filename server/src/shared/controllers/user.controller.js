import { UserService } from '../services/user.service.js';

export class UserController {
  static async createTestAccount(req, res) {
    const user = await UserService.createTestAccount(req.body);
    res.status(201).json(user);
  }

  static async getAll(req, res) {
    const users = await UserService.getAll(req.user, req.query.consultancyId);
    res.json(users);
  }

  static async getAgents(req, res) {
    const agents = await UserService.getAgents(req.user);
    res.json(agents);
  }

  static async update(req, res) {
    const user = await UserService.update(req.params.id, req.body, req.user);
    res.json(user);
  }

  static async delete(req, res) {
    const result = await UserService.delete(req.params.id, req.user);
    res.json(result);
  }
}
