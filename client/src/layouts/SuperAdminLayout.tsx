import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, History, LogOut, GraduationCap, BookOpen, CheckSquare, Settings, Newspaper, Menu, Briefcase, FileCheck, Calculator } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { AbroadUpLogo } from '../components/brand/AbroadUpLogo';
import { BRAND_NAME } from '../constants/brand';

const nav = [
  { to: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: 'consultancies', icon: Building2, label: 'Consultancies' },
  { to: 'students', icon: GraduationCap, label: 'Students' },
  { to: 'users', icon: Users, label: 'Users' },
  { to: 'verifications', icon: CheckSquare, label: 'Verifications' },
  { to: 'employers', icon: Briefcase, label: 'Employers' },
  { to: 'universities', icon: BookOpen, label: 'Universities' },
  { to: 'university-requests', icon: FileCheck, label: 'University Requests' },
  { to: 'trace-history', icon: History, label: 'Trace History' },
  { to: 'news', icon: Newspaper, label: 'News' },
  { to: 'pr-estimator', icon: Calculator, label: 'PR estimator' },
  { to: 'settings', icon: Settings, label: 'Settings' },
];

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setMobileMenuOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} aria-hidden />
      )}
      <aside className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 w-64 bg-brand-navy text-white flex flex-col fixed h-full z-50 lg:z-30 transition-transform duration-300 ease-in-out`}>
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <AbroadUpLogo variant="mark" scale="lg" />
            <span className="text-xl font-display font-bold text-brand-gold-light">{BRAND_NAME}</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Super Admin – Platform Owner</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${isActive ? 'bg-brand-gold/20 text-brand-gold-light' : 'text-slate-400 hover:bg-white/10'}`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <NavLink to="/consultancy/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-brand-gold hover:bg-white/10">
            ← Back to CRM
          </NavLink>
          <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-white/10 w-full mt-1">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen ml-0 lg:ml-64">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-2 lg:hidden">
          <button type="button" onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-slate-900">{BRAND_NAME} Admin</span>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
