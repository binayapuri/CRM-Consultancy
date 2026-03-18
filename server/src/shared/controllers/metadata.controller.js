import { MetadataService } from '../services/metadata.service.js';

export class MetadataController {
  static getConstants(req, res) {
    const type = req.path.split('/').pop();
    const constants = MetadataService.getConstants(type);
    res.json(constants);
  }

  static async getTemplates(req, res) {
    const templates = await MetadataService.getTemplates();
    res.json(templates);
  }

  static async createTemplate(req, res) {
    const template = await MetadataService.createTemplate(req.body, req.user._id);
    res.status(201).json(template);
  }

  static async deleteTemplate(req, res) {
    await MetadataService.deleteTemplate(req.params.id);
    res.json({ success: true });
  }

  static getPointsRules(req, res) {
    const rules = MetadataService.getPointsRules();
    res.json(rules);
  }

  static calculatePoints(req, res) {
    const result = MetadataService.calculatePoints(req.body);
    res.json(result);
  }
}
