import VisaTimeline from '../../shared/models/VisaTimeline.js';

export class VisaService {
  static async getMyTimeline(studentId) {
    let timeline = await VisaTimeline.findOne({ studentId });
    if (!timeline) {
      timeline = await VisaTimeline.create({
        studentId,
        currentStage: 'EXPLORING',
        milestones: [
          { title: 'Research Options', description: 'Explore suitable visas and universities.', status: 'COMPLETED', priority: 'HIGH' },
          { title: 'English Test', description: 'Secure required IELTS or PTE score.', status: 'PENDING', priority: 'HIGH' },
          { title: 'Skills Assessment', description: 'Verify qualifications for chosen ANZSCO.', status: 'PENDING', priority: 'MEDIUM' },
          { title: 'Lodge EOI', description: 'Submit Expression of Interest.', status: 'PENDING', priority: 'HIGH' }
        ]
      });
    }
    return timeline;
  }

  static async updateMilestone(milestoneId, status, user) {
    let filter = {};
    if (user.role === 'STUDENT') {
      filter = { studentId: user._id, 'milestones._id': milestoneId };
    } else {
      filter = { 'milestones._id': milestoneId };
    }

    const timeline = await VisaTimeline.findOneAndUpdate(
      filter,
      { $set: { 'milestones.$.status': status } },
      { new: true }
    );
    if (!timeline) throw Object.assign(new Error('Timeline or milestone not found'), { status: 404 });
    return timeline;
  }
}
