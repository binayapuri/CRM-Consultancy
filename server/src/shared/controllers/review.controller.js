import { ReviewService } from '../services/review.service.js';

export class ReviewController {
  static async getConsultancyReviews(req, res) {
    const reviews = await ReviewService.getConsultancyReviews(req.params.id);
    res.json(reviews);
  }

  static async postReview(req, res) {
    if (req.user.role !== 'STUDENT') return res.status(403).json({ error: 'Only students can review' });
    const review = await ReviewService.postReview(req.user.id, req.body);
    res.status(201).json(review);
  }
}
