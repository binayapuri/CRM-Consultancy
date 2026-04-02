import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { authFetch, safeJson } from '../../store/auth';
import { resolveFileUrl } from '../../lib/imageUrl';
import { readStudentUiPrefs } from '../../lib/studentUiPrefs';
import { formatAnnualFeeDisplay } from '../../lib/formatFeeDisplay';
import {
  GraduationCap,
  MapPin,
  SlidersHorizontal,
  GitCompare,
  X,
  ExternalLink,
  Sparkles,
  Loader2,
  ChevronRight,
} from 'lucide-react';

const LEVELS = [
  { value: '', label: 'All levels' },
  { value: 'CERTIFICATE', label: 'Certificate' },
  { value: 'DIPLOMA', label: 'Diploma' },
  { value: 'BACHELORS', label: 'Bachelors' },
  { value: 'MASTERS', label: 'Masters' },
  { value: 'PHD', label: 'PhD' },
  { value: 'OTHER', label: 'Other' },
];

const AU_STATES = [
  { value: '', label: 'All states' },
  { value: 'NSW', label: 'NSW' },
  { value: 'VIC', label: 'VIC' },
  { value: 'QLD', label: 'QLD' },
  { value: 'WA', label: 'WA' },
  { value: 'SA', label: 'SA' },
  { value: 'TAS', label: 'TAS' },
  { value: 'NT', label: 'NT' },
  { value: 'ACT', label: 'ACT' },
];

const SORTS = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'name', label: 'Course name (A–Z)' },
  { value: 'fee_asc', label: 'Tuition (low → high)' },
  { value: 'fee_desc', label: 'Tuition (high → low)' },
  { value: 'uni', label: 'University' },
];

type Uni = {
  _id: string;
  name: string;
  location?: { city?: string; state?: string };
  branches?: { city?: string; state?: string; name?: string }[];
  logoUrl?: string;
  website?: string;
  partnerStatus?: string;
};

type CourseRow = {
  _id: string;
  name: string;
  faculty?: string;
  level: string;
  duration?: string;
  tuitionFee?: number;
  cricosCode?: string;
  prPathwayPotential?: boolean;
  requirements?: { english?: string; academic?: string };
  fees?: { branchId: string; amount: number }[];
  universityId: Uni;
};

function levelLabel(level: string) {
  const m: Record<string, string> = {
    CERTIFICATE: 'Certificate',
    DIPLOMA: 'Diploma',
    BACHELORS: 'Bachelors',
    MASTERS: 'Masters',
    PHD: 'PhD',
    OTHER: 'Other',
  };
  return m[level] || level;
}

function uniLocation(uni: Uni | null | undefined): string {
  if (!uni) return '';
  const loc = uni.location;
  if (loc?.city || loc?.state) return [loc.city, loc.state].filter(Boolean).join(', ');
  const b = uni.branches?.find((x) => x?.city || x?.state) || uni.branches?.[0];
  if (b?.city || b?.state) return [b.city, b.state].filter(Boolean).join(', ');
  return 'Australia';
}

