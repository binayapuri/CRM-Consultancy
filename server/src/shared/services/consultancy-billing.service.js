import ConsultancyBilling from '../models/ConsultancyBilling.js';
import ConsultancyBillingCounter from '../models/ConsultancyBillingCounter.js';
import Client from '../models/Client.js';
import Application from '../models/Application.js';
import Consultancy from '../models/Consultancy.js';
import { renderInvoicePdfBuffer } from '../utils/invoicePdf.js';
import { sendEmail } from '../utils/email.js';
import { logAudit } from '../utils/audit.js';
import { WorkflowAutomationService } from './workflow-automation.service.js';

const getConsultancyId = (user, explicitConsultancyId) => {
  if (user.role === 'SUPER_ADMIN' && explicitConsultancyId) return explicitConsultancyId;
  return user.profile?.consultancyId || user._id;
};

function computeTotals({ lineItems, gstEnabled, gstRate }) {
  const items = Array.isArray(lineItems) ? lineItems : [];
  const normalized = items.map((li) => {
    const quantity = Number(li.quantity ?? 0) || 0;
    const unitPrice = Number(li.unitPrice ?? 0) || 0;
    const amount = Math.round(quantity * unitPrice * 100) / 100;
    return {
      description: String(li.description || ''),
      quantity,
      unit: String(li.unit || 'items'),
      unitPrice,
      amount,
    };
  });
  const subtotal = Math.round(normalized.reduce((s, li) => s + (Number(li.amount) || 0), 0) * 100) / 100;
  const rate = typeof gstRate === 'number' ? gstRate : 0.1;
  const gstAmount = gstEnabled ? Math.round(subtotal * rate * 100) / 100 : 0;
  const total = Math.round((subtotal + gstAmount) * 100) / 100;
  return { normalized, subtotal, gstAmount, total, gstRate: rate };
}

