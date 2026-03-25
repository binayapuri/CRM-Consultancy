import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutDashboard, Kanban, Users, FileText, Target, Calendar, GraduationCap, Shield, Wallet, User, LogOut, UsersRound, History, Settings, PanelLeftClose, PanelLeft, Building2, Clock, ReceiptText, Search } from 'lucide-react';
import Notifications from '../components/Notifications';
import TeamMessages from '../components/TeamMessages';
import ConsultancyGlobalSearch from '../components/ConsultancyGlobalSearch';
import { useAuthStore } from '../store/auth';
import { resolveFileUrl } from '../lib/imageUrl';
import { authFetch, safeJson } from '../store/auth';
import { BRAND_NAME } from '../constants/brand';

const SIDEBAR_KEY = 'orivisa-sidebar-collapsed';

const nav = [
  { to: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', perm: null },
  { to: 'kanban', icon: Kanban, label: 'Kanban', perm: 'kanban' },
  { to: 'clients', icon: Users, label: 'Clients', perm: 'clients' },
  { to: 'employees', icon: UsersRound, label: 'Employees', perm: 'employees' },
  { to: 'trace-history', icon: History, label: 'Trace History', adminOnly: true, perm: 'traceHistory' },
  { to: 'documents', icon: FileText, label: 'Documents & Templates', perm: 'documents' },
  { to: 'leads', icon: Target, label: 'Leads', perm: 'leads' },
  { to: 'calendar', icon: Calendar, label: 'Calendar View', perm: 'tasks' },
  { to: 'daily-tasks', icon: Calendar, label: 'Daily Tasks', perm: 'tasks' },
  { to: 'attendance', icon: Clock, label: 'Attendance', perm: 'tasks' },
  { to: 'colleges', icon: GraduationCap, label: 'Colleges', perm: 'colleges' },
  { to: 'oshc', icon: Shield, label: 'OSHC', perm: 'oshc' },
  { to: 'trust', icon: Wallet, label: 'Trust Ledger', adminOnly: true, perm: 'trustLedger' },
  { to: 'billing', icon: ReceiptText, label: 'Billing & Quotes', perm: 'billing' },
  { to: 'sponsors', icon: Building2, label: 'Sponsors', perm: 'sponsors' },
  { to: 'profile', icon: User, label: 'Profile', perm: null },
  { to: 'branches', icon: Building2, label: 'Branches', adminOnly: true, perm: 'settings' },
  { to: 'settings', icon: Settings, label: 'Settings', adminOnly: true, perm: 'settings' },
];

export default function ConsultancyLayout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewConsultancyId = searchParams.get('consultancyId');
  const { user, logout } = useAuthStore();
  const [consultancy, setConsultancy] = useState<{ displayName?: string; name?: string } | null>(null);
  const [permissions, setPermissions] = useState<Record<string, any> | null>(null);
  const [viewConsultancyName, setViewConsultancyName] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === 'true'; } catch { return false; }
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed)); } catch {}
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (user?.profile?.consultancyId && user.role !== 'SUPER_ADMIN') {
      authFetch('/api/consultancies/me').then(r => safeJson(r)).then((d: any) => setConsultancy(d)).catch(() => setConsultancy(null));
    }
  }, [user?.profile?.consultancyId, user?.role]);

  useEffect(() => {
    if (user?.role && user.role !== 'SUPER_ADMIN' && user.role !== 'STUDENT') {
      authFetch('/api/auth/permissions').then(r => safeJson(r)).then((p: any) => setPermissions(p || {})).catch(() => setPermissions({}));
    } else {
      setPermissions(null);
    }
  }, [user?.role]);

  useEffect(() => {
    if (viewConsultancyId && user?.role === 'SUPER_ADMIN') {
      authFetch(`/api/consultancies/${viewConsultancyId}`).then(r => safeJson(r)).then((c: any) => setViewConsultancyName(c?.displayName || c?.name || null)).catch(() => setViewConsultancyName(null));
    } else {
      setViewConsultancyName(null);
    }
  }, [viewConsultancyId, user?.role]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const initials = user?.profile?.firstName?.[0] && user?.profile?.lastName?.[0]
    ? `${user.profile.firstName[0]}${user.profile.lastName[0]}`
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile backdrop */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarCollapsed(true)} aria-hidden />
      )}
      <aside className={`${sidebarCollapsed ? 'w-0 -translate-x-full overflow-hidden' : 'w-64 translate-x-0'} bg-slate-900 text-white flex flex-col fixed h-full z-50 lg:z-40 transition-all duration-300 ease-in-out min-w-0`}>
        <div className="p-5 border-b border-slate-700 min-w-[256px]">
          <h1 className="text-xl font-display font-bold text-ori-400 truncate">
            {consultancy?.displayName || consultancy?.name || BRAND_NAME}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">{BRAND_NAME} Consultancy CRM – Australian Education & Migration</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto min-w-[256px]">
          {nav.filter(n => {
            if (n.adminOnly && !['SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER'].includes(user?.role || '')) return false;
            if (user?.role === 'SUPER_ADMIN') return true;
            if (!n.perm) return true;
            const p = permissions?.[n.perm];
            if (typeof p === 'boolean') return p;
            if (p && typeof p === 'object' && 'view' in p) return !!p.view;
            return true;
          }).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={viewConsultancyId ? `${to}?consultancyId=${viewConsultancyId}` : to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${isActive ? 'bg-ori-600/20 text-ori-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700 min-w-[256px]">
          {user?.role === 'SUPER_ADMIN' && (
            <NavLink to="/admin/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-400 hover:bg-slate-800">
              <span>Super Admin</span>
            </NavLink>
          )}
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ml-0 ${!sidebarCollapsed ? 'lg:ml-64' : ''}`}>
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            aria-label={sidebarCollapsed ? 'Open menu' : 'Close menu'}
          >
            {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 transition min-w-[280px]"
            >
              <Search className="w-4 h-4" />
              <span className="truncate">Search clients, leads, billing...</span>
              <span className="ml-auto rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] text-slate-400">Cmd/Ctrl K</span>
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Open global search"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <Notifications />
            <TeamMessages />
            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition"
              >
                {user?.profile?.avatar ? (
                  <img src={resolveFileUrl(user.profile.avatar)} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-slate-200" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-ori-500 text-white flex items-center justify-center font-semibold text-sm">
                    {initials}
                  </div>
                )}
                <span className="hidden sm:inline text-sm font-medium text-slate-700 truncate max-w-[120px]">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </span>
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="font-medium text-slate-900">{user?.profile?.firstName} {user?.profile?.lastName}</p>
                      <p className="text-sm text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <NavLink to="profile" className="flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50" onClick={() => setProfileOpen(false)}>
                      <User className="w-4 h-4" /> Profile
                    </NavLink>
                    <NavLink to="settings" className="flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50" onClick={() => setProfileOpen(false)}>
                      <Settings className="w-4 h-4" /> Settings
                    </NavLink>
                    <button onClick={() => { setProfileOpen(false); handleLogout(); }} className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 w-full text-left">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {viewConsultancyName && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
              <span className="text-amber-800 font-medium">Viewing as Super Admin: {viewConsultancyName}</span>
              <NavLink to="/admin/consultancies" className="text-amber-800 hover:text-amber-900 text-sm font-medium">← Back to Consultancies</NavLink>
            </div>
          )}
          <Outlet />
        </main>
      </div>
      <ConsultancyGlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} consultancyId={viewConsultancyId} />
    </div>
  );
}
