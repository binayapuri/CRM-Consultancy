import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authFetch } from '../../store/auth';
import { useAuthStore } from '../../store/auth';
import { User, Key, MapPin, FileCheck, Camera, Save, Eye, EyeOff, Settings, Mail } from 'lucide-react';

export default function ConsultancyProfile() {
  const { user, fetchUser } = useAuthStore();
  const [activeSection, setActiveSection] = useState<'personal' | 'passport' | 'address' | 'email' | 'security'>('personal');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [personal, setPersonal] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    marnNumber: '',
  });
  const [passport, setPassport] = useState({
    passportNumber: '',
    passportExpiry: '',
    passportCountry: '',
  });
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Australia',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [emailProfiles, setEmailProfiles] = useState<{ _id: string; name: string; isDefault?: boolean }[]>([]);
  const [preferredEmailProfileId, setPreferredEmailProfileId] = useState<string>('');

  useEffect(() => {
    if (user) {
      const p = user.profile || {};
      setPersonal({
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        email: user.email || '',
        phone: p.phone || '',
        marnNumber: p.marnNumber || '',
      });
      setPassport({
        passportNumber: p.passportNumber || '',
        passportExpiry: p.passportExpiry ? new Date(p.passportExpiry).toISOString().slice(0, 10) : '',
        passportCountry: p.passportCountry || '',
      });
      const addr = p.address || {};
      setAddress({
        street: addr.street || '',
        city: addr.city || '',
        state: addr.state || '',
        postcode: addr.postcode || '',
        country: addr.country || 'Australia',
      });
      setPreferredEmailProfileId(p.preferredEmailProfileId || '');
    }
  }, [user]);

  useEffect(() => {
    if (user?.profile?.consultancyId && ['AGENT', 'CONSULTANCY_ADMIN', 'SUPPORT'].includes(user?.role || '')) {
      authFetch('/api/consultancies/me').then(r => r.json()).then((c: any) => {
        const profiles = (c?.emailProfiles || []).filter((p: any) => p.active).map((p: any) => ({ _id: p._id, name: p.name, isDefault: p.isDefault }));
        setEmailProfiles(profiles);
      }).catch(() => {});
    }
  }, [user?.profile?.consultancyId, user?.role]);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            firstName: personal.firstName,
            lastName: personal.lastName,
            phone: personal.phone || undefined,
            marnNumber: personal.marnNumber || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchUser();
      showMsg('success', 'Profile updated');
    } catch (err) {
      showMsg('error', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            passportNumber: passport.passportNumber || undefined,
            passportExpiry: passport.passportExpiry || undefined,
            passportCountry: passport.passportCountry || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchUser();
      showMsg('success', 'Passport details updated');
    } catch (err) {
      showMsg('error', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: { address },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchUser();
      showMsg('success', 'Address updated');
    } catch (err) {
      showMsg('error', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMsg('error', 'New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showMsg('error', 'Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showMsg('success', 'Password changed successfully');
    } catch (err) {
      showMsg('error', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await authFetch('/api/auth/me/avatar', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchUser();
      showMsg('success', 'Photo updated');
    } catch (err) {
      showMsg('error', (err as Error).message);
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const initials = user?.profile?.firstName?.[0] && user?.profile?.lastName?.[0]
    ? `${user.profile.firstName[0]}${user.profile.lastName[0]}`
    : user?.email?.[0]?.toUpperCase() || '?';

  const handleSaveEmailPref = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: { preferredEmailProfileId: preferredEmailProfileId || undefined } }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchUser();
      showMsg('success', 'Email preference updated');
    } catch (err) {
      showMsg('error', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'personal' as const, label: 'Personal Details', icon: User },
    { id: 'passport' as const, label: 'Passport', icon: FileCheck },
    { id: 'address' as const, label: 'Address', icon: MapPin },
    ...(emailProfiles.length ? [{ id: 'email' as const, label: 'Email', icon: Mail }] : []),
    { id: 'security' as const, label: 'Security', icon: Key },
  ];

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-display font-bold text-slate-900">Profile</h1>
      <p className="text-slate-500 mt-1">Manage your consultancy profile and settings. <Link to="settings" className="text-ori-600 hover:underline inline-flex items-center gap-1"><Settings className="w-4 h-4" /> Notification preferences</Link></p>

      {message && (
        <div className={`mt-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Profile header with avatar */}
      <div className="card mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="relative group">
          {user?.profile?.avatar ? (
            <img src={user.profile.avatar} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-slate-100" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-ori-500 text-white flex items-center justify-center text-2xl font-bold">
              {initials}
            </div>
          )}
          <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
            {uploadingAvatar ? (
              <span className="text-white text-sm">...</span>
            ) : (
              <Camera className="w-8 h-8 text-white" />
            )}
          </label>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-900">{user?.profile?.firstName} {user?.profile?.lastName}</h2>
          <p className="text-slate-500">{user?.email}</p>
          <p className="text-sm text-slate-400 mt-1">Role: {user?.role?.replace('_', ' ')}</p>
          {(user?.role === 'AGENT' || user?.role === 'CONSULTANCY_ADMIN') && user?.profile?.marnNumber && (
            <p className="text-sm text-ori-600 mt-1">MARN: {user.profile.marnNumber}</p>
          )}
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition shrink-0 ${activeSection === id ? 'bg-ori-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Personal Details */}
      {activeSection === 'personal' && (
        <div className="card mt-6">
          <h3 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2"><User className="w-5 h-5 text-ori-600" /> Personal Details</h3>
          <form onSubmit={handleSavePersonal} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                <input value={personal.firstName} onChange={e => setPersonal(p => ({ ...p, firstName: e.target.value }))} className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                <input value={personal.lastName} onChange={e => setPersonal(p => ({ ...p, lastName: e.target.value }))} className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input value={personal.email} className="input bg-slate-50" disabled title="Contact admin to change email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input value={personal.phone} onChange={e => setPersonal(p => ({ ...p, phone: e.target.value }))} className="input" placeholder="+61 400 000 000" />
              </div>
              {(user?.role === 'AGENT' || user?.role === 'CONSULTANCY_ADMIN') && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">MARN Number</label>
                  <input value={personal.marnNumber} onChange={e => setPersonal(p => ({ ...p, marnNumber: e.target.value }))} className="input" placeholder="Migration Agent Registration Number" />
                </div>
              )}
            </div>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}</button>
          </form>
        </div>
      )}

      {/* Passport */}
      {activeSection === 'passport' && (
        <div className="card mt-6">
          <h3 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2"><FileCheck className="w-5 h-5 text-ori-600" /> Passport Details</h3>
          <p className="text-slate-500 text-sm mb-4">Update your passport information for MARN registration and travel records.</p>
          <form onSubmit={handleSavePassport} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Passport Number</label>
                <input value={passport.passportNumber} onChange={e => setPassport(p => ({ ...p, passportNumber: e.target.value }))} className="input" placeholder="e.g. N1234567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                <input type="date" value={passport.passportExpiry} onChange={e => setPassport(p => ({ ...p, passportExpiry: e.target.value }))} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Country of Issue</label>
                <input value={passport.passportCountry} onChange={e => setPassport(p => ({ ...p, passportCountry: e.target.value }))} className="input" placeholder="e.g. Australia, India" />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}</button>
          </form>
        </div>
      )}

      {/* Address */}
      {activeSection === 'address' && (
        <div className="card mt-6">
          <h3 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-ori-600" /> Address</h3>
          <form onSubmit={handleSaveAddress} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Street</label>
                <input value={address.street} onChange={e => setAddress(a => ({ ...a, street: e.target.value }))} className="input" placeholder="Street address" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <input value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                <input value={address.state} onChange={e => setAddress(a => ({ ...a, state: e.target.value }))} className="input" placeholder="e.g. NSW, VIC" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Postcode</label>
                <input value={address.postcode} onChange={e => setAddress(a => ({ ...a, postcode: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                <input value={address.country} onChange={e => setAddress(a => ({ ...a, country: e.target.value }))} className="input" />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}</button>
          </form>
        </div>
      )}

      {/* Email preference */}
      {activeSection === 'email' && emailProfiles.length > 0 && (
        <div className="card mt-6">
          <h3 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2"><Mail className="w-5 h-5 text-ori-600" /> Email for Sending</h3>
          <p className="text-slate-500 text-sm mb-4">Choose which email profile to use when sending Form 956, MIA Agreement, and Initial Advice to clients. Leave as &quot;Default&quot; to use the consultancy default.</p>
          <form onSubmit={handleSaveEmailPref} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Email Profile</label>
              <select value={preferredEmailProfileId} onChange={e => setPreferredEmailProfileId(e.target.value)} className="input">
                <option value="">Use consultancy default</option>
                {emailProfiles.map(p => <option key={p._id} value={p._id}>{p.name}{p.isDefault ? ' (default)' : ''}</option>)}
              </select>
            </div>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}</button>
          </form>
        </div>
      )}

      {/* Security - Change Password */}
      {activeSection === 'security' && (
        <div className="card mt-6">
          <h3 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2"><Key className="w-5 h-5 text-ori-600" /> Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Password *</label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                  className="input pr-10"
                  required
                />
                <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password *</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                className="input"
                required
                minLength={6}
              />
              <p className="text-xs text-slate-500 mt-1">At least 6 characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password *</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                className="input"
                required
              />
            </div>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> {saving ? 'Changing...' : 'Change Password'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
