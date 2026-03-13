import { useEffect, useState } from 'react';
import { authFetch } from '../../store/auth';
import { Plus, UserCheck, Pencil, UserX } from 'lucide-react';

export default function SuperUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [consultancies, setConsultancies] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ email: '', password: 'test123', role: 'STUDENT', profile: { firstName: '', lastName: '' }, consultancyId: '' } as any);

  const fetchUsers = () => authFetch('/api/users').then(r => r.json()).then(setUsers);

  useEffect(() => {
    fetchUsers();
    authFetch('/api/consultancies').then(r => r.json()).then(setConsultancies);
  }, []);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { ...form };
      if (payload.consultancyId === '') delete payload.consultancyId;
      const res = await authFetch('/api/users/test-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setShowForm(false);
      setForm({ email: '', password: 'test123', role: 'STUDENT', profile: { firstName: '', lastName: '' }, consultancyId: '' });
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const payload: any = { role: form.role, profile: { firstName: form.profile.firstName, lastName: form.profile.lastName, consultancyId: form.consultancyId || null } };
      if (form.password) payload.password = form.password;
      const res = await authFetch(`/api/users/${editing._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setEditing(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeactivate = async (u: any) => {
    if (!confirm(`Deactivate ${u.email}? They will not be able to login.`)) return;
    try {
      const res = await authFetch(`/api/users/${u._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Users</h1>
          <p className="text-slate-500 mt-1">All platform users. Create test accounts, edit roles, assign consultancies.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Create Test Account</button>
      </div>

      {showForm && (
        <div className="card mt-6 max-w-md">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2"><UserCheck className="w-5 h-5 text-ori-600" /> Create Test Account</h2>
          <form onSubmit={handleCreateTest} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Email *</label><input type="email" value={form.email} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} className="input" required /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Password *</label><input type="password" value={form.password} onChange={e => setForm((f: any) => ({ ...f, password: e.target.value }))} className="input" required /></div>
            <div className="grid grid-cols-2 gap-2">
              <input value={form.profile.firstName} onChange={e => setForm((f: any) => ({ ...f, profile: { ...f.profile, firstName: e.target.value } }))} className="input" placeholder="First Name" />
              <input value={form.profile.lastName} onChange={e => setForm((f: any) => ({ ...f, profile: { ...f.profile, lastName: e.target.value } }))} className="input" placeholder="Last Name" />
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Role</label><select value={form.role} onChange={e => setForm((f: any) => ({ ...f, role: e.target.value }))} className="input"><option value="STUDENT">Student</option><option value="AGENT">Agent</option><option value="MANAGER">Manager</option><option value="CONSULTANCY_ADMIN">Consultancy Admin</option></select></div>
            {['AGENT', 'MANAGER', 'CONSULTANCY_ADMIN'].includes(form.role) && (
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Consultancy</label><select value={form.consultancyId} onChange={e => setForm((f: any) => ({ ...f, consultancyId: e.target.value }))} className="input"><option value="">First consultancy</option>{consultancies.map((c: any) => <option key={c._id} value={c._id}>{c.displayName || c.name}</option>)}</select></div>
            )}
            <div className="flex gap-2"><button type="submit" className="btn-primary">Create</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button></div>
          </form>
        </div>
      )}

      {editing && (
        <div className="card mt-6 max-w-md border-2 border-ori-200">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2"><Pencil className="w-5 h-5 text-ori-600" /> Edit User</h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" value={editing.email} className="input bg-slate-50" readOnly /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">New Password (leave blank to keep)</label><input type="password" value={form.password} onChange={e => setForm((f: any) => ({ ...f, password: e.target.value }))} className="input" placeholder="••••••••" /></div>
            <div className="grid grid-cols-2 gap-2">
              <input value={form.profile.firstName} onChange={e => setForm((f: any) => ({ ...f, profile: { ...f.profile, firstName: e.target.value } }))} className="input" placeholder="First Name" />
              <input value={form.profile.lastName} onChange={e => setForm((f: any) => ({ ...f, profile: { ...f.profile, lastName: e.target.value } }))} className="input" placeholder="Last Name" />
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Role</label><select value={form.role} onChange={e => setForm((f: any) => ({ ...f, role: e.target.value }))} className="input"><option value="STUDENT">Student</option><option value="AGENT">Agent</option><option value="MANAGER">Manager</option><option value="CONSULTANCY_ADMIN">Consultancy Admin</option></select></div>
            {['AGENT', 'MANAGER', 'CONSULTANCY_ADMIN'].includes(form.role) && (
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Consultancy</label><select value={form.consultancyId} onChange={e => setForm((f: any) => ({ ...f, consultancyId: e.target.value }))} className="input"><option value="">—</option>{consultancies.map((c: any) => <option key={c._id} value={c._id}>{c.displayName || c.name}</option>)}</select></div>
            )}
            <div className="flex gap-2"><button type="submit" className="btn-primary">Save</button><button type="button" onClick={() => setEditing(null)} className="btn-secondary">Cancel</button></div>
          </form>
        </div>
      )}

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
                  <button onClick={() => { setEditing(u); setForm({ ...form, role: u.role, profile: { firstName: u.profile?.firstName || '', lastName: u.profile?.lastName || '' }, consultancyId: u.profile?.consultancyId?._id || u.profile?.consultancyId || '' }); }} className="p-2 text-ori-600 hover:bg-ori-50 rounded" title="Edit"><Pencil className="w-4 h-4" /></button>
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
