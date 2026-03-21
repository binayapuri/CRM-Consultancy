import { useEffect, useState } from 'react';
import { authFetch } from '../../store/auth';
import { safeJson } from '../../store/auth';
import { useUiStore } from '../../store/ui';
import { Mail, Shield, Bell, Save, Pencil, FolderPlus, Plus, Trash2 } from 'lucide-react';

type TabId = 'smtp' | 'auth' | 'notifications' | 'news-categories';

type NewsCategoryRow = { _id: string; name: string; slug: string; order?: number };

type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  enabled: boolean;
};

type GoogleAuth = {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
};

type AppleAuth = {
  enabled: boolean;
  clientId: string;
  teamId: string;
  keyId: string;
  privateKey: string;
};

type AuthSettings = {
  google: GoogleAuth;
  apple: AppleAuth;
};

type NotificationSettings = {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  defaultChannels: string[];
};

type PlatformSettings = {
  _id?: string;
  smtp?: SmtpSettings;
  auth?: AuthSettings;
  notifications?: NotificationSettings;
};

const defaultSmtp: SmtpSettings = {
  host: '',
  port: 587,
  secure: false,
  user: '',
  pass: '',
  from: '',
  enabled: false,
};

const defaultAuth: AuthSettings = {
  google: { enabled: false, clientId: '', clientSecret: '' },
  apple: { enabled: false, clientId: '', teamId: '', keyId: '', privateKey: '' },
};

const defaultNotifications: NotificationSettings = {
  emailEnabled: true,
  inAppEnabled: true,
  defaultChannels: [],
};

