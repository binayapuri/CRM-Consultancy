import { ApplicationService } from '../services/application.service.js';

export class ApplicationController {
  static async getMyApplications(req, res) {
    const data = await ApplicationService.getMyApplications(req.user);
    res.json(data);
  }

  static async getAll(req, res) {
    const data = await ApplicationService.getAll(req.user, req.query.consultancyId);
    res.json(data);
  }

  static async getKanban(req, res) {
    const data = await ApplicationService.getKanban(req.user, req.query.consultancyId);
    res.json(data);
  }

  static async getById(req, res) {
    const data = await ApplicationService.getById(req.params.id, req.user);
    res.json(data);
  }

  static async create(req, res) {
    const data = await ApplicationService.create(req.body, req.user);
    res.status(201).json(data);
  }

  static async update(req, res) {
    const data = await ApplicationService.update(req.params.id, req.body, req.user);
    res.json(data);
  }

  static async updateChecklist(req, res) {
    const { index, documentId, uploaded } = req.body;
    const data = await ApplicationService.updateChecklist(req.params.id, index, documentId, uploaded, req.user);
    res.json(data);
  }

  static async updateStatus(req, res) {
    const data = await ApplicationService.updateStatus(req.params.id, req.body.status, req.user);
    res.json(data);
  }

  static async addNote(req, res) {
    const data = await ApplicationService.addNote(req.params.id, req.body, req.user);
    res.json(data);
  }

  static async delete(req, res) {
    const data = await ApplicationService.delete(req.params.id, req.user);
    res.json(data);
  }
}
