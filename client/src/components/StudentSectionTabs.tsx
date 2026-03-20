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
    <div className="mb-8 w-full min-w-0 max-w-[95vw] mx-auto">
      <div
        className="student-tabs-x-scroll w-full min-w-0 max-w-full overflow-x-auto overflow-y-hidden pb-4"
        role="tablist"
        aria-label="Section tabs"
      >
        <div className="inline-flex flex-nowrap items-stretch gap-1.5 sm:gap-2 w-max min-w-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeId === t.id}
              onClick={() => onChange(t.id)}
              className={`flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-6 py-2.5 sm:py-3.5 min-h-[40px] sm:min-h-[44px] rounded-lg font-black text-[11px] sm:text-xs tracking-wide transition-all shrink-0 whitespace-nowrap uppercase border
              ${
                activeId === t.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20 sm:scale-[1.02]'
                  : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-200 hover:text-indigo-400 active:bg-slate-50'
              }`}
            >
              {t.icon && <span className="shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5 sm:[&>svg]:w-4 sm:[&>svg]:h-4">{t.icon}</span>}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
