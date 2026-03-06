import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Sponsor from '../models/Sponsor.js';
import Consultancy from '../models/Consultancy.js';
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

function getSponsorEmail(sponsor) {
  return sponsor.contactPerson?.email || sponsor.email;
}

function getSponsorName(sponsor) {
  const cp = sponsor.contactPerson;
  if (cp?.firstName || cp?.lastName) return `${cp.firstName || ''} ${cp.lastName || ''}`.trim();
  return sponsor.companyName;
}

router.post('/:sponsorId/send-form956', authenticate, requireRole('CONSULTANCY_ADMIN', 'AGENT', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.params.sponsorId);
    if (!sponsor) return res.status(404).json({ error: 'Sponsor not found' });
    const cid = req.user.role === 'SUPER_ADMIN' ? sponsor.consultancyId : getConsultancyId(req.user);
    if (sponsor.consultancyId?.toString() !== cid?.toString()) return res.status(403).json({ error: 'Not authorized' });
    const consultancy = await Consultancy.findById(cid);
    if (!consultancy) return res.status(404).json({ error: 'Consultancy not found' });

    const toEmail = getSponsorEmail(sponsor);
    if (!toEmail) return res.status(400).json({ error: 'Sponsor has no email' });

    const f956 = consultancy.form956Details || {};
    const agentName = f956.agentName || consultancy.name;
    const marn = f956.marnNumber || consultancy.marnNumbers?.[0] || '';
    const companyName = f956.companyName || consultancy.name;
    const addr = f956.address || [consultancy.address?.street, consultancy.address?.city, consultancy.address?.state].filter(Boolean).join(', ');
    const phone = f956.phone || consultancy.phone || '';
    const email = f956.email || consultancy.email || '';
    const sponsorName = getSponsorName(sponsor);

    const tpl = EMAIL_TEMPLATES.form956;
    const intro = tpl?.bodyIntro || 'As required by the Department of Home Affairs, when engaging a registered migration agent you must complete Form 956.';
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Form 956 - Migration Agent Appointment</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1e40af;">Form 956 - Appointment of a Registered Migration Agent</h2>
  <p>Dear ${sponsorName || 'Sponsor Contact'},</p>
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
  <p>Complete the form, sign it, and reply to this email with the signed copy attached.</p>
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
      to: toEmail,
      subject: `Form 956 - Migration Agent Appointment - ${companyName}`,
      html,
      replyTo: email || undefined,
      attachments,
      emailProfile: emailProfile || undefined,
    });

    await Sponsor.findByIdAndUpdate(sponsor._id, { form956Signed: false }); // Reset until they return signed
    await logAudit(cid, 'Sponsor', sponsor._id, 'SEND', req.user._id, { description: 'Form 956 sent to sponsor', sponsorId: sponsor._id });

    res.json({ success: true, message: 'Form 956 sent to sponsor email' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:sponsorId/send-mia', authenticate, requireRole('CONSULTANCY_ADMIN', 'AGENT', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.params.sponsorId);
    if (!sponsor) return res.status(404).json({ error: 'Sponsor not found' });
    const cid = req.user.role === 'SUPER_ADMIN' ? sponsor.consultancyId : getConsultancyId(req.user);
    if (sponsor.consultancyId?.toString() !== cid?.toString()) return res.status(403).json({ error: 'Not authorized' });
    const consultancy = await Consultancy.findById(cid);
    if (!consultancy) return res.status(404).json({ error: 'Consultancy not found' });

    const toEmail = getSponsorEmail(sponsor);
    if (!toEmail) return res.status(400).json({ error: 'Sponsor has no email' });

    const mia = consultancy.miaAgreementDetails || consultancy.form956Details || {};
    const agentName = mia.agentName || consultancy.form956Details?.agentName || consultancy.name;
    const sponsorName = getSponsorName(sponsor);

    const tplMia = EMAIL_TEMPLATES.mia;
    const introMia = tplMia?.bodyIntro || 'Please find attached our Migration Agent / Client Agreement as required under the MARA Code of Conduct.';
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>MIA Agreement</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1e40af;">Migration Agent / Client Agreement</h2>
  <p>Dear ${sponsorName || 'Sponsor Contact'},</p>
  <p>${introMia.replace(/\n/g, '<br/>')}</p>
  <p><strong>Agent details:</strong></p>
  <ul>
    <li><strong>Registered Agent:</strong> ${agentName}</li>
  </ul>
  <p>Please review the agreement, sign it, and reply to this email with the signed copy.</p>
  <p>Kind regards,<br/>${agentName}</p>
</body>
</html>`;

    const emailProfile = getEmailProfileForUser(consultancy, req.user);
    await sendEmail({
      to: toEmail,
      subject: `MIA Agreement - ${consultancy.displayName || consultancy.name}`,
      html,
      replyTo: consultancy.form956Details?.email || consultancy.email || undefined,
      emailProfile: emailProfile || undefined,
    });

    await logAudit(cid, 'Sponsor', sponsor._id, 'SEND', req.user._id, { description: 'MIA Agreement sent to sponsor', sponsorId: sponsor._id });

    res.json({ success: true, message: 'MIA Agreement sent to sponsor email' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
