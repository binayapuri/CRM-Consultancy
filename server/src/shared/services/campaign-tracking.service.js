import ConsultancyCampaignLog from '../models/ConsultancyCampaignLog.js';
import ConsultancyCampaignRecipientLog from '../models/ConsultancyCampaignRecipientLog.js';

const TRACKING_PIXEL_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
  'base64'
);

export class CampaignTrackingService {
  static getTrackingPixel() {
    return TRACKING_PIXEL_GIF;
  }

  static async trackOpen(token) {
    if (!token) return false;

    const recipient = await ConsultancyCampaignRecipientLog.findOne({ openToken: token });
    if (!recipient) return false;
    if (recipient.openedAt) return true;

    recipient.openedAt = new Date();
    if (recipient.status !== 'FAILED') recipient.status = 'OPENED';
    await recipient.save();

    await ConsultancyCampaignLog.updateOne(
      { _id: recipient.campaignLogId },
      { $inc: { openedCount: 1 } }
    );

    return true;
  }
}
