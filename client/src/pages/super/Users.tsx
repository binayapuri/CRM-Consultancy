import { useEffect, useState } from 'react';
import { authFetch } from '../../store/auth';

export default function SuperUsers() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    authFetch('/api/users').then(r => r.json()).then(setUsers);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900">Users</h1>
      <p className="text-slate-500 mt-1">All platform users</p>
      <div className="card mt-6 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u._id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium">{u.profile?.firstName} {u.profile?.lastName}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 rounded text-xs bg-slate-100">{u.role}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
