import React from 'react';

export interface StudentSectionTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface StudentSectionTabsProps {
  tabs: StudentSectionTab[];
  activeId: string;
  onChange: (id: string) => void;
  /** Horizontal strip (default) or vertical rail for desktop sidebars */
  variant?: 'horizontal' | 'vertical';
  /** On small screens, show a native select instead of a horizontal scroll row (e.g. many profile tabs). */
  mobilePicker?: boolean;
}

const tabButtonBase =
  'flex items-center gap-2.5 rounded-lg font-black text-xs tracking-wide transition-all uppercase border text-left w-full';

/**
 * Uniform tab bar used across student Profile, Visa Guide, Document Vault, and Settings.
 * Matches the Profile page style: bordered pills, indigo active state, optional icons.
 */
export function StudentSectionTabs({ tabs, activeId, onChange, variant = 'horizontal', mobilePicker = false }: StudentSectionTabsProps) {
  if (variant === 'vertical') {
    return (
      <nav className="space-y-1.5" aria-label="Profile sections">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">Sections</p>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`${tabButtonBase} px-3 py-3 min-h-[44px] justify-start
              ${activeId === t.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/15'
                : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600'}`}
          >
            {t.icon && <span className="shrink-0 opacity-90">{t.icon}</span>}
            <span className="truncate">{t.label}</span>
          </button>
        ))}
      </nav>
    );
  }

  const rowClass =
    'flex items-center gap-1.5 overflow-x-auto pb-3 scrollbar-hide no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory';

  return (
    <div className="mb-6 sm:mb-8">
      {mobilePicker && (
        <label className="sm:hidden mb-3 block px-4 md:px-0">
          <span className="sr-only">Section</span>
          <select
            value={activeId}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            {tabs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <div
        className={`${rowClass} ${mobilePicker ? 'hidden sm:flex' : 'flex'}`}
        role="tablist"
        aria-label="Profile sections"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeId === t.id}
            onClick={() => onChange(t.id)}
            className={`${tabButtonBase} px-4 sm:px-6 py-3.5 min-h-[44px] shrink-0 snap-start justify-center
              ${activeId === t.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-600/20 scale-[1.02]'
                : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-200 hover:text-indigo-400'}`}
          >
            {t.icon && <span className="shrink-0">{t.icon}</span>}
            {t.label}
          </button>
        ))}
      </div>
      {!mobilePicker && <p className="px-4 md:px-0 text-[11px] font-semibold text-slate-400 sm:hidden">Swipe to view more sections.</p>}
    </div>
  );
}
