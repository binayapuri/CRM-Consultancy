import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';

const API = '/api';

export default function RegisterConsultancy() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    marnNumber: '',
    consultancyName: '',
    abn: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/consultancies/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      localStorage.setItem('orivisa-auth', JSON.stringify({ state: { user: data.user, token: data.token }, version: 1 }));
      navigate('/consultancy/dashboard');
      window.location.reload();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-ori-950 p-4">
      <div className="w-full max-w-md card bg-white/95 backdrop-blur">
        <div className="flex items-center gap-2 justify-center mb-2">
          <Building2 className="w-8 h-8 text-ori-600" />
          <h1 className="text-2xl font-display font-bold text-slate-900">Consultancy Registration</h1>
        </div>
        <p className="text-slate-500 text-center text-sm mb-6">
          Register your migration consultancy. Use your <strong>business email</strong> (e.g. @orivisa.com, @yourcompany.com.au). Personal emails (Gmail, Yahoo) are not allowed.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
              <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className="input" required placeholder="John" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
              <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className="input" required placeholder="Smith" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Business Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" required placeholder="admin@yourconsultancy.com.au" />
            <p className="text-xs text-slate-500 mt-1">e.g. admin@orivisa.com, info@inspireconsultancy.com.au</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input" required minLength={6} placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">MARN Number *</label>
            <input value={form.marnNumber} onChange={e => setForm(f => ({ ...f, marnNumber: e.target.value }))} className="input" required placeholder="e.g. 1234567" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Consultancy Name *</label>
            <input value={form.consultancyName} onChange={e => setForm(f => ({ ...f, consultancyName: e.target.value }))} className="input" required placeholder="e.g. ORIVISA Migration" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ABN (optional)</label>
              <input value={form.abn} onChange={e => setForm(f => ({ ...f, abn: e.target.value }))} className="input" placeholder="12 345 678 901" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone (optional)</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" placeholder="+61 3 9999 0000" />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Registering...' : 'Register Consultancy'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-ori-600 hover:underline">Login</Link>
          {' · '}
          <Link to="/register" className="text-ori-600 hover:underline">I'm a Student</Link>
        </p>
      </div>
    </div>
  );
}
