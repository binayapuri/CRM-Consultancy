import { useState, useEffect, useRef } from 'react';
import { authFetch } from '../../store/auth';
import { Building2, GraduationCap, Save, X, MapPin, Mail, Plus, DollarSign, Settings, Image } from 'lucide-react';

function AddCourseForm({ universityId, branches, onAdded }: { universityId?: string; branches: Branch[]; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [name, setName] = useState('');
  const [level, setLevel] = useState('BACHELORS');
  const [duration, setDuration] = useState('');
  const [tuitionFee, setTuitionFee] = useState<number | ''>('');
  const [cricosCode, setCricosCode] = useState('');
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [branchFees, setBranchFees] = useState<Record<string, number>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!universityId || !name) return;
    setSaving(true);
    setErr('');
    try {
      const fees = selectedBranchIds.map(bid => ({ branchId: bid, amount: branchFees[bid] ?? tuitionFee ?? 0 }));
      const res = await authFetch(`/api/universities/${universityId}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, level, duration, tuitionFee: tuitionFee || undefined, cricosCode, branchIds: selectedBranchIds, fees: fees.length ? fees : undefined }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || 'Failed to add course');
      }
      setName('');
      setLevel('BACHELORS');
      setDuration('');
      setTuitionFee('');
      setCricosCode('');
      setSelectedBranchIds([]);
      setBranchFees({});
      setOpen(false);
      onAdded();
    } catch (e: any) {
      setErr(e?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  if (!universityId) return null;
  return (
    <div className="mb-6">
      {!open ? (
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 text-sm">
          <Plus className="w-4 h-4" /> Add course
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-slate-600 mb-1">Course name</label><input value={name} onChange={e => setName(e.target.value)} className="input" required /></div>
            <div><label className="block text-xs font-bold text-slate-600 mb-1">Level</label>
              <select value={level} onChange={e => setLevel(e.target.value)} className="input">
                <option value="CERTIFICATE">Certificate</option><option value="DIPLOMA">Diploma</option><option value="BACHELORS">Bachelors</option><option value="MASTERS">Masters</option><option value="PHD">PhD</option><option value="OTHER">Other</option>
              </select>
            </div>
            <div><label className="block text-xs font-bold text-slate-600 mb-1">Duration</label><input value={duration} onChange={e => setDuration(e.target.value)} className="input" placeholder="e.g. 2 years" /></div>
            <div><label className="block text-xs font-bold text-slate-600 mb-1">Base tuition</label><input type="number" value={tuitionFee} onChange={e => setTuitionFee(e.target.value ? Number(e.target.value) : '')} className="input" placeholder="0" /></div>
            <div><label className="block text-xs font-bold text-slate-600 mb-1">CRICOS code</label><input value={cricosCode} onChange={e => setCricosCode(e.target.value)} className="input" /></div>
          </div>
          {branches.filter(b => b._id).length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Branches & fees (save profile first to add branches)</label>
              <div className="space-y-2">
                {branches.filter(b => b._id).map(b => (
                  <div key={b._id!} className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={selectedBranchIds.includes(b._id!)} onChange={e => setSelectedBranchIds(prev => e.target.checked ? [...prev, b._id!] : prev.filter(x => x !== b._id))} />
                      <span>{b.name}</span>
                    </label>
                    {selectedBranchIds.includes(b._id!) && (
                      <input type="number" value={branchFees[b._id!] ?? ''} onChange={e => setBranchFees(f => ({ ...f, [b._id!]: Number(e.target.value) }))} className="input w-28" placeholder="Fee" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Adding...' : 'Add course'}</button>
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

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
  facilities?: string[];
  isActive?: boolean;
}

interface EmailProfile {
  _id?: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass?: string;
  from?: string;
  isDefault: boolean;
  active: boolean;
}

interface Course {
  _id: string;
  name: string;
  faculty?: string;
  level: string;
  duration?: string;
  tuitionFee?: number;
  cricosCode?: string;
  branchIds?: string[];
  fees?: { branchId: string; amount: number }[];
  intakeDates?: string[];
  isActive?: boolean;
}

interface University {
  _id: string;
  name: string;
  location?: { city?: string; state?: string; country?: string };
  branches?: Branch[];
  description?: string;
  website?: string;
  logoUrl?: string;
  cricosProviderCode?: string;
  contactEmail?: string;
  contactPhone?: string;
  intakeMonths?: string[];
  tuitionRange?: string;
  facilities?: string[];
  emailProfiles?: EmailProfile[];
  settings?: { timezone?: string; currency?: string };
  discountRules?: any[];
}

type Tab = 'profile' | 'branches' | 'courses' | 'email' | 'settings';

export default function UniversityProfile() {
  const [university, setUniversity] = useState<University | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [form, setForm] = useState<Partial<University>>({});
  const [error, setError] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

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
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await authFetch('/api/universities/me/logo', { method: 'POST', body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || 'Upload failed');
      }
      const updated = await res.json();
      setUniversity(updated);
      setForm(f => ({ ...f, logoUrl: updated.logoUrl }));
    } catch (e: any) {
      setError(e?.message || 'Upload failed');
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const addBranch = () => {
    setForm(f => ({
      ...f,
      branches: [...(f.branches || []), { name: '', city: '', state: '', country: 'Australia', isActive: true }],
    }));
  };

  const updateBranch = (i: number, field: keyof Branch, val: any) => {
    setForm(f => {
      const branches = [...(f.branches || [])];
      branches[i] = { ...branches[i], [field]: val };
      return { ...f, branches };
    });
  };

  const removeBranch = (i: number) => {
    setForm(f => ({ ...f, branches: (f.branches || []).filter((_, j) => j !== i) }));
  };

  const addEmailProfile = () => {
    setForm(f => ({
      ...f,
      emailProfiles: [...(f.emailProfiles || []), { name: '', host: '', port: 587, secure: false, user: '', from: '', isDefault: false, active: true }],
    }));
  };

  const updateEmailProfile = (i: number, field: string, val: any) => {
    setForm(f => {
      const profiles = [...(f.emailProfiles || [])];
      profiles[i] = { ...profiles[i], [field]: val };
      return { ...f, emailProfiles: profiles };
    });
  };

  const removeEmailProfile = (i: number) => {
    setForm(f => ({ ...f, emailProfiles: (f.emailProfiles || []).filter((_, j) => j !== i) }));
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'profile', label: 'Profile & Logo', icon: Building2 },
    { id: 'branches', label: 'Branches', icon: MapPin },
    { id: 'courses', label: 'Courses & Fees', icon: GraduationCap },
    { id: 'email', label: 'Email / SMTP', icon: Mail },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

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
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">University Profile</h1>
          <p className="text-slate-500 mt-1">Manage institution details, branches, courses, fees, and email</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium">{error}</div>
      )}

      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-4">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition ${activeTab === id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Image className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <button type="button" onClick={() => logoInputRef.current?.click()} disabled={saving} className="text-sm font-bold text-emerald-600 hover:text-emerald-700">
                Upload logo
              </button>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Name</label>
                <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Website</label>
                <input value={form.website || ''} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className="input" placeholder="https://" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">CRICOS Provider Code</label>
                <input value={form.cricosProviderCode || ''} onChange={e => setForm(f => ({ ...f, cricosProviderCode: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Contact Email</label>
                <input type="email" value={form.contactEmail || ''} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Contact Phone</label>
                <input value={form.contactPhone || ''} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tuition Range</label>
                <input value={form.tuitionRange || ''} onChange={e => setForm(f => ({ ...f, tuitionRange: e.target.value }))} className="input" placeholder="e.g. $25,000 - $45,000" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
            <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input resize-none" rows={4} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Location (head office)</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input value={form.location?.city || ''} onChange={e => setForm(f => ({ ...f, location: { ...f.location, city: e.target.value } }))} className="input" placeholder="City" />
              <input value={form.location?.state || ''} onChange={e => setForm(f => ({ ...f, location: { ...f.location, state: e.target.value } }))} className="input" placeholder="State" />
              <input value={form.location?.country || ''} onChange={e => setForm(f => ({ ...f, location: { ...f.location, country: e.target.value } }))} className="input" placeholder="Country" />
            </div>
          </div>
        </section>
      )}

      {activeTab === 'branches' && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><MapPin className="w-5 h-5 text-emerald-600" /> Branches / Campuses</h2>
            <button onClick={addBranch} className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 text-sm">
              <Plus className="w-4 h-4" /> Add branch
            </button>
          </div>
          <p className="text-slate-500 text-sm mb-4">Add campus locations. Courses can be assigned to specific branches with per-branch fees.</p>
          <div className="space-y-4">
            {(form.branches || []).map((b, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Branch {i + 1}</span>
                  <button type="button" onClick={() => removeBranch(i)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">Name</label><input value={b.name || ''} onChange={e => updateBranch(i, 'name', e.target.value)} className="input" placeholder="e.g. Melbourne Campus" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">Address</label><input value={b.address || ''} onChange={e => updateBranch(i, 'address', e.target.value)} className="input" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">City</label><input value={b.city || ''} onChange={e => updateBranch(i, 'city', e.target.value)} className="input" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">State</label><input value={b.state || ''} onChange={e => updateBranch(i, 'state', e.target.value)} className="input" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">Country</label><input value={b.country || ''} onChange={e => updateBranch(i, 'country', e.target.value)} className="input" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">Postcode</label><input value={b.postcode || ''} onChange={e => updateBranch(i, 'postcode', e.target.value)} className="input" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">Phone</label><input value={b.phone || ''} onChange={e => updateBranch(i, 'phone', e.target.value)} className="input" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">Email</label><input type="email" value={b.email || ''} onChange={e => updateBranch(i, 'email', e.target.value)} className="input" /></div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={b.isActive !== false} onChange={e => updateBranch(i, 'isActive', e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-600">Active</span>
                </label>
              </div>
            ))}
            {(!form.branches || form.branches.length === 0) && (
              <p className="text-slate-500 text-sm py-4">No branches yet. Add branches to assign courses and set per-branch fees.</p>
            )}
          </div>
        </section>
      )}

      {activeTab === 'courses' && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-emerald-600" /> Courses ({courses.length})</h2>
          <p className="text-slate-500 text-sm mb-4">Courses with branch mapping and per-branch fees. Add courses below or edit via super admin.</p>
          <AddCourseForm universityId={university?._id} branches={form.branches || []} onAdded={fetchData} />
          {courses.length === 0 ? (
            <p className="text-slate-500 mt-4">No courses yet. Add a course above.</p>
          ) : (
            <div className="space-y-3">
              {courses.map(c => {
                const branchNames = (form.branches || []).filter(b => c.branchIds?.includes(b._id!)).map(b => b.name).join(', ') || 'All branches';
                const feeStr = c.fees?.length ? c.fees.map(f => {
                  const br = (form.branches || []).find(b => b._id === f.branchId);
                  return `${br?.name || 'Branch'}: $${f.amount}`;
                }).join(' | ') : (c.tuitionFee ? `$${c.tuitionFee}` : '-');
                return (
                  <div key={c._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-900">{c.name}</p>
                      <p className="text-sm text-slate-500">{c.level} • {c.duration || '-'} • {feeStr}</p>
                      {c.branchIds?.length ? <p className="text-xs text-slate-500 mt-1">Branches: {branchNames}</p> : null}
                    </div>
                    {c.cricosCode && <span className="text-xs font-medium text-slate-500">CRICOS: {c.cricosCode}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === 'email' && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Mail className="w-5 h-5 text-emerald-600" /> Email / SMTP Profiles</h2>
            <button onClick={addEmailProfile} className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 text-sm">
              <Plus className="w-4 h-4" /> Add profile
            </button>
          </div>
          <p className="text-slate-500 text-sm mb-4">Configure SMTP for sending offer letters and communications. Use app password for Gmail.</p>
          <div className="space-y-4">
            {(form.emailProfiles || []).map((ep, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">{ep.name || `Profile ${i + 1}`}</span>
                  <button type="button" onClick={() => removeEmailProfile(i)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">Profile name</label><input value={ep.name || ''} onChange={e => updateEmailProfile(i, 'name', e.target.value)} className="input" placeholder="e.g. Main" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">Host</label><input value={ep.host || ''} onChange={e => updateEmailProfile(i, 'host', e.target.value)} className="input" placeholder="smtp.gmail.com" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">Port</label><input type="number" value={ep.port || 587} onChange={e => updateEmailProfile(i, 'port', Number(e.target.value))} className="input" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">User</label><input value={ep.user || ''} onChange={e => updateEmailProfile(i, 'user', e.target.value)} className="input" placeholder="your@email.com" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">Password</label><input type="password" value={ep.pass === '••••••••' ? '' : (ep.pass || '')} onChange={e => updateEmailProfile(i, 'pass', e.target.value)} className="input" placeholder={ep.pass ? '•••••••• (leave to keep)' : 'App password'} /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">From (optional)</label><input value={ep.from || ''} onChange={e => updateEmailProfile(i, 'from', e.target.value)} className="input" placeholder="Name &lt;email@domain.com&gt;" /></div>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={ep.secure || false} onChange={e => updateEmailProfile(i, 'secure', e.target.checked)} className="rounded" /><span className="text-sm">Secure (SSL)</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={ep.isDefault || false} onChange={e => updateEmailProfile(i, 'isDefault', e.target.checked)} className="rounded" /><span className="text-sm">Default</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={ep.active !== false} onChange={e => updateEmailProfile(i, 'active', e.target.checked)} className="rounded" /><span className="text-sm">Active</span></label>
                </div>
              </div>
            ))}
            {(!form.emailProfiles || form.emailProfiles.length === 0) && (
              <p className="text-slate-500 text-sm py-4">No email profiles. Add one to send offer letters from your domain.</p>
            )}
          </div>
        </section>
      )}

      {activeTab === 'settings' && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-emerald-600" /> Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Timezone</label>
              <input value={form.settings?.timezone || 'Australia/Sydney'} onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, timezone: e.target.value } }))} className="input" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Currency</label>
              <input value={form.settings?.currency || 'AUD'} onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, currency: e.target.value } }))} className="input" />
            </div>
          </div>
          {university?.discountRules?.length ? (
            <div className="mt-6">
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Discounts (managed by Super Admin)</h3>
              <div className="space-y-2">
                {university.discountRules.filter((d: any) => d.isActive !== false).map((d: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-sm">
                    <span className="font-bold">{d.name}</span> — {d.type === 'PERCENTAGE' ? `${d.value}%` : `$${d.value}`} off
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
