import express from 'express';
import { authenticate, authorize, requireRole } from '../middleware/auth.js';
import Job from '../models/Job.js';
import JobApplication from '../models/JobApplication.js';

const router = express.Router();

// Get active jobs, sorted by ANZSCO match if student
router.get('/', authenticate, async (req, res) => {
  try {
    let jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    
    // If student, prioritize ANZSCO matches
    if (req.user.role === 'STUDENT' && req.user.profile?.anzscoCode) {
      jobs = jobs.sort((a, b) => {
        const aMatch = a.anzscoCode === req.user.profile.anzscoCode ? 1 : 0;
        const bMatch = b.anzscoCode === req.user.profile.anzscoCode ? 1 : 0;
        return bMatch - aMatch;
      });
    }

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Employer Dashboard: Get Jobs + Applications
router.get('/employer/dashboard', authenticate, requireRole('EMPLOYER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'EMPLOYER') {
      filter = { postedBy: req.user._id };
    }
    const jobs = await Job.find(filter).lean();
    
    // Attach applications to each job
    for (let job of jobs) {
      const apps = await JobApplication.find({ jobId: job._id })
        .populate('studentId', 'profile.firstName profile.lastName email')
        .sort({ createdAt: -1 });
      job.applications = apps;
    }
    
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update application status
router.patch('/applications/:id/status', authenticate, requireRole('EMPLOYER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const app = await JobApplication.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(app);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Student: Get my applications
router.get('/my-applications', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const apps = await JobApplication.find({ studentId: req.user._id })
      .populate('jobId')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student: Apply to a job
router.post('/:id/apply', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const { resumeUrl, coverLetterUrl } = req.body;
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const exists = await JobApplication.findOne({ studentId: req.user._id, jobId: job._id });
    if (exists) return res.status(400).json({ error: 'Already applied for this job' });

    const app = await JobApplication.create({
      jobId: job._id,
      studentId: req.user._id,
      resumeUrl,
      coverLetterUrl
    });
    res.status(201).json(app);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get single job
router.get('/:id', authenticate, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create job (Admin/Agent/Employer)
router.post('/', authenticate, authorize('SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'AGENT', 'SPONSOR', 'EMPLOYER'), async (req, res) => {
  try {
    const job = new Job({ ...req.body, postedBy: req.user.id });
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
