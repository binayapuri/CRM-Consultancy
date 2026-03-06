import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { authFetch } from '../../store/auth';
import { ArrowLeft } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LeadForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const isEdit = !!id;
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    profile: { firstName: '', lastName: '', email: '', phone: '', interest: '', notes: '' },
    source: '',
    status: 'NEW',
    assignedTo: '',
  });

  useEffect(() => {
    authFetch('/api/users/agents').then(r => r.json()).then(setAgents);
    if (id) {
      authFetch(`/api/leads/${id}`).then(r => r.json()).then((data) => {
        if (data.error) return;
        setForm({
          profile: { firstName: '', lastName: '', email: '', phone: '', interest: '', notes: '', ...data.profile },
          source: data.source || '',
          status: data.status || 'NEW',
          assignedTo: data.assignedTo?._id || data.assignedTo || '',
        });
      });
    }
  }, [id]);

  const validate = (): string | null => {
    const fn = (form.profile?.firstName || '').trim();
    const ln = (form.profile?.lastName || '').trim();
    const email = (form.profile?.email || '').trim();
    if (!fn) return 'First name is required';
    if (!ln) return 'Last name is required';
    if (!email) return 'Email is required';
    if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError('');
    try {
      const backUrl = consultancyId ? `/consultancy/leads?consultancyId=${consultancyId}` : '/consultancy/leads';
      if (isEdit) {
        const res = await authFetch(`/api/leads/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        navigate(backUrl);
      } else {
        const payload: any = { ...form };
        if (consultancyId) payload.consultancyId = consultancyId;
        const res = await authFetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        navigate(backUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link to={consultancyId ? `/consultancy/leads?consultancyId=${consultancyId}` : '/consultancy/leads'} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Leads
      </Link>
      <h1 className="text-2xl font-display font-bold text-slate-900">{isEdit ? 'Edit Lead' : 'Add Lead'}</h1>
      <form onSubmit={handleSubmit} className="card mt-6 max-w-2xl">
        {error && <div className="p-4 rounded-lg bg-red-50 text-red-600 mb-4">{error}</div>}
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">First Name <span className="text-red-500">*</span></label><input value={form.profile.firstName} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, firstName: e.target.value } }))} className="input" required /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Last Name <span className="text-red-500">*</span></label><input value={form.profile.lastName} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, lastName: e.target.value } }))} className="input" required /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-red-500">*</span></label><input type="email" value={form.profile.email} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, email: e.target.value } }))} className="input" required /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input value={form.profile.phone} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, phone: e.target.value } }))} className="input" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Interest</label><input value={form.profile.interest} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, interest: e.target.value } }))} className="input" placeholder="e.g. Student Visa, PR" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Source</label><select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="input"><option value="">Select</option><option value="Website">Website</option><option value="Referral">Referral</option><option value="Walk-in">Walk-in</option><option value="Social">Social</option></select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input"><option value="NEW">New</option><option value="CONTACTED">Contacted</option><option value="QUALIFIED">Qualified</option><option value="CONVERTED">Converted</option><option value="LOST">Lost</option></select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label><select value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} className="input"><option value="">Select</option>{agents.map(a => <option key={a._id} value={a._id}>{a.profile?.firstName} {a.profile?.lastName}</option>)}</select></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label><textarea value={form.profile.notes} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, notes: e.target.value } }))} className="input" rows={3} /></div>
        </div>
        <div className="flex gap-4 mt-6">
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save'}</button>
          <Link to={consultancyId ? `/consultancy/leads?consultancyId=${consultancyId}` : '/consultancy/leads'} className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
