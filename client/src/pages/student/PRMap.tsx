import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { authFetch, safeJson } from '../../store/auth';

type PrEstimate = { total?: number; disclaimer?: string };
import { Footprints, MapPin, GraduationCap, Plane, Briefcase, Flag, Sparkles, ArrowRight } from 'lucide-react';

type Milestone = {
  id: string;
  year: number;
  month?: number;
  title: string;
  detail: string;
  kind: 'now' | 'study' | 'visa' | 'work' | 'goal' | 'generic';
};

function yearFrom(d?: string | Date | null): number | null {
  if (!d) return null;
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? null : t.getFullYear();
}

function buildMilestones(client: any): Milestone[] {
  const out: Milestone[] = [];
  const p = client?.profile || {};
  const cy = new Date().getFullYear();

  out.push({
    id: 'now',
    year: cy,
    title: 'Today',
    detail: 'Your journey is unique — add dates in Profile so this road reflects your story.',
    kind: 'now',
  });

  const ve = yearFrom(p.visaExpiry);
  if (ve) {
    out.push({
      id: 'visa-exp',
      year: ve,
      title: p.currentVisa ? `Visa ${p.currentVisa} horizon` : 'Visa expiry',
      detail: 'Plan the next visa step before this date (e.g. 485 within 6 months of course completion).',
      kind: 'visa',
    });
  }

  for (const ed of client?.education || []) {
    const endY = yearFrom(ed.endDate);
    if (endY) {
      out.push({
        id: `edu-${ed._id || endY}`,
        year: endY,
        title: 'Study milestone',
        detail: ed.qualification || ed.fieldOfStudy || 'Course completion — consider 485 Graduate visa timing.',
        kind: 'study',
      });
    }
  }

  const target = String(p.targetVisa || '').trim();
  if (target) {
    out.push({
      id: 'goal',
      year: cy + 2,
      title: `Goal: subclass ${target}`,
      detail: 'Work backwards from invitation rounds: skills assessment, English, and skilled employment.',
      kind: 'goal',
    });
  }

  // Generic pathway anchors (Australian skilled migration narrative)
  const generic: Milestone[] = [
    { id: 'g1', year: cy - 1, title: 'Path begins', detail: 'Research ANZSCO, SkillSelect points, and state lists.', kind: 'generic' },
    { id: 'g2', year: cy + 1, title: 'Skills & English', detail: 'Positive skills assessment + proficient English unlock most pathways.', kind: 'generic' },
    { id: 'g3', year: cy + 3, title: 'EOI & nomination', detail: 'Expression of Interest, then 189/190/491 or employer-sponsored routes.', kind: 'generic' },
  ];
  for (const g of generic) {
    if (!out.some((o) => o.year === g.year && o.kind === g.kind)) out.push(g);
  }

  return [...out].sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));
}

const kindIcon = (k: Milestone['kind']) => {
  switch (k) {
    case 'study': return GraduationCap;
    case 'visa': return Plane;
    case 'work': return Briefcase;
    case 'goal': return Flag;
    case 'now': return MapPin;
    default: return Sparkles;
  }
};

export default function PRMap() {
  const [client, setClient] = useState<any>(null);
  const [prEst, setPrEst] = useState<PrEstimate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authFetch('/api/student/profile').then((r) => safeJson<any>(r)),
      authFetch('/api/student/pr-estimate').then((r) => safeJson<PrEstimate>(r)).catch(() => null),
    ])
      .then(([prof, est]) => {
        setClient(prof?.client || null);
        setPrEst(est && typeof est?.total === 'number' ? est : null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const milestones = useMemo(() => (client ? buildMilestones(client) : []), [client]);
  const minY = milestones.length ? Math.min(...milestones.map((m) => m.year)) : new Date().getFullYear();
  const maxY = milestones.length ? Math.max(...milestones.map((m) => m.year)) : new Date().getFullYear();
  const span = Math.max(1, maxY - minY);

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto space-y-8 animate-fade-in-up pb-16">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-2">My PR Map</p>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Your road to Australian PR</h1>
        <p className="text-slate-500 mt-2 text-sm max-w-2xl">
          A visual timeline — not immigration advice. It combines typical skilled-migration steps with dates from your profile (visa, study).{' '}
          <strong className="text-slate-700">Add dates in Profile</strong> for a map that truly reflects you.
        </p>
        {prEst?.total != null && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100 px-4 py-1.5 text-sm font-bold text-indigo-800">
            Indicative PR points (dashboard): <span className="tabular-nums text-lg">{prEst.total}</span>
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Road + footprints */}
          <div
            className="relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-xl"
            style={{
              background: 'linear-gradient(180deg, #0f172a 0%, #1e3a5f 45%, #0c4a6e 100%)',
            }}
          >
            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(251,191,36,0.25), transparent 50%)' }} />
            <div className="relative z-10 px-4 sm:px-8 py-10 sm:py-14">
              <div className="flex items-center gap-2 text-amber-200/90 text-xs font-bold uppercase tracking-widest mb-6">
                <Footprints className="w-4 h-4" /> Struggle & milestones — year by year
              </div>

              <div className="relative h-36 sm:h-44 mb-4">
                <svg className="w-full h-full" viewBox="0 0 800 160" preserveAspectRatio="none" aria-hidden>
                  <defs>
                    <linearGradient id="roadGrad" x1="0" y1="0" x2="800" y2="0">
                      <stop offset="0%" stopColor="#334155" />
                      <stop offset="50%" stopColor="#475569" />
                      <stop offset="100%" stopColor="#334155" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 100 Q 200 40 400 100 T 800 95"
                    fill="none"
                    stroke="url(#roadGrad)"
                    strokeWidth="28"
                    strokeLinecap="round"
                    opacity="0.95"
                  />
                  <path
                    d="M 0 100 Q 200 40 400 100 T 800 95"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="3"
                    strokeDasharray="10 14"
                    opacity="0.35"
                  />
                  {[80, 220, 360, 500, 640].map((x, i) => (
                    <g key={i} transform={`translate(${x}, ${95 + Math.sin(i) * 6})`} opacity={0.85}>
                      <ellipse cx="0" cy="0" rx="10" ry="5" fill="#fcd34a" transform="rotate(-25)" />
                      <ellipse cx="18" cy="-4" rx="10" ry="5" fill="#fcd34a" transform="rotate(-15)" />
                    </g>
                  ))}
                </svg>
              </div>

              <div className="flex flex-wrap gap-2 justify-between text-[11px] font-bold text-slate-300/90">
                <span>{minY}</span>
                <span className="text-amber-200/80">The road bends — plans change. Update your profile anytime.</span>
                <span>{maxY}</span>
              </div>
            </div>
          </div>

          {/* Timeline cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {milestones.map((m) => {
              const Icon = kindIcon(m.kind);
              return (
                <div
                  key={m.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex gap-4"
                >
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-slate-700 flex items-center justify-center text-white">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-wider">{m.year}</p>
                    <h3 className="font-black text-slate-900 text-sm sm:text-base leading-snug">{m.title}</h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{m.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-950">
            <strong className="font-black">Registered migration agents</strong> lodge applications and interpret law. This map is educational software only — use it to organise your next steps with your agent or education provider.
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="../profile?tab=personal" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors">
              Update profile <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="../journey" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 hover:bg-slate-50">
              Open checklist (My Journey)
            </Link>
            <Link to="../calculator" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 hover:bg-slate-50">
              Full PR calculator
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
