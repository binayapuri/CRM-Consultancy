import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API = '/api';

type User = {
  id?: string;
  _id?: string;
  email: string;
  role: string;
  // Broad profile type used across the app; keep it flexible to avoid TS errors
  profile?: any;
};

type AuthState = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  register: (email: string, password: string, role: string, profile?: object) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: async (email, password) => {
        const res = await fetch(`${API}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        set({ user: data.user, token: data.token });
      },
      loginWithToken: async (token) => {
        set({ token });
        const res = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Invalid token');
        const user = await res.json();
        set({ user, token });
      },
      register: async (email, password, role, profile) => {
        const res = await fetch(`${API}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role, profile }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        set({ user: data.user, token: data.token });
      },
      logout: () => set({ user: null, token: null }),
      fetchUser: async () => {
        const { token } = get();
        if (!token) return;
        const res = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const user = await res.json();
          set({ user });
        } else if (res.status === 401) {
          set({ user: null, token: null });
        }
      },
    }),
    { name: 'orivisa-auth' }
  )
);

/** Returns true if the 401 response indicates the JWT is invalid/expired (cleared session). */
function isTokenInvalid401(res: Response, body: { error?: string } | null): boolean {
  // 403 = role-forbidden, never logout. Only 401 with JWT error strings.
  if (res.status !== 401 || !body?.error) return false;
  const msg = String(body.error).toLowerCase();
  return /invalid token|token expired|jwt|signature|malformed|sign in again|no token|authorization/i.test(msg);
}

const API_BASE =
  (import.meta.env.VITE_API_URL as string) ||
  (import.meta.env.DEV ? 'http://localhost:4000' : '');

export function authFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;

  return fetch(fullUrl, { ...opts, headers }).then((res) => {
    // NEVER force logout on 403 — that is a role/permission deny, not an auth failure
    if (res.status === 401) {
      res.clone().json()
        .then((body: { error?: string } | null) => {
          if (isTokenInvalid401(res, body)) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
          }
        })
        .catch(() => {/* ignore non-json 401 errors gracefully */});
    }
    return res;
  });
}

/** Safe JSON parse - throws clear error if server returns HTML or malformed JSON */
export async function safeJson<T = unknown>(res: Response): Promise<T> {
  const clone = res.clone();
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (text?.trim().startsWith('<')) {
      throw new Error('Backend returned HTML instead of JSON. Is the server running on port 4000? Run: npm run dev');
    }
    throw new Error(text || `Request failed: ${res.status}`);
  }
  try {
    return await res.json();
  } catch {
    const text = await clone.text().catch(() => '');
    if (text?.trim().startsWith('<')) {
      throw new Error('Backend returned HTML instead of JSON. Is the server running on port 4000? Run: npm run dev');
    }
    throw new Error(text ? `Invalid JSON: ${text.slice(0, 120)}...` : `Request failed: ${res.status}`);
  }
}
