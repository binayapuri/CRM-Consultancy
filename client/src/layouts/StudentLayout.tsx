import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, FileText, Calculator, Compass, Search as SearchIcon, LogOut, Map, Briefcase, Newspaper, MessageSquare, ChevronRight, Settings, PanelLeftClose, PanelLeft, Receipt, Menu, Footprints, Mail } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { resolveFileUrl } from '../lib/imageUrl';
import AIChatWidget from '../components/AIChatWidget';
import Notifications from '../components/Notifications';
import { AbroadUpLogo } from '../components/brand/AbroadUpLogo';
import { BrandMark } from '../components/brand/BrandMark';
import { StudentJumpIn } from '../components/student/StudentJumpIn';
import SwitchUserControl from '../components/SwitchUserControl';

const SIDEBAR_EXPANDED = 256; // w-64
const SIDEBAR_COLLAPSED = 80;  // icon-only

const navSections = [
  {
    label: 'Home',
    items: [
      { to: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: 'profile', icon: User, label: 'My Profile' },
      { to: 'cv', icon: FileText, label: 'CV Generator' },
      { to: 'journey', icon: Map, label: 'My Journey' },
      { to: 'pr-map', icon: Footprints, label: 'My PR Map' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: 'visa-guide', icon: FileText, label: 'Visa Guide' },
      { to: 'calculator', icon: Calculator, label: 'PR Points' },
      { to: 'documents', icon: FileText, label: 'Document Vault' },
      { to: 'compass', icon: Compass, label: 'AI Compass' },
      { to: 'invoices', icon: Receipt, label: 'Invoices' },
    ],
  },
  {
    label: 'Explore',
    items: [
      { to: 'jobs', icon: Briefcase, label: 'Job Board' },
      { to: 'community', icon: MessageSquare, label: 'Community' },
      { to: 'news', icon: Newspaper, label: 'News & Rules' },
      { to: 'consultancies', icon: SearchIcon, label: 'Find Consultancy' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: 'messages', icon: MessageSquare, label: 'Messages' },
      { to: 'settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export default function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
  const initials = `${user?.profile?.firstName?.[0] ?? ''}${user?.profile?.lastName?.[0] ?? ''}`.toUpperCase() || 'S';

  const mainScrollRef = useRef<HTMLDivElement>(null);
  const prevPathnameRef = useRef(location.pathname);
  const isFirstRenderRef = useRef(true);
  const scrollStorageKey = 'student_main_scroll_positions_v1';

  const getStoredScrollPositions = () => {
    try {
      const raw = sessionStorage.getItem(scrollStorageKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed as Record<string, number>;
    } catch {}
    return {} as Record<string, number>;
  };

  const setStoredScrollPositions = (positions: Record<string, number>) => {
    try {
      sessionStorage.setItem(scrollStorageKey, JSON.stringify(positions));
    } catch {}
  };

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setMobileMenuOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  // Preserve scroll per route for "SPA-like" mobile navigation.
  useLayoutEffect(() => {
    const el = mainScrollRef.current;
    if (!el) return;

    if (!isFirstRenderRef.current) {
      const positions = getStoredScrollPositions();
      positions[prevPathnameRef.current] = el.scrollTop;
      setStoredScrollPositions(positions);
    } else {
      isFirstRenderRef.current = false;
    }

    prevPathnameRef.current = location.pathname;

    const positions = getStoredScrollPositions();
    const nextTop = positions[location.pathname];
    el.scrollTop = typeof nextTop === 'number' ? nextTop : 0;
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex overflow-hidden bg-brand-cream" style={{ fontFamily: 'DM Sans, system-ui, sans-serif' }}>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} aria-hidden />
      )}
      {/* Sidebar */}
      <aside
        className={`flex flex-col fixed h-full z-50 transition-all duration-200 ease-in-out overflow-hidden
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:z-30
        `}
        style={{
          width: mobileMenuOpen ? 256 : sidebarWidth,
          background: '#1B365D',
          boxShadow: mobileMenuOpen ? '4px 0 24px rgba(0,0,0,0.35)' : '4px 0 24px rgba(27,54,93,0.4)',
        }}
      >
        {/* Logo — same treatment as landing footer (light tile + wordmark) so it stays readable on navy */}
        <div className={`border-b border-white/10 shrink-0 ${(sidebarCollapsed && !mobileMenuOpen) ? 'px-2 py-3' : 'px-3 py-3'}`}>
          <Link to="/student/dashboard" className="block min-w-0" title="Dashboard">
            {(sidebarCollapsed && !mobileMenuOpen) ? (
              <div className="flex justify-center w-full">
                <div className="rounded-xl bg-white/95 p-2 shadow-md shadow-black/25 ring-1 ring-white/20">
                  <div className="rounded-lg bg-brand-gold/10 p-1.5 ring-1 ring-brand-gold/30">
                    <BrandMark size="md" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-white/95 px-2.5 py-2 sm:px-3 flex items-center gap-2.5 min-w-0 shadow-md shadow-black/20 ring-1 ring-white/15">
                <div className="rounded-lg bg-brand-gold/10 p-1.5 ring-1 ring-brand-gold/25 shrink-0">
                  <BrandMark size="md" />
                </div>
                <AbroadUpLogo variant="wordmark" theme="light" scale="md" className="min-w-0 flex-1" />
              </div>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden space-y-6 no-scrollbar">
          {navSections.map(section => (
            <div key={section.label}>
              {(!sidebarCollapsed || mobileMenuOpen) && (
                <p className="text-xs font-bold uppercase tracking-widest px-3 mb-2 text-brand-gold/60">{section.label}</p>
              )}
              <div className="space-y-0.5">
                {section.items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    title={(sidebarCollapsed && !mobileMenuOpen) ? label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 group min-h-[44px] ${
                        (sidebarCollapsed && !mobileMenuOpen) ? 'justify-center px-0' : 'justify-between px-3'
                      } ${
                        isActive
                          ? 'text-white bg-brand-gold/25 shadow-md ring-1 ring-brand-gold/40'
                          : 'text-slate-300 hover:text-white hover:bg-white/10'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="w-5 h-5 shrink-0" style={{ width: 20, height: 20 }} />
                      {(!sidebarCollapsed || mobileMenuOpen) && <span className="truncate">{label}</span>}
                    </div>
                    {(!sidebarCollapsed || mobileMenuOpen) && <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse toggle - desktop only */}
        <div className="p-3 border-t border-white/10 hidden lg:block">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#6D7ECC] hover:text-white hover:bg-white/10 transition-all duration-200"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <PanelLeft className="w-5 h-5 shrink-0" /> : <PanelLeftClose className="w-5 h-5 shrink-0" />}
            {!sidebarCollapsed && <span className="text-sm font-medium">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main: topbar + full-width content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-[margin-left] duration-200 ease-in-out ml-0 min-w-0 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-sm shadow-slate-200/40 px-2 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 flex-nowrap min-h-[3.5rem]">
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden shrink-0 p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/45"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link
              to="/student/dashboard"
              className="hidden sm:flex 2xl:hidden items-center min-w-0 max-w-[140px] shrink-0 rounded-lg hover:bg-slate-50/80 transition p-1 -m-1"
              title="Dashboard — Abroad Up"
            >
              <BrandMark size="sm" className="opacity-95" />
            </Link>
          </div>
          <StudentJumpIn />
          <div
            className="flex shrink-0 items-center gap-1 sm:gap-2 flex-nowrap pl-2 ml-1 border-l border-slate-200/90"
            role="toolbar"
            aria-label="Account and notifications"
          >
            <div className="hidden md:flex items-center gap-2 min-w-0 max-w-[min(100%,12rem)] lg:max-w-[14rem]">
              <SearchIcon className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />
              <input
                type="search"
                placeholder="Search…"
                aria-label="Search in app"
                className="w-full min-w-0 px-2.5 py-1.5 rounded-lg border border-slate-200/90 bg-white text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:ring-2 focus:ring-brand-gold/35 focus:border-brand-navy"
              />
            </div>
            <NavLink
              to="/student/messages"
              className={({ isActive }) =>
                `p-2 rounded-xl shrink-0 transition outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/45 ${
                  isActive ? 'bg-brand-gold/15 text-brand-navy shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`
              }
              title="Messages"
              aria-label="Messages"
            >
              <Mail className="w-5 h-5" />
            </NavLink>
            <Notifications />
            <SwitchUserControl />
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/45"
              >
                {user?.profile?.avatar ? (
                  <img src={resolveFileUrl(user.profile.avatar)} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-slate-200" />
                ) : (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm text-white shrink-0 bg-gradient-to-br from-brand-navy to-brand-gold-dark">
                    {initials}
                  </div>
                )}
                <span className="hidden sm:inline text-sm font-medium text-slate-700 truncate max-w-[120px]">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </span>
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} aria-hidden />
                  <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-lg bg-white shadow-xl border border-slate-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="font-medium text-slate-900">
                        {user?.profile?.firstName} {user?.profile?.lastName}
                      </p>
                      <p className="text-sm text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <NavLink
                      to="profile"
                      className="flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User className="w-4 h-4" /> Profile
                    </NavLink>
                    <NavLink
                      to="settings"
                      className="flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </NavLink>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main
          ref={mainScrollRef}
          className="flex-1 min-w-0 px-3 sm:px-6 py-5 sm:py-8 overflow-auto"
          id="student-main"
        >
          <Outlet />
        </main>
      </div>

      <AIChatWidget />
    </div>
  );
}
