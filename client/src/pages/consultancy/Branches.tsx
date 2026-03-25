import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authFetch, useAuthStore } from '../../store/auth';
import { Building2, Pencil, Plus } from 'lucide-react';

export default function ConsultancyBranches() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: '', code: '', address: '', phone: '' });
  const [editing, setEditing] = useState<any | null>(null);

  const load = () => {
    setLoading(true);
    const q = consultancyId ? `?consultancyId=${encodeURIComponent(consultancyId)}` : '';
    authFetch(`/api/branches${q}`)
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [consultancyId]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await authFetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed');
      setForm({ name: '', code: '', address: '', phone: '' });
      setMsg('Branch created.');
      load();
    } catch (e: any) {
      setMsg(e.message || 'Error');
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setMsg('');
    try {
      const res = await authFetch(`/api/branches/${editing._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editing.name,
          code: editing.code,
          address: editing.address,
          phone: editing.phone,
          isActive: editing.isActive,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed');
      setEditing(null);
      setMsg('Branch updated.');
      load();
    } catch (e: any) {
      setMsg(e.message || 'Error');
    }
  };

  const canManage = user?.role === 'CONSULTANCY_ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
          <Building2 className="w-8 h-8 text-teal-600" /> Branches
        </h1>
        <p className="text-slate-500 mt-2">
          Offices (e.g. Sydney CBD, Melbourne). Assign clients and optionally staff to a branch — teams only see their branch by default.
        </p>
        {consultancyId && user?.role === 'SUPER_ADMIN' && (
          <p className="text-xs font-bold text-amber-700 mt-2">Viewing branches for selected consultancy (super admin).</p>
        )}
      </div>

      {canManage && (
        <form onSubmit={create} className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 space-y-3 shadow-sm">
          <h2 className="font-black text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add branch
          </h2>
          <input className="input w-full" placeholder="Branch name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <input className="input w-full" placeholder="Short code (optional)" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
          <input className="input w-full" placeholder="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          <input className="input w-full" placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <button type="submit" className="btn-primary px-5 py-2.5 font-black">
            Create branch
          </button>
        </form>
      )}

      {editing && canManage && (
        <form onSubmit={saveEdit} className="bg-teal-50 border border-teal-200 rounded-2xl p-6 mb-8 space-y-3">
          <h3 className="font-black text-slate-900">Edit branch</h3>
          <input className="input w-full" value={editing.name} onChange={(e) => setEditing((x: any) => ({ ...x, name: e.target.value }))} required />
          <input className="input w-full" value={editing.code || ''} onChange={(e) => setEditing((x: any) => ({ ...x, code: e.target.value }))} />
          <input className="input w-full" value={editing.address || ''} onChange={(e) => setEditing((x: any) => ({ ...x, address: e.target.value }))} />
          <input className="input w-full" value={editing.phone || ''} onChange={(e) => setEditing((x: any) => ({ ...x, phone: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={editing.isActive !== false} onChange={(e) => setEditing((x: any) => ({ ...x, isActive: e.target.checked }))} /> Active
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold bg-white">
              Cancel
            </button>
            <button type="submit" className="btn-primary px-5 py-2.5 font-black">
              Save
            </button>
          </div>
        </form>
      )}

      {msg && <p className="text-sm font-bold text-teal-700 mb-4">{msg}</p>}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 font-black text-slate-800">Branch offices</div>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No branches yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((b) => (
              <li key={b._id} className="px-6 py-4 flex justify-between gap-4 items-start">
                <div>
                  <p className="font-black text-slate-900">{b.name}</p>
                  <p className="text-sm text-slate-500">{b.code || '—'} · {b.address || '—'}</p>
                  {b.phone && <p className="text-xs text-slate-400 mt-1">{b.phone}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-bold uppercase ${b.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>{b.isActive ? 'Active' : 'Inactive'}</span>
                  {canManage && (
                    <button type="button" onClick={() => setEditing({ ...b })} className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
