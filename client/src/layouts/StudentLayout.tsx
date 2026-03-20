import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, FileText, Calculator, Compass, Search as SearchIcon, LogOut, Map, Briefcase, Newspaper, MessageSquare, ChevronRight, Settings, PanelLeftClose, PanelLeft, Receipt, Menu } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { resolveFileUrl } from '../lib/imageUrl';
import AIChatWidget from '../components/AIChatWidget';
import Notifications from '../components/Notifications';

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
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#F0F4FF', fontFamily: 'Inter, sans-serif' }}>
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
          background: '#0F0E2E',
          boxShadow: mobileMenuOpen ? '4px 0 24px rgba(0,0,0,0.4)' : '4px 0 24px rgba(0,0,0,0.25)',
        }}
      >
        {/* Logo */}
        <div className={`border-b border-white/10 shrink-0 ${(sidebarCollapsed && !mobileMenuOpen) ? 'px-3 py-4' : 'px-6 py-5'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-md flex items-center justify-center font-black text-white text-lg shrink-0" style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)' }}>B</div>
            {(!sidebarCollapsed || mobileMenuOpen) && (
              <div className="min-w-0">
                <h1 className="text-white font-black text-lg tracking-tight leading-none">BIGFEW</h1>
                <p className="text-xs font-medium mt-0.5" style={{ color: '#6D7ECC' }}>Your Australian Journey</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden space-y-6 no-scrollbar">
          {navSections.map(section => (
            <div key={section.label}>
              {(!sidebarCollapsed || mobileMenuOpen) && (
                <p className="text-xs font-bold uppercase tracking-widest px-3 mb-2" style={{ color: '#3D4A7A' }}>{section.label}</p>
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
                          ? 'text-white bg-indigo-500 shadow-md ring-1 ring-black/10'
                          : 'text-[#6D7ECC] hover:text-white hover:bg-white/10'
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
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0 flex-1 basis-full sm:basis-auto order-2 sm:order-1">
            <button type="button" onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Open menu">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1 max-w-full sm:max-w-md flex items-center gap-2 min-w-0">
              <SearchIcon className="w-5 h-5 text-slate-400 shrink-0 hidden sm:block" />
              <input
                type="search"
                placeholder="Search…"
                className="w-full px-2 sm:px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
              />
            </div>

            {/* Right: notifications + user avatar */}
            <div className="flex items-center gap-2 sm:gap-4 justify-end shrink-0">
              <Notifications />
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition"
                >
                  {user?.profile?.avatar ? (
                    <img
                      src={resolveFileUrl(user.profile.avatar)}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover border-2 border-slate-200"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)' }}
                    >
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
          </div>
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            <Notifications />
            <div className="relative">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex-1 max-w-md flex items-center gap-2 min-w-0">
                <SearchIcon className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="search"
                  placeholder="Search…"
                  className="w-full px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 justify-end shrink-0">
              <Notifications />
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition"
                >
                  {user?.profile?.avatar ? (
                    <img
                      src={resolveFileUrl(user.profile.avatar)}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover border-2 border-slate-200"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)' }}
                    >
                      {initials}
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
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
          </div>
        </header>
        <main className="flex-1 min-w-0 px-3 sm:px-6 py-5 sm:py-8 overflow-auto">
          <Outlet />
        </main>
      </div>

      <AIChatWidget />
    </div>
  );
}
