import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, FileText, Calculator, Compass, Search, LogOut, Map, Briefcase, Newspaper, ChevronRight, Settings } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import AIChatWidget from '../components/AIChatWidget';
import Notifications from '../components/Notifications';

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
    ],
  },
  {
    label: 'Explore',
    items: [
      { to: 'jobs', icon: Briefcase, label: 'Job Board' },
      { to: 'news', icon: Newspaper, label: 'News & Rules' },
      { to: 'consultancies', icon: Search, label: 'Find Consultancy' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: 'settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export default function StudentLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const initials = `${user?.profile?.firstName?.[0] ?? ''}${user?.profile?.lastName?.[0] ?? ''}`.toUpperCase() || 'S';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen flex" style={{ background: '#F0F4FF', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <aside
        className="w-64 flex flex-col fixed h-full z-30"
        style={{ background: '#0F0E2E', boxShadow: '4px 0 24px rgba(0,0,0,0.25)' }}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-lg" style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)' }}>O</div>
            <div>
              <h1 className="text-white font-black text-lg tracking-tight leading-none">ORIVISA</h1>
              <p className="text-xs font-medium mt-0.5" style={{ color: '#6D7ECC' }}>Your Australian Journey</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
          {navSections.map(section => (
            <div key={section.label}>
              <p className="text-xs font-bold uppercase tracking-widest px-3 mb-2" style={{ color: '#3D4A7A' }}>{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                        isActive
                          ? 'text-white'
                          : 'text-[#6D7ECC] hover:text-white hover:bg-white/5'
                      }`
                    }
                    style={({ isActive }) => isActive ? { background: 'linear-gradient(90deg, rgba(99,102,241,0.3), rgba(16,185,129,0.15))', borderLeft: '3px solid #6366F1' } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4.5 h-4.5 shrink-0" style={{ width: 18, height: 18 }} />
                      <span>{label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0" style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {user?.profile?.firstName || 'Student'} {user?.profile?.lastName || ''}
              </p>
              <p className="text-xs truncate" style={{ color: '#6D7ECC' }}>{user?.email}</p>
            </div>
            <div className="flex items-center gap-1">
              <Notifications />
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-white/10 transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" style={{ color: '#6D7ECC' }} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>

      <AIChatWidget />
    </div>
  );
}
