import { Link, useSearchParams } from 'react-router-dom';
import { Briefcase, Info } from 'lucide-react';
import EmployerJobPortal from '../../job-platform/pages/EmployerJobPortal';

/**
 * Consultancy CRM entry for job listings — same tools as /partner/jobs, reachable from the main CRM nav.
 * Super Admin platform-wide moderation remains under /admin/jobs.
 */
export default function ConsultancyJobs() {
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 flex flex-col sm:flex-row sm:items-start gap-3">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden />
        <div className="text-sm text-emerald-950">
          <p className="font-bold">Job listings in your CRM</p>
          <p className="mt-1 text-emerald-900/90">
            Post and manage roles you publish as this account. For <strong>platform-wide</strong> moderation of every job, use{' '}
            <Link to="/admin/jobs" className="font-bold underline underline-offset-2 hover:text-emerald-800">
              Super Admin → Jobs
            </Link>
            . Students see live roles on the public{' '}
            <a href="/jobs" className="font-bold underline underline-offset-2 hover:text-emerald-800">
              job board
            </a>
            .
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
        <Briefcase className="w-4 h-4 text-emerald-600" /> Jobs & applicants
        {consultancyId && (
          <span className="normal-case font-medium text-slate-500">(super admin scoped)</span>
        )}
      </div>
      <EmployerJobPortal />
    </div>
  );
}
