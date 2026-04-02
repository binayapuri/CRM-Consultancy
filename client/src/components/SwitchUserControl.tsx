import { useState, useRef, useEffect } from 'react';
import { Users, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { getDashboardPathForRole } from '../lib/authHelpers';
import { useUiStore } from '../store/ui';

const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'Student',
  SUPER_ADMIN: 'Super Admin',
  CONSULTANCY_ADMIN: 'Consultancy',
  MANAGER: 'Manager',
  AGENT: 'Agent',
  SPONSOR: 'Sponsor',
  UNIVERSITY_PARTNER: 'University',
  INSURANCE_PARTNER: 'Insurance',
  EMPLOYER: 'Employer',
  RECRUITER: 'Recruiter',
};

function roleLabel(role: string) {
  return ROLE_LABEL[role] || role;
}

export default function SwitchUserControl({ compact = false }: { compact?: boolean }) {
  const { linkedAccounts, switchAccount, user } = useAuthStore();
  const { showToast } = useUiStore();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (!linkedAccounts?.length) return null;

  const handleSwitch = async (userId: string) => {
    if (busy || userId === String(user?._id || user?.id)) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      await switchAccount(userId);
      const next = useAuthStore.getState().user;
      window.location.href = getDashboardPathForRole(next?.role || '');
    } catch (e: unknown) {
      showToast((e as Error)?.message || 'Could not switch account', 'error');
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={busy}
        className={`flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-slate-50/90 text-slate-700 hover:bg-slate-100 transition font-medium text-xs sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/45 ${
          compact ? 'px-2 py-1.5' : 'px-2.5 py-1.5'
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
        title="Switch to another account with the same email"
      >
        <Users className="w-4 h-4 shrink-0 text-slate-500" aria-hidden />
        <span className="hidden sm:inline">Switch user</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1.5 min-w-[14rem] max-w-[min(calc(100vw-2rem),18rem)] rounded-lg bg-white shadow-xl border border-slate-200 py-1 z-[60]"
          role="listbox"
        >
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            Same email — other accounts
          </p>
          {linkedAccounts.map((acc) => (
            <button
              key={String(acc._id)}
              type="button"
              role="option"
              disabled={busy}
              onClick={() => handleSwitch(String(acc._id))}
              className="w-full text-left px-3 py-2 text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              <span className="font-medium line-clamp-1">{acc.label}</span>
              <span className="block text-xs text-slate-500">{roleLabel(acc.role)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
