/**
 * Builds nodemailer SMTP options with Gmail-safe defaults.
 * - Trims host/user; strips whitespace from password (Gmail app passwords are often pasted with spaces).
 * - For smtp.gmail.com, aligns `secure` with port: 465 → SSL, 587 → STARTTLS.
 */
export function nodemailerOptionsFromSmtpFields({ host, port, secure, user, pass }) {
  const h = String(host || '').trim();
  const p = Number(port) || 587;
  const u = String(user || '').trim();
  const pwd = String(pass ?? '').replace(/\s/g, '');
  let s = !!secure;
  if (h.toLowerCase() === 'smtp.gmail.com') {
    if (p === 465) s = true;
    if (p === 587) s = false;
  }
  return {
    host: h,
    port: p,
    secure: s,
    auth: { user: u, pass: pwd },
  };
}
