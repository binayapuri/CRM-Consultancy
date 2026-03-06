import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, ArrowRight } from 'lucide-react';
import { authFetch } from '../../store/auth';

export default function SuperDashboard() {
  const [stats, setStats] = useState({ consultancies: 0, users: 0 });

  useEffect(() => {
    Promise.all([authFetch('/api/consultancies'), authFetch('/api/users')])
      .then(async ([cRes, uRes]) => {
        const c = await cRes.json();
        const u = await uRes.json();
        setStats({ consultancies: c.length, users: u.length });
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900">Super Admin Dashboard</h1>
      <p className="text-slate-500 mt-1">Manage the ORIVISA platform</p>
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Link to="consultancies" className="card flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.consultancies}</p>
            <p className="text-slate-500 text-sm">Consultancies</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 ml-auto" />
        </Link>
        <Link to="users" className="card flex items-center gap-4 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-ori-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-ori-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.users}</p>
            <p className="text-slate-500 text-sm">Users</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 ml-auto" />
        </Link>
      </div>
    </div>
  );
}
