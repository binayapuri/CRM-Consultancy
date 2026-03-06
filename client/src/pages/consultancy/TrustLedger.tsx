import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authFetch } from '../../store/auth';
import { format } from 'date-fns';
import { Wallet, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';

export default function TrustLedger() {
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const [data, setData] = useState<{ entries: any[]; balance: number }>({ entries: [], balance: 0 });
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ description: '', category: '' });
  const [form, setForm] = useState({ amount: '', direction: 'CREDIT' as 'CREDIT' | 'DEBIT', description: '', clientId: '', category: 'Client Deposit' });

  const [accessDenied, setAccessDenied] = useState(false);
  const fetchData = () => {
    const url = consultancyId ? `/api/trust?consultancyId=${consultancyId}` : '/api/trust';
    authFetch(url)
      .then(r => {
        if (r.status === 403) { setAccessDenied(true); setLoading(false); return; }
        return r.json();
      })
      .then(d => { if (d) { setData(d); setAccessDenied(false); } setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { setLoading(true); setAccessDenied(false); fetchData(); }, [consultancyId]);
  useEffect(() => {
    const url = consultancyId ? `/api/clients?consultancyId=${consultancyId}` : '/api/clients';
    authFetch(url).then(r => r.json()).then(setClients);
  }, [consultancyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return;
    try {
      const res = await authFetch('/api/trust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          direction: form.direction,
          description: form.description || form.category,
          clientId: form.clientId || undefined,
          category: form.category,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setShowForm(false);
      setForm({ amount: '', direction: 'CREDIT', description: '', clientId: '', category: 'Client Deposit' });
      fetchData();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleEdit = (e: any) => {
    setEditingId(e._id);
    setEditForm({ description: e.description || '', category: e.category || '' });
  };
  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      const res = await authFetch(`/api/trust/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setEditingId(null);
      fetchData();
    } catch (err) {
      alert((err as Error).message);
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction? Use only for corrections. Consider adding a reversal entry instead.')) return;
    try {
      const res = await authFetch(`/api/trust/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchData();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (accessDenied) return (
    <div className="card p-12 text-center">
      <Wallet className="w-16 h-16 text-amber-500 mx-auto mb-4" />
      <h2 className="font-display font-semibold text-slate-900 mb-2">Access Restricted</h2>
      <p className="text-slate-600">You don&apos;t have permission to view the Trust Ledger. Contact your consultancy admin to request access.</p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Trust Ledger</h1>
          <p className="text-slate-500 mt-1">Client funds held in trust (OMARA compliant)</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Transaction</button>
      </div>
      <div className="card mt-6 flex items-center gap-4 max-w-sm">
        <div className="w-12 h-12 rounded-xl bg-ori-100 flex items-center justify-center">
          <Wallet className="w-6 h-6 text-ori-600" />
        </div>
        <div>
          {loading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold text-slate-900">${data.balance?.toFixed(2) || '0.00'}</p>}
          <p className="text-slate-500 text-sm">Balance Held</p>
        </div>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="card mt-6 max-w-xl">
          <h3 className="font-semibold text-slate-900 mb-4">Add Transaction</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Direction</label><select value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value as 'CREDIT' | 'DEBIT' }))} className="input"><option value="CREDIT">Credit (Deposit)</option><option value="DEBIT">Debit (Withdrawal)</option></select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Amount ($) *</label><input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="input" required placeholder="e.g. 500" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Category</label><select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input"><option value="Client Deposit">Client Deposit</option><option value="Fee Transfer">Fee Transfer</option><option value="Refund">Refund</option><option value="Other">Other</option></select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Client</label><select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} className="input"><option value="">Select</option>{clients.map((c: any) => <option key={c._id} value={c._id}>{c.profile?.firstName} {c.profile?.lastName}</option>)}</select></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Description</label><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input" placeholder="e.g. Visa application deposit" /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn-primary">Add</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex items-center gap-1"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </form>
      )}
      <div className="card mt-6 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Date</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Description</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Direction</th>
              <th className="text-right px-4 py-3 font-medium text-slate-700">Amount</th>
              <th className="text-right px-4 py-3 font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6"><div className="flex justify-center"><Skeleton className="h-4 w-3/4" /></div></td></tr>
            ) : data.entries?.map((e: any) => (
              <tr key={e._id} className="border-b border-slate-100">
                <td className="px-4 py-3 text-slate-600">{format(new Date(e.createdAt), 'dd MMM yyyy')}</td>
                <td className="px-4 py-3">
                  {editingId === e._id ? (
                    <div className="flex gap-2">
                      <input value={editForm.description} onChange={ev => setEditForm(f => ({ ...f, description: ev.target.value }))} className="input py-1 text-sm" placeholder="Description" />
                      <select value={editForm.category} onChange={ev => setEditForm(f => ({ ...f, category: ev.target.value }))} className="input py-1 text-sm w-32">
                        <option value="Client Deposit">Client Deposit</option>
                        <option value="Fee Transfer">Fee Transfer</option>
                        <option value="Refund">Refund</option>
                        <option value="Other">Other</option>
                      </select>
                      <button onClick={handleSaveEdit} className="btn-primary text-sm py-1">Save</button>
                      <button onClick={() => setEditingId(null)} className="btn-secondary text-sm py-1">Cancel</button>
                    </div>
                  ) : (
                    <span>{e.description || e.category}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={e.direction === 'CREDIT' ? 'text-green-600' : 'text-red-600'}>{e.direction}</span>
                </td>
                <td className="px-4 py-3 text-right font-medium">{e.direction === 'CREDIT' ? '+' : '-'}${e.amount?.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  {editingId !== e._id && (
                    <>
                      <button onClick={() => handleEdit(e)} className="p-2 text-ori-600 hover:bg-ori-50 rounded" title="Edit"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(e._id)} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !data.entries?.length && <div className="p-12 text-center text-slate-500">No transactions</div>}
      </div>
    </div>
  );
}
