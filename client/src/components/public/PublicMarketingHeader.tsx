import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react';
import { BrandNavLogo } from '../brand/BrandNavLogo';
import { useAuthStore } from '../../store/auth';
import { resolveFileUrl } from '../../lib/imageUrl';
import { getDashboardPathForRole } from '../../lib/authHelpers';
import {
  LANDING_MORE_ANCHORS,
  LANDING_PRIMARY_ANCHORS,
  MARKETING_ROUTE_LINKS,
  PR_TRACKER_REGISTER,
} from './marketingNavConfig';

type Variant = 'landing' | 'default';

export function PublicMarketingHeader({
  variant = 'default',
  className = '',
}: {
  variant?: Variant;
  className?: string;
}) {
  const { pathname } = useLocation();
  const { user, token } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const displayName =
    user?.profile?.firstName || user?.profile?.lastName
      ? [user?.profile?.firstName, user?.profile?.lastName].filter(Boolean).join(' ')
      : user?.email ?? '';
  const initials =
    `${user?.profile?.firstName?.[0] ?? ''}${user?.profile?.lastName?.[0] ?? ''}`.toUpperCase() ||
    (user?.email ?? '').slice(0, 2).toUpperCase() ||
    '?';

  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const close = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [moreOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const routeLinks = (
    <>
      {MARKETING_ROUTE_LINKS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="text-sm font-semibold text-brand-navy/80 hover:text-brand-navy transition-colors whitespace-nowrap"
        >
          {item.label}
        </Link>
      ))}
    </>
  );

  const authBlock = (
    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
      {token && user ? (
        <Link
          to={getDashboardPathForRole(user.role)}
          className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 rounded-full bg-white border border-slate-200/90 hover:border-brand-gold/50 shadow-sm transition-all max-w-[min(100%,14rem)]"
        >
          {user.profile?.avatar ? (
            <img
              src={resolveFileUrl(user.profile.avatar)}
              alt=""
              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 bg-gradient-to-br from-brand-navy to-brand-gold-dark">
              {initials}
            </div>
          )}
          <span className="text-sm font-semibold text-brand-navy truncate min-w-0">{displayName}</span>
        </Link>
      ) : (
        <>
          <Link
            to="/login"
            className="hidden sm:inline text-sm font-semibold text-brand-navy hover:text-brand-gold-dark transition-colors whitespace-nowrap"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="relative group px-3 sm:px-6 py-2.5 rounded-full bg-brand-navy text-white font-bold overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-navy/25 hover:bg-brand-navy-deep text-sm sm:text-base whitespace-nowrap"
          >
            <span className="relative z-10 flex items-center gap-2">
              Get started <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </span>
          </Link>
        </>
      )}
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px] md:hidden touch-manipulation"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <header
        className={`fixed top-0 left-0 right-0 z-50 overflow-visible bg-brand-cream/95 backdrop-blur-xl border-b border-slate-200/90 shadow-sm pt-[env(safe-area-inset-top,0px)] ${className}`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3 px-4 sm:px-6 lg:px-10 py-2 min-h-[3.25rem]">
          <Link
            to="/"
            className="group flex items-center min-w-0 shrink leading-none hover:opacity-95 transition-opacity rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream"
          >
            <BrandNavLogo logoClassName="group-hover:drop-shadow-[0_4px_14px_rgba(27,54,93,0.14)]" />
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-4 lg:gap-5 min-w-0 flex-1 justify-end">
            {variant === 'landing' ? (
              <>
                {LANDING_PRIMARY_ANCHORS.map(({ href, label }) => (
                  <a
                    key={href}
                    href={href}
                    className="text-sm font-semibold text-brand-navy/80 hover:text-brand-navy transition-colors whitespace-nowrap"
                  >
                    {label}
                  </a>
                ))}
                <div className="relative" ref={moreRef}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-brand-navy/80 hover:text-brand-navy transition-colors"
                    aria-expanded={moreOpen}
                    aria-haspopup="menu"
                    onClick={() => setMoreOpen((o) => !o)}
                  >
                    More
                    <ChevronDown className={`w-4 h-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {moreOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-2 min-w-[13rem] rounded-xl border border-slate-200/90 bg-white py-1.5 shadow-xl shadow-brand-navy/10 z-50"
                    >
                      {LANDING_MORE_ANCHORS.map(({ href, label }) => (
                        <a
                          key={href}
                          href={href}
                          role="menuitem"
                          className="block px-4 py-2.5 text-sm font-semibold text-brand-navy/90 hover:bg-brand-cream/80"
                          onClick={() => setMoreOpen(false)}
                        >
                          {label}
                        </a>
                      ))}
                      <Link
                        to={PR_TRACKER_REGISTER}
                        role="menuitem"
                        className="block px-4 py-2.5 text-sm font-bold text-brand-navy border-t border-slate-100 hover:bg-emerald-50/80"
                        onClick={() => setMoreOpen(false)}
                      >
                        AI PR tracker →
                      </Link>
                    </div>
                  )}
                </div>
                <span className="h-4 w-px bg-slate-200/90 shrink-0" aria-hidden />
                {routeLinks}
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className="text-sm font-semibold text-brand-navy/80 hover:text-brand-navy transition-colors whitespace-nowrap"
                >
                  Home
                </Link>
                {routeLinks}
              </>
            )}
            {authBlock}
          </div>

          {/* Mobile toolbar */}
          <div className="flex md:hidden items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-lg text-brand-navy border border-slate-200/90 bg-white/80 touch-manipulation active:bg-white"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            {!token && (
              <Link
                to="/register"
                className="px-3 py-2 rounded-full bg-brand-navy text-white text-xs font-bold shadow-md whitespace-nowrap"
              >
                Start
              </Link>
            )}
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200/90 bg-brand-cream px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] max-h-[min(72dvh,28rem)] overflow-y-auto overscroll-contain space-y-1 shadow-inner">
            {variant === 'landing' ? (
              <>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 pt-1">On this page</p>
                {LANDING_PRIMARY_ANCHORS.map(({ href, label }) => (
                  <a
                    key={href}
                    href={href}
                    className="block min-h-[48px] flex items-center px-3 rounded-xl text-sm font-bold text-brand-navy hover:bg-white/80 active:bg-white/90"
                    onClick={() => setMobileOpen(false)}
                  >
                    {label}
                  </a>
                ))}
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 pt-2">More</p>
                {LANDING_MORE_ANCHORS.map(({ href, label }) => (
                  <a
                    key={href}
                    href={href}
                    className="block min-h-[48px] flex items-center px-3 rounded-xl text-sm font-semibold text-brand-navy hover:bg-white/80"
                    onClick={() => setMobileOpen(false)}
                  >
                    {label}
                  </a>
                ))}
                <Link
                  to={PR_TRACKER_REGISTER}
                  className="block min-h-[48px] flex items-center px-3 rounded-xl text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80"
                  onClick={() => setMobileOpen(false)}
                >
                  AI-powered PR tracker
                </Link>
              </>
            ) : (
              <Link
                to="/"
                className="block min-h-[48px] flex items-center px-3 rounded-xl text-sm font-bold text-brand-navy hover:bg-white/80"
                onClick={() => setMobileOpen(false)}
              >
                Home
              </Link>
            )}
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 pt-2">Browse</p>
            {MARKETING_ROUTE_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="block min-h-[48px] flex items-center px-3 rounded-xl text-sm font-bold text-brand-navy hover:bg-white/80"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {token && user ? (
              <Link
                to={getDashboardPathForRole(user.role)}
                className="block min-h-[48px] flex items-center px-3 rounded-xl text-sm font-bold text-brand-navy hover:bg-white/80"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="block min-h-[48px] flex items-center px-3 rounded-xl text-sm font-bold text-brand-navy hover:bg-white/80"
                onClick={() => setMobileOpen(false)}
              >
                Sign in
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Spacer so fixed header does not overlap content — pages add their own pt if they already had it */}
      <div className="h-[calc(3.25rem+env(safe-area-inset-top,0px))] shrink-0" aria-hidden />
    </>
  );
}
