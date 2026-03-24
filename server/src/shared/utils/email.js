import nodemailer from 'nodemailer';
import { tryGetPlatformSmtpTransport } from './mailer.js';
import { nodemailerOptionsFromSmtpFields } from './smtpNormalize.js';

let defaultTransporter = null;

function getDefaultTransporter() {
  if (defaultTransporter) return defaultTransporter;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (host && user && pass) {
    defaultTransporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure: port === '465',
      auth: { user, pass },
    });
  } else {
    defaultTransporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return defaultTransporter;
}

/** Create transporter from custom profile (consultancy email config) */
function getTransporterFromProfile(profile) {
  if (!profile?.host || !profile?.user) return null;
  const opts = nodemailerOptionsFromSmtpFields({
    host: profile.host,
    port: profile.port || 587,
    secure: profile.secure,
    user: profile.user,
    pass: profile.pass || '',
  });
  return nodemailer.createTransport(opts);
}

export async function sendEmail({ to, subject, html, text, replyTo, attachments = [], from: customFrom, emailProfile }) {
  let transport;
  let from = customFrom;
  let usedPlatformSmtp = false;
  if (emailProfile?.host && emailProfile?.user) {
    transport = getTransporterFromProfile(emailProfile);
    from = customFrom || emailProfile.from || emailProfile.user;
  }
  if (!transport) {
    const platform = await tryGetPlatformSmtpTransport();
    if (platform) {
      transport = platform.transport;
      from = customFrom || platform.from;
      usedPlatformSmtp = true;
    } else {
      transport = getDefaultTransporter();
      from = customFrom || process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@orivisa.com';
    }
  }
  const mailOptions = {
    from: from || 'noreply@orivisa.com',
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html: html || text,
    text: text || (html ? html.replace(/<[^>]*>/g, '') : ''),
    replyTo,
    attachments: attachments.filter(Boolean),
  };
  const info = await transport.sendMail(mailOptions);
  const usingEnvSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  if (!usingEnvSmtp && !usedPlatformSmtp && !emailProfile?.host) {
    console.log('[Email] Sent (dev mode):', { to, subject, messageId: info.messageId });
  }
  return info;
}

export function isEmailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** True if env SMTP or Super Admin platform SMTP can send mail (consultancy profile checked separately). */
export async function isEmailConfiguredAsync() {
  if (isEmailConfigured()) return true;
  const platform = await tryGetPlatformSmtpTransport();
  return !!platform;
}
