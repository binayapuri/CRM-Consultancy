import mongoose from 'mongoose';

const communityFollowSchema = new mongoose.Schema(
  {
    followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    followingId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

communityFollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
communityFollowSchema.index({ followerId: 1 });

export default mongoose.model('CommunityFollow', communityFollowSchema);
