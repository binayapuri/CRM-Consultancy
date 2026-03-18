import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Briefcase, MapPin, Building2, Search, DollarSign, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { getDashboardPathForRole } from '../../lib/authHelpers';

const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CASUAL', 'CONTRACT', 'INTERNSHIP'];

export default function PublicJobs() {
  const { token, user } = useAuthStore();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', location: '', type: '' });

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.location) params.set('location', filters.location);
    if (filters.type) params.set('type', filters.type);
    params.set('limit', '50');
    fetch(`/api/jobs/public?${params}`)
      .then(res => res.json())
      .then(data => {
        setJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setJobs([]);
        setLoading(false);
      });
  }, [filters.search, filters.location, filters.type]);

  const formatType = (t: string) => (t || '').replace('_', ' ');

  return (
    <div className="min-h-screen bg-[#020617] selection:bg-emerald-500/30 flex flex-col">
      <Helmet>
        <title>Jobs for Students & Graduates | Big Few</title>
        <meta name="description" content="Find jobs suited for international students and graduates. Part-time, casual, and visa sponsorship opportunities." />
        <meta property="og:title" content="Jobs for Students & Graduates | Big Few" />
      </Helmet>
      {/* Nav */}
      <nav className="w-full top-0 border-b border-white/5 bg-[#020617]">
        <div className="flex items-center justify-between px-6 lg:px-12 py-5 max-w-7xl mx-auto">
          <Link to="/" className="group flex flex-col leading-tight">
            <span className="text-2xl font-display font-black tracking-tighter text-white group-hover:drop-shadow-[0_0_15px_rgba(52,211,153,0.5)] transition-all">
              <span className="text-white">BIG</span>
              <span className="text-emerald-400">FEW</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
              Evolution of Migration
            </span>
          </Link>
          <div className="flex items-center gap-8">
            <Link to="/#jobs" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Back to Home</Link>
            <Link to="/#news" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">News</Link>
            {token ? (
              user?.role === 'STUDENT' ? (
                <Link to="/student/jobs" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">My Jobs</Link>
              ) : (
                <Link to={getDashboardPathForRole(user?.role || '')} className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">Dashboard</Link>
              )
            ) : (
              <Link to="/login?redirect=/jobs" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">Sign in to Apply</Link>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-12 py-12 relative z-10">
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight mb-4">Jobs for Students & Graduates</h1>
          <p className="text-slate-400 text-lg">Find part-time, casual, and full-time roles suited for international students and visa holders.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-10">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <input
            type="text"
            placeholder="Location"
            value={filters.location}
            onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 w-40"
          />
          <select
            value={filters.type}
            onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50"
          >
            <option value="" className="bg-slate-900">All types</option>
            {JOB_TYPES.map(t => (
              <option key={t} value={t} className="bg-slate-900">{formatType(t)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <Briefcase className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No jobs found</h3>
            <p className="text-slate-400 mb-6">Try adjusting your filters or check back later.</p>
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors">
              Sign up to get job alerts
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="group flex flex-col bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-display font-bold text-white leading-tight group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {job.title}
                      </h2>
                      <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">{job.company}</span>
                      </p>
                    </div>
                    <span className="shrink-0 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                      {formatType(job.type)}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm flex items-center gap-1.5 mb-3">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {job.location}
                  </p>
                  {job.salaryRange && (
                    <p className="text-slate-400 text-sm flex items-center gap-1.5 mb-3">
                      <DollarSign className="w-4 h-4 shrink-0" />
                      {job.salaryRange}
                    </p>
                  )}
                  <p className="text-slate-500 text-sm line-clamp-3 flex-1">{job.description}</p>
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
                    {job.visaSponsorshipAvailable && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md">
                        Visa sponsorship
                      </span>
                    )}
                    {job.partTimeAllowed && (
                      <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-1 rounded-md">Part-time OK</span>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-black/20 border-t border-white/5">
                  {token && user?.role === 'STUDENT' ? (
                    <Link
                      to={`/student/jobs?apply=${job._id}`}
                      className="block w-full text-center py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors"
                    >
                      Apply now
                    </Link>
                  ) : token ? (
                    <Link
                      to={getDashboardPathForRole(user?.role || '')}
                      className="block w-full text-center py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors"
                    >
                      View in Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/login?redirect=/jobs"
                      className="block w-full text-center py-3 rounded-xl bg-emerald-500/80 text-slate-950 font-bold hover:bg-emerald-500 transition-colors"
                    >
                      Sign in to apply
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 py-12 relative z-10 bg-black/50 mt-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-display font-black tracking-tighter text-white">
              <span className="text-white">BIG</span>
              <span className="text-emerald-400">FEW</span>
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">© 2026 Dream Big, Hustle Few. Australian Migration CRM.</p>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400 text-sm font-medium">
            <Shield className="w-4 h-4 text-emerald-400" /> Secure Australian Data Hosting
          </div>
        </div>
      </footer>
    </div>
  );
}
