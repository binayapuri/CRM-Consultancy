import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

export default function Activate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (token && email) {
      fetch(`/api/invitation/validate?token=${token}&email=${encodeURIComponent(email)}`)
        .then(r => r.json())
        .then(data => setValid(data.valid))
        .catch(() => setValid(false));
    } else setValid(false);
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/invitation/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Activation failed');
      useAuthStore.setState({ user: data.user, token: data.token });
      navigate('/student/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (valid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-ori-950 p-4">
        <div className="w-full max-w-md card bg-white/95 backdrop-blur text-center">
          <p className="text-slate-600">Validating...</p>
        </div>
      </div>
    );
  }
  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-ori-950 p-4">
        <div className="w-full max-w-md card bg-white/95 backdrop-blur text-center">
          <h1 className="text-xl font-bold text-red-600">Invalid or expired invitation</h1>
          <p className="mt-2 text-slate-500">Please contact your consultancy for a new link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-ori-950 p-4">
      <div className="w-full max-w-md card bg-white/95 backdrop-blur">
        <h1 className="text-2xl font-display font-bold text-slate-900 text-center">Activate Account</h1>
        <p className="text-slate-500 text-center mt-1">Set your password to access your client portal</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" value={email || ''} className="input bg-slate-50" readOnly /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">New Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" required minLength={6} /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input" required /></div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Activating...' : 'Activate & Login'}</button>
        </form>
      </div>
    </div>
  );
}
