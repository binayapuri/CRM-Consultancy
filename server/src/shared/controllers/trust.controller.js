import { TrustService } from '../services/trust.service.js';

export class TrustController {
  static async getLedger(req, res) {
    const result = await TrustService.getLedger(req.user, req.query);
    res.json(result);
  }

  static async createEntry(req, res) {
    const entry = await TrustService.createEntry(req.user, req.body);
    res.status(201).json(entry);
  }

  static async updateEntry(req, res) {
    const entry = await TrustService.updateEntry(req.params.id, req.user, req.body);
    res.json(entry);
  }

  static async deleteEntry(req, res) {
    const result = await TrustService.deleteEntry(req.params.id, req.user);
    res.json(result);
  }
}
