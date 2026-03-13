import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, ArrowRight, UserCheck, UserPlus, Activity, ShieldCheck } from 'lucide-react';
import { authFetch } from '../../store/auth';

export default function SuperDashboard() {
  const [stats, setStats] = useState({ 
    consultancies: 0, 
    users: 0,
    students: 0,
    agents: 0,
    activeThisWeek: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([authFetch('/api/consultancies'), authFetch('/api/users')])
      .then(async ([cRes, uRes]) => {
        const c = await cRes.json();
        const u = await uRes.json();
        
        const students = u.filter((user: any) => user.role === 'STUDENT').length;
        const agents = u.filter((user: any) => ['AGENT', 'CONSULTANCY_ADMIN'].includes(user.role)).length;
        
        setStats({ 
          consultancies: c.length, 
          users: u.length,
          students,
          agents,
          activeThisWeek: Math.floor(u.length * 0.7) // Mocked active stat
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Super Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Platform overview and global metrics</p>
        </div>
        <div className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-sm border border-indigo-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Root Access
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-ori-500 border-t-transparent animate-spin" /></div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Consultancies</p>
                  <p className="text-2xl font-black text-slate-900 leading-none mt-1">{stats.consultancies}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Students</p>
                  <p className="text-2xl font-black text-slate-900 leading-none mt-1">{stats.students}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Agents</p>
                  <p className="text-2xl font-black text-slate-900 leading-none mt-1">{stats.agents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group hover:border-sky-300 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Users</p>
                  <p className="text-2xl font-black text-slate-900 leading-none mt-1">{stats.activeThisWeek}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 text-lg">Consultancy Management</h2>
                  <p className="text-sm text-slate-500">Add, edit, or remove CRM tenants</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><Building2 className="w-5 h-5" /></div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-end">
                <Link to="consultancies" className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20 active:scale-95">
                  Manage Consultancies <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 text-lg">Platform Users</h2>
                  <p className="text-sm text-slate-500">Manage all registered users and roles</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><Users className="w-5 h-5" /></div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-end">
                <Link to="users" className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20 active:scale-95">
                  Manage Users <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 text-lg">Verification Queue</h2>
                  <p className="text-sm text-slate-500">Approve new agents, employers, insurers</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600"><ShieldCheck className="w-5 h-5" /></div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-end">
                <Link to="verifications" className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-amber-600 transition shadow-md shadow-amber-500/20 active:scale-95">
                  Review Queue <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 text-lg">University & Courses DB</h2>
                  <p className="text-sm text-slate-500">Master DB of institutions</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-600"><Building2 className="w-5 h-5" /></div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-end">
                <Link to="universities" className="w-full py-3 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-sky-700 transition shadow-md shadow-sky-600/20 active:scale-95">
                  Manage Databases <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
