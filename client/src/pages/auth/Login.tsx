import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      if (user?.role === 'SUPER_ADMIN') navigate('/admin/dashboard');
      else if (user?.role === 'STUDENT') navigate('/student/dashboard');
      else navigate('/consultancy/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-ori-950 p-4">
      <div className="w-full max-w-md card bg-white/95 backdrop-blur">
        <h1 className="text-2xl font-display font-bold text-slate-900 text-center">ORIVISA</h1>
        <p className="text-slate-500 text-center mt-1">Sign in to your account</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" required />
          </div>
          <button type="submit" className="btn-primary w-full">Sign In</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Don't have an account? <Link to="/register" className="text-ori-600 hover:underline">Student</Link>
          {' · '}
          <Link to="/register-consultancy" className="text-ori-600 hover:underline">Consultancy</Link>
        </p>
      </div>
    </div>
  );
}
