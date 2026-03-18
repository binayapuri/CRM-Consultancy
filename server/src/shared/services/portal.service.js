import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Client from '../../shared/models/Client.js';
import Sponsor from '../../shared/models/Sponsor.js';
import Consultancy from '../../shared/models/Consultancy.js';
import { sendEmail } from '../../shared/utils/email.js';
import { logAudit } from '../../shared/utils/audit.js';
import { EMAIL_TEMPLATES } from '../../constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../../uploads');

export class PortalService {
  static getEmailProfile(consultancy, user) {
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

  // --- Client ---
  static async sendForm956ToClient(clientId, user) {
    const client = await Client.findById(clientId);
    if (!client) throw Object.assign(new Error('Client not found'), { status: 404 });
    
    const cid = user.role === 'SUPER_ADMIN' ? client.consultancyId : (user.profile?.consultancyId || user._id);
    if (client.consultancyId?.toString() !== cid?.toString()) throw Object.assign(new Error('Not authorized'), { status: 403 });
    
    const consultancy = await Consultancy.findById(cid);
    const f956 = consultancy.form956Details || {};
    const clientEmail = client.profile?.email;
    if (!clientEmail) throw Object.assign(new Error('Client has no email'), { status: 400 });

    const agentName = f956.agentName || consultancy.name;
    const companyName = f956.companyName || consultancy.name;
    const tpl = EMAIL_TEMPLATES.form956;
    
    const html = this.generateForm956Html(client.profile?.firstName, f956, consultancy, tpl);
    const attachments = this.getSignatureAttachment(f956.signatureUrl);

    await sendEmail({
      to: clientEmail,
      subject: `Form 956 - Migration Agent Appointment - ${companyName}`,
      html,
      replyTo: f956.email || consultancy.email || undefined,
      attachments,
      emailProfile: this.getEmailProfile(consultancy, user) || undefined,
    });

    await logAudit(cid, 'Client', client._id, 'SEND', user._id, { description: 'Form 956 sent to client' });
    return { success: true };
  }

  static async sendMiaToClient(clientId, user) {
    const client = await Client.findById(clientId);
    if (!client) throw Object.assign(new Error('Client not found'), { status: 404 });
    const cid = user.role === 'SUPER_ADMIN' ? client.consultancyId : (user.profile?.consultancyId || user._id);
    if (client.consultancyId?.toString() !== cid?.toString()) throw Object.assign(new Error('Not authorized'), { status: 403 });

    const consultancy = await Consultancy.findById(cid);
    const mia = consultancy.miaAgreementDetails || consultancy.form956Details || {};
    const agentName = mia.agentName || consultancy.form956Details?.agentName || consultancy.name;
    const tplMia = EMAIL_TEMPLATES.mia;

    const html = this.generateMiaHtml(client.profile?.firstName, agentName, mia.marnNumber || consultancy.form956Details?.marnNumber || consultancy.marnNumbers?.[0] || '', tplMia);

    await sendEmail({
      to: client.profile?.email,
      subject: `MIA Agreement - ${consultancy.displayName || consultancy.name}`,
      html,
      replyTo: consultancy.form956Details?.email || consultancy.email || undefined,
      emailProfile: this.getEmailProfile(consultancy, user) || undefined,
    });

    await logAudit(cid, 'Client', client._id, 'SEND', user._id, { description: 'MIA Agreement sent to client' });
    return { success: true };
  }

  static async sendInitialAdvice(clientId, user, data) {
    const { applicationId, customBody, feeBlocks } = data;
    const client = await Client.findById(clientId);
    const cid = user.role === 'SUPER_ADMIN' ? client.consultancyId : (user.profile?.consultancyId || user._id);
    const consultancy = await Consultancy.findById(cid);

    const template = consultancy.initialAdviceTemplate || {};
    const bank = consultancy.bankDetails || {};
    const f956 = consultancy.form956Details || {};
    const tplAdvice = EMAIL_TEMPLATES.initialAdvice;

    let body = customBody || template.body || tplAdvice?.bodyIntro || `Thank you...`;
    const blocks = feeBlocks || template.feeBlocks || tplAdvice?.defaultFeeBlocks || [];

    const html = this.generateInitialAdviceHtml(body, blocks, bank, f956, consultancy);

    await sendEmail({
      to: client.profile?.email,
      subject: template.subject || `Initial Advice & Fee Estimation - ${consultancy.name}`,
      html,
      replyTo: f956.email || consultancy.email || undefined,
      emailProfile: this.getEmailProfile(consultancy, user) || undefined,
    });

    await logAudit(cid, 'Client', client._id, 'SEND', user._id, { description: 'Initial advice sent', applicationId });
    return { success: true };
  }

  // --- Sponsor ---
  static async sendForm956ToSponsor(sponsorId, user) {
    const sponsor = await Sponsor.findById(sponsorId);
    const cid = user.role === 'SUPER_ADMIN' ? sponsor.consultancyId : (user.profile?.consultancyId || user._id);
    const consultancy = await Consultancy.findById(cid);

    const f956 = consultancy.form956Details || {};
    const html = this.generateForm956Html(sponsor.contactPerson?.firstName || sponsor.companyName, f956, consultancy, EMAIL_TEMPLATES.form956);
    const attachments = this.getSignatureAttachment(f956.signatureUrl);

    await sendEmail({
      to: sponsor.contactPerson?.email || sponsor.email,
      subject: `Form 956 - Migration Agent Appointment - ${consultancy.name}`,
      html,
      replyTo: f956.email || consultancy.email || undefined,
      attachments,
      emailProfile: this.getEmailProfile(consultancy, user) || undefined,
    });

    await Sponsor.findByIdAndUpdate(sponsor._id, { form956Signed: false });
    await logAudit(cid, 'Sponsor', sponsor._id, 'SEND', user._id, { description: 'Form 956 sent to sponsor' });
    return { success: true };
  }

  static async sendMiaToSponsor(sponsorId, user) {
    const sponsor = await Sponsor.findById(sponsorId);
    const cid = user.role === 'SUPER_ADMIN' ? sponsor.consultancyId : (user.profile?.consultancyId || user._id);
    const consultancy = await Consultancy.findById(cid);

    const mia = consultancy.miaAgreementDetails || consultancy.form956Details || {};
    const agentName = mia.agentName || consultancy.form956Details?.agentName || consultancy.name;
    const html = this.generateMiaHtml(sponsor.contactPerson?.firstName || sponsor.companyName, agentName, '', EMAIL_TEMPLATES.mia);

    await sendEmail({
      to: sponsor.contactPerson?.email || sponsor.email,
      subject: `MIA Agreement - ${consultancy.name}`,
      html,
      replyTo: consultancy.form956Details?.email || consultancy.email || undefined,
      emailProfile: this.getEmailProfile(consultancy, user) || undefined,
    });

    await logAudit(cid, 'Sponsor', sponsor._id, 'SEND', user._id, { description: 'MIA Agreement sent to sponsor' });
    return { success: true };
  }

  // --- Helpers ---
  static getSignatureAttachment(signatureUrl) {
    if (!signatureUrl) return [];
    const basename = signatureUrl.split('/').pop();
    const sigPath = path.join(uploadsDir, basename);
    if (fs.existsSync(sigPath)) {
      return [{ filename: 'agent-signature.png', content: fs.readFileSync(sigPath) }];
    }
    return [];
  }

  static generateForm956Html(name, f956, consultancy, tpl) {
    const agentName = f956.agentName || consultancy.name;
    const marn = f956.marnNumber || consultancy.marnNumbers?.[0] || '';
    const companyName = f956.companyName || consultancy.name;
    const addr = f956.address || [consultancy.address?.street, consultancy.address?.city, consultancy.address?.state].filter(Boolean).join(', ');
    const phone = f956.phone || consultancy.phone || '';
    const email = f956.email || consultancy.email || '';
    const intro = tpl?.bodyIntro || 'As required...';

    return `<!DOCTYPE html><html><body><p>Dear ${name},</p><p>${intro.replace(/\n/g, '<br/>')}</p><ul><li>Agent: ${agentName}</li><li>MARN: ${marn}</li><li>Company: ${companyName}</li><li>Address: ${addr}</li><li>Phone: ${phone}</li><li>Email: ${email}</li></ul><p>Please download Form 956...</p></body></html>`;
  }

  static generateMiaHtml(name, agentName, marn, tpl) {
    const intro = tpl?.bodyIntro || 'Please find attached...';
    return `<!DOCTYPE html><html><body><p>Dear ${name},</p><p>${intro.replace(/\n/g, '<br/>')}</p><p>Agent: ${agentName}${marn ? ` (${marn})` : ''}</p></body></html>`;
  }

  static generateInitialAdviceHtml(body, blocks, bank, f956, consultancy) {
    let feeSection = '<h3>Estimate...</h3><table>...</table>';
    let bankSection = bank.accountName ? `<h3>Bank...</h3>` : '';
    return `<!DOCTYPE html><html><body><div style="white-space: pre-wrap;">${body.replace(/\n/g, '<br/>')}</div>${feeSection}${bankSection}</body></html>`;
  }
}
