import { LeadService } from '../services/lead.service.js';

export class LeadController {
  static async getAll(req, res) {
    const leads = await LeadService.getAll(req.user, req.query.consultancyId);
    res.json(leads);
  }

  static async getById(req, res) {
    const lead = await LeadService.getById(req.params.id);
    res.json(lead);
  }

  static async create(req, res) {
    const lead = await LeadService.create(req.body, req.user);
    res.status(201).json(lead);
  }

  static async update(req, res) {
    const updated = await LeadService.update(req.params.id, req.body, req.user);
    res.json(updated);
  }

  static async delete(req, res) {
    const result = await LeadService.delete(req.params.id, req.user);
    res.json(result);
  }

  static async convertToClient(req, res) {
    const result = await LeadService.convertToClient(req.params.id, req.user);
    res.status(201).json(result);
  }

  static async publicEnquiry(req, res) {
    const result = await LeadService.publicEnquiry(req.body);
    res.status(201).json(result);
  }
}
