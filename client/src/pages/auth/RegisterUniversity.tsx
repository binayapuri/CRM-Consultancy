import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2 } from 'lucide-react';

type FormState = {
  institutionName: string;
  contactName: string;
  email: string;
  phone: string;
  password: string;
  website: string;
  city: string;
  state: string;
  cricosProviderCode: string;
  courseSummary: string;
  notes: string;
};

const emptyForm: FormState = {
  institutionName: '',
  contactName: '',
  email: '',
  phone: '',
  password: '',
  website: '',
  city: '',
  state: '',
  cricosProviderCode: '',
  courseSummary: '',
  notes: '',
};

export default function RegisterUniversity() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/university-requests/public/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionName: form.institutionName,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          website: form.website,
          cricosProviderCode: form.cricosProviderCode,
          campuses: [{ city: form.city, state: form.state, country: 'Australia' }],
          courseSummary: form.courseSummary
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean),
          notes: form.notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Registration request failed');
      setSuccess(data?.message || 'Request submitted successfully');
      setForm(emptyForm);
    } catch (err: any) {
      setError(err?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-ori-950 p-4 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white/95 backdrop-blur rounded-2xl border border-white/20 shadow-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">University Partner Request</h1>
            <p className="text-sm text-slate-500">Create your account request. Consultancy + super admin verification is required before login.</p>
          </div>
        </div>

        {error && <div className="mt-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm font-bold">{error}</div>}
        {success && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {success}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
            Institution Name
            <input className="mt-1 w-full input" value={form.institutionName} onChange={(e) => setForm((f) => ({ ...f, institutionName: e.target.value }))} required />
          </label>
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
            Contact Person
            <input className="mt-1 w-full input" value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} required />
          </label>
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
            Business Email
            <input type="email" className="mt-1 w-full input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          </label>
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
            Password
            <input type="password" className="mt-1 w-full input" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} minLength={6} required />
          </label>
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
            Phone
            <input className="mt-1 w-full input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </label>
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
            Website
            <input className="mt-1 w-full input" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
          </label>
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
            City
            <input className="mt-1 w-full input" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </label>
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
            State
            <input className="mt-1 w-full input" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
          </label>
          <label className="md:col-span-2 text-xs font-black text-slate-500 uppercase tracking-wider">
            CRICOS Provider Code (optional)
            <input className="mt-1 w-full input" value={form.cricosProviderCode} onChange={(e) => setForm((f) => ({ ...f, cricosProviderCode: e.target.value }))} />
          </label>
          <label className="md:col-span-2 text-xs font-black text-slate-500 uppercase tracking-wider">
            Course Categories (comma separated)
            <input className="mt-1 w-full input" value={form.courseSummary} onChange={(e) => setForm((f) => ({ ...f, courseSummary: e.target.value }))} placeholder="Nursing, IT, Business, Cookery" />
          </label>
          <label className="md:col-span-2 text-xs font-black text-slate-500 uppercase tracking-wider">
            Notes
            <textarea className="mt-1 w-full input" rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </label>
          <div className="md:col-span-2 flex items-center justify-between gap-3 mt-2">
            <div className="text-sm text-slate-500">
              Already requested? <Link to="/login" className="text-ori-600 font-bold hover:underline">Go to login</Link>
            </div>
            <button type="submit" disabled={loading} className="btn-primary px-6 py-2.5">
              {loading ? 'Submitting...' : 'Submit request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

