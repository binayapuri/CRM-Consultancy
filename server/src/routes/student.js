/**
 * /api/student/* — Student self-service API
 * All routes require STUDENT role, scoped to the authenticated user only.
 * No consultancyId dependency — students own their data.
 */
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate, requireRole } from '../middleware/auth.js';
import User from '../models/User.js';
import Client from '../models/Client.js';
import Document from '../models/Document.js';
import StudentEmployer from '../models/StudentEmployer.js';
import Invoice from '../models/Invoice.js';
import InvoiceCounter from '../models/InvoiceCounter.js';
import { renderInvoicePdfBuffer } from '../utils/invoicePdf.js';
import { encryptStudentSecret, sendStudentMail } from '../utils/mailer.js';
import archiver from 'archiver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `student-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router();

// All routes require STUDENT role
router.use(authenticate);
router.use((req, res, next) => {
  if (req.user.role !== 'STUDENT' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Student portal only' });
  }
  next();
});

// ─── Helper: Get or create the student's self-owned Client record ────────────
async function getOrCreateStudentClient(userId, userProfile) {
  let client = await Client.findOne({ userId });
  if (!client) {
    // Create a minimal self-owned client record.
    // consultancyId is a placeholder ObjectId (student-owned)
    const mongoose = (await import('mongoose')).default;
    const STUDENT_OWNED_CONSULTANCY = new mongoose.Types.ObjectId('000000000000000000000000');
    const safeFirstName = (userProfile?.firstName && String(userProfile.firstName).trim()) ? String(userProfile.firstName).trim() : 'Student';
    const safeLastName = (userProfile?.lastName && String(userProfile.lastName).trim()) ? String(userProfile.lastName).trim() : 'User';
    const safeEmail = (userProfile?.email && String(userProfile.email).trim())
      ? String(userProfile.email).trim()
      : `${String(userId)}@orivisa.local`;
    client = await Client.create({
      userId,
      consultancyId: STUDENT_OWNED_CONSULTANCY,
      profile: {
        firstName: safeFirstName,
        lastName: safeLastName,
        email: safeEmail,
        phone: userProfile?.phone || '',
      },
    });
  } else {
    // Keep client profile basics in sync (non-destructive)
    const patch = {};
    if (userProfile?.firstName && !client.profile?.firstName) patch['profile.firstName'] = userProfile.firstName;
    if (userProfile?.lastName && !client.profile?.lastName) patch['profile.lastName'] = userProfile.lastName;
    if (userProfile?.phone && !client.profile?.phone) patch['profile.phone'] = userProfile.phone;
    if (userProfile?.email && !client.profile?.email) patch['profile.email'] = userProfile.email;
    if (Object.keys(patch).length) {
      client = await Client.findByIdAndUpdate(client._id, { $set: patch }, { new: true });
    }
  }
  return client;
}

// ─── GET /api/student/profile ─────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const baseProfile = { ...(user?.profile || {}), email: user?.email || user?.profile?.email || '' };
    const client = await getOrCreateStudentClient(req.user._id, baseProfile);
    // Ensure client.profile.email is populated for the UI
    if (user?.email && (!client?.profile?.email || client.profile.email !== user.email)) {
      const updatedClient = await Client.findByIdAndUpdate(
        client._id,
        { $set: { 'profile.email': user.email } },
        { new: true }
      );
      return res.json({ user, client: updatedClient });
    }
    res.json({ user, client });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/student/profile — Update User.profile ────────────────────────
