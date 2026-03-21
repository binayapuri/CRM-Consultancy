import Review from '../../shared/models/Review.js';

export class ReviewService {
  static async getConsultancyReviews(consultancyId) {
    return Review.find({ consultancyId, isApproved: true })
      .populate('studentId', 'profile.firstName profile.lastName profile.avatar')
      .sort({ createdAt: -1 });
  }

  static async postReview(studentId, data) {
    const { consultancyId } = data;
    const existing = await Review.findOne({ studentId, consultancyId });
    if (existing) throw Object.assign(new Error('You have already reviewed this consultancy'), { status: 400 });

    const review = new Review({ ...data, studentId });
    return review.save();
  }
}
