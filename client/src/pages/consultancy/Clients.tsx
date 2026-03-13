import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authFetch } from '../../store/auth';
import { format } from 'date-fns';
import { Search, Plus, Filter, X, Users, Mail } from 'lucide-react';
import { TableSkeleton } from '../../components/Skeleton';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING_ACCESS', label: 'Pending Access' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'DISCONNECTED', label: 'Disconnected' },
];

export default function Clients() {
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const [clients, setClients] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showRequestAccess, setShowRequestAccess] = useState(false);
  const [requestEmail, setRequestEmail] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState({ text: '', type: '' });

  const fetchData = () => {
    setLoading(true);
    const url = consultancyId ? `/api/clients?consultancyId=${consultancyId}` : '/api/clients';
    Promise.all([
      authFetch(url).then(r => r.json()),
      authFetch(consultancyId ? `/api/employees?consultancyId=${consultancyId}` : '/api/employees').then(r => r.json()).catch(() => []),
    ]).then(([data, agentsData]) => {
      setClients(Array.isArray(data) ? data : []);
      setAgents(Array.isArray(agentsData) ? agentsData : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [consultancyId]);

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestEmail) return;
    setRequestLoading(true);
    setRequestMessage({ text: '', type: '' });
    
    try {
      // POST to /api/clients creates a PENDING_ACCESS client if student exists
      const body: any = { profile: { email: requestEmail } };
      if (consultancyId) body.consultancyId = consultancyId;
      
      const res = await authFetch('/api/clients', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request access');
      
      setRequestMessage({ text: 'Access request sent successfully! Waiting for student approval.', type: 'success' });
      setRequestEmail('');
      fetchData(); // Refresh list to show PENDING_ACCESS client
      
      setTimeout(() => {
        setShowRequestAccess(false);
        setRequestMessage({ text: '', type: '' });
      }, 3000);
    } catch (err: any) {
      setRequestMessage({ text: err.message, type: 'error' });
    } finally {
      setRequestLoading(false);
    }
  };

  const clientsList = Array.isArray(clients) ? clients : [];
  const filtered = clientsList.filter(c => {
    const matchSearch = `${c.profile?.firstName} ${c.profile?.lastName} ${c.profile?.email} ${c.profile?.currentVisa}`.toLowerCase().includes(q.toLowerCase());
    const matchStatus = !filterStatus || (c.status || 'ACTIVE') === filterStatus;
    const matchAgent = !filterAgent || (c.assignedAgentId?._id || c.assignedAgentId) === filterAgent;
    return matchSearch && matchStatus && matchAgent;
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 mt-1">Manage your client profiles</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowRequestAccess(true)} className="btn-secondary flex items-center gap-2 border-ori-200 text-ori-700 hover:bg-ori-50">
            <Mail className="w-4 h-4" /> Request Access
          </button>
          <Link to={consultancyId ? `enroll?consultancyId=${consultancyId}` : 'enroll'} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Enroll Client
          </Link>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input placeholder="Search by name, email, visa..." value={q} onChange={e => setQ(e.target.value)} className="input pl-10" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary flex items-center gap-2 ${showFilters ? 'ring-2 ring-ori-500' : ''}`}><Filter className="w-4 h-4" /> Filters</button>
        {showFilters && (
          <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input w-full md:w-40">
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)} className="input w-full md:w-48">
              <option value="">All agents</option>
              {(Array.isArray(agents) ? agents : []).map(a => <option key={a._id} value={a._id}>{a.profile?.firstName} {a.profile?.lastName}</option>)}
            </select>
            {(filterStatus || filterAgent) && <button onClick={() => { setFilterStatus(''); setFilterAgent(''); }} className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1"><X className="w-4 h-4" /> Clear</button>}
          </div>
        )}
      </div>
      <div className="card mt-6 overflow-hidden">
        {loading ? (
          <div className="p-6"><TableSkeleton rows={8} /></div>
        ) : (
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Visa</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Last Activity</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c: any) => (
              <tr key={c._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <Link to={consultancyId ? `/consultancy/clients/${c._id}?consultancyId=${consultancyId}` : `/consultancy/clients/${c._id}`} className="font-medium text-ori-600 hover:text-ori-700 hover:underline">
                    {c.profile?.firstName} {c.profile?.lastName}
                  </Link>
                  {c.status === 'PENDING_ACCESS' && <div className="text-[10px] text-amber-600 font-bold bg-amber-50 inline-block px-1.5 rounded mt-1">Awaiting Student Approval</div>}
                </td>
                <td className="px-4 py-3 text-slate-600">{c.profile?.email}</td>
                <td className="px-4 py-3 text-slate-600">{c.profile?.currentVisa || '-'}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status || 'ACTIVE'} /></td>
                <td className="px-4 py-3 text-slate-500 text-sm">
                  {c.lastActivityAt ? format(new Date(c.lastActivityAt), 'dd MMM yyyy') : '-'}
                </td>
                <td className="px-4 py-3">
                  <Link to={consultancyId ? `/consultancy/clients/${c._id}?consultancyId=${consultancyId}` : `/consultancy/clients/${c._id}`} className="text-ori-600 hover:underline text-sm">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
        {!loading && !filtered.length && <EmptyState icon={Users} title={clients.length ? 'No clients match filters' : 'No clients'} message={clients.length ? 'Try adjusting your search or filters.' : 'Enroll your first client to get started.'} action={!clients.length && <Link to={consultancyId ? `enroll?consultancyId=${consultancyId}` : 'enroll'} className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Enroll Client</Link>} />}
      </div>

      {showRequestAccess && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-900 flex items-center gap-2"><Mail className="w-5 h-5 text-ori-600" /> Request Student Access</h2>
              <button onClick={() => setShowRequestAccess(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                If a student has already created an independent profile on BIGFEW, you can request access to manage their profile and visa applications.
              </p>
              {requestMessage.text && (
                <div className={`p-3 rounded-lg text-sm font-medium mb-4 flex items-start gap-2 ${requestMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {requestMessage.text}
                </div>
              )}
              <form onSubmit={handleRequestAccess}>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Student's Registered Email</label>
                <input 
                  type="email" 
                  required 
                  value={requestEmail} 
                  onChange={e => setRequestEmail(e.target.value)} 
                  className="input mb-4" 
                  placeholder="student@example.com"
                />
                <div className="flex gap-3 justify-end mt-6">
                  <button type="button" onClick={() => setShowRequestAccess(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={requestLoading} className="btn-primary flex items-center gap-2">
                    {requestLoading ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Mail className="w-4 h-4" />}
                    Send Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
