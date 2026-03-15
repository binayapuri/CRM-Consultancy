import mongoose from 'mongoose';

const newsCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

newsCategorySchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
  next();
});

export default mongoose.model('NewsCategory', newsCategorySchema);
