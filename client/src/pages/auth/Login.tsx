import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

const API = '/api';

export default function Login() {
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get('error');
  const [showPhone, setShowPhone] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState(errorParam || '');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      if (user?.role === 'SUPER_ADMIN') navigate('/admin/dashboard');
      else if (user?.role === 'STUDENT') navigate('/student/dashboard');
      else if (user?.role === 'SPONSOR') navigate('/sponsor/dashboard');
      else navigate('/consultancy/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let p = phone.replace(/\D/g, '');
      if (p.startsWith('0')) p = '61' + p.slice(1);
      else if (!p.startsWith('61')) p = '61' + p;
      const res = await fetch(`${API}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: p }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setOtpSent(true);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let p = phone.replace(/\D/g, '');
      if (p.startsWith('0')) p = '61' + p.slice(1);
      else if (!p.startsWith('61')) p = '61' + p;
      const res = await fetch(`${API}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: p, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      useAuthStore.setState({ user: data.user, token: data.token });
      const user = data.user;
      if (user?.role === 'SUPER_ADMIN') navigate('/admin/dashboard');
      else if (user?.role === 'STUDENT') navigate('/student/dashboard');
      else if (user?.role === 'SPONSOR') navigate('/sponsor/dashboard');
      else navigate('/consultancy/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const resetPhoneFlow = () => {
    setShowPhone(false);
    setOtpSent(false);
    setPhone('');
    setOtp('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-ori-950 p-4">
      <div className="w-full max-w-md card bg-white/95 backdrop-blur">
        <div className="flex items-center gap-2 justify-center mb-2">
          <LogIn className="w-8 h-8 text-ori-600" />
          <h1 className="text-2xl font-display font-bold text-slate-900">Sign in</h1>
        </div>
        <p className="text-slate-500 text-center text-sm mb-6">Student & Consultancy sign in</p>

        {/* Sign in / Sign up tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-6">
            <button
              type="button"
              className="flex-1 py-2.5 rounded-md text-sm font-medium bg-white shadow text-slate-900 border border-slate-200/80"
            >
              Sign in
            </button>
            <Link
              to="/register"
              className="flex-1 py-2.5 rounded-md text-sm font-medium text-center text-slate-600 hover:text-slate-900 transition"
            >
              Sign up
            </Link>
          </div>

          {!showPhone ? (
            <>
              {/* Email / Password form */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input pr-10"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              {/* Separator */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white/95 text-slate-500">or continue with</span>
                </div>
              </div>

              {/* Google + Phone buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition font-medium text-slate-700"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => setShowPhone(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition font-medium text-slate-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Phone
                </button>
              </div>

              <div className="mt-5 space-y-2 text-center">
                <Link to="/forgot-password" className="text-sm text-ori-600 hover:underline">Forgot password?</Link>
                <br />
                <Link to="/" className="text-sm text-ori-600 hover:underline">← Back to portal selection</Link>
              </div>
            </>
          ) : (
            <>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input"
                      placeholder="04XX XXX XXX or +61 4XX XXX XXX"
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? 'Sending...' : 'Send Code'}
                  </button>
                  <button type="button" onClick={resetPhoneFlow} className="w-full text-sm text-ori-600 hover:underline">
                    ← Back to email sign in
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
                  )}
                  <p className="text-sm text-slate-600">Code sent to {phone}</p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Verification Code</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="input"
                      placeholder="6-digit code"
                      maxLength={6}
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                  </button>
                  <button type="button" onClick={() => setOtpSent(false)} className="w-full text-sm text-ori-600 hover:underline">
                    Use different number
                  </button>
                </form>
              )}
            </>
          )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-ori-600 hover:underline">Student</Link>
          {' · '}
          <Link to="/register-consultancy" className="text-ori-600 hover:underline">Consultancy</Link>
        </p>
      </div>
    </div>
  );
}
