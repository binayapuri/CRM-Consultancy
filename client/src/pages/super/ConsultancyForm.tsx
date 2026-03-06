import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { authFetch } from '../../store/auth';
import { ArrowLeft } from 'lucide-react';

const SPECIALIZATIONS = ['Student Visa', 'Graduate Visa (485)', 'Skilled Migration (189/190/491)', 'Partner Visa', 'AAT', 'Visitor Visa'];

export default function ConsultancyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    abn: '',
    address: { street: '', city: '', state: '', postcode: '', country: 'Australia' },
    phone: '',
    email: '',
    website: '',
    description: '',
    specializations: [] as string[],
    languages: [] as string[],
    verified: false,
    marnNumbers: [] as string[],
  });

  useEffect(() => {
    if (isEdit && id) {
      authFetch(`/api/consultancies/${id}`)
        .then(r => r.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setForm({
            name: data.name || '',
            abn: data.abn || '',
            address: data.address || { street: '', city: '', state: '', postcode: '', country: 'Australia' },
            phone: data.phone || '',
            email: data.email || '',
            website: data.website || '',
            description: data.description || '',
            specializations: data.specializations || [],
            languages: data.languages || [],
            verified: !!data.verified,
            marnNumbers: data.marnNumbers || [],
          });
        })
        .catch(() => navigate('/admin/consultancies'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = isEdit ? `/api/consultancies/${id}` : '/api/consultancies';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      navigate('/admin/consultancies');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleSpec = (s: string) => {
    setForm(f => ({
      ...f,
      specializations: f.specializations.includes(s) ? f.specializations.filter(x => x !== s) : [...f.specializations, s],
    }));
  };

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div>
      <Link to="/admin/consultancies" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"><ArrowLeft className="w-4 h-4" /> Back to Consultancies</Link>
      <h1 className="text-2xl font-display font-bold text-slate-900">{isEdit ? 'Edit Consultancy' : 'Add Consultancy'}</h1>
      <p className="text-slate-500 mt-1">{isEdit ? 'Update consultancy details' : 'Register a new migration consultancy'}</p>

      <form onSubmit={handleSubmit} className="card mt-6 max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="input" placeholder="Consultancy name" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ABN</label>
            <input value={form.abn} onChange={e => setForm(f => ({ ...f, abn: e.target.value }))} className="input" placeholder="ABN" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" placeholder="Phone" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" placeholder="Email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
            <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className="input" placeholder="https://..." />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
          <div className="grid md:grid-cols-2 gap-3">
            <input value={form.address.street} onChange={e => setForm(f => ({ ...f, address: { ...f.address, street: e.target.value } }))} className="input md:col-span-2" placeholder="Street" />
            <input value={form.address.city} onChange={e => setForm(f => ({ ...f, address: { ...f.address, city: e.target.value } }))} className="input" placeholder="City" />
            <input value={form.address.state} onChange={e => setForm(f => ({ ...f, address: { ...f.address, state: e.target.value } }))} className="input" placeholder="State" />
            <input value={form.address.postcode} onChange={e => setForm(f => ({ ...f, address: { ...f.address, postcode: e.target.value } }))} className="input" placeholder="Postcode" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Specializations</label>
          <div className="flex flex-wrap gap-2">
            {SPECIALIZATIONS.map(s => (
              <button key={s} type="button" onClick={() => toggleSpec(s)} className={`px-3 py-1.5 rounded-full text-sm ${form.specializations.includes(s) ? 'bg-ori-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{s}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="input" placeholder="Brief description" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="verified" checked={form.verified} onChange={e => setForm(f => ({ ...f, verified: e.target.checked }))} className="rounded" />
          <label htmlFor="verified" className="text-sm font-medium text-slate-700">Verified (appears in student search)</label>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Consultancy'}</button>
          <Link to="/admin/consultancies" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
