import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authFetch } from '../../store/auth';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';

export default function SuperConsultancies() {
  const [consultancies, setConsultancies] = useState<any[]>([]);

  const fetchConsultancies = () => authFetch('/api/consultancies').then(r => r.json()).then(setConsultancies);

  useEffect(() => {
    fetchConsultancies();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete consultancy "${name}"? This cannot be undone.`)) return;
    try {
      const res = await authFetch(`/api/consultancies/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchConsultancies();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Consultancies</h1>
          <p className="text-slate-500 mt-1">All registered consultancies</p>
        </div>
        <Link to="/admin/consultancies/add" className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Consultancy</Link>
      </div>
      <div className="card mt-6 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">ABN</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Specializations</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Verified</th>
              <th className="text-right px-4 py-3 font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {consultancies.map((c: any) => (
              <tr key={c._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium">{c.displayName || c.name}</td>
                <td className="px-4 py-3 text-slate-600">{c.abn || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{c.specializations?.join(', ') || '-'}</td>
                <td className="px-4 py-3">{c.verified ? <span className="text-green-600 font-medium">✓</span> : '-'}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/admin/consultancies/${c._id}`} className="p-2 text-ori-600 hover:bg-ori-50 rounded inline-block" title="View details"><Eye className="w-4 h-4" /></Link>
                  <Link to={`/admin/consultancies/${c._id}/edit`} className="p-2 text-slate-600 hover:bg-slate-100 rounded inline-block" title="Edit"><Pencil className="w-4 h-4" /></Link>
                  <button onClick={() => handleDelete(c._id, c.name)} className="p-2 text-red-500 hover:bg-red-50 rounded inline-block" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
