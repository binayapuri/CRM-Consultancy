import { JobService } from '../services/job.service.js';

export class JobController {
  static async getPublicJobs(req, res) {
    const jobs = await JobService.getPublicJobs(req.query);
    res.json(jobs);
  }

  static async getActiveJobs(req, res) {
    const jobs = await JobService.getActiveJobs(req.user, req.query);
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
    const job = await JobService.createJob(req.body, req.user);
    res.status(201).json(job);
  }

  static async updateJob(req, res) {
    const job = await JobService.updateJob(req.params.id, req.user, req.body);
    res.json(job);
  }

  static async closeJob(req, res) {
    const job = await JobService.closeJob(req.params.id, req.user);
    res.json(job);
  }

  static async listRecruiterEmployers(req, res) {
    const rows = await JobService.listRecruiterEmployers(req.user);
    res.json(rows);
  }

  static async createRecruiterEmployer(req, res) {
    const row = await JobService.createRecruiterEmployer(req.user, req.body);
    res.status(201).json(row);
  }

  static async updateRecruiterEmployer(req, res) {
    const row = await JobService.updateRecruiterEmployer(req.user, req.params.id, req.body);
    res.json(row);
  }

  static async deleteRecruiterEmployer(req, res) {
    const row = await JobService.deleteRecruiterEmployer(req.user, req.params.id);
    res.json(row);
  }

  static async getSavedJobs(req, res) {
    const jobs = await JobService.getSavedJobs(req.user._id);
    res.json(jobs);
  }

  static async saveJob(req, res) {
    const saved = await JobService.saveJob(req.user._id, req.params.id);
    res.status(201).json(saved);
  }

  static async unsaveJob(req, res) {
    await JobService.unsaveJob(req.user._id, req.params.id);
    res.json({ success: true });
  }

  static async getJobAlerts(req, res) {
    const alerts = await JobService.getJobAlerts(req.user._id);
    res.json(alerts);
  }

  static async createJobAlert(req, res) {
    const alert = await JobService.createJobAlert(req.user._id, req.body);
    res.status(201).json(alert);
  }

  static async deleteJobAlert(req, res) {
    await JobService.deleteJobAlert(req.user._id, req.params.id);
    res.json({ success: true });
  }
}