async function nextDocumentNumber(consultancyId, documentType) {
  const year = new Date().getFullYear();
  const doc = await ConsultancyBillingCounter.findOneAndUpdate(
    { consultancyId, year, documentType },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const prefix = documentType === 'QUOTE' ? 'QUO' : 'INV';
  const orgKey = String(consultancyId).slice(-4).toUpperCase();
  return `${prefix}-${year}-${orgKey}-${String(doc.seq || 1).padStart(4, '0')}`;
}

function getEmailProfile(consultancy) {
  const profiles = consultancy.emailProfiles || [];
  const active = profiles.filter((p) => p.active);
  return active.find((p) => p.isDefault) || active[0] || null;
}

export class ConsultancyBillingService {
  static async getAll(user, query) {
    const consultancyId = getConsultancyId(user, query.consultancyId);
    const filter = { consultancyId };
    if (query.documentType) filter.documentType = query.documentType;
    if (query.status) filter.status = query.status;
    if (query.clientId) filter.clientId = query.clientId;
    if (query.applicationId) filter.applicationId = query.applicationId;
    const rows = await ConsultancyBilling.find(filter)
      .populate('clientId', 'profile')
      .populate('applicationId', 'visaSubclass status')
      .sort({ createdAt: -1 })
      .lean();
    const q = String(query.q || '').trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const hay = [
        row.documentNumber,
        row.title,
        row.documentType,
        row.status,
        row.customer?.name,
        row.customer?.email,
        row.clientId?.profile?.firstName,
        row.clientId?.profile?.lastName,
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  static async create(user, data) {
    const consultancyId = getConsultancyId(user, data.consultancyId);
    const [consultancy, client, application] = await Promise.all([
      Consultancy.findById(consultancyId),
      Client.findOne({ _id: data.clientId, consultancyId }),
      data.applicationId ? Application.findOne({ _id: data.applicationId, consultancyId }) : null,
    ]);
    if (!consultancy) throw Object.assign(new Error('Consultancy not found'), { status: 404 });
    if (!client) throw Object.assign(new Error('Client not found'), { status: 404 });
    const issueDate = data.issueDate ? new Date(data.issueDate) : new Date();
    const dueDate = data.dueDate ? new Date(data.dueDate) : null;
    const validUntil = data.validUntil ? new Date(data.validUntil) : null;
    const gstEnabled = !!data.gstEnabled;
    const { normalized, subtotal, gstAmount, total, gstRate } = computeTotals({
      lineItems: data.lineItems,
      gstEnabled,
      gstRate: data.gstRate,
    });
    const documentNumber = await nextDocumentNumber(consultancyId, data.documentType);
    const supplier = {
      name: consultancy.displayName || consultancy.name || '',
      abn: consultancy.abn || '',
      email: consultancy.email || '',
      phone: consultancy.phone || '',
      address: consultancy.address || {},
    };
    const customer = {
      name: `${client.profile?.firstName || ''} ${client.profile?.lastName || ''}`.trim(),
      abn: client.profile?.abn || '',
      email: client.profile?.email || '',
      phone: client.profile?.phone || '',
      address: client.profile?.address || {},
    };
    const payment = {
      bankName: consultancy.bankDetails?.bank || '',
      bsb: consultancy.bankDetails?.bsb || '',
      accountNumber: consultancy.bankDetails?.accountNumber || '',
      accountName: consultancy.bankDetails?.accountName || '',
      reference: `${documentNumber} / ${customer.name || 'Client'}`.trim(),
    };
    const created = await ConsultancyBilling.create({
      consultancyId,
      clientId: client._id,
      applicationId: application?._id,
      createdBy: user._id,
      documentType: data.documentType,
      status: 'DRAFT',
      documentNumber,
      title: String(data.title || `${data.documentType === 'QUOTE' ? 'Professional Services Quote' : 'Professional Services Invoice'} - ${customer.name}`).trim(),
      issueDate,
      dueDate: data.documentType === 'INVOICE' ? dueDate : null,
      validUntil: data.documentType === 'QUOTE' ? validUntil : null,
      supplier,
      customer,
      payment,
      currency: 'AUD',
      gstEnabled,
      gstRate,
      lineItems: normalized,
      subtotal,
      gstAmount,
      total,
      notes: data.notes || '',
    });
    await logAudit(consultancyId, 'ConsultancyBilling', created._id, 'CREATE', user._id, {
      description: `${data.documentType} created: ${created.documentNumber}`,
      clientId: client._id,
      applicationId: application?._id,
      visaSubclass: application?.visaSubclass,
    });
    return created;
  }

  static async update(id, user, data, options = {}) {
    const consultancyId = getConsultancyId(user, options.consultancyId);
    const doc = await ConsultancyBilling.findOne({ _id: id, consultancyId });
    if (!doc) throw Object.assign(new Error('Billing record not found'), { status: 404 });
    const allowed = ['title', 'notes', 'status', 'gstEnabled', 'gstRate'];
    allowed.forEach((key) => {
      if (data[key] !== undefined) doc[key] = data[key];
    });
    if (data.issueDate) doc.issueDate = new Date(data.issueDate);
    if (data.dueDate !== undefined) doc.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.validUntil !== undefined) doc.validUntil = data.validUntil ? new Date(data.validUntil) : null;
    if (data.lineItems) {
      const { normalized, subtotal, gstAmount, total, gstRate } = computeTotals({
        lineItems: data.lineItems,
        gstEnabled: doc.gstEnabled,
        gstRate: doc.gstRate,
      });
      doc.lineItems = normalized;
      doc.subtotal = subtotal;
      doc.gstAmount = gstAmount;
      doc.total = total;
      doc.gstRate = gstRate;
    }
    if (data.status === 'ACCEPTED' && !doc.acceptedAt) doc.acceptedAt = new Date();
    if (data.status === 'PAID' && !doc.paidAt) doc.paidAt = new Date();
    await doc.save();
    await logAudit(consultancyId, 'ConsultancyBilling', doc._id, 'UPDATE', user._id, {
      description: `${doc.documentType} updated: ${doc.documentNumber}`,
      clientId: doc.clientId,
      applicationId: doc.applicationId,
    });
    return doc;
  }

  static async cancel(id, user, options = {}) {
    const consultancyId = getConsultancyId(user, options.consultancyId);
    const doc = await ConsultancyBilling.findOne({ _id: id, consultancyId });
    if (!doc) throw Object.assign(new Error('Billing record not found'), { status: 404 });
    doc.status = 'CANCELLED';
    await doc.save();
    await logAudit(consultancyId, 'ConsultancyBilling', doc._id, 'DELETE', user._id, {
      description: `${doc.documentType} cancelled: ${doc.documentNumber}`,
      clientId: doc.clientId,
      applicationId: doc.applicationId,
    });
    return { success: true };
  }

  static async getPdf(id, user, options = {}) {
    const consultancyId = getConsultancyId(user, options.consultancyId);
    const doc = await ConsultancyBilling.findOne({ _id: id, consultancyId });
    if (!doc) throw Object.assign(new Error('Billing record not found'), { status: 404 });
    const pdf = await renderInvoicePdfBuffer(doc);
    return { doc, pdf };
  }

  static async send(id, user, body = {}, options = {}) {
    const consultancyId = getConsultancyId(user, options.consultancyId);
    const [doc, consultancy] = await Promise.all([
      ConsultancyBilling.findOne({ _id: id, consultancyId }),
      Consultancy.findById(consultancyId),
    ]);
    if (!doc) throw Object.assign(new Error('Billing record not found'), { status: 404 });
    if (!consultancy) throw Object.assign(new Error('Consultancy not found'), { status: 404 });
    const to = String(body.to || doc.customer?.email || '').trim();
    if (!to) throw Object.assign(new Error('Client email is required'), { status: 400 });
    const subject = String(body.subject || `${doc.documentType} ${doc.documentNumber} from ${doc.supplier?.name || 'Consultancy'}`).trim();
    const text = String(body.text || `Hello,\n\nPlease find attached ${doc.documentType.toLowerCase()} ${doc.documentNumber}.\n\nRegards,\n${doc.supplier?.name || 'Consultancy'}`).trim();
    const pdf = await renderInvoicePdfBuffer(doc);
    await sendEmail({
      to,
      subject,
      text,
      attachments: [{ filename: `${doc.documentNumber}.pdf`, content: pdf, contentType: 'application/pdf' }],
      emailProfile: getEmailProfile(consultancy) || undefined,
      replyTo: consultancy.email || undefined,
    });
    doc.status = 'SENT';
    doc.emailLog = { to, subject, sentAt: new Date() };
    await doc.save();
    await logAudit(consultancyId, 'ConsultancyBilling', doc._id, 'SEND', user._id, {
      description: `${doc.documentType} sent: ${doc.documentNumber}`,
      clientId: doc.clientId,
      applicationId: doc.applicationId,
    });
    await WorkflowAutomationService.onBillingSent({
      document: doc,
      consultancyId,
      actorUserId: user._id,
    });
    return { success: true };
  }
}
