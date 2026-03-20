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
}

/**
 * Uniform tab bar used across student Profile, Visa Guide, Document Vault, and Settings.
 * Matches the Profile page style: bordered pills, indigo active state, optional icons.
 */
export function StudentSectionTabs({ tabs, activeId, onChange }: StudentSectionTabsProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 scrollbar-hide no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`flex items-center gap-2.5 px-4 sm:px-6 py-3.5 min-h-[44px] rounded-lg font-black text-xs tracking-wide transition-all shrink-0 uppercase border
              ${activeId === t.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-600/20 scale-[1.02]'
                : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-200 hover:text-indigo-400'}`}
          >
            {t.icon && <>{t.icon} </>}
            {t.label}
          </button>
        ))}
      </div>
      <p className="px-4 md:px-0 text-[11px] font-semibold text-slate-400 sm:hidden">Swipe to view more sections.</p>
    </div>
  );
}
