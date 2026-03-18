import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authFetch } from '../../store/auth';
import { ArrowLeft, Building2, MapPin, Plus, X, Save } from 'lucide-react';

interface Branch {
  _id?: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export default function UniversityEdit() {
  const { id } = useParams();
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    authFetch(`/api/universities/${id}`)
      .then(r => r.json())
      .then(setForm)
      .catch(() => setForm({}))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await authFetch(`/api/universities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || 'Save failed');
      }
      setForm(await res.json());
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const addBranch = () => setForm((f: any) => ({ ...f, branches: [...(f.branches || []), { name: '', city: '', state: '', country: 'Australia', isActive: true }] }));
  const updateBranch = (i: number, field: string, val: any) => setForm((f: any) => {
    const branches = [...(f.branches || [])];
    branches[i] = { ...branches[i], [field]: val };
    return { ...f, branches };
  });
  const removeBranch = (i: number) => setForm((f: any) => ({ ...f, branches: (f.branches || []).filter((_: any, j: number) => j !== i) }));

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" /></div>;
  if (!form._id) return <div className="text-red-600">University not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to={`/admin/universities/${id}`} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to detail
      </Link>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-display font-black text-slate-900">Edit {form.name}</h1>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">{error}</div>}

      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Building2 className="w-5 h-5" /> Basic info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-xs font-bold text-slate-500 mb-1">Name</label><input value={form.name || ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} className="input" /></div>
          <div><label className="block text-xs font-bold text-slate-500 mb-1">Website</label><input value={form.website || ''} onChange={e => setForm((f: any) => ({ ...f, website: e.target.value }))} className="input" /></div>
          <div><label className="block text-xs font-bold text-slate-500 mb-1">CRICOS</label><input value={form.cricosProviderCode || ''} onChange={e => setForm((f: any) => ({ ...f, cricosProviderCode: e.target.value }))} className="input" /></div>
          <div><label className="block text-xs font-bold text-slate-500 mb-1">Contact email</label><input type="email" value={form.contactEmail || ''} onChange={e => setForm((f: any) => ({ ...f, contactEmail: e.target.value }))} className="input" /></div>
          <div><label className="block text-xs font-bold text-slate-500 mb-1">Contact phone</label><input value={form.contactPhone || ''} onChange={e => setForm((f: any) => ({ ...f, contactPhone: e.target.value }))} className="input" /></div>
          <div><label className="block text-xs font-bold text-slate-500 mb-1">Tuition range</label><input value={form.tuitionRange || ''} onChange={e => setForm((f: any) => ({ ...f, tuitionRange: e.target.value }))} className="input" /></div>
          <div><label className="block text-xs font-bold text-slate-500 mb-1">Partner status</label>
            <select value={form.partnerStatus || 'UNVERIFIED'} onChange={e => setForm((f: any) => ({ ...f, partnerStatus: e.target.value }))} className="input">
              <option value="UNVERIFIED">Unverified</option>
              <option value="STANDARD">Standard</option>
              <option value="PREMIUM">Premium</option>
              <option value="VERIFIED">Verified</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer pt-6">
            <input type="checkbox" checked={form.isActive !== false} onChange={e => setForm((f: any) => ({ ...f, isActive: e.target.checked }))} className="rounded" />
            <span className="text-sm font-medium">Active</span>
          </label>
        </div>
        <div className="mt-4"><label className="block text-xs font-bold text-slate-500 mb-1">Description</label><textarea value={form.description || ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} className="input resize-none" rows={3} /></div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><MapPin className="w-5 h-5" /> Branches</h2>
          <button onClick={addBranch} className="flex items-center gap-2 px-3 py-2 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 text-sm"><Plus className="w-4 h-4" /> Add</button>
        </div>
        <div className="space-y-4">
          {(form.branches || []).map((b: Branch, i: number) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex justify-between"><span className="font-bold">Branch {i + 1}</span><button type="button" onClick={() => removeBranch(i)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X className="w-4 h-4" /></button></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-slate-500 mb-1">Name</label><input value={b.name || ''} onChange={e => updateBranch(i, 'name', e.target.value)} className="input" /></div>
                <div><label className="block text-xs font-bold text-slate-500 mb-1">City</label><input value={b.city || ''} onChange={e => updateBranch(i, 'city', e.target.value)} className="input" /></div>
                <div><label className="block text-xs font-bold text-slate-500 mb-1">State</label><input value={b.state || ''} onChange={e => updateBranch(i, 'state', e.target.value)} className="input" /></div>
                <div><label className="block text-xs font-bold text-slate-500 mb-1">Country</label><input value={b.country || ''} onChange={e => updateBranch(i, 'country', e.target.value)} className="input" /></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
