import nodemailer from 'nodemailer';

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
  return nodemailer.createTransport({
    host: profile.host,
    port: profile.port || 587,
    secure: profile.secure || false,
    auth: { user: profile.user, pass: profile.pass || '' },
  });
}

export async function sendEmail({ to, subject, html, text, replyTo, attachments = [], from: customFrom, emailProfile }) {
  let transport;
  let from = customFrom;
  if (emailProfile?.host && emailProfile?.user) {
    transport = getTransporterFromProfile(emailProfile);
    from = customFrom || emailProfile.from || emailProfile.user;
  }
  if (!transport) {
    transport = getDefaultTransporter();
    from = customFrom || process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@orivisa.com';
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
  if (!process.env.SMTP_HOST) {
    console.log('[Email] Sent (dev mode):', { to, subject, messageId: info.messageId });
  }
  return info;
}

export function isEmailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}
