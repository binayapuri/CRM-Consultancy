const URL_RE = /https?:\/\/[^\s<>"'()[\]{}]+/gi;

/** First http(s) URL in text (trailing punctuation trimmed). */
export function extractFirstUrl(text: string): string | null {
  const m = text.match(URL_RE);
  if (!m?.[0]) return null;
  let u = m[0].replace(/[),.;!?]+$/, '');
  if (!/^https?:\/\//i.test(u)) return null;
  return u;
}

/** Unique hashtag tokens without # (alphanumeric + underscore + unicode letters). */
export function extractHashtags(text: string): string[] {
  const re = /#([a-zA-Z0-9_\u00C0-\u024F]+)/g;
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    set.add(m[1].toLowerCase());
  }
  return [...set];
}

/** API `title`: headline, else first line of body, else fallback (min 3 chars for schema). */
export function buildPostTitle(headline: string, body: string): string {
  const h = headline.trim();
  if (h.length >= 3) return h.slice(0, 200);
  const lines = body.split(/\r?\n/).map((l) => l.trim());
  const firstLine = lines.find((l) => l.length > 0) || '';
  const plain = firstLine.replace(/#[a-zA-Z0-9_\u00C0-\u024F]+/g, '').trim();
  if (plain.length >= 3) return plain.slice(0, 200);
  if (firstLine.length >= 3) return firstLine.slice(0, 200);
  const compact = body.replace(/\s+/g, ' ').trim();
  if (compact.length >= 3) return compact.slice(0, 200);
  return 'Community post';
}

/** Short label for a link when OG data is missing (hostname + optional path). */
export function linkDisplayTitle(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const path = u.pathname && u.pathname !== '/' ? u.pathname.slice(0, 80) : '';
    return path ? `${host}${path.length < 80 ? path : `${path.slice(0, 77)}…`}` : host;
  } catch {
    return url.slice(0, 120);
  }
}
