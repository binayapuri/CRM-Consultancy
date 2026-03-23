import ogs from 'open-graph-scraper';

const CACHE_TTL_MS = 10 * 60 * 1000;
const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX = 40;
const MAX_URL_LEN = 2048;

/** @type {Map<string, { at: number, result: object }>} */
const cache = new Map();
/** @type {Map<string, { count: number; windowStart: number }>} */
const rateByUser = new Map();

function normalizeUrl(raw) {
  let s = String(raw || '').trim();
  if (!s) return;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  let u;
  try {
    u = new URL(s);
  } catch {
    return;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return;
  return u.href;
}

function degradedPayload(normalized) {
  let hostname = normalized;
  try {
    hostname = new URL(normalized).hostname.replace(/^www\./, '');
  } catch {
    /* keep normalized */
  }
  const path = (() => {
    try {
      const p = new URL(normalized).pathname;
      return p && p !== '/' ? p.slice(0, 80) : '';
    } catch {
      return '';
    }
  })();
  const title = path ? `${hostname}${path.length < 80 ? path : `${path.slice(0, 77)}…`}` : hostname;
  return {
    url: normalized,
    title: title.slice(0, 500),
    description: '',
    image: '',
    degraded: true,
  };
}

function pickImage(ogImage) {
  if (!ogImage) return '';
  if (Array.isArray(ogImage)) return ogImage[0]?.url || ogImage[0] || '';
  if (typeof ogImage === 'object' && ogImage.url) return ogImage.url;
  if (typeof ogImage === 'string') return ogImage;
  return '';
}

function toAbsoluteUrl(baseUrl, maybeRelative) {
  if (!maybeRelative) return '';
  try {
    return new URL(maybeRelative, baseUrl).href;
  } catch {
    return maybeRelative;
  }
}

function checkRateLimit(userId) {
  const id = String(userId);
  const now = Date.now();
  let row = rateByUser.get(id);
  if (!row || now - row.windowStart > RATE_WINDOW_MS) {
    row = { count: 0, windowStart: now };
    rateByUser.set(id, row);
  }
  row.count += 1;
  if (row.count > RATE_MAX) {
    const err = new Error('Too many link preview requests. Try again in a few minutes.');
    err.status = 429;
    throw err;
  }
}

/**
 * @param {{ url: string, userId: string }} opts
 * @returns {Promise<{ url: string, title: string, description: string, image: string, degraded?: boolean }>}
 */
export async function fetchLinkPreview({ url, userId }) {
  const normalized = normalizeUrl(url);
  if (!normalized || normalized.length > MAX_URL_LEN) {
    throw Object.assign(new Error('Invalid URL'), { status: 400 });
  }

  const cached = cache.get(normalized);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.result;
  }

  checkRateLimit(userId);

  let data;
  try {
    data = await ogs({
      url: normalized,
      timeout: 10,
      fetchOptions: {
        headers: {
          'User-Agent': 'OriVisaCommunityBot/1.0 (+https://orivisa.com)',
          Accept: 'text/html,application/xhtml+xml',
        },
      },
    });
  } catch {
    const fallback = degradedPayload(normalized);
    cache.set(normalized, { at: Date.now(), result: fallback });
    return fallback;
  }

  if (data.error || !data.result) {
    const fallback = degradedPayload(normalized);
    cache.set(normalized, { at: Date.now(), result: fallback });
    return fallback;
  }

  const result = data.result;

  const title = (result.ogTitle || result.twitterTitle || result.dcTitle || '').trim() || normalized;
  const description = (result.ogDescription || result.twitterDescription || '').trim();
  const rawImg = pickImage(result.ogImage || result.twitterImage);
  const image = toAbsoluteUrl(normalized, rawImg);

  const payload = {
    url: result.ogUrl || result.requestUrl || normalized,
    title: title.slice(0, 500),
    description: description.slice(0, 2000),
    image: image.slice(0, 2048),
    degraded: false,
  };

  cache.set(normalized, { at: Date.now(), result: payload });
  return payload;
}
