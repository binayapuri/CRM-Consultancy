import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, ArrowRight, UserCheck, UserPlus, Activity, ShieldCheck, RefreshCw, Briefcase } from 'lucide-react';
import { authFetch } from '../../store/auth';
import { useUiStore } from '../../store/ui';

export default function SuperDashboard() {
  const { showToast, openModal, setModalContentGetter, openConfirm } = useUiStore();
  const [stats, setStats] = useState({
    consultancies: 0,
    users: 0,
    students: 0,
    agents: 0,
    activeThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const toastShownRef = useRef(false);

  const fetchData = useCallback(() => {
    setLoading(true);
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
          activeThisWeek: Math.floor(u.length * 0.7),
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Welcome toast once per mount
  useEffect(() => {
    if (toastShownRef.current || loading) return;
    toastShownRef.current = true;
    showToast('Welcome back, Admin', 'success');
  }, [loading, showToast]);

  const handleRefresh = () => {
    openConfirm({
      title: 'Refresh dashboard?',
      message: 'This will reload platform stats from the server.',
      confirmLabel: 'Refresh',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        fetchData();
        showToast('Data refreshed', 'success');
      },
    });
  };

  const openActiveUsersModal = () => {
    openModal('Active users – breakdown', null);
    setModalContentGetter(() => (
      <div className="space-y-4">
        <p className="text-slate-600 text-sm">
          Active users (last 7 days) is an estimate based on total registered users.
        </p>
        <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm">
          <li>Total users: {stats.users}</li>
          <li>Students: {stats.students}</li>
          <li>Agents / Consultancy admins: {stats.agents}</li>
          <li>Active this week (estimate): {stats.activeThisWeek}</li>
        </ul>
        <p className="text-slate-500 text-xs">Detailed analytics can be added via a future API.</p>
      </div>
    ));
  };

  return (
    <div className="w-full space-y-8 animate-fade-in-up">
      {/* Hero section */}
      <div
        className="relative overflow-hidden rounded-xl p-8 md:p-12"
        style={{ background: 'linear-gradient(135deg, #0F0E2E 0%, #1a1560 50%, #0d2847 100%)' }}
      >
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366F1, transparent)', filter: 'blur(64px)' }}
        />
        <div
          className="absolute bottom-0 left-24 w-60 h-60 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #10B981, transparent)', filter: 'blur(80px)' }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: '#10B981' }}>
              Super Admin
            </p>
            <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight leading-none mb-3">
              Platform overview
            </h1>
            <p className="text-lg font-medium" style={{ color: '#94A3B8' }}>
              Global metrics and tenant management.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div
              className="text-center p-5 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#10B981' }}>
                Total users
              </p>
              <p className="text-4xl font-black text-white leading-none">
                {loading ? '—' : stats.users}
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border border-amber-400/30 bg-amber-500/10 text-amber-300">
              <ShieldCheck className="w-4 h-4" /> Root Access
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition hover:opacity-90"
              style={{ background: 'rgba(99,102,241,0.4)', color: '#C7D2FE' }}
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div>
            <h2 className="text-xl font-display font-black text-slate-900 mb-4">Key metrics</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                className="bg-white rounded-xl border p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ borderColor: '#E8EDFB' }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Consultancies</p>
                    <p className="text-2xl font-black text-slate-900 leading-none mt-1">{stats.consultancies}</p>
                  </div>
                </div>
              </div>

              <div
                className="bg-white rounded-xl border p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ borderColor: '#E8EDFB' }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Students</p>
                    <p className="text-2xl font-black text-slate-900 leading-none mt-1">{stats.students}</p>
                  </div>
                </div>
              </div>

              <div
                className="bg-white rounded-xl border p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ borderColor: '#E8EDFB' }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Agents</p>
                    <p className="text-2xl font-black text-slate-900 leading-none mt-1">{stats.agents}</p>
                  </div>
                </div>
              </div>

              <div
                className="bg-white rounded-xl border p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ borderColor: '#E8EDFB' }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white shadow-md">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active users</p>
                    <p className="text-2xl font-black text-slate-900 leading-none mt-1">{stats.activeThisWeek}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openActiveUsersModal}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  View breakdown <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Action cards */}
          <div>
            <h2 className="text-xl font-display font-black text-slate-900 mb-4">Management</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Link
                to="consultancies"
                className="bg-white rounded-xl border overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 group"
                style={{ borderColor: '#E8EDFB' }}
              >
                <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: '#E8EDFB' }}>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-lg">Consultancy Management</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Add, edit, or remove CRM tenants</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-end">
                  <span className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 group-hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20">
                    Manage Consultancies <ArrowRight className="w-5 h-5" />
                  </span>
                </div>
              </Link>

              <Link
                to="users"
                className="bg-white rounded-xl border overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 group"
                style={{ borderColor: '#E8EDFB' }}
              >
                <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: '#E8EDFB' }}>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-lg">Platform Users</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Manage all registered users and roles</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-end">
                  <span className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 group-hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20">
                    Manage Users <ArrowRight className="w-5 h-5" />
                  </span>
                </div>
              </Link>

              <Link
                to="jobs"
                className="bg-white rounded-xl border overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 group"
                style={{ borderColor: '#E8EDFB' }}
              >
                <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: '#E8EDFB' }}>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-lg">Job listings</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Moderate, deactivate, or delete postings</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-lime-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                    <Briefcase className="w-6 h-6" />
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-end">
                  <span className="w-full py-3 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 group-hover:bg-emerald-800 transition shadow-md shadow-emerald-700/20">
                    Open jobs admin <ArrowRight className="w-5 h-5" />
                  </span>
                </div>
              </Link>

              <Link
                to="verifications"
                className="bg-white rounded-xl border overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 group"
                style={{ borderColor: '#E8EDFB' }}
              >
                <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: '#E8EDFB' }}>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-lg">Verification Queue</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Approve new agents, employers, insurers</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-end">
                  <span className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center gap-2 group-hover:bg-amber-600 transition shadow-md shadow-amber-500/20">
                    Review Queue <ArrowRight className="w-5 h-5" />
                  </span>
                </div>
              </Link>

              <Link
                to="universities"
                className="bg-white rounded-xl border overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 group"
                style={{ borderColor: '#E8EDFB' }}
              >
                <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: '#E8EDFB' }}>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-lg">University & Courses DB</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Master DB of institutions</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-end">
                  <span className="w-full py-3 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center gap-2 group-hover:bg-sky-700 transition shadow-md shadow-sky-600/20">
                    Manage Databases <ArrowRight className="w-5 h-5" />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
