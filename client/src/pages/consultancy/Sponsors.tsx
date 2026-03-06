import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authFetch, safeJson } from '../../store/auth';
import { Plus, Pencil, Trash2, Building2, FileSignature, Send, Search } from 'lucide-react';

export default function Sponsors() {
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSearch, setFilterSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    companyName: '',
    abn: '',
    acn: '',
    address: { street: '', city: '', state: '', postcode: '', country: 'Australia' },
    phone: '',
    email: '',
    industry: '',
    contactPerson: { firstName: '', lastName: '', role: '', email: '', phone: '' },
    notes: '',
  });

  const fetchSponsors = () => {
    const url = consultancyId ? `/api/sponsors?consultancyId=${consultancyId}` : '/api/sponsors';
    authFetch(url).then(r => safeJson(r)).then((d: any) => setSponsors(Array.isArray(d) ? d : [])).catch(() => setSponsors([])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchSponsors(); }, [consultancyId]);

  const filteredSponsors = sponsors.filter((s: any) => {
    const str = `${s.companyName} ${s.abn} ${s.acn} ${s.contactPerson?.firstName} ${s.contactPerson?.lastName} ${s.email}`.toLowerCase();
    return !filterSearch || str.includes(filterSearch.toLowerCase());
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        const res = await authFetch(`/api/sponsors/${editing._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await safeJson(res);
        if (!res.ok) throw new Error((data as any).error);
      } else {
        const res = await authFetch('/api/sponsors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await safeJson(res);
        if (!res.ok) throw new Error((data as any).error);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ companyName: '', abn: '', acn: '', address: { street: '', city: '', state: '', postcode: '', country: 'Australia' }, phone: '', email: '', industry: '', contactPerson: { firstName: '', lastName: '', role: '', email: '', phone: '' }, notes: '' });
      fetchSponsors();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sponsor?')) return;
    try {
      const res = await authFetch(`/api/sponsors/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await safeJson(res) as { error?: string })?.error);
      fetchSponsors();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const [sendingDoc, setSendingDoc] = useState<string | null>(null);
  const handleSendForm956 = async (id: string) => {
    setSendingDoc(id);
    try {
      const res = await authFetch(`/api/sponsors/${id}/send-form956`, { method: 'POST' });
      const data = await safeJson(res);
      if (!res.ok) throw new Error((data as any).error);
      alert('Form 956 sent');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSendingDoc(null);
    }
  };
  const handleSendMia = async (id: string) => {
    setSendingDoc(id);
    try {
      const res = await authFetch(`/api/sponsors/${id}/send-mia`, { method: 'POST' });
      const data = await safeJson(res);
      if (!res.ok) throw new Error((data as any).error);
      alert('MIA Agreement sent');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSendingDoc(null);
    }
  };
  const startEdit = (s: any) => {
    setEditing(s);
    const cp = s.contactPerson || {};
    setForm({
      companyName: s.companyName || '',
      abn: s.abn || '',
      acn: s.acn || '',
      address: { street: '', city: '', state: '', postcode: '', country: 'Australia', ...s.address },
      phone: s.phone || '',
      email: s.email || cp.email || '',
      industry: s.industry || '',
      contactPerson: { firstName: cp.firstName || '', lastName: cp.lastName || '', role: cp.role || '', email: cp.email || s.email || '', phone: cp.phone || '' },
      notes: s.notes || '',
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Sponsors / Employers</h1>
          <p className="text-slate-500 mt-1">Companies for 482, 186, training visas</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ companyName: '', abn: '', acn: '', address: { street: '', city: '', state: '', postcode: '', country: 'Australia' }, phone: '', email: '', industry: '', contactPerson: { firstName: '', lastName: '', role: '', email: '', phone: '' }, notes: '' }); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Sponsor
        </button>
      </div>
      <div className="mt-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input placeholder="Search company, ABN, contact..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} className="input pl-10" />
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mt-6 max-w-2xl">
          <h3 className="font-semibold text-slate-900 mb-4">{editing ? 'Edit Sponsor' : 'New Sponsor'}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label><input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} className="input" required /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">ABN</label><input value={form.abn} onChange={e => setForm(f => ({ ...f, abn: e.target.value }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">ACN</label><input value={form.acn} onChange={e => setForm(f => ({ ...f, acn: e.target.value }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Address</label><input value={[form.address.street, form.address.city, form.address.state].filter(Boolean).join(', ')} onChange={e => { const v = e.target.value; setForm(f => ({ ...f, address: { ...f.address, street: v } })); }} className="input" placeholder="Street, City, State" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Contact Person Name</label><input value={`${form.contactPerson.firstName} ${form.contactPerson.lastName}`.trim()} onChange={e => { const [fn, ...ln] = e.target.value.split(' '); setForm(f => ({ ...f, contactPerson: { ...f.contactPerson, firstName: fn || '', lastName: ln.join(' ') || '' } })); }} className="input" placeholder="First Last" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Contact Email (for Form 956/MIA)</label><input type="email" value={form.contactPerson.email || form.email} onChange={e => setForm(f => ({ ...f, contactPerson: { ...f.contactPerson, email: e.target.value }, email: e.target.value }))} className="input" placeholder="contact@company.com" title="Used when sending Form 956 and MIA" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input" rows={2} /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn-primary">{editing ? 'Save' : 'Add'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <p className="text-slate-500">Loading...</p> : filteredSponsors.length === 0 ? (
          <div className="card p-8 text-center text-slate-500 col-span-full">{sponsors.length ? 'No sponsors match your search.' : 'No sponsors yet. Add one for employer-sponsored visas (482, 186).'}</div>
        ) : filteredSponsors.map((s: any) => (
          <div key={s._id} className="card flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-ori-100 flex items-center justify-center shrink-0"><Building2 className="w-5 h-5 text-ori-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{s.companyName}</p>
                <p className="text-sm text-slate-500">{s.abn && `ABN: ${s.abn}`} {s.contactPerson?.firstName && `• ${s.contactPerson.firstName} ${s.contactPerson.lastName}`}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(s)} className="p-2 rounded hover:bg-slate-100 text-slate-600" title="Edit"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(s._id)} className="p-2 rounded hover:bg-red-50 text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => handleSendForm956(s._id)} disabled={sendingDoc === s._id || !(s.contactPerson?.email || s.email)} className="btn-secondary text-xs flex items-center gap-1" title="Send Form 956 to sponsor contact">
                <FileSignature className="w-3 h-3" /> {sendingDoc === s._id ? 'Sending...' : 'Form 956'}
              </button>
              <button onClick={() => handleSendMia(s._id)} disabled={sendingDoc === s._id || !(s.contactPerson?.email || s.email)} className="btn-secondary text-xs flex items-center gap-1" title="Send MIA Agreement">
                <Send className="w-3 h-3" /> MIA
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
