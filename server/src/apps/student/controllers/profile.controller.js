import { StudentProfileService } from '../services/profile.service.js';

export class StudentProfileController {
  static async getProfile(req, res) {
    const result = await StudentProfileService.getProfile(req.user._id);
    res.json(result);
  }

  static async updateProfile(req, res) {
    const result = await StudentProfileService.updateProfile(req.user._id, req.body);
    res.json(result);
  }

  static async updateAvatar(req, res) {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const result = await StudentProfileService.updateAvatar(req.user._id, req.file.filename);
    res.json(result);
  }

  static async changePassword(req, res) {
    const result = await StudentProfileService.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword);
    res.json(result);
  }

  static async updateStatement(req, res) {
    const result = await StudentProfileService.updateStatement(req.user._id, req.body.initialStatement);
    res.json(result);
  }

  // Family Members
  static async getFamilyMembers(req, res) {
    const result = await StudentProfileService.getFamilyMembers(req.user._id);
    res.json(result);
  }

  static async addFamilyMember(req, res) {
    const result = await StudentProfileService.addFamilyMember(req.user._id, req.body);
    res.status(201).json(result);
  }

  static async updateFamilyMember(req, res) {
    const result = await StudentProfileService.updateFamilyMember(req.user._id, req.params.memberId, req.body);
    res.json(result);
  }

  static async deleteFamilyMember(req, res) {
    const result = await StudentProfileService.deleteFamilyMember(req.user._id, req.params.memberId);
    res.json(result);
  }

  // Addresses
  static async getAddresses(req, res) {
    const result = await StudentProfileService.getAddresses(req.user._id);
    res.json(result);
  }

  static async updateCurrentAddress(req, res) {
    const result = await StudentProfileService.updateCurrentAddress(req.user._id, req.body);
    res.json(result);
  }

  static async addPreviousAddress(req, res) {
    const result = await StudentProfileService.addPreviousAddress(req.user._id, req.body);
    res.status(201).json(result);
  }

  static async updatePreviousAddress(req, res) {
    const result = await StudentProfileService.updatePreviousAddress(req.user._id, req.params.entryId, req.body);
    res.json(result);
  }

  static async deletePreviousAddress(req, res) {
    const result = await StudentProfileService.deletePreviousAddress(req.user._id, req.params.entryId);
    res.json(result);
  }

  // Notes
  static async getNotes(req, res) {
    const result = await StudentProfileService.getNotes(req.user._id);
    res.json(result);
  }

  static async addNote(req, res) {
    const result = await StudentProfileService.addNote(req.user._id, req.body);
    res.status(201).json(result);
  }

  static async updateNote(req, res) {
    const result = await StudentProfileService.updateNote(req.user._id, req.params.noteId, req.body);
    res.json(result);
  }

  static async deleteNote(req, res) {
    const result = await StudentProfileService.deleteNote(req.user._id, req.params.noteId);
    res.json(result);
  }
}
