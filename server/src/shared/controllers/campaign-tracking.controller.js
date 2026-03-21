import { CampaignTrackingService } from '../services/campaign-tracking.service.js';

export class CampaignTrackingController {
  static async emailOpen(req, res) {
    await CampaignTrackingService.trackOpen(req.params.token);
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.end(CampaignTrackingService.getTrackingPixel(), 'binary');
  }
}
