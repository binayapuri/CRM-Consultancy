import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { resolveFileUrl } from '../../lib/imageUrl';
import { authFetch } from '../../store/auth';
import { useUiStore } from '../../store/ui';
import {
  ArrowLeft,
  Building2,
  MapPin,
  GraduationCap,
  DollarSign,
  Plus,
  Edit2,
  FileText,
  UserCheck,
  Trash2,
} from 'lucide-react';

interface Branch {
  _id?: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  isActive?: boolean;
}

interface DiscountRule {
  _id?: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  maxAmount?: number;
  applicableTo: string;
  isActive?: boolean;
}

export default function UniversityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openConfirm, showToast } = useUiStore();
  const [university, setUniversity] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [offerApps, setOfferApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discountForm, setDiscountForm] = useState<Partial<DiscountRule>>({ name: '', type: 'PERCENTAGE', value: 0, applicableTo: 'ALL', isActive: true });
  const [showDiscountForm, setShowDiscountForm] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      const [uniRes, coursesRes, appsRes] = await Promise.all([
        authFetch(`/api/universities/${id}`),
        authFetch(`/api/universities/${id}/courses/admin`),
        authFetch(`/api/universities/${id}/offer-applications`),
      ]);
      if (uniRes.ok) setUniversity(await uniRes.json());
      if (coursesRes.ok) setCourses(await coursesRes.json());
      if (appsRes.ok) setOfferApps(await appsRes.json());
    } catch {
      setUniversity(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSaveDiscount = async () => {
    if (!university || !discountForm.name || discountForm.value == null) return;
    setSaving(true);
    try {
      const rules = [...(university.discountRules || []), { ...discountForm, _id: undefined }];
      const res = await authFetch(`/api/universities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountRules: rules }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUniversity(updated);
        setDiscountForm({ name: '', type: 'PERCENTAGE', value: 0, applicableTo: 'ALL', isActive: true });
        setShowDiscountForm(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDiscount = async (index: number) => {
    if (!university) return;
    const rules = (university.discountRules || []).filter((_: any, i: number) => i !== index);
    setSaving(true);
    try {
      const res = await authFetch(`/api/universities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountRules: rules }),
      });
      if (res.ok) setUniversity(await res.json());
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUniversity = () => {
    if (!id) return;
    openConfirm({
      title: 'Permanently delete university?',
      message:
        'This removes the institution, all linked courses, and offer-letter application links. Partner users are unlinked. This cannot be undone.',
      confirmLabel: 'Delete permanently',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/universities/${id}`, { method: 'DELETE' });
          const data = res.ok ? null : await res.json().catch(() => ({}));
          if (res.ok) {
            showToast('University deleted', 'success');
            navigate('/admin/universities');
          } else {
            showToast((data as any)?.error || 'Delete failed', 'error');
          }
        } catch {
          showToast('Delete failed', 'error');
        }
      },
    });
  };

  const handleToggleDiscount = async (index: number) => {
    if (!university) return;
    const rules = [...(university.discountRules || [])];
    rules[index] = { ...rules[index], isActive: !rules[index].isActive };
    setSaving(true);
    try {
      const res = await authFetch(`/api/universities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountRules: rules }),
      });
      if (res.ok) setUniversity(await res.json());
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" /></div>;
  if (!university) return <div className="text-red-600">University not found</div>;

  const branches = university.branches || [];
  const discountRules = university.discountRules || [];

  return (
    <div className="w-full animate-fade-in-up space-y-6">
      <Link to="/admin/universities" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Universities
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl border-2 border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50">
            {university.logoUrl ? (
              <img src={resolveFileUrl(university.logoUrl)} alt="" className="w-full h-full object-contain" />
            ) : (
              <Building2 className="w-10 h-10 text-slate-400" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-display font-black text-slate-900">{university.name}</h1>
            <p className="text-slate-500 mt-1">{university.website || '—'}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{university.partnerStatus || 'UNVERIFIED'}</span>
              {university.cricosProviderCode && <span className="text-sm text-slate-600">CRICOS {university.cricosProviderCode}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDeleteUniversity}
            className="flex items-center gap-2 px-4 py-2 border border-rose-200 text-rose-700 font-bold rounded-xl hover:bg-rose-50"
          >
            <Trash2 className="w-4 h-4" /> Delete permanently
          </button>
          <Link to={`/admin/universities/${id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700">
            <Edit2 className="w-4 h-4" /> Edit University
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase">Contact</p>
          <p className="font-medium text-slate-900 mt-1">{university.contactEmail || '—'}</p>
          <p className="text-sm text-slate-600">{university.contactPhone || '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase">Location</p>
          <p className="font-medium text-slate-900 mt-1">
            {[university.location?.city, university.location?.state, university.location?.country].filter(Boolean).join(', ') || '—'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase">Tuition Range</p>
          <p className="font-medium text-slate-900 mt-1">{university.tuitionRange || '—'}</p>
        </div>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-emerald-600" /> Branches ({branches.length})</h2>
        {branches.length === 0 ? (
          <p className="text-slate-500 text-sm">No branches. University partner can add branches in their profile.</p>
        ) : (
          <div className="space-y-3">
            {branches.map((b: Branch, i: number) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900">{b.name}</p>
                  <p className="text-sm text-slate-500">{[b.city, b.state, b.country].filter(Boolean).join(', ') || b.address || '—'}</p>
                </div>
                {b.isActive === false && <span className="text-xs font-bold text-slate-500">Inactive</span>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-emerald-600" /> Courses ({courses.length})</h2>
        {courses.length === 0 ? (
          <p className="text-slate-500 text-sm">No courses. Add via API or university partner.</p>
        ) : (
          <div className="space-y-2">
            {courses.map((c: any) => (
              <div key={c._id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900">{c.name}</p>
                  <p className="text-sm text-slate-500">{c.level} • {c.tuitionFee ? `$${c.tuitionFee}` : '-'} {c.fees?.length ? `(${c.fees.length} branch fees)` : ''}</p>
                </div>
                {c.cricosCode && <span className="text-xs text-slate-500">CRICOS {c.cricosCode}</span>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-600" /> Offer Letters & Enrolled ({offerApps.length})</h2>
        <p className="text-slate-500 text-sm mb-4">Students who applied for offer letters at this university. ACCEPTED = enrolled.</p>
        {offerApps.length === 0 ? (
          <p className="text-slate-500 text-sm">No offer letter applications yet.</p>
        ) : (
          <div className="space-y-2 mb-6">
            {offerApps.map((app: any) => (
              <div key={app._id} className={`p-4 rounded-xl border flex justify-between items-center ${app.status === 'ACCEPTED' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                <div>
                  <p className="font-bold text-slate-900">
                    {app.studentId?.profile?.firstName} {app.studentId?.profile?.lastName}
                    {app.status === 'ACCEPTED' && <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-200 text-emerald-800"><UserCheck className="w-3 h-3 inline mr-0.5" /> Enrolled</span>}
                  </p>
                  <p className="text-sm text-slate-500">{app.studentId?.email}</p>
                  <p className="text-xs text-slate-600 mt-1">{app.courseId?.name} ({app.courseId?.level})</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${app.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' : app.status === 'OFFERED' ? 'bg-amber-100 text-amber-700' : app.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><DollarSign className="w-5 h-5 text-amber-600" /> Discount Rules (Super Admin)</h2>
          <button onClick={() => setShowDiscountForm(!showDiscountForm)} className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 text-sm">
            <Plus className="w-4 h-4" /> Add discount
          </button>
        </div>
        <p className="text-slate-500 text-sm mb-4">Manage discounts for this university. Applied to fees when applicable.</p>

        {showDiscountForm && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 mb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Name</label>
                <input value={discountForm.name || ''} onChange={e => setDiscountForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="e.g. Early Bird 10%" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Type</label>
                <select value={discountForm.type || 'PERCENTAGE'} onChange={e => setDiscountForm(f => ({ ...f, type: e.target.value as 'PERCENTAGE' | 'FIXED' }))} className="input">
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED">Fixed amount</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Value</label>
                <input type="number" value={discountForm.value ?? 0} onChange={e => setDiscountForm(f => ({ ...f, value: Number(e.target.value) }))} className="input" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Applicable to</label>
                <select value={discountForm.applicableTo || 'ALL'} onChange={e => setDiscountForm(f => ({ ...f, applicableTo: e.target.value }))} className="input">
                  <option value="ALL">All courses</option>
                  <option value="BRANCH">Specific branches</option>
                  <option value="COURSE">Specific courses</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveDiscount} disabled={saving || !discountForm.name} className="px-4 py-2 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save discount'}
              </button>
              <button onClick={() => setShowDiscountForm(false)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        )}

        {discountRules.length === 0 ? (
          <p className="text-slate-500 text-sm">No discount rules. Add one above.</p>
        ) : (
          <div className="space-y-2">
            {discountRules.map((d: any, i: number) => (
              <div key={i} className={`p-4 rounded-xl border flex justify-between items-center ${d.isActive !== false ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-75'}`}>
                <div>
                  <p className="font-bold text-slate-900">{d.name}</p>
                  <p className="text-sm text-slate-500">{d.type === 'PERCENTAGE' ? `${d.value}% off` : `$${d.value} off`} • {d.applicableTo}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleToggleDiscount(i)} disabled={saving} className="text-sm font-bold text-sky-600 hover:text-sky-700">
                    {d.isActive !== false ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleRemoveDiscount(i)} disabled={saving} className="text-sm font-bold text-red-600 hover:text-red-700">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