router.patch('/profile', async (req, res) => {
  try {
    const { firstName, lastName, phone, dob, gender, nationality, countryOfBirth,
      maritalStatus, passportNumber, passportExpiry, passportCountry, address } = req.body;

    const update = {};
    if (firstName !== undefined) update['profile.firstName'] = firstName;
    if (lastName !== undefined) update['profile.lastName'] = lastName;
    if (phone !== undefined) update['profile.phone'] = phone;

    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true }).select('-password');

    // Also sync client profile
    const baseProfile = { ...(user?.profile || {}), email: user?.email || user?.profile?.email || '' };
    const client = await getOrCreateStudentClient(req.user._id, baseProfile);
    const clientUpdate = {};
    const pFields = [
      'firstName',
      'lastName',
      'phone',
      'dob',
      'gender',
      'nationality',
      'countryOfBirth',
      'maritalStatus',
      'passportNumber',
      'passportExpiry',
      'passportCountry',
      'address',
      // invoicing basics
      'businessName',
      'abn',
      'gstRegistered',
    ];
    pFields.forEach(f => {
      if (req.body[f] !== undefined) {
        if (f === 'dob' || f === 'passportExpiry') clientUpdate[`profile.${f}`] = req.body[f] ? new Date(req.body[f]) : null;
        else clientUpdate[`profile.${f}`] = req.body[f];
      }
    });
    // Always keep email available on client.profile for the UI
    if (user?.email) clientUpdate['profile.email'] = user.email;

    const updatedClient = await Client.findByIdAndUpdate(client._id, { $set: clientUpdate }, { new: true });
    res.json({ user, client: updatedClient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Invoice Manager (student scoped)
// ─────────────────────────────────────────────────────────────────────────────

function computeInvoiceTotals({ lineItems, gstEnabled, gstRate }) {
  const items = Array.isArray(lineItems) ? lineItems : [];
  const normalized = items.map((li) => {
    const quantity = Number(li.quantity ?? 0) || 0;
    const unitPrice = Number(li.unitPrice ?? 0) || 0;
    const amount = Math.round(quantity * unitPrice * 100) / 100;
    return {
      description: String(li.description || ''),
      quantity,
      unit: String(li.unit || 'hours'),
      unitPrice,
      amount,
    };
  });
  const subtotal = Math.round(normalized.reduce((s, li) => s + (Number(li.amount) || 0), 0) * 100) / 100;
  const gstR = typeof gstRate === 'number' ? gstRate : 0.1;
  const gstAmount = gstEnabled ? Math.round(subtotal * gstR * 100) / 100 : 0;
  const total = Math.round((subtotal + gstAmount) * 100) / 100;
  return { normalized, subtotal, gstAmount, total, gstRate: gstR };
}

async function nextInvoiceNumberForUser(userId) {
  const year = new Date().getFullYear();
  const doc = await InvoiceCounter.findOneAndUpdate(
    { userId, year },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const seq = doc.seq || 1;
  // AU practice: invoice numbers must be unique per supplier and not reused.
  // No single mandated format, so we use a stable supplier-specific prefix + yearly sequence:
  // INV-YYYY-<USERKEY>-0001 (globally unique across students)
  const userKey = String(userId).slice(-4).toUpperCase();
  return `INV-${year}-${userKey}-${String(seq).padStart(4, '0')}`;
}

// Employers CRUD
router.get('/employers', async (req, res) => {
  try {
    const rows = await StudentEmployer.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/employers', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.companyName || !String(body.companyName).trim()) {
      return res.status(400).json({ error: 'Company name is required' });
    }
    const created = await StudentEmployer.create({
      userId: req.user._id,
      companyName: String(body.companyName).trim(),
      abn: body.abn || '',
      contactName: body.contactName || '',
      email: body.email || '',
      phone: body.phone || '',
      address: body.address || {},
      isActive: body.isActive !== false,
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/employers/:id', async (req, res) => {
  try {
    const updated = await StudentEmployer.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body || {} },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Employer not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/employers/:id', async (req, res) => {
  try {
    const employer = await StudentEmployer.findOne({ _id: req.params.id, userId: req.user._id });
    if (!employer) return res.status(404).json({ error: 'Employer not found' });
    const invoiceCount = await Invoice.countDocuments({ userId: req.user._id, employerId: employer._id });
    if (invoiceCount > 0) {
      return res.status(400).json({
        error: `You have ${invoiceCount} invoice(s) linked to this employer. Delete/cancel invoices first, or keep the employer for history.`,
      });
    }
    await employer.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Invoices CRUD
router.get('/invoices', async (req, res) => {
  try {
    const q = { userId: req.user._id };
    if (req.query.status) q.status = String(req.query.status);
    if (req.query.employerId) q.employerId = String(req.query.employerId);
    if (req.query.from || req.query.to) {
      q.createdAt = {};
      if (req.query.from) q.createdAt.$gte = new Date(String(req.query.from));
      if (req.query.to) q.createdAt.$lte = new Date(String(req.query.to));
    }
    const rows = await Invoice.find(q).sort({ createdAt: -1 });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/invoices/export', async (req, res) => {
  try {
    const q = { userId: req.user._id };
    if (req.query.status) q.status = String(req.query.status);
    if (req.query.employerId) q.employerId = String(req.query.employerId);
    if (req.query.from || req.query.to) {
      // Export filters are based on issueDate for user expectation
      q.issueDate = {};
      if (req.query.from) q.issueDate.$gte = new Date(String(req.query.from));
      if (req.query.to) q.issueDate.$lte = new Date(String(req.query.to));
    }

    const rows = await Invoice.find(q).sort({ issueDate: -1 });

    const today = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="invoices-export-${today}.zip"`);

    const zip = archiver('zip', { zlib: { level: 9 } });
    zip.on('error', (err) => {
      try {
        res.status(500).end();
      } catch { }
      throw err;
    });
    zip.pipe(res);

    // Summary CSV
    const csvHeader = [
      'invoiceNumber',
      'status',
      'issueDate',
      'dueDate',
      'employerName',
      'employerEmail',
      'supplierName',
      'gstEnabled',
      'subtotal',
      'gstAmount',
      'total',
    ];
    const esc = (v) => {
      const s = v == null ? '' : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csvLines = [csvHeader.join(',')];
    rows.forEach((inv) => {
      csvLines.push([
        inv.invoiceNumber,
        inv.status,
        inv.issueDate ? new Date(inv.issueDate).toISOString().slice(0, 10) : '',
        inv.dueDate ? new Date(inv.dueDate).toISOString().slice(0, 10) : '',
        inv.customer?.name || '',
        inv.customer?.email || '',
        inv.supplier?.name || '',
        inv.gstEnabled ? 'yes' : 'no',
        inv.subtotal ?? 0,
        inv.gstAmount ?? 0,
        inv.total ?? 0,
      ].map(esc).join(','));
    });
    zip.append(csvLines.join('\n'), { name: 'summary.csv' });

    // PDFs
    for (const inv of rows) {
      const pdf = await renderInvoicePdfBuffer(inv);
      zip.append(pdf, { name: `invoices/${inv.invoiceNumber}.pdf` });
    }

    await zip.finalize();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/invoices', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.employerId) return res.status(400).json({ error: 'Employer is required' });

    const employer = await StudentEmployer.findOne({ _id: body.employerId, userId: req.user._id });
    if (!employer) return res.status(404).json({ error: 'Employer not found' });

    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const supplierName =
      String(body.supplier?.name || '').trim()
      || String(client?.profile?.businessName || '').trim()
      || `${client?.profile?.firstName || ''} ${client?.profile?.lastName || ''}`.trim();

    const supplier = {
      name: supplierName,
      abn: String(body.supplier?.abn || client?.profile?.abn || '').trim(),
      email: String(body.supplier?.email || client?.profile?.email || req.user.email || '').trim(),
      phone: String(body.supplier?.phone || client?.profile?.phone || '').trim(),
      address: body.supplier?.address || client?.profile?.address || {},
    };
    const payment = client?.profile?.invoiceSettings?.payment || {};

    const customer = {
      name: employer.companyName,
      abn: employer.abn || '',
      email: employer.email || '',
      phone: employer.phone || '',
      address: employer.address || {},
    };

    const issueDate = body.issueDate ? new Date(body.issueDate) : new Date();
    const dueDate = body.dueDate ? new Date(body.dueDate) : null;
    const gstEnabled = !!body.gstEnabled;
    const gstRate = body.gstRate != null ? Number(body.gstRate) : 0.1;

    const { normalized, subtotal, gstAmount, total } = computeInvoiceTotals({
      lineItems: body.lineItems,
      gstEnabled,
      gstRate,
    });
    if (!normalized.length) return res.status(400).json({ error: 'At least one line item is required' });

    const invoiceNumber = await nextInvoiceNumberForUser(req.user._id);

    const created = await Invoice.create({
      userId: req.user._id,
      employerId: employer._id,
      status: 'DRAFT',
      invoiceNumber,
      issueDate,
      dueDate,
      period: body.period || {},
      supplier,
      customer,
      payment: {
        bankName: payment.bankName || '',
        bsb: payment.bsb || '',
        accountNumber: payment.accountNumber || '',
        accountName: payment.accountName || '',
        payIdType: payment.payIdType || '',
        payId: payment.payId || '',
        reference: payment.reference || '',
      },
      currency: 'AUD',
      gstEnabled,
      gstRate,
      lineItems: normalized,
      subtotal,
      gstAmount,
      total,
      notes: body.notes || '',
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/invoices/:id/duplicate', async (req, res) => {
  try {
    const inv = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });

    const dueDays = req.body?.dueDays != null ? Number(req.body.dueDays) : 14;
    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + (Number.isFinite(dueDays) ? dueDays : 14));

    const invoiceNumber = await nextInvoiceNumberForUser(req.user._id);
    const created = await Invoice.create({
      userId: req.user._id,
      employerId: inv.employerId,
      status: 'DRAFT',
      invoiceNumber,
      issueDate,
      dueDate,
      period: inv.period || {},
      supplier: inv.supplier || {},
      customer: inv.customer || {},
      payment: inv.payment || {},
      currency: inv.currency || 'AUD',
      gstEnabled: !!inv.gstEnabled,
      gstRate: typeof inv.gstRate === 'number' ? inv.gstRate : 0.1,
      lineItems: Array.isArray(inv.lineItems) ? inv.lineItems : [],
      subtotal: inv.subtotal || 0,
      gstAmount: inv.gstAmount || 0,
      total: inv.total || 0,
      notes: inv.notes || '',
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/invoices/:id', async (req, res) => {
  try {
    const body = req.body || {};
    const inv = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });

    // Restrict what can be patched
    const allowed = ['status', 'dueDate', 'issueDate', 'notes', 'period', 'gstEnabled', 'gstRate', 'lineItems'];
    allowed.forEach((k) => {
      if (body[k] !== undefined) inv[k] = body[k];
    });

    // Validate safe status transitions
    if (body.status) {
      const next = String(body.status);
      const cur = String(inv.status);
      const allowedTransitions = new Set([
        'DRAFT->SENT',
        'SENT->PAID',
        'DRAFT->CANCELLED',
        'SENT->CANCELLED',
        'PAID->CANCELLED',
      ]);
      if (next !== cur && !allowedTransitions.has(`${cur}->${next}`)) {
        return res.status(400).json({ error: `Invalid status transition: ${cur} → ${next}` });
      }
      inv.status = next;
    }

    if (body.issueDate) inv.issueDate = new Date(body.issueDate);
    if (body.dueDate) inv.dueDate = new Date(body.dueDate);

    if (body.lineItems) {
      const { normalized, subtotal, gstAmount, total, gstRate } = computeInvoiceTotals({
        lineItems: body.lineItems,
        gstEnabled: inv.gstEnabled,
        gstRate: inv.gstRate,
      });
      inv.lineItems = normalized;
      inv.subtotal = subtotal;
      inv.gstAmount = gstAmount;
      inv.total = total;
      inv.gstRate = gstRate;
    }

    await inv.save();
    res.json(inv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/invoices/:id', async (req, res) => {
  try {
    const inv = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    inv.status = 'CANCELLED';
    await inv.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/invoices/:id/pdf', async (req, res) => {
  try {
    const inv = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    const buf = await renderInvoicePdfBuffer(inv);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${inv.invoiceNumber}.pdf"`);
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/invoices/:id/send', async (req, res) => {
  try {
    const inv = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    const to = String(req.body?.to || inv.customer?.email || '').trim();
    if (!to) return res.status(400).json({ error: 'Employer email is required' });
    const subject = String(req.body?.subject || `Invoice ${inv.invoiceNumber} from ${inv.supplier?.name || 'BIGFEW'}`).trim();
    const text = String(req.body?.text || `Hi,\n\nPlease find attached invoice ${inv.invoiceNumber}.\n\nRegards,\n${inv.supplier?.name || ''}`).trim();

    const pdf = await renderInvoicePdfBuffer(inv);
    await sendStudentMail(req.user._id, {
      to,
      subject,
      text,
      attachments: [{ filename: `${inv.invoiceNumber}.pdf`, content: pdf, contentType: 'application/pdf' }],
    });

    inv.status = 'SENT';
    inv.emailLog = { to, subject, sentAt: new Date() };
    await inv.save();
    res.json({ success: true });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message });
  }
});

// Student invoice settings (SMTP + payment details)
router.get('/invoice-settings', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const smtp = client?.profile?.invoiceSettings?.smtp || {};
    const payment = client?.profile?.invoiceSettings?.payment || {};
    // Never return password (encrypted or decrypted)
    res.json({
      smtp: {
        enabled: !!smtp.enabled,
        host: smtp.host || '',
        port: smtp.port || 587,
        secure: !!smtp.secure,
        user: smtp.user || '',
        from: smtp.from || '',
        hasPassword: !!smtp.passEnc,
      },
      payment: {
        bankName: payment.bankName || '',
        bsb: payment.bsb || '',
        accountNumber: payment.accountNumber || '',
        accountName: payment.accountName || '',
        payIdType: payment.payIdType || '',
        payId: payment.payId || '',
        reference: payment.reference || '',
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/invoice-settings', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const smtpIn = req.body?.smtp || {};
    const paymentIn = req.body?.payment || {};

    const update = {};
    if (smtpIn) {
      if (smtpIn.enabled !== undefined) update['profile.invoiceSettings.smtp.enabled'] = !!smtpIn.enabled;
      if (smtpIn.host !== undefined) update['profile.invoiceSettings.smtp.host'] = String(smtpIn.host || '');
      if (smtpIn.port !== undefined) update['profile.invoiceSettings.smtp.port'] = Number(smtpIn.port || 587);
      if (smtpIn.secure !== undefined) update['profile.invoiceSettings.smtp.secure'] = !!smtpIn.secure;
      if (smtpIn.user !== undefined) update['profile.invoiceSettings.smtp.user'] = String(smtpIn.user || '');
      if (smtpIn.from !== undefined) update['profile.invoiceSettings.smtp.from'] = String(smtpIn.from || '');
      if (smtpIn.password) update['profile.invoiceSettings.smtp.passEnc'] = encryptStudentSecret(String(smtpIn.password));
    }

    if (paymentIn) {
      const p = 'profile.invoiceSettings.payment';
      if (paymentIn.bankName !== undefined) update[`${p}.bankName`] = String(paymentIn.bankName || '');
      if (paymentIn.bsb !== undefined) update[`${p}.bsb`] = String(paymentIn.bsb || '');
      if (paymentIn.accountNumber !== undefined) update[`${p}.accountNumber`] = String(paymentIn.accountNumber || '');
      if (paymentIn.accountName !== undefined) update[`${p}.accountName`] = String(paymentIn.accountName || '');
      if (paymentIn.payIdType !== undefined) update[`${p}.payIdType`] = String(paymentIn.payIdType || '');
      if (paymentIn.payId !== undefined) update[`${p}.payId`] = String(paymentIn.payId || '');
      if (paymentIn.reference !== undefined) update[`${p}.reference`] = String(paymentIn.reference || '');
    }

    const updated = await Client.findByIdAndUpdate(client._id, { $set: update }, { new: true });
    const smtp = updated?.profile?.invoiceSettings?.smtp || {};
    const payment = updated?.profile?.invoiceSettings?.payment || {};
    res.json({
      smtp: {
        enabled: !!smtp.enabled,
        host: smtp.host || '',
        port: smtp.port || 587,
        secure: !!smtp.secure,
        user: smtp.user || '',
        from: smtp.from || '',
        hasPassword: !!smtp.passEnc,
      },
      payment: {
        bankName: payment.bankName || '',
        bsb: payment.bsb || '',
        accountNumber: payment.accountNumber || '',
        accountName: payment.accountName || '',
        payIdType: payment.payIdType || '',
        payId: payment.payId || '',
        reference: payment.reference || '',
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/student/profile/avatar ─────────────────────────────────────────
router.post('/profile/avatar', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, { 'profile.avatar': fileUrl }, { new: true }).select('-password');
    res.json({ user, avatarUrl: fileUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/student/points — Load saved PR calculator data ───────────────────
export async function getPointsHandler(req, res) {
  try {
    const user = await User.findById(req.user._id).select('profile');
    const baseProfile = { ...(user?.profile || {}), email: user?.email || user?.profile?.email || '' };
    const client = await getOrCreateStudentClient(req.user._id, baseProfile);
    const pointsData = client.pointsData || {};
    res.json({ pointsData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ─── PATCH /api/student/points — Save PR calculator inputs and total ───────────
export async function savePointsHandler(req, res) {
  // #region agent log
  fetch('http://127.0.0.1:7746/ingest/ebf2a8b6-d58b-4377-b39c-003055b4ec8c', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '6e5329' }, body: JSON.stringify({ sessionId: '6e5329', location: 'student.js:savePointsHandler:entry', message: 'handler entered', data: { userId: req.user?._id?.toString(), hasBody: !!req.body, bodyKeys: req.body ? Object.keys(req.body) : [] }, timestamp: Date.now(), hypothesisId: 'H3' }) }).catch(() => { });
  // #endregion
  try {
    const user = await User.findById(req.user._id).select('profile');
    const baseProfile = { ...(user?.profile || {}), email: user?.email || user?.profile?.email || '' };
    const client = await getOrCreateStudentClient(req.user._id, baseProfile);
    // #region agent log
    fetch('http://127.0.0.1:7746/ingest/ebf2a8b6-d58b-4377-b39c-003055b4ec8c', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '6e5329' }, body: JSON.stringify({ sessionId: '6e5329', location: 'student.js:savePointsHandler:afterClient', message: 'client resolved', data: { clientId: client?._id?.toString() }, timestamp: Date.now(), hypothesisId: 'H4' }) }).catch(() => { });
    // #endregion
    const {
      age,
      english,
      education,
      ausWork,
      osWork,
      partner,
      ausStudy,
      regionalStudy,
      professionalYear,
      naati,
      stemDoctorate,
      totalPoints,
    } = req.body;

    const existing = (client.pointsData && typeof client.pointsData.toObject === 'function')
      ? client.pointsData.toObject()
      : (client.pointsData && typeof client.pointsData === 'object' ? client.pointsData : {});
    const pointsData = {
      ...existing,
      age: age != null ? Number(age) : existing.age,
      english: english != null ? String(english) : existing.english,
      education: education != null ? String(education) : existing.education,
      ausWork: ausWork != null ? String(ausWork) : existing.ausWork,
      osWork: osWork != null ? String(osWork) : existing.osWork,
      partner: partner != null ? String(partner) : existing.partner,
      ausStudy: ausStudy != null ? Boolean(ausStudy) : existing.ausStudy,
      regionalStudy: regionalStudy != null ? Boolean(regionalStudy) : existing.regionalStudy,
      professionalYear: professionalYear != null ? Boolean(professionalYear) : existing.professionalYear,
      naati: naati != null ? Boolean(naati) : existing.naati,
      stemDoctorate: stemDoctorate != null ? Boolean(stemDoctorate) : existing.stemDoctorate,
      totalPoints: totalPoints != null ? Number(totalPoints) : existing.totalPoints,
      savedAt: new Date(),
    };
    // Legacy fields for consultancy/application views
    if (pointsData.english != null) pointsData.englishScore = pointsData.english;
    if (pointsData.education != null) pointsData.educationLevel = pointsData.education;
    if (pointsData.ausWork != null) pointsData.workExperience = Number(pointsData.ausWork) || 0;

    const updated = await Client.findByIdAndUpdate(
      client._id,
      { $set: { pointsData } },
      { new: true }
    );
    // #region agent log
    fetch('http://127.0.0.1:7746/ingest/ebf2a8b6-d58b-4377-b39c-003055b4ec8c', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '6e5329' }, body: JSON.stringify({ sessionId: '6e5329', location: 'student.js:savePointsHandler:success', message: 'saved', data: {}, timestamp: Date.now(), hypothesisId: 'H5' }) }).catch(() => { });
    // #endregion
    res.json({ pointsData: updated.pointsData });
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7746/ingest/ebf2a8b6-d58b-4377-b39c-003055b4ec8c', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '6e5329' }, body: JSON.stringify({ sessionId: '6e5329', location: 'student.js:savePointsHandler:catch', message: 'handler error', data: { errMessage: err?.message, errName: err?.name }, timestamp: Date.now(), hypothesisId: 'H3' }) }).catch(() => { });
    // #endregion
    res.status(500).json({ error: err.message });
  }
}

router.get('/points', getPointsHandler);
router.patch('/points', savePointsHandler);
router.patch('/points/', savePointsHandler);

// ─── PATCH /api/student/immigration ───────────────────────────────────────────
router.patch('/immigration', async (req, res) => {
  try {
    const { onshore, currentVisa, visaExpiry, targetVisa, anzscoCode, visaRefusalHistory } = req.body;
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const update = {};
    if (onshore !== undefined) update['profile.onshore'] = onshore;
    if (currentVisa !== undefined) update['profile.currentVisa'] = currentVisa;
    if (visaExpiry !== undefined) update['profile.visaExpiry'] = visaExpiry ? new Date(visaExpiry) : null;
    if (targetVisa !== undefined) update['profile.targetVisa'] = targetVisa;
    if (anzscoCode !== undefined) update['profile.anzscoCode'] = anzscoCode;
    if (visaRefusalHistory !== undefined) update['profile.visaRefusalHistory'] = visaRefusalHistory;
    const updated = await Client.findByIdAndUpdate(client._id, { $set: update }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/student/english-test ──────────────────────────────────────────
router.patch('/english-test', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const update = {};
    const eFields = ['testType', 'score', 'listening', 'reading', 'writing', 'speaking', 'trf', 'testDate', 'expiryDate'];
    eFields.forEach(f => {
      if (req.body[f] !== undefined) {
        if (f === 'testDate' || f === 'expiryDate') update[`englishTest.${f}`] = req.body[f] ? new Date(req.body[f]) : null;
        else update[`englishTest.${f}`] = req.body[f];
      }
    });
    const updated = await Client.findByIdAndUpdate(client._id, { $set: update }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/student/skills ─────────────────────────────────────────────────
router.patch('/skills', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const updated = await Client.findByIdAndUpdate(client._id, { $set: { skillsData: req.body } }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/student/health ─────────────────────────────────────────────────
router.patch('/health', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const updated = await Client.findByIdAndUpdate(client._id, { $set: { healthData: req.body } }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── EDUCATION CRUD ────────────────────────────────────────────────────────────

router.get('/education', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id }).select('education');
    res.json(client?.education || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/education', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const entry = { ...req.body };
    if (entry.startDate) entry.startDate = new Date(entry.startDate + '-01');
    if (entry.endDate) entry.endDate = new Date(entry.endDate + '-01');
    const updated = await Client.findByIdAndUpdate(
      client._id,
      { $push: { education: entry } },
      { new: true }
    );
    res.json(updated.education);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/education/:entryId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    const entry = client.education.id(req.params.entryId);
    if (!entry) return res.status(404).json({ error: 'Education entry not found' });
    Object.assign(entry, req.body);
    if (req.body.startDate) entry.startDate = new Date(req.body.startDate + '-01');
    if (req.body.endDate) entry.endDate = new Date(req.body.endDate + '-01');
    await client.save();
    res.json(client.education);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/education/:entryId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    client.education = client.education.filter(e => e._id.toString() !== req.params.entryId);
    await client.save();
    res.json(client.education);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── EXPERIENCE CRUD ───────────────────────────────────────────────────────────

router.get('/experience', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id }).select('experience');
    res.json(client?.experience || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/experience', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const entry = { ...req.body };
    if (entry.startDate) entry.startDate = new Date(entry.startDate + '-01');
    if (entry.endDate) entry.endDate = new Date(entry.endDate + '-01');
    const updated = await Client.findByIdAndUpdate(
      client._id,
      { $push: { experience: entry } },
      { new: true }
    );
    res.json(updated.experience);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/experience/:entryId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    const entry = client.experience.id(req.params.entryId);
    if (!entry) return res.status(404).json({ error: 'Experience entry not found' });
    Object.assign(entry, req.body);
    if (req.body.startDate) entry.startDate = new Date(req.body.startDate + '-01');
    if (req.body.endDate) entry.endDate = new Date(req.body.endDate + '-01');
    await client.save();
    res.json(client.experience);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/experience/:entryId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    client.experience = client.experience.filter(e => e._id.toString() !== req.params.entryId);
    await client.save();
    res.json(client.experience);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DOCUMENTS (student-scoped) ────────────────────────────────────────────────

router.get('/documents', async (req, res) => {
  try {
    const docs = await Document.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/documents', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const client = await Client.findOne({ userId: req.user._id });
    const doc = await Document.create({
      clientId: client?._id,
      consultancyId: client?.consultancyId,
      uploadedBy: req.user._id,
      name: req.body.name || req.file.originalname,
      type: req.body.type || 'OTHER',
      category: req.body.category || 'PERSONAL',
      fileUrl: `/uploads/${req.file.filename}`,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      description: req.body.description || '',
    });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/documents/:id', async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, uploadedBy: req.user._id });
    if (!doc) return res.status(404).json({ error: 'Document not found or access denied' });
    // Try to delete the physical file too
    try {
      const filePath = path.join(__dirname, '../../', doc.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) { /* ignore file deletion error */ }
    await doc.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CV GENERATOR ─────────────────────────────────────────────────────────────
router.get('/cv', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const client = await Client.findOne({ userId: req.user._id });

    const p = client?.profile || user?.profile || {};
    const cvData = {
      name: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
      email: user?.email || p.email || '',
      phone: p.phone || '',
      location: p.address ? [p.address.city, p.address.state, p.address.country].filter(Boolean).join(', ') : '',
      nationality: p.nationality || '',
      workRights: p.currentVisa ? `Australian Visa ${p.currentVisa}${p.visaExpiry ? ` (until ${new Date(p.visaExpiry).toLocaleDateString('en-AU')})` : ''}` : '',
      anzscoCode: p.anzscoCode || '',
      targetVisa: p.targetVisa || '',

      // English
      english: client?.englishTest ? {
        testType: client.englishTest.testType || '',
        overall: client.englishTest.score || '',
        listening: client.englishTest.listening || '',
        reading: client.englishTest.reading || '',
        writing: client.englishTest.writing || '',
        speaking: client.englishTest.speaking || '',
        testDate: client.englishTest.testDate ? new Date(client.englishTest.testDate).toLocaleDateString('en-AU') : '',
        expiryDate: client.englishTest.expiryDate ? new Date(client.englishTest.expiryDate).toLocaleDateString('en-AU') : '',
      } : null,

      // Skills
      skillsAssessment: client?.skillsData?.assessingBody ? {
        body: client.skillsData.assessingBody,
        referenceNumber: client.skillsData.referenceNumber || '',
        outcome: client.skillsData.outcome || '',
        outcomeDate: client.skillsData.outcomeDate ? new Date(client.skillsData.outcomeDate).toLocaleDateString('en-AU') : '',
      } : null,

      // Education
      education: (client?.education || []).map(e => ({
        institution: e.institution || '',
        qualification: e.qualification || '',
        fieldOfStudy: e.fieldOfStudy || '',
        country: e.country || '',
        cricos: e.cricos || '',
        startDate: e.startDate ? `${new Date(e.startDate).getFullYear()}` : '',
        endDate: e.completed ? (e.endDate ? `${new Date(e.endDate).getFullYear()}` : 'Present') : 'Ongoing',
        completed: !!e.completed,
      })),

      // Experience
      experience: (client?.experience || []).map(e => ({
        employer: e.employer || '',
        role: e.role || '',
        country: e.country || '',
        hoursPerWeek: e.hoursPerWeek || '',
        startDate: e.startDate ? new Date(e.startDate).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }) : '',
        endDate: e.isCurrent ? 'Present' : (e.endDate ? new Date(e.endDate).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }) : ''),
        isCurrent: !!e.isCurrent,
        description: e.description || '',
      })),
    };

    res.json(cvData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/student/profile (enhanced with all fields) ──────────────────────
// Re-override the profile patch to include initialStatement
router.patch('/profile/statement', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const { initialStatement } = req.body;
    const updated = await Client.findByIdAndUpdate(
      client._id,
      { $set: { initialStatement } },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TRAVEL HISTORY CRUD ───────────────────────────────────────────────────────

router.get('/travel-history', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id }).select('travelHistory');
    res.json(client?.travelHistory || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/travel-history', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const entry = {
      country: req.body.country,
      city: req.body.city,
      purpose: req.body.purpose || 'OTHER',
      visaType: req.body.visaType,
      visaGranted: req.body.visaGranted,
      visaRefused: req.body.visaRefused,
      refusalReason: req.body.refusalReason,
      notes: req.body.notes,
      dateFrom: req.body.dateFrom ? new Date(req.body.dateFrom) : undefined,
      dateTo: req.body.dateTo ? new Date(req.body.dateTo) : undefined,
    };
    const updated = await Client.findByIdAndUpdate(
      client._id,
      { $push: { travelHistory: entry } },
      { new: true }
    );
    res.json(updated.travelHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/travel-history/:entryId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    const entry = client.travelHistory.id(req.params.entryId);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    Object.assign(entry, req.body);
    if (req.body.dateFrom) entry.dateFrom = new Date(req.body.dateFrom);
    if (req.body.dateTo) entry.dateTo = new Date(req.body.dateTo);
    await client.save();
    res.json(client.travelHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/travel-history/:entryId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    client.travelHistory = client.travelHistory.filter(e => e._id.toString() !== req.params.entryId);
    await client.save();
    res.json(client.travelHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADDRESS HISTORY CRUD ─────────────────────────────────────────────────────

router.get('/addresses', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id }).select('previousAddresses profile');
    res.json({
      current: client?.profile?.address || null,
      previous: client?.previousAddresses || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update current address
router.patch('/addresses/current', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const updated = await Client.findByIdAndUpdate(
      client._id,
      { $set: { 'profile.address': req.body } },
      { new: true }
    );
    res.json({ current: updated.profile?.address, previous: updated.previousAddresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a previous address
router.post('/addresses', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const entry = {
      ...req.body,
      from: req.body.from ? new Date(req.body.from) : undefined,
      to: req.body.to ? new Date(req.body.to) : undefined,
    };
    const updated = await Client.findByIdAndUpdate(
      client._id,
      { $push: { previousAddresses: entry } },
      { new: true }
    );
    res.json({ current: updated.profile?.address, previous: updated.previousAddresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/addresses/:entryId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    const entry = client.previousAddresses.id(req.params.entryId);
    if (!entry) return res.status(404).json({ error: 'Address not found' });
    Object.assign(entry, req.body);
    if (req.body.from) entry.from = new Date(req.body.from);
    if (req.body.to) entry.to = new Date(req.body.to);
    await client.save();
    res.json({ current: client.profile?.address, previous: client.previousAddresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/addresses/:entryId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    client.previousAddresses = client.previousAddresses.filter(e => e._id.toString() !== req.params.entryId);
    await client.save();
    res.json({ current: client.profile?.address, previous: client.previousAddresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── STUDENT NOTES CRUD ────────────────────────────────────────────────────────

router.get('/notes', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id }).select('studentNotes initialStatement');
    res.json({
      notes: client?.studentNotes || [],
      initialStatement: client?.initialStatement || '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notes', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const note = {
      title: req.body.title || '',
      text: req.body.text,
      category: req.body.category || 'GENERAL',
      isPinned: req.body.isPinned || false,
      isPrivate: req.body.isPrivate !== false, // default private
      templateUsed: req.body.templateUsed || '',
      tags: req.body.tags || [],
      addedAt: new Date(),
    };
    const updated = await Client.findByIdAndUpdate(
      client._id,
      { $push: { studentNotes: note } },
      { new: true }
    );
    res.json(updated.studentNotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/notes/:noteId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    const note = client.studentNotes.id(req.params.noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    const allowed = ['title', 'text', 'category', 'isPinned', 'isPrivate', 'tags'];
    for (const k of allowed) {
      if (req.body[k] !== undefined) note[k] = req.body[k];
    }
    note.editedAt = new Date();
    await client.save();
    res.json(client.studentNotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/notes/:noteId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    client.studentNotes = client.studentNotes.filter(n => n._id.toString() !== req.params.noteId);
    await client.save();
    res.json(client.studentNotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CHANGE PASSWORD ────────────────────────────────────────────────────────────
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const user = await User.findById(req.user._id);
    if (currentPassword && !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ─── FAMILY MEMBERS CRUD ─────────────────────────────────────────────────────

router.get('/family-members', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id }).select('familyMembers');
    res.json(client?.familyMembers || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/family-members', async (req, res) => {
  try {
    const client = await getOrCreateStudentClient(req.user._id, req.user.profile);
    const entry = {
      relationship: req.body.relationship || 'OTHER',
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      dob: req.body.dob ? new Date(req.body.dob) : undefined,
      nationality: req.body.nationality,
      passportNumber: req.body.passportNumber,
      passportExpiry: req.body.passportExpiry ? new Date(req.body.passportExpiry) : undefined,
      includedInApplication: req.body.includedInApplication || false,
      visaStatus: req.body.visaStatus || '',
      notes: req.body.notes || '',
    };
    const updated = await Client.findByIdAndUpdate(
      client._id,
      { $push: { familyMembers: entry } },
      { new: true }
    );
    res.json(updated.familyMembers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/family-members/:memberId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    const member = client.familyMembers.id(req.params.memberId);
    if (!member) return res.status(404).json({ error: 'Family member not found' });
    const allowed = ['relationship', 'firstName', 'lastName', 'dob', 'nationality', 'passportNumber', 'passportExpiry', 'includedInApplication', 'visaStatus', 'notes'];
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        if ((k === 'dob' || k === 'passportExpiry') && req.body[k]) member[k] = new Date(req.body[k]);
        else member[k] = req.body[k];
      }
    }
    await client.save();
    res.json(client.familyMembers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/family-members/:memberId', async (req, res) => {
  try {
    const client = await Client.findOne({ userId: req.user._id });
    if (!client) return res.status(404).json({ error: 'Profile not found' });
    client.familyMembers = client.familyMembers.filter(m => m._id.toString() !== req.params.memberId);
    await client.save();
    res.json(client.familyMembers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

