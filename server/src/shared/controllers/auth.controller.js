import { AuthService } from '../services/auth.service.js';

export class AuthController {
  static async forgotPassword(req, res) {
    const result = await AuthService.forgotPassword(req.body.email);
    res.json(result);
  }

  static async resetPassword(req, res) {
    const { email, token, newPassword } = req.body;
    const result = await AuthService.resetPassword(email, token, newPassword);
    res.json(result);
  }

  static async sendOtp(req, res) {
    const result = await AuthService.sendOtp(req.body.phone);
    res.json(result);
  }

  static async verifyOtp(req, res) {
    const { phone, code } = req.body;
    const result = await AuthService.verifyOtp(phone, code);
    res.json(result);
  }

  static async register(req, res) {
    const result = await AuthService.register(req.body);
    res.status(201).json(result);
  }

  static async login(req, res) {
    const result = await AuthService.login(req.body.email, req.body.password);
    res.json(result);
  }

  static async getMe(req, res) {
    const linkedAccounts = await AuthService.getLinkedAccountsForUser(req.user);
    const u = req.user.toObject ? req.user.toObject() : { ...req.user };
    if (u.password) delete u.password;
    res.json({ ...u, linkedAccounts });
  }

  static async switchAccount(req, res) {
    const result = await AuthService.switchToUser(req.user, req.body.userId);
    res.json(result);
  }

  static async updateMe(req, res) {
    const user = await AuthService.updateMe(req.user, req.body);
    res.json(user);
  }

  static async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    const result = await AuthService.changePassword(req.user, currentPassword, newPassword);
    res.json(result);
  }

  static async updateAvatar(req, res) {
    const user = await AuthService.updateAvatar(req.user, req.file);
    res.json(user);
  }

  static async getPermissions(req, res) {
    const perms = await AuthService.getPermissions(req.user);
    res.json(perms);
  }
}
