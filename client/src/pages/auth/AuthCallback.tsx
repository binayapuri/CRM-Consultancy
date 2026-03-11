import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const loginWithToken = useAuthStore((s) => s.loginWithToken);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loginWithToken(token)
      .then(() => {
        const user = useAuthStore.getState().user;
        if (user?.role === 'SUPER_ADMIN') navigate('/admin/dashboard');
        else if (user?.role === 'STUDENT') navigate('/student/dashboard');
        else if (user?.role === 'SPONSOR') navigate('/sponsor/dashboard');
        else navigate('/consultancy/dashboard');
      })
      .catch(() => navigate('/login'));
  }, [token, navigate, loginWithToken]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-ori-950">
      <div className="text-white text-center">
        <div className="animate-spin w-10 h-10 border-2 border-ori-400 border-t-transparent rounded-full mx-auto mb-4" />
        <p>Signing you in...</p>
      </div>
    </div>
  );
}
