import { JobService } from '../services/job.service.js';

export class JobController {
  static async getActiveJobs(req, res) {
    const jobs = await JobService.getActiveJobs(req.user);
    res.json(jobs);
  }

  static async getEmployerDashboard(req, res) {
    const jobs = await JobService.getEmployerDashboard(req.user);
    res.json(jobs);
  }

  static async updateApplicationStatus(req, res) {
    const app = await JobService.updateApplicationStatus(req.params.id, req.body.status);
    res.json(app);
  }

  static async getMyApplications(req, res) {
    const apps = await JobService.getMyApplications(req.user._id);
    res.json(apps);
  }

  static async applyToJob(req, res) {
    const app = await JobService.applyToJob(req.params.id, req.user._id, req.body);
    res.status(201).json(app);
  }

  static async getJobById(req, res) {
    const job = await JobService.getJobById(req.params.id);
    res.json(job);
  }

  static async createJob(req, res) {
    const job = await JobService.createJob(req.body, req.user.id);
    res.status(201).json(job);
  }
}
