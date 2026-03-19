import mongoose from 'mongoose';

const consultancyCampaignRecipientLogSchema = new mongoose.Schema(
  {
    campaignLogId: { type: mongoose.Schema.Types.ObjectId, ref: 'ConsultancyCampaignLog', required: true, index: true },
    consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy', required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', index: true },
    email: { type: String, required: true, index: true },
    subject: { type: String, default: '' },
    messageId: { type: String, default: '' },
    openToken: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ['SENT', 'OPENED', 'FAILED'], default: 'SENT', index: true },
    sentAt: { type: Date, default: Date.now },
    openedAt: Date,
    errorMessage: { type: String, default: '' },
  },
  { timestamps: true }
);

consultancyCampaignRecipientLogSchema.index({ consultancyId: 1, campaignLogId: 1, createdAt: -1 });

export default mongoose.model('ConsultancyCampaignRecipientLog', consultancyCampaignRecipientLogSchema);
