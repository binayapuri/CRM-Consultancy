import mongoose from 'mongoose';

const communityPostSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: [String], // e.g. 'visa', 'university', 'accommodation'
  location: String, // e.g. 'Sydney', 'Melbourne'
  university: String, // e.g. 'UNSW', 'Monash'
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false },
  status: { type: String, enum: ['ACTIVE', 'LOCKED', 'DELETED'], default: 'ACTIVE' }
}, { timestamps: true });

export default mongoose.model('CommunityPost', communityPostSchema);
