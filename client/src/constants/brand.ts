/** Public product name — use for UI copy, emails, PDFs, meta titles */
export const BRAND_NAME = 'Abroad Up';
export const BRAND_NAME_SHORT = 'AbroadUp';

/** Primary marketing line (also in raster logo artwork when applicable) */
export const BRAND_TAGLINE = 'Your Global Journey Elevated.';

/** Set true when `BRAND_LOGO_PATH` PNG already includes the tagline text (no duplicate line under the image). */
export const BRAND_LOGO_INCLUDES_TAGLINE = true;

/** Raster logo in `client/public` */
export const BRAND_LOGO_PATH = '/logo3.png';

/** Brand palette — match logo (navy + antique gold + charcoal) */
export const BRAND_COLOR_NAVY = '#1B365D';
export const BRAND_COLOR_GOLD = '#C1A376';
export const BRAND_COLOR_CHARCOAL = '#333333';

/** Canonical domain (use in copy when you want the “main” site) */
export const BRAND_DOMAIN = 'abroadup.com';

/** All production hostnames served by Nginx (HTTPS after Certbot). */
export const BRAND_DOMAINS = [
  'abroadup.com',
  'www.abroadup.com',
  'abroadup.online',
  'www.abroadup.online',
] as const;

/** Legal / operating company (footer, contact, copyright) */
export const COMPANY_NAME = 'AuthKeep';
export const COMPANY_WEBSITE = 'https://authkeep.com';
export const COMPANY_EMAIL = 'info@authkeep.com';
/** Display as AU national format */
export const COMPANY_PHONE_DISPLAY = '0433 432 085';
export const COMPANY_PHONE_TEL = '+61433432085';
