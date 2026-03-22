/**
 * Must be imported before any other local module that reads process.env.
 * Resolves server/.env from this file's location (cwd-independent) and
 * overrides shell vars so server/.env is always the source of truth locally.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });
