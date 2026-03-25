import { MapPin, Building2, DollarSign } from 'lucide-react';
import { resolveFileUrl } from '../../lib/imageUrl';

type Job = {
  _id: string;
  title: string;
  company: string;
  location?: string;
  type?: string;
  description?: string;
  salaryRange?: string;
  companyLogoUrl?: string;
  visaSponsorshipAvailable?: boolean;
  partTimeAllowed?: boolean;
  tags?: string[];
};

function formatType(t?: string) {
  return (t || '').replace(/_/g, ' ');
}

function logoSrc(url?: string) {
  if (!url) return '';
  return url.startsWith('http') ? url : resolveFileUrl(url);
}

type Props = {
  job: Job;
  applySlot: React.ReactNode;
};

/** Job board card — Jobb-style dense listing with optional brand logo */
export default function PublicJobCard({ job, applySlot }: Props) {
  const logo = logoSrc(job.companyLogoUrl);

  return (
    <article className="group flex flex-col bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:bg-white/[0.07] hover:border-emerald-500/35 transition-all duration-300 shadow-lg shadow-black/20">
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
            {logo ? (
              <img src={logo} alt="" className="w-full h-full object-contain p-1" />
            ) : (
              <Building2 className="w-6 h-6 text-slate-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-display font-bold text-white leading-tight group-hover:text-emerald-400 transition-colors line-clamp-2">
              {job.title}
            </h2>
            <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate font-semibold">{job.company}</span>
            </p>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-black uppercase tracking-wide border border-emerald-500/25">
            {formatType(job.type)}
          </span>
        </div>
        <p className="text-slate-400 text-sm flex items-center gap-1.5 mb-2">
          <MapPin className="w-4 h-4 shrink-0 text-slate-500" />
          {job.location}
        </p>
        {job.salaryRange && (
          <p className="text-slate-400 text-sm flex items-center gap-1.5 mb-2">
            <DollarSign className="w-4 h-4 shrink-0 text-slate-500" />
            {job.salaryRange}
          </p>
        )}
        <p className="text-slate-500 text-sm line-clamp-3 flex-1 leading-relaxed">{job.description}</p>
        {(job.tags?.length || 0) > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(job.tags || []).slice(0, 4).map((t) => (
              <span key={t} className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/10">
          {job.visaSponsorshipAvailable && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md">
              Visa sponsorship
            </span>
          )}
          {job.partTimeAllowed && (
            <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-1 rounded-md">Part-time OK</span>
          )}
        </div>
      </div>
      <div className="p-4 bg-black/25 border-t border-white/5">{applySlot}</div>
    </article>
  );
}
