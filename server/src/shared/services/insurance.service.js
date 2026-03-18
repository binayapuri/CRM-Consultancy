import InsuranceProvider from '../../shared/models/InsuranceProvider.js';
import InsurancePlan from '../../shared/models/InsurancePlan.js';
import InsuranceApplication from '../../shared/models/InsuranceApplication.js';

export class InsuranceService {
  static async getMarketplace() {
    const plans = await InsurancePlan.find({ isActive: true }).populate({
      path: 'providerId',
      match: { verificationStatus: 'VERIFIED' },
      select: 'companyName logoUrl verificationStatus'
    });
    return plans.filter(p => p.providerId !== null);
  }

  static async applyForPlan(studentId, data) {
    const { planId, notes } = data;
    const exist = await InsuranceApplication.findOne({ 
      studentId, 
      status: { $in: ['APPLIED', 'PENDING_PAYMENT', 'APPROVED', 'ACTIVE'] } 
    });
    if (exist) throw Object.assign(new Error('You already have an active or pending insurance application.'), { status: 400 });

    return InsuranceApplication.create({ studentId, planId, notes });
  }

  static async getMyApplications(studentId) {
    return InsuranceApplication.find({ studentId })
      .populate({ path: 'planId', populate: { path: 'providerId' } })
      .sort({ createdAt: -1 });
  }

  static async manageApplications(user) {
    if (user.role === 'SUPER_ADMIN') {
      return InsuranceApplication.find().populate('studentId planId').sort({ createdAt: -1 });
    }
    const providerId = user.profile?.insuranceProviderId;
    const plans = await InsurancePlan.find({ providerId }).select('_id');
    const planIds = plans.map(p => p._id);
    return InsuranceApplication.find({ planId: { $in: planIds } })
      .populate('studentId')
      .populate('planId')
      .sort({ createdAt: -1 });
  }

  static async updateApplicationStatus(id, data) {
    const { status, policyNumber, startDate, endDate } = data;
    return InsuranceApplication.findByIdAndUpdate(
      id, 
      { status, policyNumber, startDate, endDate }, 
      { new: true }
    );
  }
}
