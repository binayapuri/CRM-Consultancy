import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authFetch } from '../../store/auth';
import { useUiStore } from '../../store/ui';
import { Plus, Pencil, Trash2, Eye, Check } from 'lucide-react';

const SPECIALIZATIONS = ['Student Visa', 'Graduate Visa (485)', 'Skilled Migration (189/190/491)', 'Partner Visa', 'AAT', 'Visitor Visa'];

const emptyForm = () => ({
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

export default function SuperConsultancies() {
  const [consultancies, setConsultancies] = useState<any[]>([]);
  const [editingConsultancy, setEditingConsultancy] = useState<{ _id: string } | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const { openModal, closeModal, showToast, openConfirm, modal, setModalContentGetter, bumpModalContentKey } = useUiStore();

  const fetchConsultancies = () => authFetch('/api/consultancies').then(r => r.json()).then(setConsultancies);

  useEffect(() => {
    fetchConsultancies();
  }, []);

  const toggleSpec = (s: string) => {
    setForm(f => ({
      ...f,
      specializations: f.specializations.includes(s) ? f.specializations.filter(x => x !== s) : [...f.specializations, s],
    }));
  };

  const getFormContent = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="input w-full" placeholder="Consultancy name" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ABN</label>
          <input value={form.abn} onChange={e => setForm(f => ({ ...f, abn: e.target.value }))} className="input w-full" placeholder="ABN" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
          <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input w-full" placeholder="Phone" />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input w-full" placeholder="Email" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
          <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className="input w-full" placeholder="https://..." />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
        <div className="grid md:grid-cols-2 gap-3">
          <input value={form.address.street} onChange={e => setForm(f => ({ ...f, address: { ...f.address, street: e.target.value } }))} className="input w-full md:col-span-2" placeholder="Street" />
          <input value={form.address.city} onChange={e => setForm(f => ({ ...f, address: { ...f.address, city: e.target.value } }))} className="input w-full" placeholder="City" />
          <input value={form.address.state} onChange={e => setForm(f => ({ ...f, address: { ...f.address, state: e.target.value } }))} className="input w-full" placeholder="State" />
          <input value={form.address.postcode} onChange={e => setForm(f => ({ ...f, address: { ...f.address, postcode: e.target.value } }))} className="input w-full" placeholder="Postcode" />
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
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="input w-full" placeholder="Brief description" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="consultancy-verified" checked={form.verified} onChange={e => setForm(f => ({ ...f, verified: e.target.checked }))} className="rounded" />
        <label htmlFor="consultancy-verified" className="text-sm font-medium text-slate-700">Verified (appears in student search)</label>
      </div>
      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => {
            closeModal();
            setEditingConsultancy(null);
            setForm(emptyForm());
          }}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              if (editingConsultancy) {
                const res = await authFetch(`/api/consultancies/${editingConsultancy._id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(form),
                });
                const data = res.ok ? null : await res.json().catch(() => ({}));
                if (res.ok) {
                  closeModal();
                  setEditingConsultancy(null);
                  setForm(emptyForm());
                  showToast('Consultancy updated', 'success');
                  fetchConsultancies();
                } else {
                  showToast(data?.error || 'Update failed', 'error');
                }
              } else {
                const res = await authFetch('/api/consultancies', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(form),
                });
                const data = res.ok ? null : await res.json().catch(() => ({}));
                if (res.ok) {
                  closeModal();
                  setForm(emptyForm());
                  showToast('Consultancy created', 'success');
                  fetchConsultancies();
                } else {
                  showToast(data?.error || 'Create failed', 'error');
                }
              }
            } catch (err: any) {
              showToast(err?.message || 'Request failed', 'error');
            } finally {
              setSaving(false);
            }
          }}
          className="btn-primary disabled:opacity-50"
        >
          {editingConsultancy ? (saving ? 'Saving...' : 'Save Changes') : saving ? 'Creating...' : 'Create Consultancy'}
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    if (modal.open) {
      setModalContentGetter(getFormContent);
      bumpModalContentKey();
    }
  }, [modal.open, form, saving, editingConsultancy, setModalContentGetter, bumpModalContentKey]);

  const openAddModal = () => {
    setEditingConsultancy(null);
    setForm(emptyForm());
    openModal('Add Consultancy', null, { size: 'large' });
  };

  const openEditModal = async (c: any) => {
    try {
      const res = await authFetch(`/api/consultancies/${c._id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data?.error || 'Failed to load consultancy', 'error');
        return;
      }
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
      setEditingConsultancy({ _id: c._id });
      openModal('Edit Consultancy', null, { size: 'large' });
    } catch (err: any) {
      showToast(err?.message || 'Request failed', 'error');
    }
  };

  const handleDelete = (id: string, name: string) => {
    openConfirm({
      title: 'Delete Consultancy',
      message: `Delete consultancy "${name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/consultancies/${id}`, { method: 'DELETE' });
          const data = res.ok ? null : await res.json().catch(() => ({}));
          if (res.ok) {
            showToast('Consultancy deleted', 'success');
            fetchConsultancies();
          } else {
            showToast(data?.error || 'Delete failed', 'error');
          }
        } catch (err: any) {
          showToast(err?.message || 'Request failed', 'error');
        }
      },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Consultancies</h1>
          <p className="text-slate-500 mt-1">All registered consultancies</p>
        </div>
        <button type="button" onClick={openAddModal} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Consultancy</button>
      </div>
      <div className="card mt-6 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">ABN</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Specializations</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Verified</th>
              <th className="text-right px-4 py-3 font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {consultancies.map((c: any) => (
              <tr key={c._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium">{c.displayName || c.name}</td>
                <td className="px-4 py-3 text-slate-600">{c.abn || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{c.specializations?.join(', ') || '-'}</td>
                <td className="px-4 py-3">{c.verified ? <Check className="w-5 h-5 text-green-600 inline-block" aria-hidden /> : '-'}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/admin/consultancies/${c._id}`} className="p-2 text-ori-600 hover:bg-ori-50 rounded inline-block" title="View details"><Eye className="w-4 h-4" /></Link>
                  <button type="button" onClick={() => openEditModal(c)} className="p-2 text-slate-600 hover:bg-slate-100 rounded inline-block" title="Edit"><Pencil className="w-4 h-4" /></button>
                  <button type="button" onClick={() => handleDelete(c._id, c.displayName || c.name)} className="p-2 text-red-500 hover:bg-red-50 rounded inline-block" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