export default function AdminAdvancedSettings() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('smtp');
  const [googleCredForm, setGoogleCredForm] = useState({ clientId: '', clientSecret: '' });
  const [appleCredForm, setAppleCredForm] = useState({ clientId: '', teamId: '', keyId: '', privateKey: '' });
  const [credModalProvider, setCredModalProvider] = useState<'google' | 'apple' | null>(null);

  const smtp = settings?.smtp ?? defaultSmtp;
  const auth = settings?.auth ?? defaultAuth;
  const notifications = settings?.notifications ?? defaultNotifications;

  const { showToast, openModal, closeModal, setModalContentGetter, bumpModalContentKey, modal, openConfirm } = useUiStore();

  const [newsCategories, setNewsCategories] = useState<NewsCategoryRow[]>([]);
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', order: 0 });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);

  const fetchSettings = () => {
    setLoading(true);
    authFetch('/api/admin/settings')
      .then(r => safeJson<PlatformSettings>(r))
      .then(data => setSettings(data ?? null))
      .catch(() => showToast('Failed to load settings', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchNewsCategories = () =>
    authFetch('/api/admin/news/categories')
      .then(r => safeJson<NewsCategoryRow[]>(r))
      .then(data => setNewsCategories(Array.isArray(data) ? data : []))
      .catch(() => setNewsCategories([]));

  useEffect(() => {
    if (activeTab === 'news-categories') fetchNewsCategories();
  }, [activeTab]);

  const patchSettings = async (payload: Partial<PlatformSettings>) => {
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await safeJson<PlatformSettings>(res);
      if (!res.ok) throw new Error((data as any)?.error || 'Save failed');
      setSettings(data ?? null);
      showToast('Settings saved', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateSmtp = (updates: Partial<SmtpSettings>) => {
    setSettings(prev => ({
      ...prev,
      smtp: { ...defaultSmtp, ...prev?.smtp, ...updates },
    }));
  };

  const updateAuth = (provider: 'google' | 'apple', updates: Partial<GoogleAuth> | Partial<AppleAuth>) => {
    setSettings(prev => ({
      ...prev,
      auth: {
        ...defaultAuth,
        ...prev?.auth,
        [provider]: { ...prev?.auth?.[provider], ...updates },
      },
    }));
  };

  const updateNotifications = (updates: Partial<NotificationSettings>) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...defaultNotifications, ...prev?.notifications, ...updates },
    }));
  };

  const handleSaveSmtp = () => {
    patchSettings({ smtp });
  };

  const handleSaveAuth = () => {
    patchSettings({ auth });
  };

  const handleSaveNotifications = () => {
    patchSettings({ notifications });
  };

  const handleDisableProvider = (provider: 'google' | 'apple', label: string) => {
    openConfirm({
      title: `Disable ${label}`,
      message: `Disable ${label} sign-in? Users will no longer be able to sign in with ${label}.`,
      confirmLabel: 'Disable',
      danger: true,
      onConfirm: async () => {
        const next = { ...auth, [provider]: { ...auth[provider], enabled: false } };
        updateAuth(provider, { enabled: false });
        await patchSettings({ auth: next });
      },
    });
  };

  const getGoogleCredModalContent = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Client ID</label>
        <input
          type="text"
          value={googleCredForm.clientId}
          onChange={e => setGoogleCredForm(f => ({ ...f, clientId: e.target.value }))}
          className="input w-full"
          placeholder="Google OAuth client ID"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Client Secret</label>
        <input
          type="password"
          value={googleCredForm.clientSecret}
          onChange={e => setGoogleCredForm(f => ({ ...f, clientSecret: e.target.value }))}
          className="input w-full"
          placeholder="Leave blank to keep existing"
        />
      </div>
      <div className="flex gap-2 pt-4 border-t border-slate-100">
        <button type="button" onClick={() => { closeModal(); setCredModalProvider(null); }} className="btn-secondary">Cancel</button>
        <button
          type="button"
          onClick={async () => {
            const next = { ...auth.google, clientId: googleCredForm.clientId };
            if (googleCredForm.clientSecret && googleCredForm.clientSecret !== '••••••••') next.clientSecret = googleCredForm.clientSecret;
            updateAuth('google', next);
            await patchSettings({ auth: { ...auth, google: next } });
            closeModal();
            setCredModalProvider(null);
          }}
          className="btn-primary"
        >
          Save
        </button>
      </div>
    </div>
  );

  const getAppleCredModalContent = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Client ID (Service ID)</label>
        <input type="text" value={appleCredForm.clientId} onChange={e => setAppleCredForm(f => ({ ...f, clientId: e.target.value }))} className="input w-full" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Team ID</label>
        <input type="text" value={appleCredForm.teamId} onChange={e => setAppleCredForm(f => ({ ...f, teamId: e.target.value }))} className="input w-full" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Key ID</label>
        <input type="text" value={appleCredForm.keyId} onChange={e => setAppleCredForm(f => ({ ...f, keyId: e.target.value }))} className="input w-full" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Private Key (leave blank to keep)</label>
        <textarea value={appleCredForm.privateKey} onChange={e => setAppleCredForm(f => ({ ...f, privateKey: e.target.value }))} className="input w-full min-h-[80px]" rows={3} placeholder="PEM content" />
      </div>
      <div className="flex gap-2 pt-4 border-t border-slate-100">
        <button type="button" onClick={() => { closeModal(); setCredModalProvider(null); }} className="btn-secondary">Cancel</button>
        <button
          type="button"
          onClick={async () => {
            const next = { ...auth.apple, clientId: appleCredForm.clientId, teamId: appleCredForm.teamId, keyId: appleCredForm.keyId };
            if (appleCredForm.privateKey && appleCredForm.privateKey !== '••••••••') next.privateKey = appleCredForm.privateKey;
            updateAuth('apple', next);
            await patchSettings({ auth: { ...auth, apple: next } });
            closeModal();
            setCredModalProvider(null);
          }}
          className="btn-primary"
        >
          Save
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    if (modal.open && credModalProvider) {
      setModalContentGetter(credModalProvider === 'google' ? getGoogleCredModalContent : getAppleCredModalContent);
      bumpModalContentKey();
    }
  }, [modal.open, credModalProvider, googleCredForm, appleCredForm, auth, setModalContentGetter, bumpModalContentKey]);

  const openGoogleCredentialsModal = () => {
    setGoogleCredForm({ clientId: auth.google.clientId, clientSecret: auth.google.clientSecret || '' });
    setCredModalProvider('google');
    openModal('Edit Google credentials', null);
  };

  const openAppleCredentialsModal = () => {
    setAppleCredForm({
      clientId: auth.apple.clientId,
      teamId: auth.apple.teamId,
      keyId: auth.apple.keyId,
      privateKey: auth.apple.privateKey || '',
    });
    setCredModalProvider('apple');
    openModal('Edit Apple credentials', null);
  };

  const getCategoryModalContent = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
        <input
          type="text"
          value={categoryForm.name}
          onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))}
          className="input w-full"
          placeholder="e.g. Visa Updates"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Slug (optional)</label>
        <input
          type="text"
          value={categoryForm.slug}
          onChange={e => setCategoryForm(f => ({ ...f, slug: e.target.value }))}
          className="input w-full"
          placeholder="e.g. visa-updates"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Order</label>
        <input
          type="number"
          value={categoryForm.order}
          onChange={e => setCategoryForm(f => ({ ...f, order: Number(e.target.value) || 0 }))}
          className="input w-full"
        />
      </div>
      <div className="flex gap-2 pt-4 border-t border-slate-100">
        <button type="button" onClick={() => { closeModal(); setCategoryModalOpen(false); setEditingCategoryId(null); }} className="btn-secondary">Cancel</button>
        <button
          type="button"
          disabled={savingCategory}
          onClick={async () => {
            setSavingCategory(true);
            try {
              const body = { name: categoryForm.name.trim(), slug: categoryForm.slug.trim() || undefined, order: categoryForm.order };
              if (editingCategoryId) {
                const res = await authFetch(`/api/admin/news/categories/${editingCategoryId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                });
                const data = await safeJson(res);
                if (!res.ok) throw new Error((data as any)?.error || 'Update failed');
                showToast('Category updated', 'success');
              } else {
                const res = await authFetch('/api/admin/news/categories', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                });
                const data = await safeJson(res);
                if (!res.ok) throw new Error((data as any)?.error || 'Create failed');
                showToast('Category added', 'success');
              }
              closeModal();
              setCategoryModalOpen(false);
              setEditingCategoryId(null);
              setCategoryForm({ name: '', slug: '', order: 0 });
              fetchNewsCategories();
            } catch (e: any) {
              showToast(e?.message || 'Request failed', 'error');
            } finally {
              setSavingCategory(false);
            }
          }}
          className="btn-primary disabled:opacity-50"
        >
          {editingCategoryId ? (savingCategory ? 'Saving…' : 'Save') : savingCategory ? 'Adding…' : 'Add'}
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    if (modal.open && categoryModalOpen) {
      setModalContentGetter(getCategoryModalContent);
      bumpModalContentKey();
    }
  }, [modal.open, categoryModalOpen, categoryForm, savingCategory, editingCategoryId, setModalContentGetter, bumpModalContentKey]);

  const openAddCategoryModal = () => {
    setEditingCategoryId(null);
    setCategoryForm({ name: '', slug: '', order: newsCategories.length });
    setCategoryModalOpen(true);
    openModal('Add news category', null);
  };

  const openEditCategoryModal = (cat: NewsCategoryRow) => {
    setEditingCategoryId(cat._id);
    setCategoryForm({ name: cat.name, slug: cat.slug || '', order: cat.order ?? 0 });
    setCategoryModalOpen(true);
    openModal('Edit news category', null);
  };

  const handleDeleteCategory = (cat: NewsCategoryRow) => {
    openConfirm({
      title: 'Delete category',
      message: `Delete "${cat.name}"? Articles using it will need to be reassigned.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/admin/news/categories/${cat._id}`, { method: 'DELETE' });
          const data = res.ok ? null : await safeJson(res);
          if (res.ok) {
            showToast('Category deleted', 'success');
            fetchNewsCategories();
          } else {
            showToast((data as any)?.error || 'Delete failed', 'error');
          }
        } catch (err: any) {
          showToast(err?.message || 'Request failed', 'error');
        }
      },
    });
  };

  useEffect(() => {
    if (!modal.open) setCategoryModalOpen(false);
  }, [modal.open]);

  const tabs: { id: TabId; label: string; icon: typeof Mail }[] = [
    { id: 'smtp', label: 'SMTP', icon: Mail },
    { id: 'auth', label: 'Authentication', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'news-categories', label: 'News categories', icon: FolderPlus },
  ];

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Advanced Settings</h1>
        <p className="text-slate-500 mt-1">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900">Advanced Settings</h1>
      <p className="text-slate-500 mt-1">Platform-wide SMTP, sign-in providers, and notification preferences.</p>

      <div className="flex gap-1 mt-6 border-b border-slate-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm rounded-t-lg transition ${activeTab === id ? 'bg-amber-600/10 text-amber-700 border-b-2 border-amber-600 -mb-px' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="card mt-0 rounded-t-none">
        {activeTab === 'smtp' && (
          <div className="space-y-4">
            <h2 className="font-display font-semibold text-slate-900 flex items-center gap-2"><Mail className="w-5 h-5 text-ori-600" /> SMTP</h2>
            <p className="text-slate-600 text-sm">Default platform email (e.g. for system emails). Consultancies can use their own profiles.</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={smtp.enabled}
                onChange={e => updateSmtp({ enabled: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-ori-600 focus:ring-ori-500/50"
              />
              <span className="text-sm font-medium text-slate-700">Enable platform SMTP</span>
            </label>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Host</label>
                <input value={smtp.host} onChange={e => updateSmtp({ host: e.target.value })} className="input w-full" placeholder="smtp.example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
                <input type="number" value={smtp.port} onChange={e => updateSmtp({ port: Number(e.target.value) || 587 })} className="input w-full" placeholder="587" />
                <p className="text-xs text-slate-500 mt-1">587 = STARTTLS (secure unchecked). 465 = implicit TLS (secure checked).</p>
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <input type="checkbox" checked={smtp.secure} onChange={e => updateSmtp({ secure: e.target.checked })} className="w-5 h-5 rounded border-slate-300 text-ori-600" />
                <span className="text-sm font-medium text-slate-700">Use implicit TLS (required for port 465 only)</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">User</label>
                <input value={smtp.user} onChange={e => updateSmtp({ user: e.target.value })} className="input w-full" placeholder="SMTP user" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input type="password" value={smtp.pass} onChange={e => updateSmtp({ pass: e.target.value })} className="input w-full" placeholder="Leave blank to keep" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">From address</label>
                <input type="email" value={smtp.from} onChange={e => updateSmtp({ from: e.target.value })} className="input w-full" placeholder="noreply@example.com" />
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <button type="button" onClick={handleSaveSmtp} disabled={saving} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save SMTP'}</button>
            </div>
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="space-y-6">
            <h2 className="font-display font-semibold text-slate-900 flex items-center gap-2"><Shield className="w-5 h-5 text-ori-600" /> Authentication</h2>
            <p className="text-slate-600 text-sm">Control Google and Apple sign-in. Credentials are stored securely.</p>

            <div className="card bg-slate-50/50">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-medium text-slate-900">Google (Gmail)</h3>
                  <p className="text-sm text-slate-500">Sign in with Google</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={openGoogleCredentialsModal} className="btn-secondary flex items-center gap-2"><Pencil className="w-4 h-4" /> Edit credentials</button>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={auth.google.enabled}
                      onChange={() => {
                        if (auth.google.enabled) handleDisableProvider('google', 'Google');
                        else updateAuth('google', { enabled: true });
                      }}
                      className="w-5 h-5 rounded border-slate-300 text-ori-600"
                    />
                    <span className="text-sm font-medium text-slate-700">Enabled</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="card bg-slate-50/50">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-medium text-slate-900">Apple</h3>
                  <p className="text-sm text-slate-500">Sign in with Apple</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={openAppleCredentialsModal} className="btn-secondary flex items-center gap-2"><Pencil className="w-4 h-4" /> Edit credentials</button>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={auth.apple.enabled}
                      onChange={() => {
                        if (auth.apple.enabled) handleDisableProvider('apple', 'Apple');
                        else updateAuth('apple', { enabled: true });
                      }}
                      className="w-5 h-5 rounded border-slate-300 text-ori-600"
                    />
                    <span className="text-sm font-medium text-slate-700">Enabled</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <button type="button" onClick={handleSaveAuth} disabled={saving} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save authentication'}</button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h2 className="font-display font-semibold text-slate-900 flex items-center gap-2"><Bell className="w-5 h-5 text-ori-600" /> Notifications</h2>
            <p className="text-slate-600 text-sm">Global notification preferences.</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.emailEnabled}
                onChange={e => updateNotifications({ emailEnabled: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-ori-600 focus:ring-ori-500/50"
              />
              <span className="text-sm font-medium text-slate-700">Email notifications enabled</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.inAppEnabled}
                onChange={e => updateNotifications({ inAppEnabled: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-ori-600 focus:ring-ori-500/50"
              />
              <span className="text-sm font-medium text-slate-700">In-app notifications enabled</span>
            </label>
            <div className="pt-4 border-t border-slate-100">
              <button type="button" onClick={handleSaveNotifications} disabled={saving} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save notifications'}</button>
            </div>
          </div>
        )}

        {activeTab === 'news-categories' && (
          <div className="space-y-4">
            <h2 className="font-display font-semibold text-slate-900 flex items-center gap-2"><FolderPlus className="w-5 h-5 text-ori-600" /> News categories</h2>
            <p className="text-slate-600 text-sm">Categories for news articles. Use these when adding or editing news in the News section.</p>
            <div className="flex justify-end">
              <button type="button" onClick={openAddCategoryModal} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add category</button>
            </div>
            {newsCategories.length === 0 ? (
              <p className="text-slate-500 text-sm">No categories yet. Add one to assign to news articles.</p>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-700">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-700">Slug</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-700">Order</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {newsCategories.map(cat => (
                    <tr key={cat._id} className="border-b border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-900">{cat.name}</td>
                      <td className="px-4 py-3 text-slate-600">{cat.slug}</td>
                      <td className="px-4 py-3 text-slate-500">{cat.order ?? 0}</td>
                      <td className="px-4 py-3 flex gap-1">
                        <button type="button" onClick={() => openEditCategoryModal(cat)} className="p-2 text-ori-600 hover:bg-ori-50 rounded" title="Edit"><Pencil className="w-4 h-4" /></button>
                        <button type="button" onClick={() => handleDeleteCategory(cat)} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
