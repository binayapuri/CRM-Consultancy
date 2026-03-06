import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authFetch, safeJson } from '../../store/auth';
import { GraduationCap, Search, Plus, Pencil, Trash2, X, Filter, GitCompare } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';
import FilterBar from '../../components/FilterBar';

const COLLEGE_TYPES = [
  { value: 'UNIVERSITY', label: 'University' },
  { value: 'TAFE', label: 'TAFE' },
  { value: 'VET', label: 'VET' },
  { value: 'ELICOS', label: 'ELICOS' },
  { value: 'OTHER', label: 'Other' },
];

const AU_STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

const COURSE_LEVELS = ['CERTIFICATE', 'DIPLOMA', 'BACHELOR', 'MASTER', 'PHD', 'ELICOS', 'OTHER'];

export default function Colleges() {
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const [colleges, setColleges] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({ type: '', state: '', city: '', feeMin: '', feeMax: '' });
  const [form, setForm] = useState({
    name: '',
    cricosCode: '',
    type: 'VET',
    website: '',
    phone: '',
    email: '',
    location: { city: '', state: '', address: '', postcode: '', campus: '' },
    contactPerson: { name: '', role: '', email: '', phone: '' },
    courses: [] as { name: string; code: string; duration: string; feePerYear: number; fieldOfStudy: string; level: string }[],
  });

  const buildUrl = () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (filterValues.type) params.set('type', filterValues.type);
    if (filterValues.state) params.set('state', filterValues.state);
    if (filterValues.city) params.set('city', filterValues.city);
    if (filterValues.feeMin) params.set('feeMin', filterValues.feeMin);
    if (filterValues.feeMax) params.set('feeMax', filterValues.feeMax);
    if (consultancyId) params.set('consultancyId', consultancyId);
    return `/api/colleges${params.toString() ? '?' + params.toString() : ''}`;
  };

  const fetchColleges = () => {
    setLoading(true);
    authFetch(buildUrl()).then(r => safeJson(r)).then((d: any) => setColleges(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchColleges(); }, [q, filterValues, consultancyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        cricosCode: form.cricosCode || undefined,
        type: form.type,
        website: form.website || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        location: form.location,
        contactPerson: form.contactPerson,
        courses: form.courses.filter(c => c.name.trim()),
      };
      if (editing) {
        const res = await authFetch(`/api/colleges/${editing._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error((await safeJson(res) as any).error);
      } else {
        const res = await authFetch('/api/colleges', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error((await safeJson(res) as any).error);
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      fetchColleges();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const resetForm = () => setForm({
    name: '', cricosCode: '', type: 'VET', website: '', phone: '', email: '',
    location: { city: '', state: '', address: '', postcode: '', campus: '' },
    contactPerson: { name: '', role: '', email: '', phone: '' },
    courses: [],
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this college?')) return;
    try {
      const res = await authFetch(`/api/colleges/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await safeJson(res) as any).error);
      setCompareIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      fetchColleges();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const startEdit = (c: any) => {
    setEditing(c);
    setForm({
      name: c.name || '',
      cricosCode: c.cricosCode || '',
      type: c.type || 'VET',
      website: c.website || '',
      phone: c.phone || '',
      email: c.email || '',
      location: { city: '', state: '', address: '', postcode: '', campus: '', ...c.location },
      contactPerson: { name: '', role: '', email: '', phone: '', ...c.contactPerson },
      courses: (c.courses || []).length ? c.courses.map((co: any) => ({ name: co.name || '', code: co.code || '', duration: co.duration || '', feePerYear: co.feePerYear || 0, fieldOfStudy: co.fieldOfStudy || '', level: co.level || 'OTHER' })) : [],
    });
    setShowForm(true);
  };

  const addCourse = () => setForm(f => ({ ...f, courses: [...f.courses, { name: '', code: '', duration: '', feePerYear: 0, fieldOfStudy: '', level: 'OTHER' }] }));
  const removeCourse = (i: number) => setForm(f => ({ ...f, courses: f.courses.filter((_, j) => j !== i) }));
  const updateCourse = (i: number, field: string, val: string | number) => setForm(f => {
    const c = [...f.courses];
    c[i] = { ...c[i], [field]: val };
    return { ...f, courses: c };
  });

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else if (s.size < 4) s.add(id);
      return s;
    });
  };

  const comparedColleges = colleges.filter(c => compareIds.has(c._id));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Colleges & Institutions</h1>
          <p className="text-slate-500 mt-1">Education provider directory – courses, fees, contact</p>
        </div>
        <div className="flex gap-2">
          {compareIds.size > 0 && (
            <button onClick={() => setShowCompare(true)} className="btn-secondary flex items-center gap-2">
              <GitCompare className="w-4 h-4" /> Compare ({compareIds.size})
            </button>
          )}
          <button onClick={() => { setEditing(null); resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add College</button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input placeholder="Search colleges..." value={q} onChange={e => setQ(e.target.value)} className="input pl-10" />
        </div>
        <FilterBar
          fields={[
            { key: 'type', label: 'Type', type: 'select', options: [{ value: '', label: 'All' }, ...COLLEGE_TYPES.map(t => ({ value: t.value, label: t.label }))] },
            { key: 'state', label: 'State', type: 'select', options: [{ value: '', label: 'All' }, ...AU_STATES.map(s => ({ value: s, label: s }))] },
            { key: 'city', label: 'City', type: 'text', placeholder: 'e.g. Melbourne' },
            { key: 'feeMin', label: 'Fee Min ($)', type: 'text', placeholder: '0' },
            { key: 'feeMax', label: 'Fee Max ($)', type: 'text', placeholder: '50000' },
          ]}
          values={filterValues}
          onChange={setFilterValues}
          onClear={() => setFilterValues({ type: '', state: '', city: '', feeMin: '', feeMax: '' })}
        />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mt-6 max-w-3xl">
          <h3 className="font-semibold text-slate-900 mb-4">{editing ? 'Edit College' : 'Add College'}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" required /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">CRICOS Code</label><input value={form.cricosCode} onChange={e => setForm(f => ({ ...f, cricosCode: e.target.value }))} className="input" placeholder="e.g. 00123A" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Type</label><select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input">{COLLEGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Website</label><input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className="input" type="url" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">City</label><input value={form.location.city} onChange={e => setForm(f => ({ ...f, location: { ...f.location, city: e.target.value } }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">State</label><select value={form.location.state} onChange={e => setForm(f => ({ ...f, location: { ...f.location, state: e.target.value } }))} className="input"><option value="">—</option>{AU_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Address</label><input value={form.location.address} onChange={e => setForm(f => ({ ...f, location: { ...f.location, address: e.target.value } }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label><input value={form.contactPerson.name} onChange={e => setForm(f => ({ ...f, contactPerson: { ...f.contactPerson, name: e.target.value } }))} className="input" placeholder="Name" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label><input type="email" value={form.contactPerson.email} onChange={e => setForm(f => ({ ...f, contactPerson: { ...f.contactPerson, email: e.target.value } }))} className="input" /></div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2"><label className="text-sm font-medium text-slate-700">Courses Offered</label><button type="button" onClick={addCourse} className="text-ori-600 text-sm">+ Add Course</button></div>
            {form.courses.map((co, i) => (
              <div key={i} className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-2 p-3 bg-slate-50 rounded-lg">
                <input value={co.name} onChange={e => updateCourse(i, 'name', e.target.value)} className="input text-sm col-span-2" placeholder="Course name" />
                <input value={co.code} onChange={e => updateCourse(i, 'code', e.target.value)} className="input text-sm" placeholder="Code" />
                <input value={co.duration} onChange={e => updateCourse(i, 'duration', e.target.value)} className="input text-sm" placeholder="Duration" />
                <input type="number" value={co.feePerYear || ''} onChange={e => updateCourse(i, 'feePerYear', parseFloat(e.target.value) || 0)} className="input text-sm" placeholder="Fee/yr" />
                <select value={co.level} onChange={e => updateCourse(i, 'level', e.target.value)} className="input text-sm">{COURSE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</select>
                <button type="button" onClick={() => removeCourse(i)} className="text-red-500 p-1">×</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn-primary">{editing ? 'Save' : 'Add'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary flex items-center gap-1"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </form>
      )}

      {showCompare && comparedColleges.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCompare(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-semibold text-slate-900">Compare Colleges</h3>
              <button onClick={() => setShowCompare(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-medium text-slate-700">Attribute</th>
                    {comparedColleges.map(c => <th key={c._id} className="text-left py-2 px-3 font-medium text-slate-700 min-w-[180px]">{c.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100"><td className="py-2 px-3 text-slate-500">CRICOS</td>{comparedColleges.map(c => <td key={c._id} className="py-2 px-3">{c.cricosCode || '—'}</td>)}</tr>
                  <tr className="border-b border-slate-100"><td className="py-2 px-3 text-slate-500">Type</td>{comparedColleges.map(c => <td key={c._id} className="py-2 px-3">{c.type || '—'}</td>)}</tr>
                  <tr className="border-b border-slate-100"><td className="py-2 px-3 text-slate-500">Location</td>{comparedColleges.map(c => <td key={c._id} className="py-2 px-3">{[c.location?.city, c.location?.state].filter(Boolean).join(', ') || '—'}</td>)}</tr>
                  <tr className="border-b border-slate-100"><td className="py-2 px-3 text-slate-500">Courses</td>{comparedColleges.map(c => <td key={c._id} className="py-2 px-3">{(c.courses || []).length} courses</td>)}</tr>
                  <tr className="border-b border-slate-100"><td className="py-2 px-3 text-slate-500">Min Fee (yr)</td>{comparedColleges.map(c => { const fees = (c.courses || []).map((co: any) => co.feePerYear).filter((x: number) => x > 0); return <td key={c._id} className="py-2 px-3">{fees.length ? `$${Math.min(...fees)}` : '—'}</td>; })}</tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="card flex items-start gap-3"><Skeleton className="w-10 h-10 rounded-lg" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>)
        ) : colleges.map((c: any) => (
          <div key={c._id} className="card flex flex-col gap-2 group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-ori-100 flex items-center justify-center shrink-0"><GraduationCap className="w-5 h-5 text-ori-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900">{c.name}</p>
                <p className="text-sm text-slate-500">{c.cricosCode || '—'} • {c.type || '—'}</p>
                {c.location?.city && <p className="text-xs text-slate-400">{c.location.city}, {c.location.state}</p>}
                {(c.courses || []).length > 0 && (() => {
                  const fees = (c.courses || []).map((co: any) => co.feePerYear).filter((x: number) => x > 0);
                  return <p className="text-xs text-ori-600 mt-1">{(c.courses || []).length} course(s){fees.length ? ` • from $${Math.min(...fees)}/yr` : ''}</p>;
                })()}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => toggleCompare(c._id)} className={`p-2 rounded-lg ${compareIds.has(c._id) ? 'bg-ori-100 text-ori-600' : 'hover:bg-slate-100 text-slate-600'}`} title="Compare"><GitCompare className="w-4 h-4" /></button>
                <button onClick={() => startEdit(c)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="Edit"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(c._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!loading && !colleges.length && <div className="card mt-6 p-12 text-center text-slate-500">No colleges found</div>}
    </div>
  );
}
