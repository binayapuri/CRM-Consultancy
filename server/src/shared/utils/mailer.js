import nodemailer from 'nodemailer';
import PlatformSettings from '../models/PlatformSettings.js';
import Client from '../models/Client.js';
import crypto from 'crypto';

function getStudentKey() {
  const key = process.env.STUDENT_SMTP_ENC_KEY || '';
  if (key.length < 32) {
    const err = new Error('Student SMTP encryption key missing. Set STUDENT_SMTP_ENC_KEY (32+ chars).');
    err.statusCode = 503;
    throw err;
  }
  // Derive 32-byte key
  return crypto.createHash('sha256').update(key).digest();
}

export function encryptStudentSecret(plain) {
  const key = getStudentKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

export function decryptStudentSecret(payload) {
  if (!payload) return '';
  const [v, ivB64, tagB64, dataB64] = String(payload).split(':');
  if (v !== 'v1' || !ivB64 || !tagB64 || !dataB64) return '';
  const key = getStudentKey();
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString('utf8');
}

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

export async function sendStudentMail(userId, { to, subject, text, html, attachments }) {
  const client = await Client.findOne({ userId });
  const smtp = client?.profile?.invoiceSettings?.smtp || {};
  if (!smtp.enabled) {
    const err = new Error('Student SMTP is disabled. Configure it in Student Settings → Invoices.');
    err.statusCode = 503;
    throw err;
  }
  if (!smtp.host || !smtp.user || !smtp.passEnc) {
    const err = new Error('Student SMTP is not configured. Set host/user/password in Student Settings → Invoices.');
    err.statusCode = 503;
    throw err;
  }
  const pass = decryptStudentSecret(smtp.passEnc);
  if (!pass) {
    const err = new Error('Student SMTP password could not be decrypted. Please re-save SMTP password.');
    err.statusCode = 503;
    throw err;
  }

  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port || 587,
    secure: !!smtp.secure,
    auth: { user: smtp.user, pass },
  });
  const from = smtp.from || smtp.user;
  await transport.sendMail({ from, to, subject, text, html, attachments });
}

