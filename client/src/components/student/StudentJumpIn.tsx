import { NavLink } from 'react-router-dom';
import {
  MessageCircle,
  Newspaper,
  Footprints,
  Sparkles,
  Calculator,
  Briefcase,
} from 'lucide-react';

const ITEMS: { to: string; label: string; gradient: string; Icon: typeof MessageCircle }[] = [
  { to: '/student/community', label: 'Community', gradient: 'from-fuchsia-500 to-pink-600', Icon: MessageCircle },
  { to: '/student/news', label: 'News', gradient: 'from-sky-500 to-blue-600', Icon: Newspaper },
  { to: '/student/jobs', label: 'Jobs', gradient: 'from-amber-500 to-orange-600', Icon: Briefcase },
  { to: '/student/pr-map', label: 'PR Map', gradient: 'from-emerald-600 to-teal-700', Icon: Footprints },
  { to: '/student/journey', label: 'Journey', gradient: 'from-violet-500 to-indigo-600', Icon: Sparkles },
  { to: '/student/calculator', label: 'Points', gradient: 'from-rose-500 to-red-600', Icon: Calculator },
];

/**
 * Primary shortcuts strip — lives in the student top bar.
 * Visually grouped as one “module” so it reads as the product’s quick-launch rail (marketing + wayfinding).
 */
export function StudentJumpIn() {
  return (
    <div className="flex flex-1 min-w-0 items-stretch gap-2 sm:gap-3" role="navigation" aria-label="Quick navigation">
      <div className="hidden 2xl:flex flex-col justify-center shrink-0 pr-1 border-r border-slate-200/90 mr-0.5">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-navy/80 leading-none">Abroad Up</span>
        <span className="text-[9px] font-semibold text-slate-400 mt-0.5 tracking-wide">Student hub</span>
      </div>
      <div className="flex flex-1 min-w-0 items-center gap-1.5 sm:gap-2 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/95 to-white pl-2 pr-1.5 py-1 shadow-inner shadow-slate-200/40">
        <p className="hidden lg:block text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 shrink-0 w-[3.25rem] leading-tight pl-0.5">
          Jump in
        </p>
        <div className="flex flex-1 min-w-0 gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5 items-center justify-start xl:justify-center">
          {ITEMS.map(({ to, label, gradient, Icon }) => (
            <NavLink
              key={to}
              to={to}
              aria-label={`Jump in: ${label}`}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 shrink-0 w-11 sm:w-[3.35rem] rounded-xl py-0.5 transition outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 focus-visible:ring-offset-1 ${
                  isActive
                    ? 'bg-white shadow-sm ring-1 ring-brand-gold/35'
                    : 'hover:bg-white/80'
                }`
              }
              title={label}
            >
              <span
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-sm ring-1 ring-white/90`}
              >
                <Icon className="w-[1.1rem] h-[1.1rem] sm:w-5 sm:h-5 opacity-[0.98]" aria-hidden />
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-600 text-center leading-none max-w-[2.85rem] truncate">
                {label}
              </span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}
