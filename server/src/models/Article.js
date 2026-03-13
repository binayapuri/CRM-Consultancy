import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  content: { type: String, required: true },
  summary: String,
  coverImage: String,
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional, could be admin
  category: { type: String, enum: ['NEWS', 'VISA_UPDATE', 'GUIDE', 'SUCCESS_STORY'], default: 'NEWS' },
  tags: [String],
  isPublished: { type: Boolean, default: false },
  publishedAt: Date,
  views: { type: Number, default: 0 }
}, { timestamps: true });

articleSchema.pre('save', function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
  next();
});

export default mongoose.model('Article', articleSchema);
