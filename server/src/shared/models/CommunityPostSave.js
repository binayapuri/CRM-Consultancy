import mongoose from 'mongoose';

const communityPostSaveSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', required: true },
  },
  { timestamps: true }
);

communityPostSaveSchema.index({ userId: 1, postId: 1 }, { unique: true });
communityPostSaveSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('CommunityPostSave', communityPostSaveSchema);
