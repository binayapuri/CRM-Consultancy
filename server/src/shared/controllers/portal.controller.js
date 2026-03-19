import { PortalService } from '../services/portal.service.js';

export class PortalController {
  // --- Client ---
  static async previewForm956ToClient(req, res) {
    const result = await PortalService.previewForm956ToClient(req.params.clientId, req.user, req.body || {});
    res.json(result);
  }

  static async sendForm956ToClient(req, res) {
    const result = await PortalService.sendForm956ToClient(req.params.clientId, req.user, req.body || {});
    res.json(result);
  }

  static async previewMiaToClient(req, res) {
    const result = await PortalService.previewMiaToClient(req.params.clientId, req.user, req.body || {});
    res.json(result);
  }

  static async sendMiaToClient(req, res) {
    const result = await PortalService.sendMiaToClient(req.params.clientId, req.user, req.body || {});
    res.json(result);
  }

  static async previewInitialAdvice(req, res) {
    const result = await PortalService.previewInitialAdvice(req.params.clientId, req.user, req.body || {});
    res.json(result);
  }

  static async sendInitialAdvice(req, res) {
    const result = await PortalService.sendInitialAdvice(req.params.clientId, req.user, req.body);
    res.json(result);
  }

  // --- Sponsor ---
  static async previewForm956ToSponsor(req, res) {
    const result = await PortalService.previewForm956ToSponsor(req.params.sponsorId, req.user, req.body || {});
    res.json(result);
  }

  static async sendForm956ToSponsor(req, res) {
    const result = await PortalService.sendForm956ToSponsor(req.params.sponsorId, req.user, req.body || {});
    res.json(result);
  }

  static async previewMiaToSponsor(req, res) {
    const result = await PortalService.previewMiaToSponsor(req.params.sponsorId, req.user, req.body || {});
    res.json(result);
  }

  static async sendMiaToSponsor(req, res) {
    const result = await PortalService.sendMiaToSponsor(req.params.sponsorId, req.user, req.body || {});
    res.json(result);
  }

  static async previewSponsorshipPackage(req, res) {
    const result = await PortalService.previewSponsorshipPackage(req.params.sponsorId, req.user, req.body || {});
    res.json(result);
  }

  static async sendSponsorshipPackage(req, res) {
    const result = await PortalService.sendSponsorshipPackage(req.params.sponsorId, req.user, req.body || {});
    res.json(result);
  }
}
