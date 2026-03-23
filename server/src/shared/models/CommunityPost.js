import mongoose from 'mongoose';

const communityPostSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  images: [{ url: { type: String, required: true } }],
  linkUrl: String,
  linkPreview: {
    title: String,
    description: String,
    image: String,
  },
  tags: [String], // e.g. 'visa', 'university', 'accommodation'
  category: { type: String, enum: ['ROOM_RENT', 'JOB_HELP', 'COMMUNITY_SUPPORT', 'STUDY_HELP', 'GENERAL'], default: 'GENERAL' },
  location: String, // e.g. 'Sydney', 'Melbourne'
  university: String, // e.g. 'UNSW', 'Monash'
  contactPreference: { type: String, enum: ['IN_APP_MESSAGE', 'EMAIL', 'PHONE'], default: 'IN_APP_MESSAGE' },
  price: Number,
  priceType: { type: String, enum: ['FIXED', 'NEGOTIABLE', 'FREE'], default: 'FIXED' },
  suburb: String,
  state: String,
  moderationFlags: [String],
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false },
  status: { type: String, enum: ['ACTIVE', 'LOCKED', 'DELETED'], default: 'ACTIVE' }
}, { timestamps: true });

export default mongoose.model('CommunityPost', communityPostSchema);
