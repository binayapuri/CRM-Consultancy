import mongoose from 'mongoose';

const consultancyCampaignLogSchema = new mongoose.Schema(
  {
    consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    campaignKey: { type: String, default: 'CUSTOM_BULK_EMAIL', index: true },
    campaignLabel: { type: String, default: 'Custom Bulk Email' },
    channel: { type: String, enum: ['EMAIL'], default: 'EMAIL' },
    audienceCount: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    openedCount: { type: Number, default: 0 },
    subject: { type: String, default: '' },
    bodySnapshot: { type: String, default: '' },
    recipientClientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Client' }],
    recipientEmails: [{ type: String }],
    metadata: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true }
);

consultancyCampaignLogSchema.index({ consultancyId: 1, createdAt: -1 });

export default mongoose.model('ConsultancyCampaignLog', consultancyCampaignLogSchema);
