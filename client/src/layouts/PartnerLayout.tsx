import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { LogOut, FileText, Briefcase, ShieldPlus } from 'lucide-react';

export default function PartnerLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const getNavItems = () => {
    switch (user?.role) {
      case 'UNIVERSITY_PARTNER':
        return [{ path: '/partner/applications', label: 'Offer Letters', icon: FileText }];
      case 'INSURANCE_PARTNER':
        return [{ path: '/partner/insurance', label: 'Policies', icon: ShieldPlus }];
      case 'EMPLOYER':
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
      <div className="w-16 lg:w-64 bg-slate-900 text-white flex flex-col justify-between py-6 h-full flex-shrink-0 relative z-20">
        <div>
          <div className="px-5 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center font-black">P</div>
            <span className="hidden lg:inline font-display font-black text-xl tracking-tight">Orivisa Partner</span>
          </div>

          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const active = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition font-medium ${
                    active ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="px-3">
          <div className="hidden lg:block px-4 py-3 mb-4 rounded-xl bg-slate-800 border border-slate-700">
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
            <span className="hidden lg:inline">Sign Out</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto h-full scroll-smooth">
        <div className="min-h-full p-4 md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