export default function TrainingCourses() {
  const [currencyDisplay, setCurrencyDisplay] = useState(() => readStudentUiPrefs().currencyDisplay || 'AUD');
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [level, setLevel] = useState('');
  const [state, setState] = useState('');
  const [feeMin, setFeeMin] = useState('');
  const [feeMax, setFeeMax] = useState('');
  const [prOnly, setPrOnly] = useState(false);
  const [sort, setSort] = useState('updated');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareData, setCompareData] = useState<CourseRow[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const sync = () => setCurrencyDisplay(readStudentUiPrefs().currencyDisplay || 'AUD');
    window.addEventListener('student-prefs-updated', sync);
    return () => window.removeEventListener('student-prefs-updated', sync);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQ) params.set('q', debouncedQ);
      if (level) params.set('level', level);
      if (state) params.set('state', state);
      if (feeMin) params.set('feeMin', feeMin);
      if (feeMax) params.set('feeMax', feeMax);
      if (prOnly) params.set('prPathway', 'true');
      params.set('sort', sort);
      params.set('limit', '200');
      const res = await authFetch(`/api/universities/catalog/courses?${params.toString()}`);
      const data = await safeJson<CourseRow[] | { error?: string }>(res);
      if (!res.ok) throw new Error((data as { error?: string })?.error || 'Failed to load');
      setCourses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn(e);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, level, state, feeMin, feeMax, prOnly, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const runCompare = async () => {
    if (compareIds.length < 2) return;
    setCompareLoading(true);
    try {
      const res = await authFetch(`/api/universities/compare/courses?ids=${compareIds.join(',')}`);
      const data = await safeJson<CourseRow[] | { error?: string }>(res);
      if (!res.ok) throw new Error((data as { error?: string })?.error || 'Compare failed');
      setCompareData(Array.isArray(data) ? data : []);
      setCompareOpen(true);
    } catch {
      setCompareData([]);
    } finally {
      setCompareLoading(false);
    }
  };

  const selectedCourses = useMemo(
    () => courses.filter((c) => compareIds.includes(String(c._id))),
    [courses, compareIds]
  );

  return (
    <div className="w-full min-w-0 max-w-full animate-fade-in-up pb-24">
      <div className="rounded-2xl overflow-hidden mb-8 border border-indigo-100 bg-gradient-to-br from-[#0f0e2e] via-[#1a1560] to-[#0d2847] text-white p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-1">Training & education</p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex flex-wrap items-center gap-2">
              <GraduationCap className="w-9 h-9 text-amber-300 shrink-0" aria-hidden />
              Courses & universities
            </h1>
            <p className="text-slate-300 font-medium mt-2 max-w-2xl">
              Search CRICOS-listed programs, filter by level, state and fees, then compare institutions side by side — like
              comparing phones, but for your future degree.
            </p>
            {currencyDisplay !== 'AUD' && (
              <p className="text-xs text-indigo-200/90 mt-3 max-w-2xl">
                Showing fees in <strong>{currencyDisplay}</strong> (approximate) plus AUD reference. Change in{' '}
                <Link to="../settings?tab=preferences" className="underline font-bold text-white">
                  Settings → Display & region
                </Link>
                .
              </p>
            )}
          </div>
          <Link
            to="../offer-letters"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-white/10 border border-white/20 hover:bg-white/15 transition shrink-0"
          >
            Offer letter applications <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters — desktop */}
        <aside className="hidden lg:block w-72 shrink-0 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm sticky top-24">
            <h2 className="font-black text-slate-900 flex items-center gap-2 mb-4">
              <SlidersHorizontal className="w-5 h-5 text-indigo-600" aria-hidden />
              Filters
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500">Search</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Course name, CRICOS…"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500">Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                >
                  {LEVELS.map((o) => (
                    <option key={o.value || 'all'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500">State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                >
                  {AU_STATES.map((o) => (
                    <option key={o.value || 'all-s'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500">Fee min (AUD)</label>
                  <input
                    type="number"
                    value={feeMin}
                    onChange={(e) => setFeeMin(e.target.value)}
                    placeholder="e.g. 20000"
                    className="mt-1 w-full px-2 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500">Fee max (AUD)</label>
                  <input
                    type="number"
                    value={feeMax}
                    onChange={(e) => setFeeMax(e.target.value)}
                    placeholder="e.g. 45000"
                    className="mt-1 w-full px-2 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Filters use stored annual fees in AUD (including branch fees).</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={prOnly} onChange={(e) => setPrOnly(e.target.checked)} />
                <span className="text-sm font-medium text-slate-700">PR pathway flagged</span>
              </label>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500">Sort</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                >
                  {SORTS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Mobile filter toggle */}
          <div className="lg:hidden mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>
          {filtersOpen && (
            <div className="lg:hidden bg-white rounded-xl border border-slate-200 p-4 mb-4 space-y-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search courses…"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <select value={level} onChange={(e) => setLevel(e.target.value)} className="px-2 py-2 rounded-lg border text-sm">
                  {LEVELS.map((o) => (
                    <option key={o.value || 'all'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <select value={state} onChange={(e) => setState(e.target.value)} className="px-2 py-2 rounded-lg border text-sm">
                  {AU_STATES.map((o) => (
                    <option key={o.value || 'all-s'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={prOnly} onChange={(e) => setPrOnly(e.target.checked)} />
                <span className="text-sm">PR pathway</span>
              </label>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20 text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <p className="text-slate-600 font-medium">No courses match your filters.</p>
              <p className="text-sm text-slate-400 mt-2">Try clearing search or widening the fee range.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-2 gap-4">
              {courses.map((c) => {
                const uni = c.universityId;
                const selected = compareIds.includes(String(c._id));
                return (
                  <article
                    key={c._id}
                    className={`bg-white rounded-xl border shadow-sm overflow-hidden transition hover:shadow-md ${
                      selected ? 'ring-2 ring-indigo-500 border-indigo-200' : 'border-slate-200'
                    }`}
                  >
                    <div className="p-4 flex gap-3">
                      <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {uni?.logoUrl ? (
                          <img src={resolveFileUrl(uni.logoUrl)} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <GraduationCap className="w-7 h-7 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-slate-900 leading-tight line-clamp-2">{c.name}</h3>
                        <p className="text-sm font-bold text-indigo-700 mt-0.5 truncate">{uni?.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {uniLocation(uni)}
                        </p>
                      </div>
                    </div>
                    <div className="px-4 pb-3 flex flex-wrap gap-2 text-xs font-bold">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{levelLabel(c.level)}</span>
                      {c.duration && <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-600">{c.duration}</span>}
                      {c.prPathwayPotential && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-0.5">
                          <Sparkles className="w-3 h-3" /> PR pathway
                        </span>
                      )}
                    </div>
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400">Indicative fee</p>
                        <p className="text-lg font-black text-slate-900 leading-snug">
                          {formatAnnualFeeDisplay(c, currencyDisplay)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => toggleCompare(String(c._id))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                            selected
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                          }`}
                        >
                          {selected ? 'Selected' : 'Compare'}
                        </button>
                        {uni?.website && (
                          <a
                            href={uni.website.startsWith('http') ? uni.website : `https://${uni.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50"
                          >
                            Website <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sticky compare bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <GitCompare className="w-5 h-5 text-indigo-600 shrink-0" />
              <span className="text-sm font-bold text-slate-800">
                {compareIds.length} selected — max 4
              </span>
              <div className="flex flex-wrap gap-1">
                {selectedCourses.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => toggleCompare(String(c._id))}
                    className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-100 flex items-center gap-1 max-w-[10rem]"
                  >
                    <span className="truncate">{c.name}</span>
                    <X className="w-3 h-3 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setCompareIds([])}
                className="px-4 py-2 rounded-xl font-bold text-sm text-slate-600 border border-slate-200"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={compareIds.length < 2 || compareLoading}
                onClick={runCompare}
                className="px-5 py-2 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 inline-flex items-center gap-2"
              >
                {compareLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />}
                Compare now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare modal */}
      {compareOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/50" role="dialog">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-[100vw] w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h2 className="font-black text-lg text-slate-900">Compare courses</h2>
              <button type="button" onClick={() => setCompareOpen(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto flex-1 p-4">
              <div className="overflow-x-auto min-w-0">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 pr-4 font-black text-slate-500 w-36">Attribute</th>
                      {compareData.map((c) => (
                        <th key={c._id} className="text-left py-2 px-2 font-black text-slate-900 min-w-[160px]">
                          <div className="line-clamp-2">{c.name}</div>
                          <div className="text-xs font-medium text-indigo-600 mt-0.5">{c.universityId?.name}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="align-top">
                    <tr className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-bold text-slate-500">Location</td>
                      {compareData.map((c) => (
                        <td key={c._id} className="py-2 px-2 text-slate-800">
                          {uniLocation(c.universityId)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-bold text-slate-500">Level</td>
                      {compareData.map((c) => (
                        <td key={c._id} className="py-2 px-2">
                          {levelLabel(c.level)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-bold text-slate-500">Duration</td>
                      {compareData.map((c) => (
                        <td key={c._id} className="py-2 px-2">
                          {c.duration || '—'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-bold text-slate-500">Indicative fee</td>
                      {compareData.map((c) => (
                        <td key={c._id} className="py-2 px-2 font-bold text-slate-900 text-xs leading-snug">
                          {formatAnnualFeeDisplay(c, currencyDisplay)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-bold text-slate-500">CRICOS</td>
                      {compareData.map((c) => (
                        <td key={c._id} className="py-2 px-2">
                          {c.cricosCode || '—'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-bold text-slate-500">English req.</td>
                      {compareData.map((c) => (
                        <td key={c._id} className="py-2 px-2 text-xs">
                          {c.requirements?.english || '—'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-bold text-slate-500">Academic req.</td>
                      {compareData.map((c) => (
                        <td key={c._id} className="py-2 px-2 text-xs">
                          {c.requirements?.academic || '—'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-bold text-slate-500">PR pathway</td>
                      {compareData.map((c) => (
                        <td key={c._id} className="py-2 px-2">
                          {c.prPathwayPotential ? 'Flagged' : '—'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="../offer-letters"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-emerald-600 text-white"
                  onClick={() => setCompareOpen(false)}
                >
                  Apply for offer letter <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
