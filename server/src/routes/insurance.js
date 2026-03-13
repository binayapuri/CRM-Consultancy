import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import InsuranceProvider from '../models/InsuranceProvider.js';
import InsurancePlan from '../models/InsurancePlan.js';
import InsuranceApplication from '../models/InsuranceApplication.js';

const router = express.Router();

// Public: Get all verified providers and their plans
router.get('/marketplace', async (req, res) => {
  try {
    const plans = await InsurancePlan.find({ isActive: true }).populate({
      path: 'providerId',
      match: { verificationStatus: 'VERIFIED' },
      select: 'companyName logoUrl verificationStatus'
    });
    // Filter out plans where the provider isn't verified
    const activePlans = plans.filter(p => p.providerId !== null);
    res.json(activePlans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student: Apply/Purchase a plan
router.post('/apply', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const { planId, notes } = req.body;
    
    // Check if already applied or active
    const exist = await InsuranceApplication.findOne({ studentId: req.user._id, status: { $in: ['APPLIED', 'PENDING_PAYMENT', 'APPROVED', 'ACTIVE'] } });
    if (exist) return res.status(400).json({ error: 'You already have an active or pending insurance application.' });

    const app = await InsuranceApplication.create({
      studentId: req.user._id,
      planId,
      notes
    });
    res.status(201).json(app);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Student: Get my applications
router.get('/my-applications', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const apps = await InsuranceApplication.find({ studentId: req.user._id })
      .populate({ path: 'planId', populate: { path: 'providerId' } })
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Partner: Manage applications
router.get('/partner/applications', authenticate, requireRole('INSURANCE_PARTNER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    let apps = [];
    if (req.user.role === 'SUPER_ADMIN') {
      apps = await InsuranceApplication.find().populate('studentId planId').sort({ createdAt: -1 });
    } else {
      const providerId = req.user.profile?.insuranceProviderId;
      // Get all applications for plans that belong to this provider
      const plans = await InsurancePlan.find({ providerId }).select('_id');
      const planIds = plans.map(p => p._id);
      apps = await InsuranceApplication.find({ planId: { $in: planIds } })
        .populate('studentId')
        .populate('planId')
        .sort({ createdAt: -1 });
    }
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Partner: Update Status (Issue Policy)
router.patch('/partner/applications/:id/status', authenticate, requireRole('INSURANCE_PARTNER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { status, policyNumber, startDate, endDate } = req.body;
    const app = await InsuranceApplication.findByIdAndUpdate(
      req.params.id, 
      { status, policyNumber, startDate, endDate }, 
      { new: true }
    );
    res.json(app);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
