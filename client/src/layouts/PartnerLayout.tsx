import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { LogOut, FileText, Briefcase, ShieldPlus, Menu, Building2 } from 'lucide-react';
import { AbroadUpLogo } from '../components/brand/AbroadUpLogo';
import { BRAND_NAME } from '../constants/brand';

export default function PartnerLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setMobileMenuOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getNavItems = () => {
    switch (user?.role) {
      case 'UNIVERSITY_PARTNER':
        return [
          { path: '/partner/profile', label: 'University Profile', icon: Building2 },
          { path: '/partner/applications', label: 'Offer Letters', icon: FileText },
        ];
      case 'INSURANCE_PARTNER':
        return [{ path: '/partner/insurance', label: 'Policies', icon: ShieldPlus }];
      case 'EMPLOYER':
      case 'RECRUITER':
        return [{ path: '/partner/jobs', label: 'Job Postings', icon: Briefcase }];
      case 'SUPER_ADMIN':
        return [
          { path: '/partner/applications', label: 'Offer Letters', icon: FileText },
          { path: '/partner/insurance', label: 'Policies', icon: ShieldPlus },
          { path: '/partner/jobs', label: 'Job Postings', icon: Briefcase }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="flex h-screen bg-slate-50 relative overflow-hidden">
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} aria-hidden />
      )}
      <aside className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 w-64 bg-brand-navy text-white flex flex-col justify-between py-6 h-full fixed z-50 lg:z-20 transition-transform duration-300 ease-in-out`}>
        <div>
          <div className="px-5 mb-8 flex items-center gap-3 min-w-0">
            <AbroadUpLogo variant="mark" scale="lg" />
            <span className="font-display font-black text-xl tracking-tight truncate text-brand-gold-light">{BRAND_NAME} Partner</span>
          </div>

          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const active = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition font-medium ${
                    active ? 'bg-brand-gold text-brand-navy shadow-md shadow-black/20' : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="px-3">
          <div className="px-4 py-3 mb-4 rounded-xl bg-slate-800 border border-slate-700">
            <p className="text-sm font-bold truncate">{user?.profile?.firstName} {user?.profile?.lastName}</p>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">{user?.role.replace('_', ' ')}</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500 transition font-medium"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen ml-0 lg:ml-64 overflow-auto scroll-smooth">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-2 lg:hidden">
          <button type="button" onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-slate-900">{BRAND_NAME} Partner</span>
        </header>
        <div className="min-h-full p-4 md:p-8 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
