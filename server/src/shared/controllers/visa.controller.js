import { VisaService } from '../services/visa.service.js';

export class VisaController {
  static async getMyTimeline(req, res) {
    const timeline = await VisaService.getMyTimeline(req.user._id);
    res.json(timeline);
  }

  static async updateMilestone(req, res) {
    const timeline = await VisaService.updateMilestone(req.params.milestoneId, req.body.status, req.user);
    res.json(timeline);
  }
}
