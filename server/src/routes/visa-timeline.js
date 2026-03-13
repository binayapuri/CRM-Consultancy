import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import VisaTimeline from '../models/VisaTimeline.js';
import User from '../models/User.js';

const router = express.Router();

// Get the student's timeline
router.get('/my-timeline', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    let timeline = await VisaTimeline.findOne({ studentId: req.user._id });
    if (!timeline) {
      // Create a default timeline if none exists
      timeline = await VisaTimeline.create({
        studentId: req.user._id,
        currentStage: 'EXPLORING',
        milestones: [
          { title: 'Research Options', description: 'Explore suitable visas and universities.', status: 'COMPLETED', priority: 'HIGH' },
          { title: 'English Test', description: 'Secure required IELTS or PTE score.', status: 'PENDING', priority: 'HIGH' },
          { title: 'Skills Assessment', description: 'Verify qualifications for chosen ANZSCO.', status: 'PENDING', priority: 'MEDIUM' },
          { title: 'Lodge EOI', description: 'Submit Expression of Interest.', status: 'PENDING', priority: 'HIGH' }
        ]
      });
    }
    res.json(timeline);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update milestone status (Student or Agent)
router.patch('/milestones/:milestoneId', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    let filter = {};
    if (req.user.role === 'STUDENT') filter = { studentId: req.user._id, 'milestones._id': req.params.milestoneId };
    else filter = { 'milestones._id': req.params.milestoneId }; // Agents/Admins

    const timeline = await VisaTimeline.findOneAndUpdate(
      filter,
      { $set: { 'milestones.$.status': status } },
      { new: true }
    );
    if (!timeline) return res.status(404).json({ error: 'Timeline or milestone not found' });
    res.json(timeline);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
