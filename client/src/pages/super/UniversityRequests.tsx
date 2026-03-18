import { useEffect, useMemo, useState } from 'react';
import { authFetch } from '../../store/auth';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

export default function UniversityRequestsAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/university-requests');
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
  }, []);

  const applyDecision = async (id: string, decision: 'APPROVE' | 'REJECT') => {
    setSavingId(id);
    setError('');
    try {
      const res = await authFetch(`/api/university-requests/${id}/super-review`, {
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

  const stats = useMemo(() => ({
    total: rows.length,
    pending: rows.filter((r) => ['PENDING', 'CONSULTANCY_REVIEWED', 'CONSULTANCY_RECOMMENDED'].includes(r.status)).length,
    approved: rows.filter((r) => r.status === 'SUPER_APPROVED').length,
    rejected: rows.filter((r) => r.status === 'REJECTED').length,
  }), [rows]);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" /></div>;

  return (
    <div className="w-full animate-fade-in-up space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">University Onboarding Requests</h1>
          <p className="text-slate-500 mt-1">Final super-admin approval for university partner accounts.</p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-sm inline-flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> final authority
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4"><p className="text-xs font-black text-slate-500">TOTAL</p><p className="text-2xl font-black mt-1">{stats.total}</p></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4"><p className="text-xs font-black text-slate-500">TO REVIEW</p><p className="text-2xl font-black mt-1">{stats.pending}</p></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4"><p className="text-xs font-black text-slate-500">APPROVED</p><p className="text-2xl font-black mt-1">{stats.approved}</p></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4"><p className="text-xs font-black text-slate-500">REJECTED</p><p className="text-2xl font-black mt-1">{stats.rejected}</p></div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{error}</div>}

      <div className="space-y-3">
        {rows.map((r) => {
          const locked = ['SUPER_APPROVED', 'REJECTED'].includes(r.status);
          return (
            <div key={r._id} className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-slate-900">{r.institutionName}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">{r.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{r.email} {r.phone ? `· ${r.phone}` : ''}</p>
                  <p className="text-xs text-slate-500 mt-1">{r.website || 'No website'} {r.cricosProviderCode ? `· CRICOS ${r.cricosProviderCode}` : ''}</p>
                  {r.consultancyReview?.decision && (
                    <p className="text-xs text-slate-700 mt-2">
                      Consultancy review: <span className="font-bold">{r.consultancyReview.decision}</span>
                      {r.consultancyReview.notes ? ` — ${r.consultancyReview.notes}` : ''}
                    </p>
                  )}
                </div>
                <div className="w-full lg:w-[420px] space-y-2">
                  <textarea
                    className="w-full input"
                    rows={2}
                    placeholder="Super admin notes"
                    value={notes[r._id] || ''}
                    onChange={(e) => setNotes((n) => ({ ...n, [r._id]: e.target.value }))}
                    disabled={locked}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={locked || savingId === r._id}
                      onClick={() => applyDecision(r._id, 'APPROVE')}
                      className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve + activate
                    </button>
                    <button
                      disabled={locked || savingId === r._id}
                      onClick={() => applyDecision(r._id, 'REJECT')}
                      className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 font-bold hover:bg-rose-50 disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500">No university requests found.</div>}
      </div>
    </div>
  );
}

