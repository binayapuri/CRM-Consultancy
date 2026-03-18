import { InvitationService } from '../services/invitation.service.js';

export class InvitationController {
  static async validate(req, res) {
    const result = await InvitationService.validate(req.query.token, req.query.email);
    res.json(result);
  }

  static async activate(req, res) {
    const result = await InvitationService.activate(req.body);
    res.json(result);
  }
}
