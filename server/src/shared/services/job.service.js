import Job from '../models/Job.js';
import JobApplication from '../models/JobApplication.js';
import RecruiterEmployerProfile from '../models/RecruiterEmployerProfile.js';
import SavedJob from '../models/SavedJob.js';
import JobAlert from '../models/JobAlert.js';
import Notification from '../models/Notification.js';

export class JobService {
  static async getActiveJobs(user, query = {}) {
    const q = { isActive: true, moderationState: { $ne: 'REMOVED' } };
    if (query.search) {
      const rx = new RegExp(String(query.search).trim(), 'i');
      q.$or = [{ title: rx }, { company: rx }, { location: rx }, { tags: rx }];
    }
    if (query.location) q.location = new RegExp(String(query.location), 'i');
    if (query.type) q.type = String(query.type);
    if (query.visaSponsorship === 'true') q.visaSponsorshipAvailable = true;
    if (query.workRights) q.workRights = { $in: [String(query.workRights)] };

    let jobs = await Job.find(q).sort({ createdAt: -1 }).lean();
    
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
    } else if (user.role === 'RECRUITER') {
      filter = { postedBy: user._id, postedByRole: 'RECRUITER' };
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
    const app = await JobApplication.findByIdAndUpdate(id, { status }, { new: true });
    if (app?.studentId) {
      await Notification.create({
        userId: app.studentId,
        type: 'JOB_APPLICATION_UPDATE',
        title: 'Your job application was updated',
        message: `Application status changed to ${status}`,
        relatedEntityType: 'JobApplication',
        relatedEntityId: app._id,
      });
    }
    return app;
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

    const created = await JobApplication.create({
      jobId: job._id,
      studentId,
      resumeUrl,
      coverLetterUrl
    });
    if (job.postedBy) {
      await Notification.create({
        userId: job.postedBy,
        type: 'NEW_JOB_APPLICATION',
        title: 'New application received',
        message: `${job.title} has a new applicant.`,
        relatedEntityType: 'Job',
        relatedEntityId: job._id,
      });
    }
    return created;
  }

  static async getJobById(id) {
    const job = await Job.findById(id);
    if (!job) throw Object.assign(new Error('Job not found'), { status: 404 });
    return job;
  }

  static async createJob(data, postedBy) {
    const payload = { ...data };
    if (!payload.company && postedBy.role === 'EMPLOYER') {
      payload.company = postedBy.profile?.companyName || postedBy.profile?.organisation || 'Employer';
    }
    if (postedBy.role === 'RECRUITER') {
      if (!payload.recruiterEmployerProfileId) {
        throw Object.assign(new Error('Recruiter must select an employer profile'), { status: 400 });
      }
      const profile = await RecruiterEmployerProfile.findOne({
        _id: payload.recruiterEmployerProfileId,
        recruiterId: postedBy._id,
        isActive: true,
      });
      if (!profile) throw Object.assign(new Error('Recruiter employer profile not found'), { status: 404 });
      payload.company = profile.companyName;
    }
    if (!payload.company) throw Object.assign(new Error('Company is required'), { status: 400 });
    const job = new Job({ ...payload, postedBy: postedBy._id, postedByRole: postedBy.role });
    return job.save();
  }

  static async listRecruiterEmployers(user) {
    if (user.role !== 'RECRUITER' && user.role !== 'SUPER_ADMIN') {
      throw Object.assign(new Error('Only recruiters can access employer profiles'), { status: 403 });
    }
    const q = user.role === 'SUPER_ADMIN' ? {} : { recruiterId: user._id };
    return RecruiterEmployerProfile.find(q).sort({ createdAt: -1 });
  }

  static async createRecruiterEmployer(user, data) {
    if (user.role !== 'RECRUITER' && user.role !== 'SUPER_ADMIN') {
      throw Object.assign(new Error('Only recruiters can create employer profiles'), { status: 403 });
    }
    const recruiterId = user.role === 'SUPER_ADMIN' && data.recruiterId ? data.recruiterId : user._id;
    return RecruiterEmployerProfile.create({
      recruiterId,
      companyName: String(data.companyName || '').trim(),
      abn: data.abn || '',
      contactName: data.contactName || '',
      contactEmail: data.contactEmail || '',
      contactPhone: data.contactPhone || '',
      website: data.website || '',
      address: data.address || '',
      isActive: data.isActive !== false,
    });
  }

  static async updateRecruiterEmployer(user, id, data) {
    const row = await RecruiterEmployerProfile.findById(id);
    if (!row) throw Object.assign(new Error('Employer profile not found'), { status: 404 });
    if (user.role !== 'SUPER_ADMIN' && String(row.recruiterId) !== String(user._id)) {
      throw Object.assign(new Error('Not allowed'), { status: 403 });
    }
    Object.assign(row, {
      companyName: data.companyName ?? row.companyName,
      abn: data.abn ?? row.abn,
      contactName: data.contactName ?? row.contactName,
      contactEmail: data.contactEmail ?? row.contactEmail,
      contactPhone: data.contactPhone ?? row.contactPhone,
      website: data.website ?? row.website,
      address: data.address ?? row.address,
      isActive: data.isActive ?? row.isActive,
    });
    await row.save();
    return row;
  }

  static async deleteRecruiterEmployer(user, id) {
    const row = await RecruiterEmployerProfile.findById(id);
    if (!row) throw Object.assign(new Error('Employer profile not found'), { status: 404 });
    if (user.role !== 'SUPER_ADMIN' && String(row.recruiterId) !== String(user._id)) {
      throw Object.assign(new Error('Not allowed'), { status: 403 });
    }
    row.isActive = false;
    await row.save();
    return { success: true };
  }

  static async getSavedJobs(userId) {
    const saved = await SavedJob.find({ userId }).populate('jobId').sort({ createdAt: -1 });
    return saved.filter(s => s.jobId).map(s => s.jobId);
  }

  static async saveJob(userId, jobId) {
    const job = await Job.findById(jobId);
    if (!job) throw Object.assign(new Error('Job not found'), { status: 404 });
    const existing = await SavedJob.findOne({ userId, jobId });
    if (existing) return existing;
    return SavedJob.create({ userId, jobId });
  }

  static async unsaveJob(userId, jobId) {
    await SavedJob.deleteOne({ userId, jobId });
    return { success: true };
  }

  static async getJobAlerts(userId) {
    return JobAlert.find({ userId }).sort({ createdAt: -1 });
  }

  static async createJobAlert(userId, data) {
    const User = (await import('../models/User.js')).default;
    const email = data.email || (await User.findById(userId).select('email').lean())?.email;
    if (!email) throw Object.assign(new Error('Email is required for job alerts'), { status: 400 });
    return JobAlert.create({
      userId,
      keywords: data.keywords || '',
      location: data.location || '',
      jobType: data.jobType || undefined,
      visaSponsorship: data.visaSponsorship === true,
      email,
      isActive: true,
    });
  }

  static async deleteJobAlert(userId, id) {
    const alert = await JobAlert.findOne({ _id: id, userId });
    if (!alert) throw Object.assign(new Error('Alert not found'), { status: 404 });
    await JobAlert.deleteOne({ _id: id });
    return { success: true };
  }
}
