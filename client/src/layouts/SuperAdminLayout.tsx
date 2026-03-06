import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/auth';

const nav = [
  { to: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: 'consultancies', icon: Building2, label: 'Consultancies' },
  { to: 'users', icon: Users, label: 'Users' },
];

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full">
        <div className="p-5 border-b border-slate-700">
          <h1 className="text-xl font-display font-bold text-amber-400">ORIVISA</h1>
          <p className="text-xs text-slate-400 mt-0.5">Super Admin</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${isActive ? 'bg-amber-600/20 text-amber-400' : 'text-slate-400 hover:bg-slate-800'}`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <NavLink to="/consultancy/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-ori-400 hover:bg-slate-800">
            ← Back to CRM
          </NavLink>
          <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 w-full mt-1">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-64 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
