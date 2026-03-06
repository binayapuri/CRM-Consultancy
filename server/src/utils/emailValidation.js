/** Personal email domains - consultancy admin must use business email */
const PERSONAL_DOMAINS = [
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.com.au', 'outlook.com', 'hotmail.com',
  'hotmail.com.au', 'live.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com', 'protonmail.com',
  'mail.com', 'zoho.com', 'yandex.com', 'gmx.com', 'inbox.com', 'rediffmail.com', 'qq.com',
  '163.com', '126.com', 'ymail.com', 'msn.com', 'sky.com', 'btinternet.com', 'virginmedia.com',
];

export function isBusinessEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return !PERSONAL_DOMAINS.includes(domain);
}

export function getEmailDomain(email) {
  if (!email || typeof email !== 'string') return '';
  return email.split('@')[1]?.toLowerCase() || '';
}
