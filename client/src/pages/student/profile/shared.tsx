import React from 'react';
import { AlertTriangle } from 'lucide-react';

/** Matches `englishTest.testType` enum on Client model */
export const ENGLISH_TEST_TYPE_OPTIONS = [
  'IELTS_AC',
  'IELTS_GT',
  'PTE',
  'TOEFL',
  'OET',
  'CAE',
  'PEARSON',
  'NAATI',
  'NONE',
] as const;

export function formatEnglishTestTypeLabel(code: string | undefined) {
  return code ? code.replace(/_/g, ' ') : '';
}

/** Urgency for any ISO date (visa expiry, English result expiry, etc.) */
export function dateExpiryUrgency(iso?: string | null): 'none' | 'expired' | 'critical' | 'soon' | 'ok' {
  if (!iso) return 'none';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'none';
  const now = new Date();
  const ms = d.getTime() - now.getTime();
  const days = ms / (24 * 60 * 60 * 1000);
  if (days < 0) return 'expired';
  if (days <= 30) return 'critical';
  if (days <= 90) return 'soon';
  return 'ok';
}

const IMMIGRATION_PATCH_KEYS = [
  'onshore',
  'currentVisa',
  'visaExpiry',
  'targetVisa',
  'anzscoCode',
  'visaRefusalHistory',
] as const;

/** Body for PATCH `/api/student/immigration` and consultancy `PATCH .../immigration` (profile fields only). */
export function buildImmigrationPatchBody(p: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of IMMIGRATION_PATCH_KEYS) {
    if (p[k] !== undefined) out[k] = p[k];
  }
  return out;
}

const ENGLISH_TEST_PATCH_KEYS = [
  'testType',
  'score',
  'listening',
  'reading',
  'writing',
  'speaking',
  'trf',
  'testDate',
  'expiryDate',
] as const;

/** Body for PATCH `/api/student/english-test` and consultancy `PATCH .../english-test`. */
export function buildEnglishTestPatchBody(e: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of ENGLISH_TEST_PATCH_KEYS) {
    if (e[k] !== undefined) out[k] = e[k];
  }
  return out;
}

const expiryBannerClass: Record<'expired' | 'critical' | 'soon', string> = {
  expired: 'bg-red-50 border-red-200 text-red-900',
  critical: 'bg-amber-50 border-amber-200 text-amber-950',
  soon: 'bg-sky-50 border-sky-200 text-sky-950',
};

export function DateExpiryAlertBanner({
  iso,
  urgency,
  kind,
}: {
  iso?: string | null;
  urgency: ReturnType<typeof dateExpiryUrgency>;
  kind: 'visa' | 'english';
}) {
  if (!iso || urgency === 'none' || urgency === 'ok') return null;
  const copy =
    kind === 'visa'
      ? {
          expired:
            'Your recorded visa expiry date is in the past. Update the date or speak to your migration agent urgently.',
          critical: 'Visa expires within 30 days — confirm your status and plan the next step with your agent.',
          soon: 'Visa expires within 90 days — worth planning extensions or the next visa pathway now.',
        }
      : {
          expired:
            'Your recorded English test validity date is in the past. Update the expiry or add a new test result if you need a current score.',
          critical:
            'English test validity expires within 30 days — plan a retest if you need valid scores for a visa application.',
          soon: 'English test validity expires within 90 days — check if you need a fresh test for your timeline.',
        };
  const msg = copy[urgency as keyof typeof copy];
  if (!msg) return null;
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${expiryBannerClass[urgency]}`}>
      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
      <p>{msg}</p>
    </div>
  );
}

// Uniform form and button tokens for all profile tabs
export const formCardClass =
  'bg-slate-50 p-6 rounded-xl border-2 border-indigo-100 space-y-4';
export const formGridClass = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
export const formGridClassWide = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';

export const btnCancel =
  'flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors';
export const btnPrimary =
  'flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-600/20 transition-all active:scale-95';
export const btnAddDashed =
  'w-full py-4 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 font-black text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2';

export const inp = "w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-400";

export const SI = (p: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} className={`${inp} ${p.className || ''}`} />
);

export const SS = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={`${inp} ${p.className || ''}`} />
);

export const TA = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className={`${inp} ${p.className || ''}`} />
);

export const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
      {label}
    </label>
    {children}
  </div>
);

export const DataRow = ({ label, value, icon }: { label: string; value: string | React.ReactNode; icon?: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-slate-50 last:border-0 group">
    <div className="w-full sm:w-1/3 flex items-center gap-2 mb-1 sm:mb-0">
      {icon && <span className="text-slate-400 group-hover:text-indigo-500 transition-colors">{icon}</span>}
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
    </div>
    <div className="w-full sm:w-2/3">
      <span className="text-sm font-black text-slate-700">{value || <span className="text-slate-300 font-normal italic">Not specified</span>}</span>
    </div>
  </div>
);
