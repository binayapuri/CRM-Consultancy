import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import Client from '../../shared/models/Client.js';
import Sponsor from '../../shared/models/Sponsor.js';
import Consultancy from '../../shared/models/Consultancy.js';
import Application from '../../shared/models/Application.js';
import { sendEmail } from '../../shared/utils/email.js';
import { logAudit } from '../../shared/utils/audit.js';
import { EMAIL_TEMPLATES } from '../../constants.js';
import { WorkflowAutomationService } from './workflow-automation.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../../uploads');
const templateAssetsDir = path.join(__dirname, '../../assets/consultancy-templates');
const OFFICIAL_CONSUMER_GUIDE_URL = 'https://www.mara.gov.au/get-help-visa-subsite/FIles/consumer_guide_english.pdf';
const OFFICIAL_FORM_956_URL = 'https://immi.homeaffairs.gov.au/form-listing/forms/956.pdf';
const OFFICIAL_CONSUMER_GUIDE_PATH = path.join(templateAssetsDir, 'consumer-guide-official.pdf');
const OFFICIAL_FORM_956_PATH = path.join(templateAssetsDir, 'form-956-normalized.pdf');

const SAMPLE_ATTACHMENT_FILES = {
  'sample-job-description': 'sample-job-description.txt',
  'sample-list-of-applicants': 'sample-list-of-applicants.txt',
  'genuine-position-report': 'genuine-position-report-sample.txt',
  'work-reference-sample': 'work-reference-sample.txt',
};

const DEFAULT_482_FEE_BLOCKS = [
  {
    label: 'Stage 1: Preparation & Strategy',
    amount: '$2,750 (GST exclusive)',
    description: 'Migration advice, document collation, LMT report, genuine position report, and equivalent worker report.',
  },
  {
    label: 'Stage 2: Lodgment',
    amount: '$2,750 (GST exclusive)',
    description: 'Preparation and lodgment of the nomination and visa application.',
  },
];

const DEFAULT_482_GOVERNMENT_FEES = [
  { label: 'Application fee for Nomination', amount: '$330', description: 'Paid by employer', payer: 'Employer' },
  { label: 'Skilling Australians Fund (SAF)', amount: '$2,400 or $3,600', description: 'Varies by turnover for a 2-year visa', payer: 'Employer' },
  { label: 'Visa Application (Main Applicant)', amount: '$3,210', description: 'Paid by employer or applicant', payer: 'Employer or Applicant' },
];

const DEFAULT_482_CHECKLIST = [
  'Copy of Standard Business Sponsorship (SBS) approval',
  'Two different advertisements from different platforms',
  'Advertising payment receipts',
  'Company tax returns and financial statements for the last 2 years',
  'Business Activity Statements (BAS) for the last 2 years',
  'Organizational chart showing the kitchen hierarchy',
  'Payroll information for current employees',
];

export class PortalService {
  static getEmailProfile(consultancy, user) {
    const profiles = consultancy.emailProfiles || [];
    const active = profiles.filter((p) => p.active);
    if (!active.length) return null;
    const preferredId = user?.profile?.preferredEmailProfileId;
    if (preferredId) {
      const preferred = active.find((ep) => String(ep._id) === String(preferredId));
      if (preferred) return preferred;
    }
    return active.find((p) => p.isDefault) || active[0];
  }

  static escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  static nl2br(value = '') {
    return this.escapeHtml(value).replace(/\n/g, '<br/>');
  }

