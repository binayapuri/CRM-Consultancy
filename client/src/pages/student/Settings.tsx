import { useEffect, useRef, useState } from 'react';
import { useAuthStore, authFetch } from '../../store/auth';
import { resolveFileUrl } from '../../lib/imageUrl';
import { useUiStore } from '../../store/ui';
import { KeyRound, User, Camera, Shield, Trash2, Eye, EyeOff, CheckCircle2, AlertTriangle, LogOut, Settings as SettingsIcon, Mail, CreditCard } from 'lucide-react';
import { StudentSectionTabs } from '../../components/StudentSectionTabs';

const TABS = [
  { id: 'security', label: 'Security', icon: KeyRound },
  { id: 'account', label: 'Account', icon: User },
  { id: 'avatar', label: 'Avatar', icon: Camera },
  { id: 'email', label: 'Email (SMTP)', icon: Mail },
  { id: 'invoices', label: 'Invoices (Payment)', icon: CreditCard },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'danger', label: 'Danger Zone', icon: Trash2 },
];

export default function Settings() {
  const { user, logout } = useAuthStore();
  const { showToast } = useUiStore();
  const [tab, setTab] = useState('security');

  // Security
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Avatar
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Account
  const [firstName, setFirstName] = useState(user?.profile?.firstName || '');
  const [lastName, setLastName] = useState(user?.profile?.lastName || '');
  const [phone, setPhone] = useState(user?.profile?.phone || '');
  const [accLoading, setAccLoading] = useState(false);
  const [accMsg, setAccMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Invoice settings (student SMTP + payment)
  const [invLoading, setInvLoading] = useState(false);
  const [invMsg, setInvMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [smtpEnabled, setSmtpEnabled] = useState(false);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpHasPassword, setSmtpHasPassword] = useState(false);

  const [bankName, setBankName] = useState('');
  const [bsb, setBsb] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [payIdType, setPayIdType] = useState<'EMAIL' | 'PHONE' | ''>('');
  const [payId, setPayId] = useState('');
  const [reference, setReference] = useState('');

  useEffect(() => {
    if (tab !== 'invoices' && tab !== 'email') return;
    let cancelled = false;
    (async () => {
      setInvLoading(true);
      setInvMsg(null);
      try {
        const res = await authFetch('/api/student/invoice-settings');
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load invoice settings');
        if (cancelled) return;
        setSmtpEnabled(!!data?.smtp?.enabled);
        setSmtpHost(data?.smtp?.host || '');
        setSmtpPort(Number(data?.smtp?.port || 587));
        setSmtpSecure(!!data?.smtp?.secure);
        setSmtpUser(data?.smtp?.user || '');
        setSmtpFrom(data?.smtp?.from || '');
        setSmtpHasPassword(!!data?.smtp?.hasPassword);
        setSmtpPassword('');

        setBankName(data?.payment?.bankName || '');
        setBsb(data?.payment?.bsb || '');
        setAccountNumber(data?.payment?.accountNumber || '');
        setAccountName(data?.payment?.accountName || '');
        setPayIdType(data?.payment?.payIdType || '');
        setPayId(data?.payment?.payId || '');
        setReference(data?.payment?.reference || '');
      } catch (e: any) {
        if (!cancelled) setInvMsg({ type: 'error', text: e.message });
      } finally {
        if (!cancelled) setInvLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const inp =
    'w-full min-w-0 max-w-full px-3 sm:px-4 py-3 rounded-xl text-sm font-medium text-slate-800 outline-none transition-all focus:ring-2 focus:ring-indigo-500/40 bg-slate-50 border border-slate-200';

  const handlePasswordChange = async () => {
    setPwMsg(null);
    if (!currentPw || !newPw || !confirmPw) return setPwMsg({ type: 'error', text: 'All fields are required' });
    if (newPw !== confirmPw) return setPwMsg({ type: 'error', text: 'New passwords do not match' });
    if (newPw.length < 6) return setPwMsg({ type: 'error', text: 'Password must be at least 6 characters' });
    setPwLoading(true);
    try {
      const res = await authFetch('/api/student/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showToast('Password updated successfully!', 'success');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e: any) {
      setPwMsg({ type: 'error', text: e.message });
    } finally {
      setPwLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return setAvatarMsg({ type: 'error', text: 'Please select a file first' });
    setAvatarLoading(true);
    setAvatarMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await authFetch('/api/student/profile/avatar', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      showToast('Avatar updated successfully!', 'success');
      useAuthStore.getState().fetchUser();
    } catch (e: any) {
      setAvatarMsg({ type: 'error', text: e.message });
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSaveAccount = async () => {
    setAccLoading(true);
    setAccMsg(null);
    try {
      const res = await authFetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      showToast('Account details saved!', 'success');
      useAuthStore.getState().fetchUser();
    } catch (e: any) {
      setAccMsg({ type: 'error', text: e.message });
    } finally {
      setAccLoading(false);
    }
  };

  const Alert = ({ msg }: { msg: { type: string; text: string } | null }) => {
    if (!msg) return null;
    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium mt-4 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
        {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
        {msg.text}
      </div>
    );
  };

  const saveInvoiceSettings = async () => {
    setInvLoading(true);
    setInvMsg(null);
    try {
      const res = await authFetch('/api/student/invoice-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtp: {
            enabled: smtpEnabled,
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            user: smtpUser,
            from: smtpFrom,
            password: smtpPassword || undefined,
          },
          payment: {
            bankName,
            bsb,
            accountNumber,
            accountName,
            payIdType,
            payId,
            reference,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save');
      setSmtpHasPassword(!!data?.smtp?.hasPassword);
      setSmtpPassword('');
      showToast('Invoice settings saved!', 'success');
      setInvMsg({ type: 'success', text: 'Saved successfully.' });
    } catch (e: any) {
      setInvMsg({ type: 'error', text: e.message });
    } finally {
      setInvLoading(false);
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-10 h-10 text-indigo-600 shrink-0" aria-hidden /> Settings
        </h1>
        <p className="text-slate-500 font-medium mt-2">Manage your account, security, and privacy.</p>
      </div>

      {/* User badge */}
      <div className="flex items-center gap-4 p-5 rounded-xl mb-6" style={{ background: 'linear-gradient(135deg, #EEF2FF, #E0FDF4)', border: '1px solid #C7D2FE' }}>
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-indigo-600 flex items-center justify-center text-white text-xl font-black">
          {user?.profile?.avatar ? <img src={resolveFileUrl(user.profile.avatar)} alt="" className="w-full h-full object-cover" /> : (user?.profile?.firstName?.[0] || user?.email?.[0] || '?').toUpperCase()}
        </div>
        <div>
          <p className="font-black text-slate-900 text-lg">{user?.profile?.firstName} {user?.profile?.lastName}</p>
          <p className="text-sm text-slate-500 font-medium">{user?.email}</p>
          <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 mt-1">{user?.role}</span>
        </div>
      </div>

      {/* Tab navigation */}
      <StudentSectionTabs
        tabs={TABS.map((t) => {
          const Icon = t.icon;
          return { id: t.id, label: t.label, icon: <Icon className="w-4 h-4" aria-hidden /> };
        })}
        activeId={tab}
        onChange={setTab}
      />

      {/* Security Tab */}
      {tab === 'security' && (
        <div className="bg-white rounded-xl p-6 space-y-5" style={{ border: '1px solid #E8EDFB' }}>
          <h2 className="font-black text-slate-900 text-xl">Change Password</h2>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Current Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)} className={inp} placeholder="Enter current password" />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">New Password</label>
            <input type={showPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} className={inp} placeholder="Min. 6 characters" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Confirm New Password</label>
            <input type={showPw ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className={inp} placeholder="Re-enter new password" />
          </div>
          <button onClick={handlePasswordChange} disabled={pwLoading} className="px-6 py-3 rounded-lg font-black text-white text-sm disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)' }}>
            {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
          <Alert msg={pwMsg} />

          <hr className="border-slate-100" />
          <div>
            <h3 className="font-black text-slate-800 mb-2">Session</h3>
            <p className="text-sm text-slate-500 font-medium mb-3">You are logged in as <strong>{user?.email}</strong>. Tokens expire after 7 days.</p>
            <button onClick={() => logout()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">
              <LogOut className="w-4 h-4" /> Sign out of all sessions
            </button>
          </div>
        </div>
      )}

      {/* Account Tab */}
      {tab === 'account' && (
        <div className="bg-white rounded-xl p-6 space-y-5" style={{ border: '1px solid #E8EDFB' }}>
          <h2 className="font-black text-slate-900 text-xl">Account Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">First Name</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Last Name</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} className={inp} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className={inp} placeholder="+61 412 345 678" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Email</label>
            <input value={user?.email || ''} disabled className={`${inp} opacity-50 cursor-not-allowed`} />
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed here. Contact support.</p>
          </div>
          <button onClick={handleSaveAccount} disabled={accLoading} className="px-6 py-3 rounded-lg font-black text-white text-sm disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)' }}>
            {accLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <Alert msg={accMsg} />
        </div>
      )}

      {/* Avatar Tab */}
      {tab === 'avatar' && (
        <div className="bg-white rounded-xl p-6 space-y-6" style={{ border: '1px solid #E8EDFB' }}>
          <h2 className="font-black text-slate-900 text-xl">Profile Photo</h2>
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-xl overflow-hidden bg-indigo-100 flex items-center justify-center border-4 border-indigo-100">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : user?.profile?.avatar ? (
                <img src={resolveFileUrl(user.profile.avatar)} alt="Current" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-indigo-400">{(user?.profile?.firstName?.[0] || '?').toUpperCase()}</span>
              )}
            </div>
            <div className="text-center">
              <input type="file" accept="image/*" ref={fileRef} onChange={handleAvatarChange} className="hidden" id="avatar-input" />
              <label htmlFor="avatar-input" className="cursor-pointer px-4 py-2.5 rounded-xl font-bold text-sm text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors">
                Choose Photo
              </label>
              <p className="text-xs text-slate-400 mt-2">JPG, PNG or GIF · Max 2MB</p>
            </div>
          </div>
          {avatarPreview && (
            <button onClick={handleAvatarUpload} disabled={avatarLoading} className="w-full py-3 rounded-lg font-black text-white text-sm disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)' }}>
              {avatarLoading ? 'Uploading...' : 'Save Photo'}
            </button>
          )}
          <Alert msg={avatarMsg} />
        </div>
      )}

      {/* Email (SMTP) Tab */}
      {tab === 'email' && (
        <div
          className="bg-white rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6 w-full min-w-0 max-w-[95vw] sm:max-w-full mx-auto"
          style={{ border: '1px solid #E8EDFB' }}
        >
          <div className="min-w-0">
            <h2 className="font-black text-slate-900 text-lg sm:text-xl flex flex-wrap items-center gap-2 min-w-0">
              <Mail className="w-5 h-5 text-indigo-600 shrink-0" aria-hidden />{' '}
              <span className="break-words">Email sending (SMTP)</span>
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-2 break-words">
              Configure your own SMTP (private) for sending invoices and other future emails from BIGFEW (for example, reminders or statements).
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 sm:p-5 min-w-0 overflow-hidden">
            <h3 className="font-black text-slate-900 flex flex-wrap items-center gap-2 min-w-0">
              <Mail className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden />{' '}
              <span className="break-words">SMTP (Send from your email)</span>
            </h3>
            <div className="mt-4 flex flex-wrap items-start gap-2">
              <input type="checkbox" checked={smtpEnabled} onChange={(e) => setSmtpEnabled(e.target.checked)} className="mt-1 shrink-0" />
              <span className="text-sm font-bold text-slate-700 min-w-0 break-words">Enable my SMTP for invoice emails</span>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">SMTP Host</label>
                <input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className={inp} placeholder="smtp.gmail.com" />
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Port</label>
                <input type="number" value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} className={inp} placeholder="587" />
                <p className="text-xs text-slate-500 mt-1 break-words">587 = STARTTLS (secure unchecked). 465 = implicit TLS (secure checked).</p>
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Username</label>
                <input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className={inp} placeholder="your@email.com" />
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">From (optional)</label>
                <input value={smtpFrom} onChange={(e) => setSmtpFrom(e.target.value)} className={inp} placeholder="Your Name <your@email.com>" />
              </div>
              <div className="md:col-span-2 min-w-0">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Password / App password</label>
                <input value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} className={inp} placeholder={smtpHasPassword ? 'Saved (enter to replace)' : 'Enter app password'} />
                <p className="text-xs text-slate-400 mt-1 break-words">We recommend using a Gmail/App password. Your password is stored encrypted.</p>
              </div>
              <div className="md:col-span-2 flex flex-wrap items-start gap-2 min-w-0">
                <input type="checkbox" checked={smtpSecure} onChange={(e) => setSmtpSecure(e.target.checked)} className="mt-1 shrink-0" />
                <span className="text-sm font-bold text-slate-700 min-w-0 break-words">
                  Use implicit TLS (for port 465 only; leave unchecked for 587)
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={saveInvoiceSettings}
            disabled={invLoading}
            className="w-full sm:w-auto px-6 py-3 rounded-lg font-black text-white text-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)' }}
          >
            {invLoading ? 'Saving...' : 'Save Invoice Settings'}
          </button>
          <Alert msg={invMsg} />
        </div>
      )}

      {/* Invoices / Payment Tab */}
      {tab === 'invoices' && (
        <div
          className="bg-white rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6 w-full min-w-0 max-w-[95vw] sm:max-w-full mx-auto"
          style={{ border: '1px solid #E8EDFB' }}
        >
          <div className="min-w-0">
            <h2 className="font-black text-slate-900 text-lg sm:text-xl flex flex-wrap items-center gap-2 min-w-0">
              <CreditCard className="w-5 h-5 text-indigo-600 shrink-0" aria-hidden />{' '}
              <span className="break-words">Invoice payment details</span>
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-2 break-words">
              These bank details appear in the <strong>Payment Information</strong> box on your invoice PDFs and in the student Invoice Manager.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 sm:p-5 min-w-0 overflow-hidden">
            <h3 className="font-black text-slate-900 flex flex-wrap items-center gap-2 min-w-0">
              <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden />{' '}
              <span className="break-words">Bank details (for getting paid)</span>
            </h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Bank name</label>
                <input value={bankName} onChange={(e) => setBankName(e.target.value)} className={inp} placeholder="Commonwealth Bank" />
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Account name</label>
                <input value={accountName} onChange={(e) => setAccountName(e.target.value)} className={inp} placeholder="Your legal name" />
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">BSB</label>
                <input value={bsb} onChange={(e) => setBsb(e.target.value)} className={inp} placeholder="062-948" />
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Account number</label>
                <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className={inp} placeholder="12345678" />
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">PayID type</label>
                <select value={payIdType} onChange={(e) => setPayIdType(e.target.value as any)} className={inp}>
                  <option value="">None</option>
                  <option value="EMAIL">Email</option>
                  <option value="PHONE">Phone</option>
                </select>
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">PayID</label>
                <input value={payId} onChange={(e) => setPayId(e.target.value)} className={inp} placeholder="you@email.com or +61..." />
              </div>
              <div className="md:col-span-2 min-w-0">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Payment reference (optional)</label>
                <input value={reference} onChange={(e) => setReference(e.target.value)} className={inp} placeholder="e.g., Invoice number as reference" />
              </div>
            </div>
          </div>

          <button
            onClick={saveInvoiceSettings}
            disabled={invLoading}
            className="w-full sm:w-auto px-6 py-3 rounded-lg font-black text-white text-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)' }}
          >
            {invLoading ? 'Saving...' : 'Save Invoice Settings'}
          </button>
          <Alert msg={invMsg} />
        </div>
      )}

      {/* Privacy Tab */}
      {tab === 'privacy' && (
        <div className="bg-white rounded-xl p-6 space-y-5" style={{ border: '1px solid #E8EDFB' }}>
          <h2 className="font-black text-slate-900 text-xl">Data Privacy</h2>
          <div className="p-5 rounded-lg" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <p className="font-black text-emerald-900 flex items-center gap-2"><KeyRound className="w-4 h-4 shrink-0" aria-hidden /> Your data is private by default</p>
            <p className="text-sm text-emerald-700 font-medium mt-1">Migration agents can only see your profile when you explicitly connect and choose what to share from the "Find Consultancy" page.</p>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 mb-3">Currently shared with</h3>
            <div className="p-4 rounded-xl bg-slate-50 text-sm text-slate-400 font-medium text-center">
              You haven't shared your data with any consultancy yet.
            </div>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 mb-3">Data we collect</h3>
            {[
              ['Profile Information', 'Name, date of birth, nationality, contact details'],
              ['Immigration Details', 'Visa status, ANZSCO code, English test results'],
              ['Education & Work', 'Degrees and employment history you enter'],
              ['Documents', 'Files you upload to your Document Vault'],
              ['Usage Data', 'Pages visited, features used (anonymous analytics only)'],
            ].map(([title, desc]) => (
              <div key={title} className="flex justify-between items-start py-3 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-bold text-slate-700">{title}</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{desc}</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0 ml-4">Encrypted</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger Zone Tab */}
      {tab === 'danger' && (
        <div className="bg-white rounded-xl p-6 space-y-5" style={{ border: '2px solid #FEE2E2' }}>
          <h2 className="font-black text-red-700 text-xl flex items-center gap-2"><AlertTriangle className="w-5 h-5 shrink-0" aria-hidden /> Danger Zone</h2>
          <div className="p-5 rounded-lg" style={{ background: '#FFF1F2', border: '1px solid #FECDD3' }}>
            <h3 className="font-black text-red-800 mb-1">Delete Account</h3>
            <p className="text-sm text-red-700 font-medium mb-4">This will permanently delete your account and all associated data. This action is irreversible. To request deletion, please contact support or send an email.</p>
            <a href="mailto:support@orivisa.com?subject=Delete%20My%20Account&body=Please%20delete%20my%20account%20associated%20with%20this%20email." className="inline-block px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 transition-colors">
              Request Account Deletion
            </a>
          </div>
          <div className="p-5 rounded-lg" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
            <h3 className="font-black text-amber-800 mb-1">Download My Data</h3>
            <p className="text-sm text-amber-700 font-medium mb-3">You have the right to export all your data stored in Orivisa.</p>
            <button className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-amber-600 hover:bg-amber-700 transition-colors">
              Request Data Export (Coming Soon)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
