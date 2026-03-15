import { useState, useEffect } from 'react';
import { authFetch } from '../../store/auth';
import { useUiStore } from '../../store/ui';
import { Building2, Plus, Edit2, ShieldCheck, MapPin, Trash2 } from 'lucide-react';

type PartnerStatus = 'UNVERIFIED' | 'STANDARD' | 'PREMIUM' | 'VERIFIED';
type FormData = { name: string; city: string; state: string; partnerStatus: PartnerStatus; isActive: boolean };
const emptyForm = (): FormData => ({ name: '', city: '', state: '', partnerStatus: 'UNVERIFIED', isActive: true });

export default function Universities() {
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(emptyForm());
  const [editingUniversity, setEditingUniversity] = useState<{ _id: string; name: string; city: string; state: string; partnerStatus: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const { openModal, closeModal, showToast, openConfirm, modal, setModalContentGetter, bumpModalContentKey } = useUiStore();

  const fetchUnis = async () => {
    try {
      const res = await authFetch('/api/universities/admin');
      if (res.ok) setUniversities(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnis();
  }, []);

  const getFormContent = () => (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">University Name</label>
          <input
            required
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Partner Status</label>
          <select
            value={formData.partnerStatus}
            onChange={e => setFormData({ ...formData, partnerStatus: e.target.value as PartnerStatus })}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/50"
          >
            <option value="UNVERIFIED">Unverified</option>
            <option value="STANDARD">Standard Partner</option>
            <option value="PREMIUM">Premium Partner</option>
            <option value="VERIFIED">Verified Institution</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">City</label>
          <input
            required
            type="text"
            value={formData.city}
            onChange={e => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">State/Region</label>
          <input
            required
            type="text"
            value={formData.state}
            onChange={e => setFormData({ ...formData, state: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/50"
          />
        </div>
      </div>
      <label className="flex items-center gap-3 cursor-pointer pt-2">
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
          className="w-5 h-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500/50"
        />
        <span className="text-sm font-bold text-slate-700">Active (show on public lists)</span>
      </label>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => {
            closeModal();
            setEditingUniversity(null);
            setFormData(emptyForm());
          }}
          className="px-6 py-2 border border-slate-200 font-bold rounded-xl text-slate-600 hover:bg-slate-50 transition"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              const body = {
                name: formData.name,
                location: { city: formData.city, state: formData.state },
                partnerStatus: formData.partnerStatus,
                isActive: formData.isActive,
              };
              if (editingUniversity) {
                const res = await authFetch(`/api/universities/${editingUniversity._id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                });
                const data = res.ok ? null : await res.json().catch(() => ({}));
                if (res.ok) {
                  closeModal();
                  setEditingUniversity(null);
                  setFormData(emptyForm());
                  showToast('University updated', 'success');
                  fetchUnis();
                } else {
                  showToast(data?.error || 'Update failed', 'error');
                }
              } else {
                const res = await authFetch('/api/universities', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                });
                const data = res.ok ? null : await res.json().catch(() => ({}));
                if (res.ok) {
                  closeModal();
                  setFormData(emptyForm());
                  showToast('University added', 'success');
                  fetchUnis();
                } else {
                  showToast(data?.error || 'Add failed', 'error');
                }
              }
            } catch (err: any) {
              showToast(err?.message || 'Request failed', 'error');
            } finally {
              setSaving(false);
            }
          }}
          className="px-6 py-2 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition shadow-md shadow-sky-600/20 disabled:opacity-50"
        >
          {editingUniversity ? (saving ? 'Saving...' : 'Save changes') : saving ? 'Adding...' : 'Save Institution'}
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    if (modal.open) {
      setModalContentGetter(getFormContent);
      bumpModalContentKey();
    }
  }, [modal.open, formData, saving, editingUniversity, setModalContentGetter, bumpModalContentKey]);

  const openAddModal = () => {
    setEditingUniversity(null);
    setFormData(emptyForm());
    openModal('Add University', null);
  };

  const openEditModal = (uni: any) => {
    setEditingUniversity({
      _id: uni._id,
      name: uni.name || '',
      city: uni.location?.city || '',
      state: uni.location?.state || '',
      partnerStatus: uni.partnerStatus || 'UNVERIFIED',
    });
    setFormData({
      name: uni.name || '',
      city: uni.location?.city || '',
      state: uni.location?.state || '',
      partnerStatus: (uni.partnerStatus as PartnerStatus) || 'UNVERIFIED',
      isActive: uni.isActive !== false,
    });
    openModal('Edit University', null);
  };

  const handleDelete = (uni: any) => {
    openConfirm({
      title: 'Deactivate University',
      message: `Deactivate "${uni.name}"? It will be marked inactive and hidden from public lists.`,
      confirmLabel: 'Deactivate',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/universities/${uni._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: false }),
          });
          const data = res.ok ? null : await res.json().catch(() => ({}));
          if (res.ok) {
            showToast('University removed', 'success');
            fetchUnis();
          } else {
            showToast(data?.error || 'Delete failed', 'error');
          }
        } catch (err: any) {
          showToast(err?.message || 'Request failed', 'error');
        }
      },
    });
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" /></div>;

  return (
    <div className="w-full animate-fade-in-up">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Universities Master DB</h1>
          <p className="text-slate-500 mt-1">Manage partner universities and institutions globally.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-sm border border-indigo-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> root access
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition-colors shadow-sm shadow-sky-600/20"
          >
            <Plus className="w-5 h-5" /> Add University
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {universities.map((uni: any) => (
          <div
            key={uni._id}
            className={`bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden ${uni.isActive === false ? 'border-slate-200 opacity-75' : 'border-slate-200'}`}
          >
            {uni.isActive === false && (
              <span className="absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded bg-slate-200 text-slate-600 z-10">Inactive</span>
            )}
            <div className={`absolute top-0 right-0 w-2 h-full ${uni.partnerStatus === 'PREMIUM' ? 'bg-amber-500' : uni.partnerStatus === 'STANDARD' ? 'bg-sky-500' : 'bg-slate-300'}`} />
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-sky-600 mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1 leading-tight">{uni.name}</h3>
            <div className="flex flex-col gap-2 mt-3">
              <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {uni.location?.city}, {uni.location?.state}</p>
              <p className="text-xs font-bold px-2 py-1 rounded w-max bg-slate-100 text-slate-600">{uni.partnerStatus?.replace('_', ' ') || '—'}</p>
            </div>
            <div className="hidden group-hover:flex absolute bottom-4 right-4 gap-2">
              <button
                type="button"
                onClick={() => openEditModal(uni)}
                className="w-10 h-10 border border-slate-200 bg-white rounded-full items-center justify-center text-sky-600 hover:bg-sky-50 shadow-sm transition flex"
                aria-label="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              {uni.isActive !== false && (
                <button
                  type="button"
                  onClick={() => handleDelete(uni)}
                  className="w-10 h-10 border border-slate-200 bg-white rounded-full items-center justify-center text-red-600 hover:bg-red-50 shadow-sm transition flex"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
