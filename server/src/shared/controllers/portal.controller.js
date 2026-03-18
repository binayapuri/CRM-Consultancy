import { PortalService } from '../services/portal.service.js';

export class PortalController {
  // --- Client ---
  static async sendForm956ToClient(req, res) {
    const result = await PortalService.sendForm956ToClient(req.params.clientId, req.user);
    res.json(result);
  }

  static async sendMiaToClient(req, res) {
    const result = await PortalService.sendMiaToClient(req.params.clientId, req.user);
    res.json(result);
  }

  static async sendInitialAdvice(req, res) {
    const result = await PortalService.sendInitialAdvice(req.params.clientId, req.user, req.body);
    res.json(result);
  }

  // --- Sponsor ---
  static async sendForm956ToSponsor(req, res) {
    const result = await PortalService.sendForm956ToSponsor(req.params.sponsorId, req.user);
    res.json(result);
  }

  static async sendMiaToSponsor(req, res) {
    const result = await PortalService.sendMiaToSponsor(req.params.sponsorId, req.user);
    res.json(result);
  }
}
