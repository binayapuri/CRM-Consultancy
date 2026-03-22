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
      className={`sticky top-0 z-50 border-b border-slate-200/90 bg-brand-cream/95 backdrop-blur-xl shadow-sm ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-10 py-2">
        <Link
          to="/"
          className="flex items-center min-w-0 shrink leading-none hover:opacity-95 transition-opacity rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 -my-0.5"
        >
          <AbroadUpLogo variant="wordmark" theme="light" scale="header" />
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-sm font-semibold">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-brand-navy/85 hover:text-brand-navy transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/login"
            className="rounded-full bg-brand-navy px-5 py-2.5 text-white font-semibold shadow-md shadow-brand-navy/15 ring-1 ring-brand-navy/10 hover:bg-brand-navy-deep transition-colors"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
