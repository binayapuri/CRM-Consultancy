import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'AGENT'>('STUDENT');
  const [error, setError] = useState('');
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(email, password, role, { firstName, lastName });
      const user = useAuthStore.getState().user;
      if (user?.role === 'STUDENT') navigate('/student/dashboard');
      else navigate('/consultancy/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-ori-950 p-4">
      <div className="w-full max-w-md card bg-white/95 backdrop-blur">
        <h1 className="text-2xl font-display font-bold text-slate-900 text-center">ORIVISA</h1>
        <p className="text-slate-500 text-center mt-1">Create your account</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">I am a</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="role" checked={role === 'STUDENT'} onChange={() => setRole('STUDENT')} />
                <span>Student</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="role" checked={role === 'AGENT'} onChange={() => setRole('AGENT')} />
                <span>Consultancy Agent</span>
              </label>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">Create Account</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-ori-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
