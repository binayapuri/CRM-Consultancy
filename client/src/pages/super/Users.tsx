import { useEffect, useState } from 'react';
import { authFetch } from '../../store/auth';
import { useUiStore } from '../../store/ui';
import { Plus, Pencil, UserX } from 'lucide-react';

const emptyForm = () => ({
  email: '',
  password: 'test123',
  role: 'STUDENT' as string,
  profile: { firstName: '', lastName: '' },
  consultancyId: '',
  isActive: true,
});

export default function SuperUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [consultancies, setConsultancies] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const { openModal, closeModal, showToast, openConfirm, modal, setModalContentGetter, bumpModalContentKey } = useUiStore();

  const fetchUsers = () => authFetch('/api/users').then(r => r.json()).then(setUsers);

  useEffect(() => {
    fetchUsers();
    authFetch('/api/consultancies').then(r => r.json()).then(setConsultancies);
  }, []);

  const getFormContent = () => (
    <div className="space-y-4">
      {!editingUser ? (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input w-full" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input w-full" required />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={editingUser.email} className="input w-full bg-slate-50" readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password (leave blank to keep)</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input w-full" placeholder="••••••••" />
          </div>
        </>
      )}
      <div className="grid grid-cols-2 gap-2">
        <input value={form.profile.firstName} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, firstName: e.target.value } }))} className="input w-full" placeholder="First Name" />
        <input value={form.profile.lastName} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, lastName: e.target.value } }))} className="input w-full" placeholder="Last Name" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input w-full">
          <option value="STUDENT">Student</option>
          <option value="AGENT">Agent</option>
          <option value="MANAGER">Manager</option>
          <option value="CONSULTANCY_ADMIN">Consultancy Admin</option>
          <option value="UNIVERSITY_PARTNER">University Partner</option>
          <option value="EMPLOYER">Employer</option>
          <option value="RECRUITER">Recruiter</option>
          <option value="INSURANCE_PARTNER">Insurance Partner</option>
        </select>
      </div>
      {['AGENT', 'MANAGER', 'CONSULTANCY_ADMIN'].includes(form.role) && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Consultancy</label>
          <select value={form.consultancyId} onChange={e => setForm(f => ({ ...f, consultancyId: e.target.value }))} className="input w-full">
            <option value="">{editingUser ? '—' : 'First consultancy'}</option>
            {consultancies.map((c: any) => (
              <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
            ))}
          </select>
        </div>
      )}
      {editingUser && (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
            className="w-5 h-5 rounded border-slate-300 text-ori-600 focus:ring-ori-500/50"
          />
          <span className="text-sm font-medium text-slate-700">Active (can login)</span>
        </label>
      )}
      <div className="flex gap-2 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => {
            closeModal();
            setEditingUser(null);
            setForm(emptyForm());
          }}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              if (editingUser) {
                const payload: any = { role: form.role, profile: { firstName: form.profile.firstName, lastName: form.profile.lastName, consultancyId: form.consultancyId || null }, isActive: form.isActive };
                if (form.password) payload.password = form.password;
                const res = await authFetch(`/api/users/${editingUser._id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                const data = res.ok ? null : await res.json().catch(() => ({}));
                if (res.ok) {
                  closeModal();
                  setEditingUser(null);
                  setForm(emptyForm());
                  showToast('User updated', 'success');
                  fetchUsers();
                } else {
                  showToast(data?.error || 'Update failed', 'error');
                }
              } else {
                const payload: any = { ...form };
                if (payload.consultancyId === '') delete payload.consultancyId;
                const res = await authFetch('/api/users/test-account', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                const data = res.ok ? null : await res.json().catch(() => ({}));
                if (res.ok) {
                  closeModal();
                  setForm(emptyForm());
                  showToast('Test account created', 'success');
                  fetchUsers();
                } else {
                  showToast(data?.error || 'Create failed', 'error');
                }
              }
            } catch (err: any) {
              showToast(err?.message || 'Request failed', 'error');
            } finally {
              setSaving(false);
            }
          }}
          className="btn-primary disabled:opacity-50"
        >
          {editingUser ? (saving ? 'Saving...' : 'Save') : saving ? 'Creating...' : 'Create'}
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    if (modal.open) {
      setModalContentGetter(getFormContent);
      bumpModalContentKey();
    }
  }, [modal.open, form, saving, editingUser, consultancies, setModalContentGetter, bumpModalContentKey]);

  const openAddModal = () => {
    setEditingUser(null);
    setForm(emptyForm());
    openModal('Create Test Account', null);
  };

  const openEditModal = (u: any) => {
    setEditingUser(u);
    setForm({
      email: u.email || '',
      password: '',
      role: u.role || 'STUDENT',
      profile: { firstName: u.profile?.firstName || '', lastName: u.profile?.lastName || '' },
      consultancyId: u.profile?.consultancyId?._id || u.profile?.consultancyId || '',
      isActive: u.isActive !== false,
    });
    openModal('Edit User', null);
  };

  const handleDeactivate = (u: any) => {
    openConfirm({
      title: 'Deactivate User',
      message: `Deactivate ${u.email}? They will not be able to login.`,
      confirmLabel: 'Deactivate',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/users/${u._id}`, { method: 'DELETE' });
          const data = res.ok ? null : await res.json().catch(() => ({}));
          if (res.ok) {
            showToast('User deactivated', 'success');
            fetchUsers();
          } else {
            showToast(data?.error || 'Deactivate failed', 'error');
          }
        } catch (err: any) {
          showToast(err?.message || 'Request failed', 'error');
        }
      },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Users</h1>
          <p className="text-slate-500 mt-1">All platform users. Create test accounts, edit roles, assign consultancies.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Create Test Account</button>
      </div>

      <div className="card mt-6 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Role</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Consultancy</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u._id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium">{u.profile?.firstName} {u.profile?.lastName}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${u.role === 'SUPER_ADMIN' ? 'bg-amber-100 text-amber-700' : u.role === 'CONSULTANCY_ADMIN' ? 'bg-amber-100 text-amber-700' : u.role === 'MANAGER' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>{u.role}</span></td>
                <td className="px-4 py-3 text-slate-500 text-sm">
                  {typeof u.profile?.consultancyId === 'object' ? (u.profile.consultancyId?.displayName || u.profile.consultancyId?.name || '—') : '—'}
                </td>
                <td className="px-4 py-3">
                  {!u.isActive ? <span className="text-xs text-red-600">Inactive</span> : u.isTestAccount ? <span className="text-xs text-ori-600">Test</span> : '—'}
                </td>
                <td className="px-4 py-3 flex gap-1">
                  <button onClick={() => openEditModal(u)} className="p-2 text-ori-600 hover:bg-ori-50 rounded" title="Edit"><Pencil className="w-4 h-4" /></button>
                  {u.role !== 'SUPER_ADMIN' && u.isActive !== false && (
                    <button onClick={() => handleDeactivate(u)} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Deactivate"><UserX className="w-4 h-4" /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
