import { useEffect, useMemo, useState } from 'react';
import { authFetch } from '../../store/auth';
import { Building2, CheckCircle2, XCircle, Filter } from 'lucide-react';

export default function UniversityRequests() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('ALL');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      if (status !== 'ALL') qs.set('status', status);
      const res = await authFetch(`/api/university-requests${qs.toString() ? `?${qs.toString()}` : ''}`);
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.error || 'Failed to load requests');
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const updateDecision = async (id: string, decision: 'RECOMMEND' | 'REVIEWED' | 'REJECT') => {
    setSavingId(id);
    setError('');
    try {
      const res = await authFetch(`/api/university-requests/${id}/consultancy-review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, notes: notes[id] || '' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to update request');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to update request');
    } finally {
      setSavingId(null);
    }
  };

  const grouped = useMemo(
    () => ({
      total: rows.length,
      pending: rows.filter((r) => r.status === 'PENDING').length,
      recommended: rows.filter((r) => r.status === 'CONSULTANCY_RECOMMENDED').length,
      rejected: rows.filter((r) => r.status === 'REJECTED').length,
    }),
    [rows]
  );

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" /></div>;

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in-up space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900">University Verification Queue</h1>
          <p className="text-slate-500 mt-1">Review incoming university onboarding requests and recommend to super admin.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4"><p className="text-xs font-black text-slate-500">TOTAL</p><p className="text-2xl font-black mt-1">{grouped.total}</p></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4"><p className="text-xs font-black text-slate-500">PENDING</p><p className="text-2xl font-black mt-1">{grouped.pending}</p></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4"><p className="text-xs font-black text-slate-500">RECOMMENDED</p><p className="text-2xl font-black mt-1">{grouped.recommended}</p></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4"><p className="text-xs font-black text-slate-500">REJECTED</p><p className="text-2xl font-black mt-1">{grouped.rejected}</p></div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2"><Filter className="w-4 h-4" /> Status
          <select className="mt-1 w-full md:w-64 input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {['ALL', 'PENDING', 'CONSULTANCY_REVIEWED', 'CONSULTANCY_RECOMMENDED', 'SUPER_APPROVED', 'REJECTED'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{error}</div>}

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r._id} className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <p className="font-black text-slate-900">{r.institutionName}</p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">{r.status}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{r.email} {r.phone ? `· ${r.phone}` : ''}</p>
                {(r.website || r.cricosProviderCode) && (
                  <p className="text-xs text-slate-500 mt-1">{r.website || 'No website'} {r.cricosProviderCode ? `· CRICOS ${r.cricosProviderCode}` : ''}</p>
                )}
                {!!r.courseSummary?.length && <p className="text-xs text-slate-600 mt-2">Courses: {r.courseSummary.join(', ')}</p>}
                {!!r.notes && <p className="text-xs text-slate-600 mt-2">{r.notes}</p>}
              </div>

              <div className="w-full lg:w-[420px] space-y-2">
                <textarea
                  className="w-full input"
                  rows={2}
                  placeholder="Consultancy review notes (recommended for super admin)"
                  value={notes[r._id] || ''}
                  onChange={(e) => setNotes((n) => ({ ...n, [r._id]: e.target.value }))}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={savingId === r._id}
                    onClick={() => updateDecision(r._id, 'REVIEWED')}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                  >
                    Mark reviewed
                  </button>
                  <button
                    disabled={savingId === r._id}
                    onClick={() => updateDecision(r._id, 'RECOMMEND')}
                    className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-700 inline-flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Recommend
                  </button>
                  <button
                    disabled={savingId === r._id}
                    onClick={() => updateDecision(r._id, 'REJECT')}
                    className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 font-bold hover:bg-rose-50 inline-flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500">No university requests found.</div>}
      </div>
    </div>
  );
}

