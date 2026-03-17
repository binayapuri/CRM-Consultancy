import nodemailer from 'nodemailer';
import PlatformSettings from '../models/PlatformSettings.js';

export async function getSmtpTransport() {
  const doc = await PlatformSettings.findOne();
  const smtp = doc?.smtp || {};
  if (!smtp.enabled) {
    const err = new Error('SMTP is disabled. Configure SMTP in Super Admin settings.');
    err.statusCode = 503;
    throw err;
  }
  if (!smtp.host || !smtp.user || !smtp.pass) {
    const err = new Error('SMTP is not configured. Set host/user/pass in Super Admin settings.');
    err.statusCode = 503;
    throw err;
  }
  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port || 587,
    secure: !!smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });
  return { transport, from: smtp.from || smtp.user };
}

export async function sendMail({ to, subject, text, html, attachments }) {
  const { transport, from } = await getSmtpTransport();
  await transport.sendMail({
    from,
    to,
    subject,
    text,
    html,
    attachments,
  });
}

