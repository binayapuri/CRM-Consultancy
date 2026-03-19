/**
 * Resolve image/file URLs from the backend.
 *
 * Stored URLs are usually relative (`/uploads/xyz.jpg`).  In development the
 * frontend runs on :3000 while the API runs on :4000, so relative paths 404.
 * This helper prepends the API base so images always point to the server.
 */
const API_BASE: string =
  (import.meta.env.VITE_API_URL as string) ||
  (import.meta.env.DEV ? 'http://localhost:4000' : '');

export function resolveFileUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}
