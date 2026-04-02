import { ClientService } from '../services/client.service.js';

export class ClientController {
  static async getAll(req, res) {
    const data = await ClientService.getAll(req.user, req.query.consultancyId);
    res.json(data);
  }

  static async previewBulkEmail(req, res) {
    const data = await ClientService.previewBulkEmail(req.body, req.user);
    res.json(data);
  }

  static async campaignAudience(req, res) {
    const data = await ClientService.getCampaignAudience(req.body, req.user);
    res.json(data);
  }

  static async campaignHistory(req, res) {
    const data = await ClientService.getCampaignHistory(req.user, req.query);
    res.json(data);
  }

  static async sendBulkEmail(req, res) {
    const data = await ClientService.sendBulkEmail(req.body, req.user);
    res.json(data);
  }

  static async getTasks(req, res) {
    const data = await ClientService.getTasks(req.params.id, req.user);
    res.json(data);
  }

  static async getActivity(req, res) {
    const data = await ClientService.getActivity(req.params.id, req.user);
    res.json(data);
  }

  static async getById(req, res) {
    const data = await ClientService.getById(req.params.id, req.user);
    res.json(data);
  }

  static async getApplications(req, res) {
    const data = await ClientService.getApplications(req.params.id, req.user);
    res.json(data);
  }

  static async create(req, res) {
    const data = await ClientService.create(req.body, req.user);
    res.status(201).json(data);
  }

  static async update(req, res) {
    const data = await ClientService.update(req.params.id, req.body, req.user);
    res.json(data);
  }

  static async delete(req, res) {
    const data = await ClientService.delete(req.params.id, req.user);
    res.json(data);
  }

  static async removeFromPortal(req, res) {
    const data = await ClientService.removeFromPortal(req.params.id, req.user);
    res.json(data);
  }

  static async acceptAccess(req, res) {
    const data = await ClientService.acceptAccess(req.params.id, req.user);
    res.json(data);
  }

  static async invite(req, res) {
    const data = await ClientService.invite(req.params.id, req.user);
    res.json(data);
  }

  static async disconnectAgent(req, res) {
    const data = await ClientService.disconnectAgent(req.params.id, req.user);
    res.json(data);
  }

  static async addSkillAssessment(req, res) {
    const data = await ClientService.addSkillAssessment(req.params.id, req.body, req.user);
    res.json(data);
  }

  static async updateSkillAssessment(req, res) {
    const data = await ClientService.updateSkillAssessment(req.params.id, req.params.idx, req.body, req.user);
    res.json(data);
  }

  static async addImmigrationHistory(req, res) {
    const data = await ClientService.addImmigrationHistory(req.params.id, req.body, req.user);
    res.json(data);
  }

  static async updateImmigrationHistory(req, res) {
    const data = await ClientService.updateImmigrationHistory(req.params.id, req.params.idx, req.body, req.user);
    res.json(data);
  }

  static async addActivity(req, res) {
    if (!req.body?.text?.trim()) throw Object.assign(new Error('Activity text is required'), { status: 400 });
    const data = await ClientService.addActivity(req.params.id, req.body, req.user);
    res.status(201).json(data);
  }

  static async updateActivity(req, res) {
    const data = await ClientService.updateActivity(req.params.id, req.params.aid, req.body, req.user);
    res.json(data);
  }

  static async deleteActivity(req, res) {
    const data = await ClientService.deleteActivity(req.params.id, req.params.aid, req.user);
    res.json(data);
  }

  static async addNote(req, res) {
    const data = await ClientService.addNote(req.params.id, req.body, req.user);
    res.json(data);
  }

  static async updateNote(req, res) {
    const data = await ClientService.updateNote(req.params.id, req.params.idx, req.body, req.user);
    res.json(data);
  }

  static async deleteNote(req, res) {
    const data = await ClientService.deleteNote(req.params.id, req.params.idx, req.user);
    res.json(data);
  }

  static async updateProfile(req, res) {
    const data = await ClientService.updateNestedProfile(req.params.id, req.body, 'profile');
    res.json(data);
  }

  static async updateProfileStatement(req, res) {
    const data = await ClientService.updateNestedProfile(req.params.id, { initialStatement: req.body.initialStatement }, null);
    res.json({ initialStatement: data.initialStatement });
  }

  static async updateImmigration(req, res) {
    // Legacy maps to profile again 
    const data = await ClientService.updateNestedProfile(req.params.id, req.body, 'profile');
    res.json(data);
  }

  static async updateEnglishTest(req, res) {
    const data = await ClientService.updateNestedProfile(req.params.id, req.body, 'englishTest');
    res.json(data);
  }

  static async updateCurrentAddress(req, res) {
    const data = await ClientService.updateNestedProfile(req.params.id, { address: req.body }, 'profile');
    res.json(data.address);
  }

  static async addPreviousAddress(req, res) {
    const data = await ClientService.appendArrayItem(req.params.id, req.body, 'previousAddresses');
    res.json(data);
  }

  static async deletePreviousAddress(req, res) {
    const data = await ClientService.deleteArrayItem(req.params.id, req.params.addrId, 'previousAddresses');
    res.json(data);
  }

  static async addEducation(req, res) {
    const data = await ClientService.appendArrayItem(req.params.id, req.body, 'education');
    res.json(data);
  }

  static async deleteEducation(req, res) {
    const data = await ClientService.deleteArrayItem(req.params.id, req.params.eduId, 'education');
    res.json(data);
  }

  static async addExperience(req, res) {
    const data = await ClientService.appendArrayItem(req.params.id, req.body, 'experience');
    res.json(data);
  }

  static async deleteExperience(req, res) {
    const data = await ClientService.deleteArrayItem(req.params.id, req.params.expId, 'experience');
    res.json(data);
  }

  static async addTravelHistory(req, res) {
    const data = await ClientService.appendArrayItem(req.params.id, req.body, 'travelHistory');
    res.json(data);
  }

  static async deleteTravelHistory(req, res) {
    const data = await ClientService.deleteArrayItem(req.params.id, req.params.travId, 'travelHistory');
    res.json(data);
  }

  static async addFamilyMember(req, res) {
    const data = await ClientService.appendArrayItem(req.params.id, req.body, 'familyMembers');
    res.json(data);
  }

  static async deleteFamilyMember(req, res) {
    const data = await ClientService.deleteArrayItem(req.params.id, req.params.memId, 'familyMembers');
    res.json(data);
  }

  static async updateSkills(req, res) {
    const data = await ClientService.updateNestedProfile(req.params.id, { skillsData: req.body }, null);
    res.json(data);
  }

  static async updateHealth(req, res) {
    const data = await ClientService.updateNestedProfile(req.params.id, { healthData: req.body }, null);
    res.json(data);
  }
}
