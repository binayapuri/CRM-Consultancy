import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authFetch } from '../../store/auth';
import { useAuthStore } from '../../store/auth';
import { format } from 'date-fns';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { History } from 'lucide-react';

export default function TraceHistory() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const urlConsultancyId = searchParams.get('consultancyId');
  const [logs, setLogs] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [consultancies, setConsultancies] = useState<any[]>([]);
  const [filters, setFilters] = useState({ consultancyId: urlConsultancyId || '', clientId: '', entityType: '', userId: '', assignedAgentId: '', visaSubclass: '', dateFrom: '', dateTo: '', page: 1 });
  const [total, setTotal] = useState(0);
  const [employees, setEmployees] = useState<any[]>([]);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (urlConsultancyId && !filters.consultancyId) setFilters(f => ({ ...f, consultancyId: urlConsultancyId }));
  }, [urlConsultancyId]);

  useEffect(() => {
    const clientsUrl = filters.consultancyId ? `/api/clients?consultancyId=${filters.consultancyId}` : '/api/clients';
    const employeesUrl = filters.consultancyId ? `/api/employees?consultancyId=${filters.consultancyId}` : '/api/employees';
    authFetch(clientsUrl).then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : []));
    authFetch(employeesUrl).then(r => r.json()).then(d => setEmployees(Array.isArray(d) ? d : []));
    if (isSuperAdmin) authFetch('/api/consultancies').then(r => r.json()).then((d: any) => setConsultancies(Array.isArray(d?.consultancies) ? d.consultancies : Array.isArray(d) ? d : []));
  }, [filters.consultancyId, isSuperAdmin]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (isSuperAdmin && filters.consultancyId) params.set('consultancyId', filters.consultancyId);
    if (filters.clientId) params.set('clientId', filters.clientId);
    if (filters.entityType) params.set('entityType', filters.entityType);
    if (filters.userId) params.set('userId', filters.userId);
    if (filters.assignedAgentId) params.set('assignedAgentId', filters.assignedAgentId);
    if (filters.visaSubclass) params.set('visaSubclass', filters.visaSubclass);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    params.set('page', String(filters.page));
    params.set('limit', '50');
    authFetch(`/api/audit?${params}`).then(r => r.json()).then((data: any) => { setLogs(Array.isArray(data?.logs) ? data.logs : []); setTotal(Number(data?.total) || 0); });
  }, [filters, isSuperAdmin]);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900">Trace History</h1>
      <p className="text-slate-500 mt-1">Every change across the system. Filter by client, user, date, visa, or assigned employee.</p>
      <div className="card mt-6 p-4 flex flex-wrap gap-4">
        {isSuperAdmin && (
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Consultancy</label>
            <select value={filters.consultancyId} onChange={e => setFilters(f => ({ ...f, consultancyId: e.target.value, page: 1 }))} className="input">
              <option value="">All consultancies</option>
              {(Array.isArray(consultancies) ? consultancies : []).map((c: any) => <option key={c._id} value={c._id}>{c.displayName || c.name}</option>)}
            </select>
          </div>
        )}
        <div className="min-w-[180px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
          <select value={filters.clientId} onChange={e => setFilters(f => ({ ...f, clientId: e.target.value, page: 1 }))} className="input">
            <option value="">All clients</option>
            {(Array.isArray(clients) ? clients : []).map((c: any) => <option key={c._id} value={c._id}>{c.profile?.firstName} {c.profile?.lastName}</option>)}
          </select>
        </div>
        <div className="min-w-[180px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">Employee Assigned</label>
          <select value={filters.assignedAgentId} onChange={e => setFilters(f => ({ ...f, assignedAgentId: e.target.value, page: 1 }))} className="input">
            <option value="">All</option>
            {(Array.isArray(employees) ? employees : []).map((e: any) => <option key={e._id} value={e._id}>{e.profile?.firstName} {e.profile?.lastName}</option>)}
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
            {(Array.isArray(employees) ? employees : []).map((e: any) => <option key={e._id} value={e._id}>{e.profile?.firstName} {e.profile?.lastName}</option>)}
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
            <option value="Lead">Lead</option>
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
              {(Array.isArray(logs) ? logs : []).map((log: any) => (
                <tr key={log._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{format(new Date(log.changedAt), 'dd MMM yyyy HH:mm')}</td>
                  <td className="px-4 py-3 text-sm">{log.entityType}{log.visaSubclass ? ` (${log.visaSubclass})` : ''}</td>
                  <td className="px-4 py-3"><StatusBadge status={log.action} /></td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate" title={log.description}>{log.description || '-'}</td>
                  <td className="px-4 py-3 text-sm">{log.changedBy?.profile?.firstName} {log.changedBy?.profile?.lastName}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{log.assignedAgentId ? `${log.assignedAgentId.profile?.firstName} ${log.assignedAgentId.profile?.lastName}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!(Array.isArray(logs) && logs.length) && <EmptyState icon={History} title="No audit logs" message="No activity matches your filters. Try adjusting date range or filters." />}
      </div>
    </div>
  );
}
