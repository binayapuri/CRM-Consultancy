import { OfferService } from '../services/offer.service.js';

export class OfferController {
  static async getMyApplications(req, res) {
    const apps = await OfferService.getMyApplications(req.user._id);
    res.json(apps);
  }

  static async applyForCourse(req, res) {
    const app = await OfferService.applyForCourse(req.user._id, req.body);
    res.status(201).json(app);
  }

  static async manageApplications(req, res) {
    const apps = await OfferService.manageApplications(req.user);
    res.json(apps);
  }

  static async updateStatus(req, res) {
    const app = await OfferService.updateStatus(req.params.id, req.body);
    res.json(app);
  }

  static async getOshcProviders(req, res) {
    const providers = await OfferService.getOshcProviders(req.user, req.query);
    res.json(providers);
  }

  static async createOshc(req, res) {
    const oshc = await OfferService.createOshc(req.body, req.user);
    res.status(201).json(oshc);
  }

  static async updateOshc(req, res) {
    const oshc = await OfferService.updateOshc(req.params.id, req.body);
    res.json(oshc);
  }

  static async deleteOshc(req, res) {
    const result = await OfferService.deleteOshc(req.params.id);
    res.json(result);
  }
}
