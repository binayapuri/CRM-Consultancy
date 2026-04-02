import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { authFetch, safeJson } from '../../store/auth';
import { useUiStore } from '../../store/ui';
import { Briefcase, Eye, Trash2, Archive, RefreshCw, ExternalLink } from 'lucide-react';

export default function SuperJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openConfirm, showToast } = useUiStore();

  const load = useCallback(() => {
    setLoading(true);
    authFetch('/api/jobs/employer/dashboard')
      .then((r) => r.json())
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deactivate = (job: any) => {
    openConfirm({
      title: 'Deactivate listing?',
      message: `"${job.title}" will be hidden from public search. You can still see it here.`,
      confirmLabel: 'Deactivate',
      onConfirm: async () => {
        const res = await authFetch(`/api/jobs/${job._id}/close`, { method: 'PATCH' });
        const err = res.ok ? null : await safeJson<any>(res);
        if (res.ok) {
          showToast('Job deactivated', 'success');
          load();
        } else {
          showToast((err as any)?.error || 'Failed', 'error');
        }
      },
    });
  };

  const remove = (job: any) => {
    openConfirm({
      title: 'Delete job listing?',
      message: `Remove "${job.title}" from the board? Applications stay on file for audit. This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        const res = await authFetch(`/api/jobs/${job._id}`, { method: 'DELETE' });
        const err = res.ok ? null : await safeJson<any>(res);
        if (res.ok) {
          showToast('Job removed', 'success');
          load();
        } else {
          showToast((err as any)?.error || 'Failed', 'error');
        }
      },
    });
  };

  const posterLabel = (job: any) => {
    const p = job.postedBy;
    if (!p) return '—';
    if (typeof p === 'object') {
      const name = [p.profile?.firstName, p.profile?.lastName].filter(Boolean).join(' ');
      return name || p.email || p.role || '—';
    }
    return String(p);
  };

  return (
    <div className="w-full animate-fade-in-up space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black text-slate-900">Job listings</h1>
          <p className="text-slate-500 mt-1">
            All jobs across the platform. Deactivate to hide from search, or delete to remove a posting (creator data unchanged).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <Link to="/partner/jobs" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700">
            <ExternalLink className="w-4 h-4" /> Employer workspace
          </Link>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">Loading…</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-bold">No job postings yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-bold text-slate-700">Job</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-700">Company</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-700">Posted by</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-700">Status</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-700">Applicants</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job: any) => (
                  <tr key={job._id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-bold text-slate-900 max-w-[220px]">
                      {job.title}
                      {job.moderationState === 'REMOVED' && (
                        <span className="ml-2 text-[10px] uppercase font-black text-rose-600">Removed</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{job.company}</td>
                    <td className="px-4 py-3 text-slate-600">{posterLabel(job)}</td>
                    <td className="px-4 py-3">
                      {!job.isActive || job.moderationState === 'REMOVED' ? (
                        <span className="text-xs font-bold text-rose-600">Hidden</span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600">Live</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{job.applications?.length ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <a
                          href={`/jobs#${job._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                          title="Open public jobs page"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        {job.isActive !== false && job.moderationState !== 'REMOVED' && (
                          <button
                            type="button"
                            onClick={() => deactivate(job)}
                            className="p-2 rounded-lg text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                            title="Deactivate (hide from search)"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => remove(job)}
                          className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                          title="Delete listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
