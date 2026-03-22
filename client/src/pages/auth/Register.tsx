import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { GraduationCap } from 'lucide-react';
import { AbroadUpLogo } from '../../components/brand/AbroadUpLogo';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(email, password, 'STUDENT', { firstName, lastName });
      const user = useAuthStore.getState().user;
      if (user?.role === 'STUDENT') navigate('/student/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-navy via-brand-navy-deep to-[#0a1628] p-4 gap-8">
      <div className="rounded-2xl bg-white px-5 py-3 shadow-2xl shadow-black/40 ring-1 ring-white/20">
        <AbroadUpLogo variant="wordmark" theme="light" scale="lg" />
      </div>
      <div className="w-full max-w-md card bg-white/95 backdrop-blur">
        <div className="flex items-center gap-2 justify-center mb-2">
          <GraduationCap className="w-8 h-8 text-brand-navy" />
          <h1 className="text-2xl font-display font-bold text-slate-900">Student Registration</h1>
        </div>
        <p className="text-slate-500 text-center text-sm mb-6">
          Create your account as a student or client. Your consultancy will link you to their portal.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}
          <div className="flex gap-2">
            <input placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} className="input flex-1" />
            <input placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} className="input flex-1" />
          </div>
          <div>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="input" required />
          </div>
          <div>
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="input" required minLength={6} />
          </div>
          <button type="submit" className="btn-primary w-full">Create Account</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-brand-navy hover:underline">Login</Link>
          {' · '}
          <Link to="/register-consultancy" className="text-brand-navy hover:underline">Register Consultancy</Link>
        </p>
      </div>
    </div>
  );
}
