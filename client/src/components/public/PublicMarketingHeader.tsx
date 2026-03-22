import { Link } from 'react-router-dom';
import { AbroadUpLogo } from '../brand/AbroadUpLogo';

type NavItem = { to: string; label: string };

const DEFAULT_NAV: NavItem[] = [
  { to: '/', label: 'Home' },
  { to: '/news', label: 'News' },
  { to: '/visas', label: 'Australian visas' },
  { to: '/jobs', label: 'Jobs' },
];

export function PublicMarketingHeader({
  extraNav,
  className = '',
}: {
  extraNav?: NavItem[];
  className?: string;
}) {
  const nav = extraNav ?? DEFAULT_NAV;

  return (
    <header
      className={`sticky top-0 z-50 border-b border-white/10 bg-[#020617]/95 backdrop-blur-xl ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-10 py-4">
        <Link to="/" className="flex items-center gap-2 min-w-0 hover:opacity-95 transition-opacity">
          <AbroadUpLogo variant="wordmark" theme="dark" />
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-sm font-semibold">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-slate-300 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/login"
            className="rounded-full bg-emerald-500/15 px-4 py-2 text-emerald-300 ring-1 ring-emerald-500/40 hover:bg-emerald-500/25"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
