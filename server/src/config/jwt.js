import '../loadEnv.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'orivisa-secret-key-change-in-production';
/** Default session length for password / OAuth / OTP login (override with JWT_EXPIRES_IN). */
export const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '24h';
