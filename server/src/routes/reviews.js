import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Review from '../models/Review.js';

const router = express.Router();

// Get reviews for a consultancy
router.get('/consultancy/:id', async (req, res) => {
  try {
    const reviews = await Review.find({ consultancyId: req.params.id, isApproved: true })
      .populate('studentId', 'profile.firstName profile.lastName profile.avatar')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Post a review (Student)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT') return res.status(403).json({ error: 'Only students can review' });
    
    // Prevent multiple reviews
    const existing = await Review.findOne({ studentId: req.user.id, consultancyId: req.body.consultancyId });
    if (existing) return res.status(400).json({ error: 'You have already reviewed this consultancy' });

    const review = new Review({ ...req.body, studentId: req.user.id });
    await review.save();
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
