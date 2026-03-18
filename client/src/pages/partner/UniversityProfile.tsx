import { useState, useEffect } from 'react';
import { authFetch } from '../../store/auth';
import { Building2, GraduationCap, Pencil, Save, X } from 'lucide-react';

interface Campus {
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  facilities?: string[];
}

interface University {
  _id: string;
  name: string;
  location?: { city?: string; state?: string; country?: string };
  campuses?: Campus[];
  description?: string;
  website?: string;
  cricosProviderCode?: string;
  contactEmail?: string;
  contactPhone?: string;
  intakeMonths?: string[];
  tuitionRange?: string;
  facilities?: string[];
}

interface Course {
  _id: string;
  name: string;
  faculty?: string;
  level: string;
  duration?: string;
  tuitionFee?: number;
  cricosCode?: string;
  intakeDates?: string[];
  isActive?: boolean;
}

export default function UniversityProfile() {
  const [university, setUniversity] = useState<University | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<University>>({});
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const res = await authFetch('/api/universities/me');
      if (!res.ok) {
        if (res.status === 404) setError('No university assigned to your account.');
        return;
      }
      const data = await res.json();
      setUniversity(data.university);
      setCourses(data.courses || []);
      setForm(data.university || {});
    } catch (e) {
      console.error(e);
      setError('Failed to load university data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await authFetch('/api/universities/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || 'Failed to save');
      }
      const updated = await res.json();
      setUniversity(updated);
      setForm(updated);
      setEditMode(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error && !university) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-amber-800 font-medium">{error}</p>
        <p className="text-sm text-amber-700 mt-2">Contact the platform administrator to get your university verified and assigned.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">University Profile</h1>
          <p className="text-slate-500 mt-1">Manage your institution details and courses</p>
        </div>
        {!editMode ? (
          <button onClick={() => setEditMode(true)} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition">
            <Pencil className="w-4 h-4" /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => { setEditMode(false); setForm(university || {}); }} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium">{error}</div>
      )}

      <div className="space-y-6">
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" /> Institution Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Name</label>
              {editMode ? (
                <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" />
              ) : (
                <p className="font-medium text-slate-900">{university?.name}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Website</label>
              {editMode ? (
                <input value={form.website || ''} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className="input" placeholder="https://" />
              ) : (
                <p className="font-medium text-slate-900">{university?.website || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">CRICOS Provider Code</label>
              {editMode ? (
                <input value={form.cricosProviderCode || ''} onChange={e => setForm(f => ({ ...f, cricosProviderCode: e.target.value }))} className="input" />
              ) : (
                <p className="font-medium text-slate-900">{university?.cricosProviderCode || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Contact Email</label>
              {editMode ? (
                <input type="email" value={form.contactEmail || ''} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} className="input" />
              ) : (
                <p className="font-medium text-slate-900">{university?.contactEmail || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Contact Phone</label>
              {editMode ? (
                <input value={form.contactPhone || ''} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} className="input" />
              ) : (
                <p className="font-medium text-slate-900">{university?.contactPhone || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tuition Range</label>
              {editMode ? (
                <input value={form.tuitionRange || ''} onChange={e => setForm(f => ({ ...f, tuitionRange: e.target.value }))} className="input" placeholder="e.g. $25,000 - $45,000" />
              ) : (
                <p className="font-medium text-slate-900">{university?.tuitionRange || '-'}</p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
            {editMode ? (
              <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input resize-none" rows={4} />
            ) : (
              <p className="font-medium text-slate-700 whitespace-pre-wrap">{university?.description || '-'}</p>
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-600" /> Courses ({courses.length})
          </h2>
          {courses.length === 0 ? (
            <p className="text-slate-500">No courses yet. Contact super admin to add courses.</p>
          ) : (
            <div className="space-y-3">
              {courses.map(c => (
                <div key={c._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-900">{c.name}</p>
                    <p className="text-sm text-slate-500">{c.level} • {c.duration || '-'} • {c.tuitionFee ? `$${c.tuitionFee}` : '-'}</p>
                  </div>
                  {c.cricosCode && <span className="text-xs font-medium text-slate-500">CRICOS: {c.cricosCode}</span>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
