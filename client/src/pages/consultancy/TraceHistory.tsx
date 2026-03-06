import { useEffect, useState } from 'react';
import { authFetch } from '../../store/auth';
import { format } from 'date-fns';

export default function TraceHistory() {
  const [logs, setLogs] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [filters, setFilters] = useState({ clientId: '', entityType: '', userId: '', assignedAgentId: '', visaSubclass: '', dateFrom: '', dateTo: '', page: 1 });
  const [total, setTotal] = useState(0);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    authFetch('/api/clients').then(r => r.json()).then(setClients);
    authFetch('/api/employees').then(r => r.json()).then(setEmployees);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.clientId) params.set('clientId', filters.clientId);
    if (filters.entityType) params.set('entityType', filters.entityType);
    if (filters.userId) params.set('userId', filters.userId);
    if (filters.assignedAgentId) params.set('assignedAgentId', filters.assignedAgentId);
    if (filters.visaSubclass) params.set('visaSubclass', filters.visaSubclass);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    params.set('page', String(filters.page));
    params.set('limit', '50');
    authFetch(`/api/audit?${params}`).then(r => r.json()).then(data => { setLogs(data.logs || []); setTotal(data.total || 0); });
  }, [filters]);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900">Trace History</h1>
      <p className="text-slate-500 mt-1">Every change across the system. Filter by client, user, date, visa, or assigned employee.</p>
      <div className="card mt-6 p-4 flex flex-wrap gap-4">
        <div className="min-w-[180px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
          <select value={filters.clientId} onChange={e => setFilters(f => ({ ...f, clientId: e.target.value, page: 1 }))} className="input">
            <option value="">All clients</option>
            {clients.map((c: any) => <option key={c._id} value={c._id}>{c.profile?.firstName} {c.profile?.lastName}</option>)}
          </select>
        </div>
        <div className="min-w-[180px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">Employee Assigned</label>
          <select value={filters.assignedAgentId} onChange={e => setFilters(f => ({ ...f, assignedAgentId: e.target.value, page: 1 }))} className="input">
            <option value="">All</option>
            {employees.map((e: any) => <option key={e._id} value={e._id}>{e.profile?.firstName} {e.profile?.lastName}</option>)}
          </select>
        </div>
        <div className="min-w-[120px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">Visa</label>
          <select value={filters.visaSubclass} onChange={e => setFilters(f => ({ ...f, visaSubclass: e.target.value, page: 1 }))} className="input">
            <option value="">All</option>
            <option value="500">500</option>
            <option value="485">485</option>
            <option value="190">190</option>
            <option value="189">189</option>
            <option value="491">491</option>
            <option value="482">482</option>
            <option value="600">600</option>
          </select>
        </div>
        <div className="min-w-[180px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">Changed By</label>
          <select value={filters.userId} onChange={e => setFilters(f => ({ ...f, userId: e.target.value, page: 1 }))} className="input">
            <option value="">All</option>
            {employees.map((e: any) => <option key={e._id} value={e._id}>{e.profile?.firstName} {e.profile?.lastName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date From</label>
          <input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value, page: 1 }))} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date To</label>
          <input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value, page: 1 }))} className="input" />
        </div>
        <div className="min-w-[140px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">Entity Type</label>
          <select value={filters.entityType} onChange={e => setFilters(f => ({ ...f, entityType: e.target.value, page: 1 }))} className="input">
            <option value="">All</option>
            <option value="Client">Client</option>
            <option value="Application">Application</option>
            <option value="Task">Task</option>
            <option value="Document">Document</option>
          </select>
        </div>
      </div>
      {total > 0 && (
        <div className="flex items-center justify-between mt-2 text-sm text-slate-500">
          <span>{total} total entries</span>
          <div className="flex gap-2">
            <button onClick={() => setFilters(f => ({ ...f, page: Math.max(1, f.page - 1) }))} disabled={filters.page <= 1} className="btn-secondary text-sm py-1">Previous</button>
            <span className="py-1">Page {filters.page}</span>
            <button onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} disabled={filters.page * 50 >= total} className="btn-secondary text-sm py-1">Next</button>
          </div>
        </div>
      )}
      <div className="card mt-6 overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Date/Time</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Entity</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Action</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Description</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Changed By</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Assigned Agent</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{format(new Date(log.changedAt), 'dd MMM yyyy HH:mm')}</td>
                  <td className="px-4 py-3 text-sm">{log.entityType}{log.visaSubclass ? ` (${log.visaSubclass})` : ''}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${log.action === 'CREATE' ? 'bg-green-100 text-green-700' : log.action === 'DELETE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{log.action}</span></td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate" title={log.description}>{log.description || '-'}</td>
                  <td className="px-4 py-3 text-sm">{log.changedBy?.profile?.firstName} {log.changedBy?.profile?.lastName}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{log.assignedAgentId ? `${log.assignedAgentId.profile?.firstName} ${log.assignedAgentId.profile?.lastName}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!logs.length && <div className="p-12 text-center text-slate-500">No audit logs</div>}
      </div>
    </div>
  );
}
