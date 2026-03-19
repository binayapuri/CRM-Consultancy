import { ConsultancyOpsService } from '../services/consultancy-ops.service.js';

export class ConsultancyOpsController {
  static async search(req, res) {
    const result = await ConsultancyOpsService.search(req.user, req.query);
    res.json(result);
  }
}
