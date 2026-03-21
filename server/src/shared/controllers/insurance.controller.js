import { InsuranceService } from '../services/insurance.service.js';

export class InsuranceController {
  static async getMarketplace(req, res) {
    const plans = await InsuranceService.getMarketplace();
    res.json(plans);
  }

  static async applyForPlan(req, res) {
    const app = await InsuranceService.applyForPlan(req.user._id, req.body);
    res.status(201).json(app);
  }

  static async getMyApplications(req, res) {
    const apps = await InsuranceService.getMyApplications(req.user._id);
    res.json(apps);
  }

  static async manageApplications(req, res) {
    const apps = await InsuranceService.manageApplications(req.user);
    res.json(apps);
  }

  static async updateApplicationStatus(req, res) {
    const app = await InsuranceService.updateApplicationStatus(req.params.id, req.body);
    res.json(app);
  }
}
