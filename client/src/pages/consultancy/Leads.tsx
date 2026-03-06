import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch } from '../../store/auth';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, UserPlus, Search, Filter, X } from 'lucide-react';
import { TableSkeleton } from '../../components/Skeleton';

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-slate-100 text-slate-700',
  CONTACTED: 'bg-blue-100 text-blue-700',
  QUALIFIED: 'bg-amber-100 text-amber-700',
  CONVERTED: 'bg-green-100 text-green-700',
  LOST: 'bg-red-100 text-red-700',
};

const STATUS_OPTIONS = ['', 'NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'];
const SOURCE_OPTIONS = ['', 'Website', 'Referral', 'Walk-in', 'Social'];

export default function Leads() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchLeads = () => {
    const url = consultancyId ? `/api/leads?consultancyId=${consultancyId}` : '/api/leads';
    authFetch(url).then(r => r.json()).then(data => { setLeads(data); setLoading(false); });
  };
  useEffect(() => { setLoading(true); fetchLeads(); }, [consultancyId]);

  const filtered = leads.filter(l => {
    const matchSearch = `${l.profile?.firstName} ${l.profile?.lastName} ${l.profile?.email} ${l.profile?.interest}`.toLowerCase().includes(q.toLowerCase());
    const matchStatus = !filterStatus || l.status === filterStatus;
    const matchSource = !filterSource || (l.source || '').toLowerCase() === filterSource.toLowerCase();
    return matchSearch && matchStatus && matchSource;
  });

  const handleConvert = async (leadId: string) => {
    if (!confirm('Convert this lead to a client?')) return;
    try {
      const res = await authFetch(`/api/leads/${leadId}/convert`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.client?._id) navigate(`/consultancy/clients/${data.client._id}`);
      else fetchLeads();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm('Delete this lead?')) return;
    try {
      const res = await authFetch(`/api/leads/${leadId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      setLoading(true);
      fetchLeads();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Leads</h1>
          <p className="text-slate-500 mt-1">Manage incoming leads</p>
        </div>
        <Link to="/consultancy/leads/add" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Lead
        </Link>
      </div>
      <div className="mt-6 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input placeholder="Search by name, email, interest..." value={q} onChange={e => setQ(e.target.value)} className="input pl-10" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary flex items-center gap-2 ${showFilters ? 'ring-2 ring-ori-500' : ''}`}><Filter className="w-4 h-4" /> Filters</button>
        {showFilters && (
          <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input w-full md:w-36">
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
            </select>
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="input w-full md:w-36">
              {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s || 'All sources'}</option>)}
            </select>
            {(filterStatus || filterSource) && <button onClick={() => { setFilterStatus(''); setFilterSource(''); }} className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1"><X className="w-4 h-4" /> Clear</button>}
          </div>
        )}
      </div>
      <div className="card mt-6 overflow-hidden">
        {loading ? <div className="p-6"><TableSkeleton rows={6} cols={6} /></div> : (
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Contact</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Interest</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Source</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Created</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l: any) => (
              <tr key={l._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium">{l.profile?.firstName} {l.profile?.lastName}</td>
                <td className="px-4 py-3 text-slate-600">{l.profile?.email}</td>
                <td className="px-4 py-3 text-slate-600">{l.profile?.interest || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{l.source || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[l.status] || 'bg-slate-100'}`}>
                    {l.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-sm">{format(new Date(l.createdAt), 'dd MMM yyyy')}</td>
                <td className="px-4 py-3 flex gap-2">
                  <Link to={`/consultancy/leads/${l._id}/edit`} className="p-2 text-ori-600 hover:bg-ori-50 rounded" title="Edit"><Pencil className="w-4 h-4" /></Link>
                  {l.status !== 'CONVERTED' && <button onClick={() => handleConvert(l._id)} className="p-2 text-green-600 hover:bg-green-50 rounded" title="Convert to Client"><UserPlus className="w-4 h-4" /></button>}
                  <button onClick={() => handleDelete(l._id)} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
        {!loading && !filtered.length && <div className="p-12 text-center text-slate-500">{leads.length ? 'No leads match filters' : 'No leads'}</div>}
      </div>
    </div>
  );
}
