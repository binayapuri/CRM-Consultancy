import { useEffect, useState } from 'react';
import { authFetch, safeJson } from '../../store/auth';
import { useUiStore } from '../../store/ui';
import { Calculator, Save, RotateCcw } from 'lucide-react';

const DEFAULT_JSON = `{
  "disclaimer": "Indicative only. Not legal advice.",
  "english": { "superior": 20, "proficient": 10, "competent": 0 },
  "education": { "doctorate": 20, "masters": 15, "bachelor": 15, "diploma": 10, "other": 0 },
  "ausStudy": 5,
  "regionalStudy": 5,
  "professionalYear": 5,
  "naati": 5,
  "partner": 10
}`;

export default function AdminPrEstimator() {
  const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const showToast = useUiStore((s) => s.showToast);

  const load = () => {
    setLoading(true);
    authFetch('/api/admin/settings')
      .then((r) => safeJson<any>(r))
      .then((data) => {
        const pe = data?.prEstimator && typeof data.prEstimator === 'object' ? data.prEstimator : {};
        let merged = pe;
        try {
          if (!Object.keys(pe).length) merged = JSON.parse(DEFAULT_JSON);
        } catch {
          merged = {};
        }
        setRaw(JSON.stringify(merged, null, 2));
      })
      .catch(() => showToast('Failed to load', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      showToast('Invalid JSON', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prEstimator: parsed }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error((data as any)?.error || 'Save failed');
      showToast('PR estimator weights saved', 'success');
      const saved = data as { prEstimator?: Record<string, unknown> };
      if (saved?.prEstimator) setRaw(JSON.stringify(saved.prEstimator, null, 2));
    } catch (e: any) {
      showToast(e?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
          <Calculator className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">PR points estimator</h1>
          <p className="text-slate-600 text-sm mt-1">
            Tunable weights for the <strong>student dashboard</strong> indicative total (GET <code className="text-xs bg-slate-100 px-1 rounded">/api/student/pr-estimate</code>). Does not change the full PR Calculator page unless you align those fields separately.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Points test rules change with legislation. Keep disclaimers accurate; students still need a MARN for advice.
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRaw(DEFAULT_JSON)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="w-4 h-4" /> Reset template
            </button>
          </div>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="w-full min-h-[420px] font-mono text-sm rounded-xl border border-slate-200 p-4 bg-slate-900 text-emerald-100 focus:ring-2 focus:ring-indigo-400 outline-none"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save weights'}
          </button>
        </>
      )}
    </div>
  );
}
