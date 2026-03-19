import { DocumentService } from '../services/document.service.js';

export class DocumentController {
  static async getAll(req, res) {
    const docs = await DocumentService.getAll(req.user, req.query);
    res.json(docs);
  }

  static async create(req, res) {
    const doc = await DocumentService.create(req.body, req.user);
    res.status(201).json(doc);
  }

  static async upload(req, res) {
    const doc = await DocumentService.upload(req.file, req.body, req.user);
    res.status(201).json(doc);
  }

  static async bulkUpload(req, res) {
    const docs = await DocumentService.bulkUpload(req.files || [], req.body, req.user);
    res.status(201).json(docs);
  }

  static async update(req, res) {
    const doc = await DocumentService.update(req.params.id, req.body, req.user);
    res.json(doc);
  }

  static async delete(req, res) {
    const result = await DocumentService.delete(req.params.id, req.user);
    res.json(result);
  }

  static async getVersions(req, res) {
    const docs = await DocumentService.getVersions(req.params.id, req.user);
    res.json(docs);
  }

  static async getChecklist(req, res) {
    const items = DocumentService.getChecklist(req.params.visaSubclass);
    res.json(items);
  }
}
