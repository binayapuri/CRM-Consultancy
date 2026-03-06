import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Client from '../models/Client.js';
import Consultancy from '../models/Consultancy.js';
import Application from '../models/Application.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { sendEmail } from '../utils/email.js';
import { logAudit } from '../utils/audit.js';
import { EMAIL_TEMPLATES } from '../constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');

const router = express.Router();

const getConsultancyId = (user) => user.profile?.consultancyId || user._id;

function getEmailProfileForUser(consultancy, user) {
  const profiles = consultancy.emailProfiles || [];
  const active = profiles.filter(p => p.active);
  if (!active.length) return null;
  const preferredId = user?.profile?.preferredEmailProfileId;
  if (preferredId) {
    const p = active.find(ep => String(ep._id) === String(preferredId));
    if (p) return p;
  }
  const def = active.find(p => p.isDefault);
  return def || active[0];
}

router.post('/:clientId/send-form956', authenticate, requireRole('CONSULTANCY_ADMIN', 'AGENT', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    const cid = req.user.role === 'SUPER_ADMIN' ? client.consultancyId : getConsultancyId(req.user);
    if (client.consultancyId?.toString() !== cid?.toString()) return res.status(403).json({ error: 'Not authorized for this client' });
    const consultancy = await Consultancy.findById(cid);
    if (!consultancy) return res.status(404).json({ error: 'Consultancy not found' });

    const f956 = consultancy.form956Details || {};
    const clientEmail = client.profile?.email;
    if (!clientEmail) return res.status(400).json({ error: 'Client has no email' });

    const agentName = f956.agentName || consultancy.name;
    const marn = f956.marnNumber || consultancy.marnNumbers?.[0] || '';
    const companyName = f956.companyName || consultancy.name;
    const addr = f956.address || [consultancy.address?.street, consultancy.address?.city, consultancy.address?.state].filter(Boolean).join(', ');
    const phone = f956.phone || consultancy.phone || '';
    const email = f956.email || consultancy.email || '';

    const tpl = EMAIL_TEMPLATES.form956;
    const intro = tpl?.bodyIntro || 'As required by the Department of Home Affairs, when engaging a registered migration agent you must complete Form 956 (Appointment of a registered migration agent).';
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Form 956 - Migration Agent Appointment</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1e40af;">Form 956 - Appointment of a Registered Migration Agent</h2>
  <p>Dear ${client.profile?.firstName || 'Client'},</p>
  <p>${intro.replace(/\n/g, '<br/>')}</p>
  <p><strong>Our details for the form:</strong></p>
  <ul>
    <li><strong>Agent/Company:</strong> ${companyName}</li>
    <li><strong>Registered Agent:</strong> ${agentName}</li>
    <li><strong>MARN:</strong> ${marn}</li>
    <li><strong>Address:</strong> ${addr || '-'}</li>
    <li><strong>Phone:</strong> ${phone || '-'}</li>
    <li><strong>Email:</strong> ${email || '-'}</li>
  </ul>
  <p>Please download Form 956 from the Department of Home Affairs: <a href="https://immi.homeaffairs.gov.au/form-listing/forms/956.pdf">Form 956 (PDF)</a></p>
  <p>Complete the form, sign it, and reply to this email with the signed copy attached. You may also upload it in your client portal.</p>
  <p>If you have any questions, please contact us.</p>
  ${tpl?.footer ? `<p style="font-size: 12px; color: #64748b;">${tpl.footer.replace(/\n/g, '<br/>')}</p>` : ''}
  <p>Kind regards,<br/>${agentName}<br/>${companyName}</p>
</body>
</html>`;

    const attachments = [];
    if (f956.signatureUrl) {
      const basename = f956.signatureUrl.split('/').pop();
      const sigPath = path.join(uploadsDir, basename);
      if (fs.existsSync(sigPath)) {
        attachments.push({ filename: 'agent-signature.png', content: fs.readFileSync(sigPath) });
      }
    }

    const emailProfile = getEmailProfileForUser(consultancy, req.user);
    await sendEmail({
      to: clientEmail,
      subject: `Form 956 - Migration Agent Appointment - ${companyName}`,
      html,
      replyTo: email || undefined,
      attachments,
      emailProfile: emailProfile || undefined,
    });

    await logAudit(cid, 'Client', client._id, 'SEND', req.user._id, {
      description: 'Form 956 sent to client',
      clientId: client._id,
    });

    res.json({ success: true, message: 'Form 956 sent to client email' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:clientId/send-mia', authenticate, requireRole('CONSULTANCY_ADMIN', 'AGENT', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    const cid = req.user.role === 'SUPER_ADMIN' ? client.consultancyId : getConsultancyId(req.user);
    if (client.consultancyId?.toString() !== cid?.toString()) return res.status(403).json({ error: 'Not authorized for this client' });
    const consultancy = await Consultancy.findById(cid);
    if (!consultancy) return res.status(404).json({ error: 'Consultancy not found' });

    const mia = consultancy.miaAgreementDetails || consultancy.form956Details || {};
    const clientEmail = client.profile?.email;
    if (!clientEmail) return res.status(400).json({ error: 'Client has no email' });

    const agentName = mia.agentName || consultancy.form956Details?.agentName || consultancy.name;
    const marn = mia.marnNumber || consultancy.form956Details?.marnNumber || consultancy.marnNumbers?.[0] || '';

    const tplMia = EMAIL_TEMPLATES.mia;
    const introMia = tplMia?.bodyIntro || 'Please find attached our Migration Agent / Client Agreement as required under the MARA Code of Conduct.';
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>MIA Migration Agent / Client Agreement</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1e40af;">Migration Agent / Client Agreement</h2>
  <p>Dear ${client.profile?.firstName || 'Client'},</p>
  <p>${introMia.replace(/\n/g, '<br/>')}</p>
  <p><strong>Agent details:</strong></p>
  <ul>
    <li><strong>Registered Agent:</strong> ${agentName}</li>
    <li><strong>MARN:</strong> ${marn}</li>
  </ul>
  <p>Please review the agreement, sign it, and reply to this email with the signed copy. You may also upload it in your client portal.</p>
  ${tplMia?.footer ? `<p style="font-size: 12px; color: #64748b;">${tplMia.footer.replace(/\n/g, '<br/>')}</p>` : ''}
  <p>Kind regards,<br/>${agentName}</p>
</body>
</html>`;

    const emailProfile = getEmailProfileForUser(consultancy, req.user);
    await sendEmail({
      to: clientEmail,
      subject: `MIA Agreement - ${consultancy.displayName || consultancy.name}`,
      html,
      replyTo: consultancy.form956Details?.email || consultancy.email || undefined,
      emailProfile: emailProfile || undefined,
    });

    await logAudit(cid, 'Client', client._id, 'SEND', req.user._id, {
      description: 'MIA Agreement sent to client',
      clientId: client._id,
    });

    res.json({ success: true, message: 'MIA Agreement sent to client email' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:clientId/send-initial-advice', authenticate, requireRole('CONSULTANCY_ADMIN', 'AGENT', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { applicationId, customBody, feeBlocks } = req.body;
    const client = await Client.findById(req.params.clientId);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    const cid = req.user.role === 'SUPER_ADMIN' ? client.consultancyId : getConsultancyId(req.user);
    if (client.consultancyId?.toString() !== cid?.toString()) return res.status(403).json({ error: 'Not authorized for this client' });
    const consultancy = await Consultancy.findById(cid);
    if (!consultancy) return res.status(404).json({ error: 'Consultancy not found' });

    const clientEmail = client.profile?.email;
    if (!clientEmail) return res.status(400).json({ error: 'Client has no email' });

    const template = consultancy.initialAdviceTemplate || {};
    const bank = consultancy.bankDetails || {};
    const f956 = consultancy.form956Details || {};
    const agentName = f956.agentName || consultancy.name;
    const companyName = f956.companyName || consultancy.name;

    const tplAdvice = EMAIL_TEMPLATES.initialAdvice;
    const defaultBody = tplAdvice?.bodyIntro || `Thank you for your interest in our migration services. In accordance with the MARA Code of Conduct, we provide this written estimate of fees and charges before commencing work.\n\nIf you have any questions or wish to proceed, please contact us.`;
    let body = customBody || template.body || defaultBody;

    const blocks = feeBlocks || template.feeBlocks || tplAdvice?.defaultFeeBlocks || [
      { label: 'Professional Fees', amount: 'As per quote', description: 'Preparation, lodgment, and representation' },
      { label: 'Government Fees', amount: 'Varies by visa', description: 'Department of Home Affairs visa application charges' },
    ];

    let feeSection = '<h3>Estimate of Fees and Charges</h3><table style="border-collapse: collapse; width: 100%;"><tr style="background: #f1f5f9;"><th style="padding: 8px; text-align: left;">Item</th><th style="padding: 8px;">Amount (AUD)</th><th style="padding: 8px; text-align: left;">Notes</th></tr>';
    blocks.forEach(b => {
      feeSection += `<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${b.label || '-'}</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${b.amount || '-'}</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${b.description || '-'}</td></tr>`;
    });
    feeSection += '</table>';

    let bankSection = '';
    if (bank.accountName || bank.bank) {
      bankSection = `<h3>Bank Details</h3><p><strong>Account Name:</strong> ${bank.accountName || '-'}<br/><strong>Bank:</strong> ${bank.bank || '-'}<br/><strong>BSB:</strong> ${bank.bsb || '-'}<br/><strong>Account No:</strong> ${bank.accountNumber || '-'}</p>`;
    }

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Initial Advice & Fee Estimation</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1e40af;">Initial Advice & Fee Estimation</h2>
  <div style="white-space: pre-wrap;">${body.replace(/\n/g, '<br/>')}</div>
  ${feeSection}
  ${bankSection}
  <p style="margin-top: 24px;">Kind regards,<br/><strong>${agentName}</strong><br/>${companyName}</p>
</body>
</html>`;

    const emailProfile = getEmailProfileForUser(consultancy, req.user);
    await sendEmail({
      to: clientEmail,
      subject: template.subject || `Initial Advice & Fee Estimation - ${companyName}`,
      html,
      replyTo: f956.email || consultancy.email || undefined,
      emailProfile: emailProfile || undefined,
    });

    await logAudit(cid, 'Client', client._id, 'SEND', req.user._id, {
      description: 'Initial advice & fee estimation sent to client',
      clientId: client._id,
      applicationId: applicationId || undefined,
    });

    res.json({ success: true, message: 'Initial advice sent to client email' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
