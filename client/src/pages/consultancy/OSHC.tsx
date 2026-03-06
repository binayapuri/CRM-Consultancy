import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authFetch } from '../../store/auth';
import { Shield, Plus, Pencil, Trash2, X, ExternalLink, User } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';
import FilterBar from '../../components/FilterBar';

const COVERAGE_TYPES = ['SINGLE', 'COUPLE', 'FAMILY'];
const APPLICATION_TYPES = [
  { value: 'AGENT', label: 'Agent Only' },
  { value: 'DIRECT', label: 'Direct Only' },
  { value: 'BOTH', label: 'Agent & Direct' },
];

export default function OSHC() {
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({ coverageType: '', applicationType: '' });
  const [form, setForm] = useState({
    provider: '',
    planName: '',
    coverageType: 'SINGLE',
    applicationType: 'BOTH',
    pricePerMonth: '',
    pricePerYear: '',
    excessAmount: '',
    website: '',
    phone: '',
    directApplyUrl: '',
    agentName: '',
    agentEmail: '',
    agentPhone: '',
  });

  const buildUrl = () => {
    const params = new URLSearchParams();
    if (consultancyId) params.set('consultancyId', consultancyId);
    if (filterValues.coverageType) params.set('coverageType', filterValues.coverageType);
    if (filterValues.applicationType) params.set('applicationType', filterValues.applicationType);
    return `/api/oshc${params.toString() ? '?' + params.toString() : ''}`;
  };

  const fetchProviders = () => {
    setLoading(true);
    authFetch(buildUrl()).then(r => r.json()).then(data => { setProviders(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchProviders(); }, [filterValues.coverageType, filterValues.applicationType, consultancyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        provider: form.provider,
        planName: form.planName || undefined,
        coverageType: form.coverageType,
        applicationType: form.applicationType,
        pricePerMonth: form.pricePerMonth ? parseFloat(form.pricePerMonth) : undefined,
        pricePerYear: form.pricePerYear ? parseFloat(form.pricePerYear) : undefined,
        excessAmount: form.excessAmount ? parseFloat(form.excessAmount) : undefined,
        website: form.website || undefined,
        phone: form.phone || undefined,
        directApplyUrl: form.directApplyUrl || undefined,
        agentContact: (form.agentName || form.agentEmail || form.agentPhone) ? {
          name: form.agentName || undefined,
          email: form.agentEmail || undefined,
          phone: form.agentPhone || undefined,
        } : undefined,
      };
      if (editing) {
        const res = await authFetch(`/api/oshc/${editing._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error((await res.json()).error);
      } else {
        const res = await authFetch('/api/oshc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error((await res.json()).error);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ provider: '', planName: '', coverageType: 'SINGLE', applicationType: 'BOTH', pricePerMonth: '', pricePerYear: '', excessAmount: '', website: '', phone: '', directApplyUrl: '', agentName: '', agentEmail: '', agentPhone: '' });
      fetchProviders();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this OSHC provider?')) return;
    try {
      const res = await authFetch(`/api/oshc/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchProviders();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const startEdit = (p: any) => {
    setEditing(p);
    const ac = p.agentContact || {};
    setForm({
      provider: p.provider || '',
      planName: p.planName || '',
      coverageType: p.coverageType || 'SINGLE',
      applicationType: p.applicationType || 'BOTH',
      pricePerMonth: p.pricePerMonth?.toString() || '',
      pricePerYear: p.pricePerYear?.toString() || '',
      excessAmount: p.excessAmount?.toString() || '',
      website: p.website || '',
      phone: p.phone || '',
      directApplyUrl: p.directApplyUrl || '',
      agentName: ac.name || '',
      agentEmail: ac.email || '',
      agentPhone: ac.phone || '',
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">OSHC Providers</h1>
          <p className="text-slate-500 mt-1">Overseas Student Health Cover partners</p>
        </div>
        <div className="flex items-center gap-2">
          <FilterBar
            fields={[
              { key: 'coverageType', label: 'Coverage', type: 'select', options: COVERAGE_TYPES.map(t => ({ value: t, label: t })) },
              { key: 'applicationType', label: 'Apply via', type: 'select', options: APPLICATION_TYPES },
            ]}
            values={filterValues}
            onChange={setFilterValues}
            onClear={() => setFilterValues({ coverageType: '', applicationType: '' })}
          />
          <button onClick={() => { setEditing(null); setForm({ provider: '', planName: '', coverageType: 'SINGLE', applicationType: 'BOTH', pricePerMonth: '', pricePerYear: '', excessAmount: '', website: '', phone: '', directApplyUrl: '', agentName: '', agentEmail: '', agentPhone: '' }); setShowForm(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Provider</button>
        </div>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="card mt-6 max-w-3xl">
          <h3 className="font-semibold text-slate-900 mb-4">{editing ? 'Edit OSHC Provider' : 'Add OSHC Provider'}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Provider *</label><input value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} className="input" required placeholder="e.g. Allianz, BUPA" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Plan Name</label><input value={form.planName} onChange={e => setForm(f => ({ ...f, planName: e.target.value }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Coverage Type</label><select value={form.coverageType} onChange={e => setForm(f => ({ ...f, coverageType: e.target.value }))} className="input">{COVERAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Application Type</label><select value={form.applicationType} onChange={e => setForm(f => ({ ...f, applicationType: e.target.value }))} className="input">{APPLICATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Price per Month ($)</label><input type="number" step="0.01" value={form.pricePerMonth} onChange={e => setForm(f => ({ ...f, pricePerMonth: e.target.value }))} className="input" placeholder="e.g. 55" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Price per Year ($)</label><input type="number" step="0.01" value={form.pricePerYear} onChange={e => setForm(f => ({ ...f, pricePerYear: e.target.value }))} className="input" placeholder="e.g. 600" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Excess ($)</label><input type="number" step="0.01" value={form.excessAmount} onChange={e => setForm(f => ({ ...f, excessAmount: e.target.value }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Website</label><input type="url" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className="input" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Direct Apply URL</label><input type="url" value={form.directApplyUrl} onChange={e => setForm(f => ({ ...f, directApplyUrl: e.target.value }))} className="input" placeholder="e.g. https://provider.com/apply" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><User className="w-4 h-4" /> Agent Contact</label><div className="grid grid-cols-3 gap-2"><input value={form.agentName} onChange={e => setForm(f => ({ ...f, agentName: e.target.value }))} className="input" placeholder="Name" /><input type="email" value={form.agentEmail} onChange={e => setForm(f => ({ ...f, agentEmail: e.target.value }))} className="input" placeholder="Email" /><input type="tel" value={form.agentPhone} onChange={e => setForm(f => ({ ...f, agentPhone: e.target.value }))} className="input" placeholder="Phone" /></div></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn-primary">{editing ? 'Save' : 'Add'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary flex items-center gap-1"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </form>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {loading ? (
          <>
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="card flex items-start gap-3"><Skeleton className="w-10 h-10 rounded-lg" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>)}
          </>
        ) : providers.map((p: any) => (
          <div key={p._id} className="card flex items-start gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900">{p.provider}</p>
              <p className="text-sm text-slate-500">{p.planName || '—'} • {p.coverageType || '—'}</p>
              <p className="text-xs text-slate-400 mt-0.5">{p.applicationType === 'AGENT' ? 'Agent' : p.applicationType === 'DIRECT' ? 'Direct' : 'Agent & Direct'}</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {p.pricePerMonth && <span className="text-ori-600 font-medium text-sm">${p.pricePerMonth}/mo</span>}
                {p.pricePerYear && <span className="text-slate-600 text-sm">${p.pricePerYear}/yr</span>}
              </div>
              {p.agentContact?.name && <p className="text-xs text-slate-500 mt-1">Agent: {p.agentContact.name}</p>}
              {p.directApplyUrl && (
                <a href={p.directApplyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                  <ExternalLink className="w-3 h-3" /> Direct apply
                </a>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => startEdit(p)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="Edit"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(p._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
      {!loading && !providers.length && <div className="card mt-6 p-12 text-center text-slate-500">No OSHC providers. Add one to get started.</div>}
    </div>
  );
}
