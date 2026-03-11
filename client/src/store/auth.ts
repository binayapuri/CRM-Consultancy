import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API = '/api';

type User = {
  id?: string;
  _id?: string;
  email: string;
  role: string;
  profile?: { firstName?: string; lastName?: string; consultancyId?: string };
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

/** Returns true if the 401 response indicates the JWT is invalid/expired (so we should clear auth and redirect to login). */
function isTokenInvalid401(res: Response, body: { error?: string } | null): boolean {
  if (res.status !== 401 || !body?.error) return false;
  const msg = String(body.error).toLowerCase();
  // Only treat as logout-worthy when the JWT itself is invalid/expired.
  // Do NOT logout on generic "access denied / no token" messages because those can be caused by
  // a misrouted request, missing header on a single call, or role-based endpoint restrictions.
  return /invalid token|token expired|jwt|signature|malformed|sign in again/i.test(msg);
}

export function authFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { ...opts, headers }).then((res) => {
    if (res.status === 401) {
      const clone = res.clone();
      clone.json().then((body: { error?: string } | null) => {
        if (isTokenInvalid401(res, body)) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      }).catch(() => {});
    }
    return res;
  });
}

/** Safe JSON parse - throws clear error if server returns HTML (e.g. backend not running) */
export async function safeJson<T = unknown>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (text?.trim().startsWith('<')) {
      throw new Error('Backend returned HTML instead of JSON. Is the server running on port 4000? Run: npm run dev');
    }
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}
