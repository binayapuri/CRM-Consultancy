import { SponsorService } from '../services/sponsor.service.js';

export class SponsorController {
  static async getMySponsorRecord(req, res) {
    if (req.user.role !== 'SPONSOR') return res.status(403).json({ error: 'Sponsor access only' });
    const sponsor = await SponsorService.getMySponsorRecord(req.user._id);
    res.json(sponsor);
  }

  static async getAll(req, res) {
    const sponsors = await SponsorService.getAll(req.user, req.query.consultancyId);
    res.json(sponsors);
  }

  static async create(req, res) {
    const sponsor = await SponsorService.create(req.body, req.user);
    res.status(201).json(sponsor);
  }

  static async getById(req, res) {
    const sponsor = await SponsorService.getById(req.params.id, req.user);
    res.json(sponsor);
  }

  static async update(req, res) {
    const sponsor = await SponsorService.update(req.params.id, req.body, req.user);
    res.json(sponsor);
  }

  static async delete(req, res) {
    const result = await SponsorService.delete(req.params.id, req.user);
    res.json(result);
  }

  static async invitePortal(req, res) {
    const result = await SponsorService.invitePortal(req.params.id, req.user);
    res.json(result);
  }
}
