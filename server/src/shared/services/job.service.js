import Job from '../../shared/models/Job.js';
import JobApplication from '../../shared/models/JobApplication.js';

export class JobService {
  static async getActiveJobs(user) {
    let jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    
    if (user.role === 'STUDENT' && user.profile?.anzscoCode) {
      jobs = jobs.sort((a, b) => {
        const aMatch = a.anzscoCode === user.profile.anzscoCode ? 1 : 0;
        const bMatch = b.anzscoCode === user.profile.anzscoCode ? 1 : 0;
        return bMatch - aMatch;
      });
    }
    return jobs;
  }

  static async getEmployerDashboard(user) {
    let filter = {};
    if (user.role === 'EMPLOYER') {
      filter = { postedBy: user._id };
    }
    const jobs = await Job.find(filter).lean();
    
    for (let job of jobs) {
      const apps = await JobApplication.find({ jobId: job._id })
        .populate('studentId', 'profile.firstName profile.lastName email')
        .sort({ createdAt: -1 });
      job.applications = apps;
    }
    return jobs;
  }

  static async updateApplicationStatus(id, status) {
    return JobApplication.findByIdAndUpdate(id, { status }, { new: true });
  }

  static async getMyApplications(studentId) {
    return JobApplication.find({ studentId })
      .populate('jobId')
      .sort({ createdAt: -1 });
  }

  static async applyToJob(jobId, studentId, data) {
    const { resumeUrl, coverLetterUrl } = data;
    const job = await Job.findById(jobId);
    if (!job) throw Object.assign(new Error('Job not found'), { status: 404 });

    const exists = await JobApplication.findOne({ studentId, jobId: job._id });
    if (exists) throw Object.assign(new Error('Already applied for this job'), { status: 400 });

    return JobApplication.create({
      jobId: job._id,
      studentId,
      resumeUrl,
      coverLetterUrl
    });
  }

  static async getJobById(id) {
    const job = await Job.findById(id);
    if (!job) throw Object.assign(new Error('Job not found'), { status: 404 });
    return job;
  }

  static async createJob(data, postedBy) {
    const job = new Job({ ...data, postedBy });
    return job.save();
  }
}
