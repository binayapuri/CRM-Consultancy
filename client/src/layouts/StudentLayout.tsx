import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, FileText, Calculator, Compass, Search, Map, LogOut, ClipboardList, FileCheck } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import Notifications from '../components/Notifications';

const nav = [
  { to: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: 'profile', icon: User, label: 'My Profile' },
  { to: 'applications', icon: FileCheck, label: 'Applications' },
  { to: 'tasks', icon: ClipboardList, label: 'Tasks' },
  { to: 'documents', icon: FileText, label: 'Documents' },
  { to: 'calculator', icon: Calculator, label: 'PR Calculator' },
  { to: 'compass', icon: Compass, label: 'AI Compass' },
  { to: 'consultancies', icon: Search, label: 'Find Consultancy' },
  { to: 'roadmap', icon: Map, label: 'Visa Roadmap' },
];

export default function StudentLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full shadow-sm">
        <div className="p-5 border-b border-slate-200">
          <h1 className="text-xl font-display font-bold text-ori-600">BIGFEW</h1>
          <p className="text-xs text-slate-500 mt-0.5">Student Portal – Australian Education & Migration</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${isActive ? 'bg-ori-50 text-ori-600' : 'text-slate-600 hover:bg-slate-50'}`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-200 flex items-center gap-2">
          <Notifications />
          <div className="px-3 py-2 text-sm text-slate-500 truncate flex-1">
            {user?.profile?.firstName} {user?.profile?.lastName}
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-slate-50 w-full">
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
