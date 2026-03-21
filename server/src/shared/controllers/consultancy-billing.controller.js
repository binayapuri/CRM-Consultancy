import { ConsultancyBillingService } from '../services/consultancy-billing.service.js';

export class ConsultancyBillingController {
  static async getAll(req, res) {
    const rows = await ConsultancyBillingService.getAll(req.user, req.query);
    res.json(rows);
  }

  static async create(req, res) {
    const row = await ConsultancyBillingService.create(req.user, req.body);
    res.status(201).json(row);
  }

  static async update(req, res) {
    const row = await ConsultancyBillingService.update(req.params.id, req.user, req.body, { consultancyId: req.query.consultancyId });
    res.json(row);
  }

  static async delete(req, res) {
    const result = await ConsultancyBillingService.cancel(req.params.id, req.user, { consultancyId: req.query.consultancyId });
    res.json(result);
  }

  static async pdf(req, res) {
    const { doc, pdf } = await ConsultancyBillingService.getPdf(req.params.id, req.user, { consultancyId: req.query.consultancyId });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.documentNumber}.pdf"`);
    res.send(pdf);
  }

  static async send(req, res) {
    const result = await ConsultancyBillingService.send(req.params.id, req.user, req.body || {}, { consultancyId: req.query.consultancyId });
    res.json(result);
  }
}
