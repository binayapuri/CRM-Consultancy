import { ConsultancyService } from '../services/consultancy.service.js';

export class ConsultancyController {
  static async uploadSignature(req, res) {
    const cid = req.user.profile?.consultancyId;
    if (!req.file) throw Object.assign(new Error('No file uploaded'), { status: 400 });
    const fileUrl = `/uploads/${req.file.filename}`;
    const result = await ConsultancyService.uploadSignature(cid, fileUrl);
    res.json(result);
  }

  static async uploadConsumerGuide(req, res) {
    const cid = req.user.profile?.consultancyId;
    if (!req.file) throw Object.assign(new Error('No file uploaded'), { status: 400 });
    const fileUrl = `/uploads/${req.file.filename}`;
    const result = await ConsultancyService.uploadConsumerGuide(cid, fileUrl);
    res.json(result);
  }

  static async getAll(req, res) {
    const result = await ConsultancyService.getAllConsultancies(req.user);
    res.json(result);
  }

  static async search(req, res) {
    const result = await ConsultancyService.searchConsultancies(req.query);
    res.json(result);
  }

  static async getMe(req, res) {
    let cid = req.user.profile?.consultancyId;
    if (req.user.role === 'SUPER_ADMIN' && req.query.consultancyId) cid = req.query.consultancyId;
    if (!cid) throw Object.assign(new Error('No consultancy assigned'), { status: 404 });
    const result = await ConsultancyService.getConsultancyById(cid);
    res.json(result);
  }

  static async getById(req, res) {
    const result = await ConsultancyService.getConsultancyById(req.params.id);
    res.json(result);
  }

  static async getOverview(req, res) {
    const result = await ConsultancyService.getOverview(req.params.id);
    res.json(result);
  }

  static async register(req, res) {
    // Schema guarantees all fields exist
    const result = await ConsultancyService.registerConsultancy(req.body);
    res.status(201).json(result);
  }

  static async create(req, res) {
    const result = await ConsultancyService.createConsultancy(req.body);
    res.status(201).json(result);
  }

  static async updateMe(req, res) {
    let cid = req.user.profile?.consultancyId;
    if (req.user.role === 'SUPER_ADMIN' && req.body.consultancyId) {
      cid = req.body.consultancyId;
      delete req.body.consultancyId;
    }
    if (!cid) throw Object.assign(new Error('No consultancy assigned. Use consultancyId in body when Super Admin.'), { status: 404 });
    const result = await ConsultancyService.updateOwnConsultancy(cid, req.body);
    res.json(result);
  }

  static async updateById(req, res) {
    const cid = req.user.profile?.consultancyId;
    if (['CONSULTANCY_ADMIN', 'MANAGER'].includes(req.user.role) && cid?.toString() !== req.params.id) {
       throw Object.assign(new Error('Can only update your own consultancy'), { status: 403 });
    }
    const result = await ConsultancyService.updateConsultancyById(req.params.id, req.body);
    res.json(result);
  }

  static async delete(req, res) {
    const result = await ConsultancyService.deleteConsultancy(req.params.id);
    res.json(result);
  }
}