  static formatName(profile = {}) {
    return [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
  }

  static normalizeFeeBlocks(blocks = []) {
    return (Array.isArray(blocks) ? blocks : [])
      .map((item) => ({
        label: String(item?.label || '').trim(),
        amount: String(item?.amount || '').trim(),
        description: String(item?.description || '').trim(),
      }))
      .filter((item) => item.label || item.amount || item.description);
  }

  static normalizeGovernmentFees(blocks = []) {
    return (Array.isArray(blocks) ? blocks : [])
      .map((item) => ({
        label: String(item?.label || '').trim(),
        amount: String(item?.amount || '').trim(),
        description: String(item?.description || '').trim(),
        payer: String(item?.payer || '').trim(),
      }))
      .filter((item) => item.label || item.amount || item.description || item.payer);
  }

  static normalizeChecklist(items = []) {
    return (Array.isArray(items) ? items : [])
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  static getConsultancyIdForEntity(entity, user) {
    return user.role === 'SUPER_ADMIN' ? entity.consultancyId : (user.profile?.consultancyId || user._id);
  }

  static async loadClientContext(clientId, user, applicationId) {
    const client = await Client.findById(clientId);
    if (!client) throw Object.assign(new Error('Client not found'), { status: 404 });

    const cid = this.getConsultancyIdForEntity(client, user);
    if (String(client.consultancyId) !== String(cid)) {
      throw Object.assign(new Error('Not authorized'), { status: 403 });
    }

    const consultancy = await Consultancy.findById(cid);
    if (!consultancy) throw Object.assign(new Error('Consultancy not found'), { status: 404 });

    let application = null;
    if (applicationId) {
      application = await Application.findById(applicationId)
        .populate('sponsorId')
        .populate('clientId', 'profile');
      if (!application || String(application.clientId?._id || application.clientId) !== String(client._id)) {
        throw Object.assign(new Error('Application not found for this client'), { status: 404 });
      }
    }

    return { cid, client, consultancy, application };
  }

  static async loadSponsorContext(sponsorId, user, applicationId) {
    const sponsor = await Sponsor.findById(sponsorId);
    if (!sponsor) throw Object.assign(new Error('Sponsor not found'), { status: 404 });

    const cid = this.getConsultancyIdForEntity(sponsor, user);
    if (String(sponsor.consultancyId) !== String(cid)) {
      throw Object.assign(new Error('Not authorized'), { status: 403 });
    }

    const consultancy = await Consultancy.findById(cid);
    if (!consultancy) throw Object.assign(new Error('Consultancy not found'), { status: 404 });

    let application = null;
    let client = null;
    if (applicationId) {
      application = await Application.findById(applicationId)
        .populate('clientId', 'profile')
        .populate('sponsorId');
      if (!application || String(application.sponsorId?._id || application.sponsorId) !== String(sponsor._id)) {
        throw Object.assign(new Error('Application not found for this sponsor'), { status: 404 });
      }
      client = application.clientId;
    }

    return { cid, sponsor, consultancy, application, client };
  }

  static resolveUploadAttachment(fileUrl, fallbackFilename) {
    if (!fileUrl) return null;
    const basename = fileUrl.split('/').pop();
    if (!basename) return null;
    const filePath = path.join(uploadsDir, basename);
    if (!fs.existsSync(filePath)) return null;
    return {
      filename: fallbackFilename || basename,
      content: fs.readFileSync(filePath),
      path: filePath,
    };
  }

  static getSignatureAttachment(signatureUrl) {
    const attachment = this.resolveUploadAttachment(signatureUrl, 'agent-signature');
    return attachment ? [attachment] : [];
  }

  static getConsumerGuideAttachment(consumerGuideUrl) {
    const uploaded = this.resolveUploadAttachment(consumerGuideUrl, 'MARA-Consumer-Guide.pdf');
    if (uploaded) return [uploaded];
    if (fs.existsSync(OFFICIAL_CONSUMER_GUIDE_PATH)) {
      return [{ filename: 'MARA-Consumer-Guide.pdf', content: fs.readFileSync(OFFICIAL_CONSUMER_GUIDE_PATH), path: OFFICIAL_CONSUMER_GUIDE_PATH }];
    }
    const fallbackPath = path.join(templateAssetsDir, 'consumer-guide-download-instructions.txt');
    if (!fs.existsSync(fallbackPath)) return [];
    return [{ filename: 'MARA-Consumer-Guide-link.txt', content: fs.readFileSync(fallbackPath), path: fallbackPath }];
  }

  static getOfficialForm956Attachment() {
    if (fs.existsSync(OFFICIAL_FORM_956_PATH)) {
      return [{ filename: 'Form-956.pdf', content: fs.readFileSync(OFFICIAL_FORM_956_PATH), path: OFFICIAL_FORM_956_PATH }];
    }
    const fallbackPath = path.join(templateAssetsDir, 'form-956-download-instructions.txt');
    if (!fs.existsSync(fallbackPath)) return [];
    return [{ filename: 'Form-956-link.txt', content: fs.readFileSync(fallbackPath), path: fallbackPath }];
  }

  static getSampleAttachments(sampleKeys = []) {
    return sampleKeys
      .map((key) => {
        const filename = SAMPLE_ATTACHMENT_FILES[key];
        if (!filename) return null;
        const filePath = path.join(templateAssetsDir, filename);
        if (!fs.existsSync(filePath)) return null;
        return { key, filename, content: fs.readFileSync(filePath), path: filePath };
      })
      .filter(Boolean);
  }

  static getAttachmentSummary(attachments = []) {
    return attachments.map((attachment) => ({
      name: attachment.filename,
      source: attachment.path?.includes('/uploads/') ? 'upload' : 'template',
    }));
  }

  static tableHtml(rows, columns) {
    if (!rows.length) return '';
    return `
      <table style="width:100%;border-collapse:collapse;margin-top:12px;margin-bottom:18px;">
        <thead>
          <tr>
            ${columns.map((col) => `<th style="text-align:left;padding:10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:12px;">${this.escapeHtml(col.label)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              ${columns.map((col) => `<td style="padding:10px;border:1px solid #e2e8f0;font-size:13px;vertical-align:top;">${this.nl2br(row[col.key] || '')}</td>`).join('')}
            </tr>`).join('')}
        </tbody>
      </table>
    `;
  }

  static listHtml(items = []) {
    if (!items.length) return '';
    return `<ul style="margin:12px 0 18px 18px;padding:0;">${items.map((item) => `<li style="margin:6px 0;">${this.escapeHtml(item)}</li>`).join('')}</ul>`;
  }

  static renderBankSection(bank = {}, reference = '') {
    if (!bank.accountName && !bank.bank && !bank.accountNumber) return '';
    const rows = [
      { label: 'Account Name', value: bank.accountName || '—' },
      { label: 'BSB', value: bank.bsb || '—' },
      { label: 'Account Number', value: bank.accountNumber || '—' },
      { label: 'Bank', value: bank.bank || '—' },
      { label: 'Reference', value: reference || 'Use your matter reference' },
    ];
    return `
      <h3 style="margin:22px 0 10px;font-size:16px;">Payment Details</h3>
      ${this.tableHtml(rows, [{ key: 'label', label: 'Item' }, { key: 'value', label: 'Value' }])}
    `;
  }

  static getClientEmail(client) {
    const email = client?.profile?.email;
    if (!email) throw Object.assign(new Error('Client has no email'), { status: 400 });
    return email;
  }

  static getSponsorEmail(sponsor) {
    const email = sponsor?.contactPerson?.email || sponsor?.email;
    if (!email) throw Object.assign(new Error('Sponsor has no email'), { status: 400 });
    return email;
  }

  static mergeDraftWithApplication(application, payload = {}) {
    const existing = application?.communicationDraft || {};
    return {
      subject: payload.subject || existing.subject || '',
      customBody: payload.customBody || existing.body || '',
      includeConsumerGuide: payload.includeConsumerGuide ?? existing.includeConsumerGuide ?? true,
      includeForm956Attachment: payload.includeForm956Attachment ?? existing.includeForm956Attachment ?? false,
      feeBlocks: this.normalizeFeeBlocks(payload.feeBlocks || existing.feeBlocks || []),
      governmentFeeBlocks: this.normalizeGovernmentFees(payload.governmentFeeBlocks || existing.governmentFeeBlocks || []),
      checklistItems: this.normalizeChecklist(payload.checklistItems || existing.checklistItems || []),
      sampleAttachments: this.normalizeChecklist(payload.sampleAttachments || existing.sampleAttachments || []),
      occupation: payload.occupation || existing.occupation || '',
      anzscoCode: payload.anzscoCode || existing.anzscoCode || '',
      positionTitle: payload.positionTitle || existing.positionTitle || '',
      sbsStatus: payload.sbsStatus || existing.sbsStatus || '',
      recipientName: payload.recipientName || '',
    };
  }

  static splitName(fullName = '') {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return { givenNames: '', familyName: '' };
    if (parts.length === 1) return { givenNames: parts[0], familyName: '' };
    return {
      givenNames: parts.slice(0, -1).join(' '),
      familyName: parts.slice(-1).join(' '),
    };
  }

  static getUploadPath(fileUrl) {
    if (!fileUrl) return null;
    const basename = fileUrl.split('/').pop();
    if (!basename) return null;
    const filePath = path.join(uploadsDir, basename);
    return fs.existsSync(filePath) ? filePath : null;
  }

  static drawPdfText(page, text, x, yFromTop, options = {}) {
    if (!text) return;
    const {
      font,
      size = 8,
      color = rgb(0.08, 0.1, 0.12),
      maxWidth,
      lineHeight = size + 2,
    } = options;
    const { height } = page.getSize();
    const lines = String(text).split('\n');
    lines.forEach((line, idx) => {
      page.drawText(String(line), {
        x,
        y: height - yFromTop - (idx * lineHeight) - size,
        size,
        font,
        color,
        maxWidth,
      });
    });
  }

  static drawPdfMark(page, x, yFromTop, font, size = 10) {
    const { height } = page.getSize();
    page.drawText('X', {
      x,
      y: height - yFromTop - size,
      size,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
  }

  static drawPdfDigits(page, value, positions, font, size = 8) {
    const digits = String(value || '').replace(/\D/g, '').split('');
    positions.forEach((pos, idx) => {
      if (!digits[idx]) return;
      this.drawPdfText(page, digits[idx], pos.x, pos.y, { font, size });
    });
  }

  static async drawSignatureImage(pdfDoc, page, signatureUrl, rect) {
    const filePath = this.getUploadPath(signatureUrl);
    if (!filePath) return false;
    const bytes = fs.readFileSync(filePath);
    const lower = filePath.toLowerCase();
    let image;
    if (lower.endsWith('.png')) image = await pdfDoc.embedPng(bytes);
    else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) image = await pdfDoc.embedJpg(bytes);
    else return false;
    page.drawImage(image, rect);
    return true;
  }

  static async generateFilledForm956({ consultancy, client = null, sponsor = null, application = null }) {
    if (!fs.existsSync(OFFICIAL_FORM_956_PATH)) return null;
    const pdfBytes = fs.readFileSync(OFFICIAL_FORM_956_PATH);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    if (pages.length < 6) return null;

    const form956 = consultancy.form956Details || {};
    const agent = this.splitName(form956.agentName || consultancy.name || '');
    const agentEmail = form956.email || consultancy.email || '';
    const agentPhone = form956.phone || consultancy.phone || '';
    const companyName = form956.companyName || consultancy.displayName || consultancy.name || '';
    const agentAddress = form956.address || [consultancy.address?.street, consultancy.address?.city, consultancy.address?.state, consultancy.address?.postcode].filter(Boolean).join(', ');
    const isClientMatter = !!client;
    const recipientProfile = client?.profile || {};
    const recipientName = isClientMatter
      ? { givenNames: recipientProfile.firstName || '', familyName: recipientProfile.lastName || '' }
      : this.splitName(sponsor?.contactPerson?.firstName && sponsor?.contactPerson?.lastName
        ? `${sponsor.contactPerson.firstName} ${sponsor.contactPerson.lastName}`
        : sponsor?.contactPerson?.name || sponsor?.companyName || '');
    const recipientAddress = isClientMatter
      ? [recipientProfile.address?.street, recipientProfile.address?.suburb || recipientProfile.address?.city, recipientProfile.address?.state, recipientProfile.address?.postcode, recipientProfile.address?.country].filter(Boolean).join(', ')
      : [sponsor?.address?.street, sponsor?.address?.suburb || sponsor?.address?.city, sponsor?.address?.state, sponsor?.address?.postcode, sponsor?.address?.country].filter(Boolean).join(', ');
    const recipientPhone = isClientMatter ? recipientProfile.phone || '' : sponsor?.contactPerson?.phone || sponsor?.phone || '';
    const recipientEmail = isClientMatter ? recipientProfile.email || '' : sponsor?.contactPerson?.email || sponsor?.email || '';
    const matterType = application?.visaSubclass
      ? `Subclass ${application.visaSubclass}${isClientMatter ? ' visa application' : ' sponsorship / nomination matter'}`
      : (isClientMatter ? 'Visa application matter' : 'Sponsorship / nomination matter');
    const dateLodged = application?.lodgedAt ? new Date(application.lodgedAt) : null;
    const today = new Date();

    const page3 = pages[2];
    this.drawPdfMark(page3, 130, 133, bold, 10); // Q1 new appointment
    this.drawPdfText(page3, agent.familyName, 88, 485, { font, size: 8, maxWidth: 170 });
    this.drawPdfText(page3, agent.givenNames, 88, 529, { font, size: 8, maxWidth: 170 });
    this.drawPdfText(page3, companyName, 72, 648, { font, size: 8, maxWidth: 210 });
    this.drawPdfText(page3, agentAddress, 72, 783, { font, size: 8, maxWidth: 210, lineHeight: 11 });
    this.drawPdfText(page3, 'AS ABOVE', 72, 912, { font, size: 8 });
    this.drawPdfText(page3, agentPhone, 88, 1181, { font, size: 8, maxWidth: 170 });
    this.drawPdfText(page3, agentPhone, 88, 1223, { font, size: 8, maxWidth: 170 });
    this.drawPdfMark(page3, 669, 136, bold, 10); // Q7 yes
    this.drawPdfText(page3, agentEmail, 386, 199, { font, size: 8, maxWidth: 150 });
    this.drawPdfMark(page3, 504, 430, bold, 10); // Q8 registered migration agent
    this.drawPdfDigits(page3, form956.marnNumber || consultancy.marnNumbers?.[0] || '', [
      { x: 462, y: 547 }, { x: 478, y: 547 }, { x: 494, y: 547 }, { x: 510, y: 547 }, { x: 526, y: 547 }, { x: 542, y: 547 }, { x: 558, y: 547 },
    ], font, 8);
    this.drawPdfMark(page3, 422, 721, bold, 10); // Q10 no

    const page4 = pages[3];
    this.drawPdfMark(page4, isClientMatter ? 278 : 287, isClientMatter ? 128 : 171, bold, 10); // Q12 client type
    this.drawPdfText(page4, recipientName.familyName, 90, 335, { font, size: 8, maxWidth: 165 });
    this.drawPdfText(page4, recipientName.givenNames, 90, 379, { font, size: 8, maxWidth: 165 });
    if (recipientProfile.dob) {
      const dob = new Date(recipientProfile.dob);
      this.drawPdfText(page4, String(dob.getDate()).padStart(2, '0'), 103, 449, { font, size: 8 });
      this.drawPdfText(page4, String(dob.getMonth() + 1).padStart(2, '0'), 138, 449, { font, size: 8 });
      this.drawPdfText(page4, String(dob.getFullYear()), 175, 449, { font, size: 8 });
    }
    if (!isClientMatter) this.drawPdfText(page4, sponsor?.companyName || '', 90, 546, { font, size: 8, maxWidth: 165 });
    this.drawPdfText(page4, recipientAddress, 90, 672, { font, size: 8, maxWidth: 170, lineHeight: 11 });
    this.drawPdfText(page4, recipientPhone, 96, 856, { font, size: 8, maxWidth: 165 });
    this.drawPdfText(page4, recipientPhone, 96, 899, { font, size: 8, maxWidth: 165 });
    if (client?._id) this.drawPdfText(page4, String(client._id).slice(-8), 205, 983, { font, size: 8, maxWidth: 75 });
    this.drawPdfMark(page4, 346, 159, bold, 10); // Q15 application process
    this.drawPdfText(page4, matterType, 392, 205, { font, size: 8, maxWidth: 150 });
    if (dateLodged) {
      this.drawPdfText(page4, String(dateLodged.getDate()).padStart(2, '0'), 448, 256, { font, size: 8 });
      this.drawPdfText(page4, String(dateLodged.getMonth() + 1).padStart(2, '0'), 478, 256, { font, size: 8 });
      this.drawPdfText(page4, String(dateLodged.getFullYear()), 513, 256, { font, size: 8 });
    } else {
      this.drawPdfMark(page4, 560, 256, bold, 10);
    }
    this.drawPdfText(page4, application?.immiAccountRef || '', 455, 1107, { font, size: 8, maxWidth: 80 });
    this.drawPdfMark(page4, 360, 1507, bold, 10); // Q17 yes

    const page6 = pages[5];
    this.drawPdfMark(page6, 44, 128, bold, 10);
    this.drawPdfMark(page6, 44, 268, bold, 10);
    await this.drawSignatureImage(pdfDoc, page6, form956.signatureUrl, { x: 76, y: 443, width: 120, height: 28 });
    this.drawPdfText(page6, String(today.getDate()).padStart(2, '0'), 90, 821, { font, size: 8 });
    this.drawPdfText(page6, String(today.getMonth() + 1).padStart(2, '0'), 126, 821, { font, size: 8 });
    this.drawPdfText(page6, String(today.getFullYear()), 162, 821, { font, size: 8 });
    this.drawPdfMark(page6, 44, 968, bold, 10);
    this.drawPdfMark(page6, 44, 1107, bold, 10);
    if (recipientProfile.signatureUrl) {
      await this.drawSignatureImage(pdfDoc, page6, recipientProfile.signatureUrl, { x: 76, y: 65, width: 120, height: 28 });
    }

    const bytesOut = await pdfDoc.save();
    return {
      filename: `Form-956-${(recipientName.familyName || sponsor?.companyName || 'matter').replace(/[^a-z0-9-_]+/gi, '-')}.pdf`,
      content: Buffer.from(bytesOut),
      source: 'generated',
    };
  }

  static async persistApplicationCommunication(applicationId, patch = {}, compliancePatch = {}) {
    if (!applicationId) return;
    const update = {};
    Object.entries(patch).forEach(([key, value]) => {
      if (value !== undefined) update[`communicationDraft.${key}`] = value;
    });
    Object.entries(compliancePatch).forEach(([key, value]) => {
      if (value !== undefined) update[`compliance.${key}`] = value;
    });
    if (!Object.keys(update).length) return;
    await Application.findByIdAndUpdate(applicationId, { $set: update });
  }

  static buildForm956Draft({ recipientName, to, consultancy, f956, subject, customBody }) {
    const agentName = f956.agentName || consultancy.name;
    const marn = f956.marnNumber || consultancy.marnNumbers?.[0] || '';
    const companyName = f956.companyName || consultancy.name;
    const addr = f956.address || [consultancy.address?.street, consultancy.address?.city, consultancy.address?.state].filter(Boolean).join(', ');
    const phone = f956.phone || consultancy.phone || '';
    const email = f956.email || consultancy.email || '';
    const intro = customBody || EMAIL_TEMPLATES.form956.bodyIntro;
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#0f172a;">
      <p>Dear ${this.escapeHtml(recipientName || 'Client')},</p>
      <p>${this.nl2br(intro)}</p>
      <ul>
        <li>Agent: ${this.escapeHtml(agentName)}</li>
        <li>MARN: ${this.escapeHtml(marn)}</li>
        <li>Company: ${this.escapeHtml(companyName)}</li>
        <li>Address: ${this.escapeHtml(addr)}</li>
        <li>Phone: ${this.escapeHtml(phone)}</li>
        <li>Email: ${this.escapeHtml(email)}</li>
      </ul>
      <p>Please review the attached pre-filled official Form 956, sign where required, and return it to us at your earliest convenience.</p>
      <p><strong>Consumer Guide:</strong> The MARA Consumer Guide is attached for your reference. Please reply to this email with: <em>"Copy of consumer guide received."</em></p>
      <p>You can also review the official guide here: <a href="${OFFICIAL_CONSUMER_GUIDE_URL}">${OFFICIAL_CONSUMER_GUIDE_URL}</a></p>
    </body></html>`;
    return { to, subject: subject || EMAIL_TEMPLATES.form956.subject, html };
  }

  static buildMiaDraft({ recipientName, to, consultancy, subject, customBody }) {
    const agentName = consultancy.miaAgreementDetails?.agentName || consultancy.form956Details?.agentName || consultancy.name;
    const marn = consultancy.miaAgreementDetails?.marnNumber || consultancy.form956Details?.marnNumber || consultancy.marnNumbers?.[0] || '';
    const intro = customBody || EMAIL_TEMPLATES.mia.bodyIntro;
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#0f172a;">
      <p>Dear ${this.escapeHtml(recipientName || 'Client')},</p>
      <p>${this.nl2br(intro)}</p>
      <p><strong>Registered Migration Agent:</strong> ${this.escapeHtml(agentName)}${marn ? ` (${this.escapeHtml(marn)})` : ''}</p>
      <p>MARA Code of Conduct: <a href="https://www.mara.gov.au/tools-for-registered-agents/code-of-conduct">https://www.mara.gov.au/tools-for-registered-agents/code-of-conduct</a></p>
    </body></html>`;
    return { to, subject: subject || EMAIL_TEMPLATES.mia.subject, html };
  }

  static buildInitialAdviceDraft({ recipientName, to, consultancy, application, client, sponsor, draft }) {
    const template = consultancy.initialAdviceTemplate || {};
    const bank = consultancy.bankDetails || {};
    const visaSubclass = application?.visaSubclass || client?.profile?.targetVisa || '';
    const is482 = String(visaSubclass) === '482';
    const subject = draft.subject
      || template.subject
      || (is482 ? `Sponsorship of ${draft.occupation || draft.positionTitle || 'Position'} for Subclass 482 Visa – ${sponsor?.companyName || 'Employer'}` : EMAIL_TEMPLATES.initialAdvice.subject);

    const feeBlocks = draft.feeBlocks.length ? draft.feeBlocks : this.normalizeFeeBlocks(template.feeBlocks || EMAIL_TEMPLATES.initialAdvice.defaultFeeBlocks || []);
    const governmentFees = draft.governmentFeeBlocks.length ? draft.governmentFeeBlocks : this.normalizeGovernmentFees(template.governmentFeeBlocks || (is482 ? DEFAULT_482_GOVERNMENT_FEES : []));
    const checklistItems = draft.checklistItems.length ? draft.checklistItems : this.normalizeChecklist(template.checklistItems || (is482 ? DEFAULT_482_CHECKLIST : []));

    let body = draft.customBody || template.body || EMAIL_TEMPLATES.initialAdvice.bodyIntro;
    if (is482 && !draft.customBody) {
      const contactName = sponsor?.contactPerson?.firstName || 'Management Team';
      const nomineeName = this.formatName(client?.profile || {}) || 'Nominee';
      const sponsorName = sponsor?.companyName || 'Employer';
      const occupation = draft.occupation || draft.positionTitle || 'Chef';
      const anzsco = draft.anzscoCode || client?.profile?.anzscoCode || '';
      const sbsStatus = draft.sbsStatus || sponsor?.sbsStatus || 'approved';
      const defaultBody = template.sponsorship482Body || [
        `I hope this email finds you well.`,
        ``,
        `Thank you for contacting us regarding the Subclass 482 application for ${nomineeName}. We understand that the Standard Business Sponsorship (SBS) for ${sponsorName} has already been ${sbsStatus}.`,
        ``,
        `To proceed with the next stages, could you please supply the Sponsorship Approval notice and copies of your job advertisements with receipts? Please note that you must provide at least two different advertisements from different platforms, and they must not be older than four months to comply with Labour Market Testing (LMT) requirements.`,
        ``,
        `As a Registered Migration Agent, I am required by law to provide you with the attached Consumer Guide. Please reply to this email with: "Copy of consumer guide received."`,
        ``,
        `The 482 Visa Process:`,
        `Step 2: Nomination - The employer nominates the position (${occupation}${anzsco ? `, ANZSCO ${anzsco}` : ''}) and demonstrates a genuine need and lack of local candidates.`,
        `Step 3: Visa Application - The nominee must meet health, character, English proficiency, and skills/experience requirements.`,
      ].join('\n');
      body = `Dear ${contactName},\n\n${defaultBody}`;
    }

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.55;">
      <div style="white-space:pre-wrap;">${this.nl2br(body)}</div>
      ${feeBlocks.length ? `<h3 style="margin:22px 0 10px;font-size:16px;">Our Quotation and Services</h3>${this.tableHtml(feeBlocks, [{ key: 'label', label: 'Block of Work' }, { key: 'amount', label: 'Amount' }, { key: 'description', label: 'Description' }])}` : ''}
      ${governmentFees.length ? `<h3 style="margin:22px 0 10px;font-size:16px;">Estimated Government and Additional Fees</h3>${this.tableHtml(governmentFees, [{ key: 'label', label: 'Fee Type' }, { key: 'amount', label: 'Amount' }, { key: 'payer', label: 'Payer' }, { key: 'description', label: 'Notes' }])}` : ''}
      ${checklistItems.length ? `<h3 style="margin:22px 0 10px;font-size:16px;">Document Checklist</h3>${this.listHtml(checklistItems)}` : ''}
      ${this.renderBankSection(bank, `${sponsor?.companyName || client?.profile?.firstName || 'Matter'} / ${this.formatName(client?.profile || {}) || 'Client'}`)}
      <p><strong>Consumer Guide:</strong> The MARA Consumer Guide is attached for your reference. Official link: <a href="${OFFICIAL_CONSUMER_GUIDE_URL}">${OFFICIAL_CONSUMER_GUIDE_URL}</a></p>
    </body></html>`;

    return { to, subject, html, feeBlocks, governmentFees, checklistItems };
  }

  static buildSponsorshipPackageDraft({ to, consultancy, application, client, sponsor, draft }) {
    const bank = consultancy.bankDetails || {};
    const occupation = draft.occupation || draft.positionTitle || 'Chef';
    const anzsco = draft.anzscoCode || client?.profile?.anzscoCode || '351311';
    const sponsorName = sponsor?.companyName || 'Employer';
    const nomineeName = this.formatName(client?.profile || {}) || 'Nominee';
    const feeBlocks = draft.feeBlocks.length ? draft.feeBlocks : DEFAULT_482_FEE_BLOCKS;
    const governmentFees = draft.governmentFeeBlocks.length ? draft.governmentFeeBlocks : DEFAULT_482_GOVERNMENT_FEES;
    const checklistItems = draft.checklistItems.length ? draft.checklistItems : DEFAULT_482_CHECKLIST;
    const subject = draft.subject || `Sponsorship of ${occupation} for Subclass 482 Visa – ${sponsorName}`;
    const body = draft.customBody || [
      `Dear ${draft.recipientName || sponsor?.contactPerson?.firstName || 'Management Team'},`,
      ``,
      `I hope this email finds you well.`,
      ``,
      `Thank you for contacting us regarding the Subclass 482 application for ${nomineeName}. We understand that the Standard Business Sponsorship (SBS) for ${sponsorName} has already been ${draft.sbsStatus || sponsor?.sbsStatus || 'approved'}.`,
      ``,
      `To proceed with the next stages, could you please supply the Sponsorship Approval notice and copies of your job advertisements with receipts? You must provide at least two different advertisements from different platforms and they must not be older than four months to comply with Labour Market Testing requirements.`,
      ``,
      `As a Registered Migration Agent, I am required by law to provide you with the attached Consumer Guide. Please reply to this email with: "Copy of consumer guide received."`,
      ``,
      `The 482 Visa Process`,
      `Step 2: Nomination - The employer nominates the position (${occupation}, ANZSCO ${anzsco}) and demonstrates a genuine need and lack of local candidates.`,
      `Step 3: Visa Application - ${nomineeName} must meet health, character, English proficiency, and skills/experience requirements.`,
    ].join('\n');

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.55;">
      <div style="white-space:pre-wrap;">${this.nl2br(body)}</div>
      <h3 style="margin:22px 0 10px;font-size:16px;">Our Quotation and Services</h3>
      ${this.tableHtml(feeBlocks, [{ key: 'label', label: 'Block of Work' }, { key: 'amount', label: 'Amount' }, { key: 'description', label: 'Description' }])}
      <h3 style="margin:22px 0 10px;font-size:16px;">Estimated Government and Additional Fees</h3>
      ${this.tableHtml(governmentFees, [{ key: 'label', label: 'Fee Type' }, { key: 'amount', label: 'Amount' }, { key: 'payer', label: 'Payer' }, { key: 'description', label: 'Notes' }])}
      <h3 style="margin:22px 0 10px;font-size:16px;">Document Checklist for Nomination</h3>
      ${this.listHtml(checklistItems)}
      ${this.renderBankSection(bank, `${sponsorName} / ${nomineeName}`)}
      <p>I have also attached the Form 956, sample job description, sample list of applicants, genuine position report sample, and work reference sample for your use.</p>
      <p><strong>Consumer Guide:</strong> The MARA Consumer Guide is attached for your reference. Official link: <a href="${OFFICIAL_CONSUMER_GUIDE_URL}">${OFFICIAL_CONSUMER_GUIDE_URL}</a></p>
    </body></html>`;

    return { to, subject, html, feeBlocks, governmentFees, checklistItems };
  }

  static async previewForm956ToClient(clientId, user, payload = {}) {
    const { client, consultancy, application } = await this.loadClientContext(clientId, user, payload.applicationId);
    const f956 = consultancy.form956Details || {};
    const draft = this.buildForm956Draft({
      recipientName: this.formatName(client.profile),
      to: this.getClientEmail(client),
      consultancy,
      f956,
      subject: payload.subject,
      customBody: payload.customBody,
    });
    const generatedForm = await this.generateFilledForm956({ consultancy, client, application });
    const attachments = [
      ...(generatedForm ? [generatedForm] : this.getOfficialForm956Attachment()),
      ...this.getConsumerGuideAttachment(f956.consumerGuideUrl),
    ];
    return {
      ...draft,
      attachments: this.getAttachmentSummary(attachments),
      consumerGuideLink: OFFICIAL_CONSUMER_GUIDE_URL,
      applicationId: application?._id || payload.applicationId || null,
    };
  }

  static async sendForm956ToClient(clientId, user, payload = {}) {
    const preview = await this.previewForm956ToClient(clientId, user, payload);
    const { client, consultancy, application, cid } = await this.loadClientContext(clientId, user, payload.applicationId);
    const f956 = consultancy.form956Details || {};
    const generatedForm = await this.generateFilledForm956({ consultancy, client, application });
    const attachments = [
      ...(generatedForm ? [generatedForm] : this.getOfficialForm956Attachment()),
      ...this.getConsumerGuideAttachment(f956.consumerGuideUrl),
    ];
    await sendEmail({
      to: preview.to,
      subject: preview.subject,
      html: preview.html,
      replyTo: f956.email || consultancy.email || undefined,
      attachments,
      emailProfile: this.getEmailProfile(consultancy, user) || undefined,
    });
    if (payload.applicationId) {
      await this.persistApplicationCommunication(payload.applicationId, {}, {
        form956SentAt: new Date(),
        consumerGuideSentAt: new Date(),
      });
    }
    await logAudit(cid, 'Client', client._id, 'SEND', user._id, {
      description: 'Form 956 sent to client',
      applicationId: payload.applicationId,
    });
    if (payload.applicationId) {
      await WorkflowAutomationService.onCommunicationSent({
        communicationType: 'FORM_956',
        application: { _id: payload.applicationId, agentId: application?.agentId, clientId: client._id },
        consultancyId: cid,
        actorUserId: user._id,
        clientId: client._id,
        assignedTo: application?.agentId?._id || application?.agentId,
        dueInDays: 5,
        title: 'Follow up signed Form 956',
        description: 'Workflow-generated reminder to confirm the client has reviewed and signed Form 956.',
        priority: 'HIGH',
      });
    }
    return { success: true, preview };
  }

  static async previewMiaToClient(clientId, user, payload = {}) {
    const { client, consultancy, application } = await this.loadClientContext(clientId, user, payload.applicationId);
    const draft = this.buildMiaDraft({
      recipientName: this.formatName(client.profile),
      to: this.getClientEmail(client),
      consultancy,
      subject: payload.subject,
      customBody: payload.customBody,
    });
    return {
      ...draft,
      attachments: [],
      applicationId: application?._id || payload.applicationId || null,
    };
  }

  static async sendMiaToClient(clientId, user, payload = {}) {
    const preview = await this.previewMiaToClient(clientId, user, payload);
    const { client, consultancy, application, cid } = await this.loadClientContext(clientId, user, payload.applicationId);
    await sendEmail({
      to: preview.to,
      subject: preview.subject,
      html: preview.html,
      replyTo: consultancy.form956Details?.email || consultancy.email || undefined,
      emailProfile: this.getEmailProfile(consultancy, user) || undefined,
    });
    if (payload.applicationId) {
      await this.persistApplicationCommunication(payload.applicationId, {}, { miaSentAt: new Date() });
    }
    await logAudit(cid, 'Client', client._id, 'SEND', user._id, {
      description: 'MIA Agreement sent to client',
      applicationId: payload.applicationId,
    });
    if (payload.applicationId) {
      await WorkflowAutomationService.onCommunicationSent({
        communicationType: 'MIA',
        application: { _id: payload.applicationId, agentId: application?.agentId, clientId: client._id },
        consultancyId: cid,
        actorUserId: user._id,
        clientId: client._id,
        assignedTo: application?.agentId?._id || application?.agentId,
        dueInDays: 5,
        title: 'Follow up signed MIA agreement',
        description: 'Workflow-generated reminder to chase the signed MIA agreement and confirm authority to act.',
        priority: 'HIGH',
      });
    }
    return { success: true, preview };
  }

  static async previewInitialAdvice(clientId, user, payload = {}) {
    const { client, consultancy, application } = await this.loadClientContext(clientId, user, payload.applicationId);
    const sponsor = application?.sponsorId || null;
    const draftData = this.mergeDraftWithApplication(application, payload);
    const preview = this.buildInitialAdviceDraft({
      recipientName: this.formatName(client.profile),
      to: this.getClientEmail(client),
      consultancy,
      application,
      client,
      sponsor,
      draft: draftData,
    });
    const generatedForm = draftData.includeForm956Attachment ? await this.generateFilledForm956({ consultancy, client, application }) : null;
    const attachments = [
      ...(draftData.includeConsumerGuide ? this.getConsumerGuideAttachment(consultancy.form956Details?.consumerGuideUrl) : []),
      ...(generatedForm ? [generatedForm] : []),
    ];
    return {
      ...preview,
      attachments: this.getAttachmentSummary(attachments),
      consumerGuideLink: OFFICIAL_CONSUMER_GUIDE_URL,
      applicationId: application?._id || payload.applicationId || null,
    };
  }

  static async sendInitialAdvice(clientId, user, payload = {}) {
    const preview = await this.previewInitialAdvice(clientId, user, payload);
    const { client, consultancy, application, cid } = await this.loadClientContext(clientId, user, payload.applicationId);
    const draftData = this.mergeDraftWithApplication(application, payload);
    const generatedForm = draftData.includeForm956Attachment ? await this.generateFilledForm956({ consultancy, client, application }) : null;
    const attachments = [
      ...(draftData.includeConsumerGuide ? this.getConsumerGuideAttachment(consultancy.form956Details?.consumerGuideUrl) : []),
      ...(generatedForm ? [generatedForm] : []),
    ];
    await sendEmail({
      to: preview.to,
      subject: preview.subject,
      html: preview.html,
      replyTo: consultancy.form956Details?.email || consultancy.email || undefined,
      attachments,
      emailProfile: this.getEmailProfile(consultancy, user) || undefined,
    });
    if (payload.applicationId) {
      await this.persistApplicationCommunication(payload.applicationId, {
        subject: preview.subject,
        body: draftData.customBody,
        includeConsumerGuide: draftData.includeConsumerGuide,
        includeForm956Attachment: draftData.includeForm956Attachment,
        feeBlocks: preview.feeBlocks,
        governmentFeeBlocks: preview.governmentFees,
        checklistItems: preview.checklistItems,
        occupation: draftData.occupation,
        anzscoCode: draftData.anzscoCode,
        positionTitle: draftData.positionTitle,
        sbsStatus: draftData.sbsStatus,
        sampleAttachments: draftData.sampleAttachments,
      }, {
        initialAdviceSentAt: new Date(),
        consumerGuideSentAt: draftData.includeConsumerGuide && attachments.length ? new Date() : undefined,
      });
    }
    await logAudit(cid, 'Client', client._id, 'SEND', user._id, {
      description: 'Initial advice sent',
      applicationId: payload.applicationId,
    });
    if (payload.applicationId) {
      await WorkflowAutomationService.onCommunicationSent({
        communicationType: 'INITIAL_ADVICE',
        application,
        consultancyId: cid,
        actorUserId: user._id,
        clientId: client._id,
        assignedTo: application?.agentId?._id || application?.agentId,
        dueInDays: 3,
        title: 'Check initial advice acknowledgement',
        description: 'Workflow-generated reminder to confirm the client received the initial advice and consumer guide.',
        priority: 'MEDIUM',
      });
    }
    return { success: true, preview };
  }

  static async previewForm956ToSponsor(sponsorId, user, payload = {}) {
    const { sponsor, consultancy, application } = await this.loadSponsorContext(sponsorId, user, payload.applicationId);
    const f956 = consultancy.form956Details || {};
    const draft = this.buildForm956Draft({
      recipientName: sponsor.contactPerson?.firstName || sponsor.companyName,
      to: this.getSponsorEmail(sponsor),
      consultancy,
      f956,
      subject: payload.subject || `Form 956 - Migration Agent Appointment - ${consultancy.name}`,
      customBody: payload.customBody,
    });
    const generatedForm = await this.generateFilledForm956({ consultancy, sponsor, application });
    const attachments = [
      ...(generatedForm ? [generatedForm] : this.getOfficialForm956Attachment()),
      ...this.getConsumerGuideAttachment(f956.consumerGuideUrl),
    ];
    return {
      ...draft,
      attachments: this.getAttachmentSummary(attachments),
      consumerGuideLink: OFFICIAL_CONSUMER_GUIDE_URL,
      applicationId: application?._id || payload.applicationId || null,
    };
  }

  static async sendForm956ToSponsor(sponsorId, user, payload = {}) {
    const preview = await this.previewForm956ToSponsor(sponsorId, user, payload);
    const { sponsor, consultancy, application, cid } = await this.loadSponsorContext(sponsorId, user, payload.applicationId);
    const f956 = consultancy.form956Details || {};
    const generatedForm = await this.generateFilledForm956({ consultancy, sponsor, application });
    const attachments = [
      ...(generatedForm ? [generatedForm] : this.getOfficialForm956Attachment()),
      ...this.getConsumerGuideAttachment(f956.consumerGuideUrl),
    ];
    await sendEmail({
      to: preview.to,
      subject: preview.subject,
      html: preview.html,
      replyTo: f956.email || consultancy.email || undefined,
      attachments,
      emailProfile: this.getEmailProfile(consultancy, user) || undefined,
    });
    await Sponsor.findByIdAndUpdate(sponsor._id, { form956Signed: false });
    if (application?._id) {
      await this.persistApplicationCommunication(application._id, {}, {
        form956SentAt: new Date(),
        consumerGuideSentAt: new Date(),
      });
    }
    await logAudit(cid, 'Sponsor', sponsor._id, 'SEND', user._id, {
      description: 'Form 956 sent to sponsor',
      applicationId: application?._id,
    });
    if (application?._id) {
      await WorkflowAutomationService.onCommunicationSent({
        communicationType: 'SPONSOR_FORM_956',
        application,
        consultancyId: cid,
        actorUserId: user._id,
        clientId: application?.clientId?._id || application?.clientId,
        assignedTo: application?.agentId?._id || application?.agentId,
        dueInDays: 5,
        title: 'Follow up sponsor Form 956',
        description: 'Workflow-generated reminder to confirm the sponsor has actioned Form 956.',
        priority: 'HIGH',
      });
    }
    return { success: true, preview };
  }

  static async previewMiaToSponsor(sponsorId, user, payload = {}) {
    const { sponsor, consultancy, application } = await this.loadSponsorContext(sponsorId, user, payload.applicationId);
    const draft = this.buildMiaDraft({
      recipientName: sponsor.contactPerson?.firstName || sponsor.companyName,
      to: this.getSponsorEmail(sponsor),
      consultancy,
      subject: payload.subject || `MIA Agreement - ${consultancy.name}`,
      customBody: payload.customBody,
    });
    return {
      ...draft,
      attachments: [],
      applicationId: application?._id || payload.applicationId || null,
    };
  }

  static async sendMiaToSponsor(sponsorId, user, payload = {}) {
    const preview = await this.previewMiaToSponsor(sponsorId, user, payload);
    const { sponsor, consultancy, application, cid } = await this.loadSponsorContext(sponsorId, user, payload.applicationId);
    await sendEmail({
      to: preview.to,
      subject: preview.subject,
      html: preview.html,
      replyTo: consultancy.form956Details?.email || consultancy.email || undefined,
      emailProfile: this.getEmailProfile(consultancy, user) || undefined,
    });
    await Sponsor.findByIdAndUpdate(sponsor._id, { miaSigned: false });
    if (application?._id) {
      await this.persistApplicationCommunication(application._id, {}, { miaSentAt: new Date() });
    }
    await logAudit(cid, 'Sponsor', sponsor._id, 'SEND', user._id, {
      description: 'MIA Agreement sent to sponsor',
      applicationId: application?._id,
    });
    if (application?._id) {
      await WorkflowAutomationService.onCommunicationSent({
        communicationType: 'SPONSOR_MIA',
        application,
        consultancyId: cid,
        actorUserId: user._id,
        clientId: application?.clientId?._id || application?.clientId,
        assignedTo: application?.agentId?._id || application?.agentId,
        dueInDays: 5,
        title: 'Follow up sponsor MIA',
        description: 'Workflow-generated reminder to collect the signed sponsor MIA agreement.',
        priority: 'HIGH',
      });
    }
    return { success: true, preview };
  }

  static async previewSponsorshipPackage(sponsorId, user, payload = {}) {
    const { sponsor, consultancy, application, client } = await this.loadSponsorContext(sponsorId, user, payload.applicationId);
    const draftData = this.mergeDraftWithApplication(application, payload);
    const preview = this.buildSponsorshipPackageDraft({
      to: this.getSponsorEmail(sponsor),
      consultancy,
      application,
      client,
      sponsor,
      draft: draftData,
    });
    const generatedForm = await this.generateFilledForm956({ consultancy, sponsor, application, client });
    const attachments = [
      ...(generatedForm ? [generatedForm] : this.getOfficialForm956Attachment()),
      ...this.getConsumerGuideAttachment(consultancy.form956Details?.consumerGuideUrl),
      ...this.getSampleAttachments(draftData.sampleAttachments.length ? draftData.sampleAttachments : Object.keys(SAMPLE_ATTACHMENT_FILES)),
    ];
    return {
      ...preview,
      attachments: this.getAttachmentSummary(attachments),
      consumerGuideLink: OFFICIAL_CONSUMER_GUIDE_URL,
      applicationId: application?._id || payload.applicationId || null,
      sampleAttachments: draftData.sampleAttachments.length ? draftData.sampleAttachments : Object.keys(SAMPLE_ATTACHMENT_FILES),
    };
  }

  static async sendSponsorshipPackage(sponsorId, user, payload = {}) {
    const preview = await this.previewSponsorshipPackage(sponsorId, user, payload);
    const { sponsor, consultancy, application, cid } = await this.loadSponsorContext(sponsorId, user, payload.applicationId);
    const draftData = this.mergeDraftWithApplication(application, payload);
    const sampleAttachments = draftData.sampleAttachments.length ? draftData.sampleAttachments : Object.keys(SAMPLE_ATTACHMENT_FILES);
    const generatedForm = await this.generateFilledForm956({ consultancy, sponsor, application, client: application?.clientId || null });
    const attachments = [
      ...(generatedForm ? [generatedForm] : this.getOfficialForm956Attachment()),
      ...this.getConsumerGuideAttachment(consultancy.form956Details?.consumerGuideUrl),
      ...this.getSampleAttachments(sampleAttachments),
    ];
    await sendEmail({
      to: preview.to,
      subject: preview.subject,
      html: preview.html,
      replyTo: consultancy.form956Details?.email || consultancy.email || undefined,
      attachments,
      emailProfile: this.getEmailProfile(consultancy, user) || undefined,
    });
    if (application?._id) {
      await this.persistApplicationCommunication(application._id, {
        subject: preview.subject,
        body: draftData.customBody,
        feeBlocks: preview.feeBlocks,
        governmentFeeBlocks: preview.governmentFees,
        checklistItems: preview.checklistItems,
        occupation: draftData.occupation,
        anzscoCode: draftData.anzscoCode,
        positionTitle: draftData.positionTitle,
        sbsStatus: draftData.sbsStatus,
        sampleAttachments,
      }, {
        sponsorshipPackageSentAt: new Date(),
        consumerGuideSentAt: attachments.length ? new Date() : undefined,
      });
    }
    await logAudit(cid, 'Sponsor', sponsor._id, 'SEND', user._id, {
      description: '482 sponsorship package sent to sponsor',
      applicationId: application?._id,
    });
    if (application?._id) {
      await WorkflowAutomationService.onCommunicationSent({
        communicationType: 'SPONSORSHIP_PACKAGE',
        application,
        consultancyId: cid,
        actorUserId: user._id,
        clientId: application?.clientId?._id || application?.clientId,
        assignedTo: application?.agentId?._id || application?.agentId,
        dueInDays: 4,
        title: 'Review sponsorship package response',
        description: 'Workflow-generated reminder to review sponsor documents, LMT evidence, and package completion.',
        priority: 'HIGH',
      });
    }
    return { success: true, preview };
  }
}
