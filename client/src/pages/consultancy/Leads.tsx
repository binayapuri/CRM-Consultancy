import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch } from '../../store/auth';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, UserPlus, Search, Filter, X, UserPlus as LeadIcon } from 'lucide-react';
import { TableSkeleton } from '../../components/Skeleton';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

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
  const [filterAgent, setFilterAgent] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);

  const fetchLeads = () => {
    const url = consultancyId ? `/api/leads?consultancyId=${consultancyId}` : '/api/leads';
    authFetch(url).then(r => r.json()).then((data: unknown) => { setLeads(Array.isArray(data) ? data : []); setLoading(false); });
  };
  useEffect(() => { setLoading(true); fetchLeads(); }, [consultancyId]);
  useEffect(() => {
    authFetch(consultancyId ? `/api/employees?consultancyId=${consultancyId}` : '/api/employees').then(r => r.json()).then((d: unknown) => setAgents(Array.isArray(d) ? d : [])).catch(() => setAgents([]));
  }, [consultancyId]);

  const leadsList = Array.isArray(leads) ? leads : [];
  const filtered = leadsList.filter(l => {
    const matchSearch = `${l.profile?.firstName} ${l.profile?.lastName} ${l.profile?.email} ${l.profile?.interest}`.toLowerCase().includes(q.toLowerCase());
    const matchStatus = !filterStatus || l.status === filterStatus;
    const matchSource = !filterSource || (l.source || '').toLowerCase() === filterSource.toLowerCase();
    const matchAgent = !filterAgent || (l.assignedTo?._id || l.assignedTo) === filterAgent;
    return matchSearch && matchStatus && matchSource && matchAgent;
  });

  const handleConvert = async (leadId: string) => {
    if (!confirm('Convert this lead to a client?')) return;
    try {
      const res = await authFetch(`/api/leads/${leadId}/convert`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.client?._id) navigate(consultancyId ? `/consultancy/clients/${data.client._id}?consultancyId=${consultancyId}` : `/consultancy/clients/${data.client._id}`);
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
        <Link to={consultancyId ? `/consultancy/leads/add?consultancyId=${consultancyId}` : '/consultancy/leads/add'} className="btn-primary flex items-center gap-2">
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
            <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)} className="input w-full md:w-40">
              <option value="">All agents</option>
              {(Array.isArray(agents) ? agents : []).map((a: any) => <option key={a._id} value={a._id}>{a.profile?.firstName} {a.profile?.lastName}</option>)}
            </select>
            {(filterStatus || filterSource || filterAgent) && <button onClick={() => { setFilterStatus(''); setFilterSource(''); setFilterAgent(''); }} className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1"><X className="w-4 h-4" /> Clear</button>}
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
                <td className="px-4 py-3 font-medium">
                  <Link to={consultancyId ? `/consultancy/leads/${l._id}?consultancyId=${consultancyId}` : `/consultancy/leads/${l._id}`} className="text-ori-600 hover:underline">{l.profile?.firstName} {l.profile?.lastName}</Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{l.profile?.email}</td>
                <td className="px-4 py-3 text-slate-600">{l.profile?.interest || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{l.source || '-'}</td>
                <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                <td className="px-4 py-3 text-slate-500 text-sm">{format(new Date(l.createdAt), 'dd MMM yyyy')}</td>
                <td className="px-4 py-3 flex gap-2">
                  <Link to={consultancyId ? `/consultancy/leads/${l._id}/edit?consultancyId=${consultancyId}` : `/consultancy/leads/${l._id}/edit`} className="p-2 text-ori-600 hover:bg-ori-50 rounded" title="Edit"><Pencil className="w-4 h-4" /></Link>
                  {l.status !== 'CONVERTED' && <button onClick={() => handleConvert(l._id)} className="p-2 text-green-600 hover:bg-green-50 rounded" title="Convert to Client"><UserPlus className="w-4 h-4" /></button>}
                  <button onClick={() => handleDelete(l._id)} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
        {!loading && !filtered.length && <EmptyState icon={LeadIcon} title={leads.length ? 'No leads match filters' : 'No leads'} message={leads.length ? 'Try adjusting your search or filters.' : 'Add your first lead to get started.'} action={!leads.length && <Link to={consultancyId ? `/consultancy/leads/add?consultancyId=${consultancyId}` : '/consultancy/leads/add'} className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add Lead</Link>} />}
      </div>
    </div>
  );
}
