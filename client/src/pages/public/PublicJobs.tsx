import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Briefcase, Search } from 'lucide-react';
import PublicJobCard from '../../job-platform/components/PublicJobCard';
import { useAuthStore } from '../../store/auth';
import { getDashboardPathForRole } from '../../lib/authHelpers';
import { PublicMarketingHeader } from '../../components/public/PublicMarketingHeader';
import { PublicMarketingFooter } from '../../components/public/PublicMarketingFooter';
import { BRAND_DOMAIN, BRAND_NAME } from '../../constants/brand';

const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CASUAL', 'CONTRACT', 'INTERNSHIP'];

export default function PublicJobs() {
  const { token, user } = useAuthStore();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', location: '', type: '', visaSponsorship: '' });

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.location) params.set('location', filters.location);
    if (filters.type) params.set('type', filters.type);
    if (filters.visaSponsorship === 'true') params.set('visaSponsorship', 'true');
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
  }, [filters.search, filters.location, filters.type, filters.visaSponsorship]);

  return (
    <div className="min-h-screen bg-[#020617] selection:bg-emerald-500/30 flex flex-col">
      <Helmet>
        <title>Jobs for students & graduates | {BRAND_NAME}</title>
        <meta
          name="description"
          content="Find jobs suited for international students and graduates in Australia—part-time, casual, and full-time roles."
        />
        <link rel="canonical" href={`https://${BRAND_DOMAIN}/jobs`} />
        <meta property="og:title" content={`Jobs for students & graduates | ${BRAND_NAME}`} />
        <meta property="og:url" content={`https://${BRAND_DOMAIN}/jobs`} />
      </Helmet>
      <PublicMarketingHeader
        extraNav={[
          { to: '/', label: 'Home' },
          { to: '/news', label: 'News' },
          { to: '/visas', label: 'Visas' },
          { to: '/jobs', label: 'Jobs' },
        ]}
      />
      <div className="border-b border-white/5 bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-3 flex flex-wrap items-center justify-end gap-4 text-sm font-semibold">
            <Link to="/#jobs" className="text-slate-300 hover:text-white transition-colors">Back to Home</Link>
            <Link to="/news" className="text-slate-300 hover:text-white transition-colors">News</Link>
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-12 relative z-10">
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <p className="text-emerald-400/90 text-xs font-black uppercase tracking-[0.2em] mb-3">Australia · Free to browse</p>
          <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight mb-4">Find work that fits your visa</h1>
          <p className="text-slate-400 text-lg">
            Part-time, casual, and full-time roles — filter by location, role type, and sponsorship. Sign in as a student to apply in one click.
          </p>
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
              <option key={t} value={t} className="bg-slate-900">{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select
            value={filters.visaSponsorship}
            onChange={(e) => setFilters((f) => ({ ...f, visaSponsorship: e.target.value }))}
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50"
          >
            <option value="" className="bg-slate-900">Sponsorship: any</option>
            <option value="true" className="bg-slate-900">Sponsorship available</option>
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
              <PublicJobCard
                key={job._id}
                job={job}
                applySlot={
                  token && user?.role === 'STUDENT' ? (
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
                  )
                }
              />
            ))}
          </div>
        )}
      </main>

      <PublicMarketingFooter />
    </div>
  );
}
