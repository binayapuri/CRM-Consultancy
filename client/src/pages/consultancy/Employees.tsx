import { useEffect, useState } from 'react';
import { authFetch } from '../../store/auth';
import { useAuthStore } from '../../store/auth';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Pencil, UserX } from 'lucide-react';

export default function Employees() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const [employees, setEmployees] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ email: '', password: '', role: 'AGENT', profile: { firstName: '', lastName: '', phone: '' } });

  const canAdd = ['SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER'].includes(user?.role || '');
  const canDelete = ['SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER'].includes(user?.role || '');

  useEffect(() => {
    const url = consultancyId ? `/api/employees?consultancyId=${consultancyId}` : '/api/employees';
    authFetch(url).then(r => r.json()).then(setEmployees);
  }, [consultancyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await authFetch(`/api/employees/${editing._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: form.profile, role: form.role }),
        });
      } else {
        await authFetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      setShowForm(false);
      setEditing(null);
      setForm({ email: '', password: '', role: 'AGENT', profile: { firstName: '', lastName: '', phone: '' } });
      authFetch(consultancyId ? `/api/employees?consultancyId=${consultancyId}` : '/api/employees').then(r => r.json()).then(setEmployees);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this employee? They will not be able to login.')) return;
    try {
      await authFetch(`/api/employees/${id}`, { method: 'DELETE' });
      authFetch(consultancyId ? `/api/employees?consultancyId=${consultancyId}` : '/api/employees').then(r => r.json()).then(setEmployees);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Employees</h1>
          <p className="text-slate-500 mt-1">Manage team members and roles. Only admin can delete.</p>
        </div>
        {canAdd && <button onClick={() => { setShowForm(true); setEditing(null); setForm({ email: '', password: '', role: 'AGENT', profile: { firstName: '', lastName: '', phone: '' } }); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Employee</button>}
      </div>

      {showForm && (
        <div className="card mt-6 max-w-md">
          <h2 className="font-display font-semibold mb-4">{editing ? 'Edit Employee' : 'Add Employee'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" required disabled={!!editing} /></div>
            {!editing && <div><label className="block text-sm font-medium text-slate-700 mb-1">Password (optional - temp123 if blank)</label><input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input" /></div>}
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">First Name</label><input value={form.profile.firstName} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, firstName: e.target.value } }))} className="input" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label><input value={form.profile.lastName} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, lastName: e.target.value } }))} className="input" /></div>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Role</label><select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input" disabled={editing?.role === 'CONSULTANCY_ADMIN'}><option value="AGENT">Agent</option><option value="MANAGER">Manager (full access)</option>{editing?.role === 'CONSULTANCY_ADMIN' && <option value="CONSULTANCY_ADMIN">Admin (owner)</option>}</select></div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Save</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary">Cancel</button>
            </div>
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
              <th className="text-left px-4 py-3 font-medium text-slate-700">MARN</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp: any) => (
              <tr key={emp._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium"><Link to={`/consultancy/employees/${emp._id}`} className="text-ori-600 hover:underline">{emp.profile?.firstName} {emp.profile?.lastName}</Link></td>
                <td className="px-4 py-3 text-slate-600">{emp.email}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${emp.role === 'CONSULTANCY_ADMIN' ? 'bg-amber-100 text-amber-700' : emp.role === 'MANAGER' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>{emp.role}</span></td>
                <td className="px-4 py-3 text-slate-600">{emp.profile?.marnNumber || '-'}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => { setEditing(emp); setForm({ email: emp.email, password: '', role: emp.role, profile: { firstName: emp.profile?.firstName || '', lastName: emp.profile?.lastName || '', phone: emp.profile?.phone || '' } }); setShowForm(true); }} className="p-2 text-ori-600 hover:bg-ori-50 rounded"><Pencil className="w-4 h-4" /></button>
                  {canDelete && emp._id !== user?.id && emp.role !== 'CONSULTANCY_ADMIN' && <button onClick={() => handleDeactivate(emp._id)} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Deactivate"><UserX className="w-4 h-4" /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
