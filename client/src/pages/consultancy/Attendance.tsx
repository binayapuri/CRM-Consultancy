import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authFetch, safeJson } from '../../store/auth';
import { format } from 'date-fns';
import { LogIn, LogOut, Calendar, Users, Clock, Filter } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';
import FilterBar from '../../components/FilterBar';
import { useAuthStore } from '../../store/auth';

export default function Attendance() {
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const { user } = useAuthStore();
  const [today, setToday] = useState<any>(null);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({ from: '', to: '', userId: '' });
  const [employees, setEmployees] = useState<any[]>([]);
  const isAdmin = ['SUPER_ADMIN', 'CONSULTANCY_ADMIN'].includes(user?.role || '');

  const fetchToday = () => {
    authFetch('/api/attendance/me/today').then(r => safeJson(r)).then(setToday).catch(() => setToday(null));
  };

  const fetchList = () => {
    if (!isAdmin) return;
    setListLoading(true);
    const params = new URLSearchParams();
    if (consultancyId) params.set('consultancyId', consultancyId);
    if (filterValues.from) params.set('from', filterValues.from);
    if (filterValues.to) params.set('to', filterValues.to);
    if (filterValues.userId) params.set('userId', filterValues.userId);
    authFetch(`/api/attendance?${params.toString()}`).then(r => safeJson(r)).then(data => { setList(Array.isArray(data) ? data : []); setListLoading(false); }).catch(() => setListLoading(false));
  };

  useEffect(() => { setLoading(true); fetchToday(); setLoading(false); }, []);
  useEffect(() => { if (isAdmin) fetchList(); }, [isAdmin, filterValues.from, filterValues.to, filterValues.userId, consultancyId]);

  useEffect(() => {
    if (isAdmin) authFetch(consultancyId ? `/api/employees?consultancyId=${consultancyId}` : '/api/employees').then(r => safeJson(r)).then((d: any) => setEmployees(Array.isArray(d) ? d : (d?.employees || []))).catch(() => []);
  }, [isAdmin]);

  const handleCheckIn = async () => {
    setChecking(true);
    try {
      const res = await authFetch('/api/attendance/check-in', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (!res.ok) throw new Error((await safeJson<any>(res)).error);
      fetchToday();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setChecking(false);
    }
  };

  const handleCheckOut = async () => {
    setChecking(true);
    try {
      const res = await authFetch('/api/attendance/check-out', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (!res.ok) throw new Error((await safeJson<any>(res)).error);
      fetchToday();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setChecking(false);
    }
  };

  const duration = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return '—';
    const a = new Date(checkIn).getTime();
    const b = new Date(checkOut).getTime();
    const mins = Math.floor((b - a) / 60000);
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Attendance</h1>
          <p className="text-slate-500 mt-1">Daily check-in & check-out</p>
        </div>
      </div>

      {/* Employee: My today */}
      <div className="card mt-6 max-w-md">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-ori-600" /> Today</h2>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              {today?.checkIn ? (
                <div>
                  <p className="text-slate-600">Checked in at <span className="font-medium text-slate-900">{format(new Date(today.checkIn), 'HH:mm')}</span></p>
                  {!today.checkOut ? (
                    <button onClick={handleCheckOut} disabled={checking} className="btn-primary mt-3 flex items-center gap-2">
                      <LogOut className="w-4 h-4" /> {checking ? 'Checking out...' : 'Check Out'}
                    </button>
                  ) : (
                    <p className="text-slate-600 mt-2">Checked out at <span className="font-medium">{format(new Date(today.checkOut), 'HH:mm')}</span> • {duration(today.checkIn, today.checkOut)}</p>
                  )}
                </div>
              ) : (
                <button onClick={handleCheckIn} disabled={checking} className="btn-primary flex items-center gap-2">
                  <LogIn className="w-4 h-4" /> {checking ? 'Checking in...' : 'Check In'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Admin: List */}
      {isAdmin && (
        <div className="card mt-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Users className="w-5 h-5 text-ori-600" /> Team Attendance</h2>
            <FilterBar
              fields={[
                { key: 'from', label: 'From', type: 'date' },
                { key: 'to', label: 'To', type: 'date' },
                { key: 'userId', label: 'Employee', type: 'select', options: employees.map((e: any) => ({ value: e._id, label: `${e.profile?.firstName || ''} ${e.profile?.lastName || ''} (${e.email})` })) },
              ]}
              values={filterValues}
              onChange={setFilterValues}
              onClear={() => setFilterValues({ from: '', to: '', userId: '' })}
            />
          </div>
          {listLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Employee</th>
                    <th className="py-3 px-3">Check In</th>
                    <th className="py-3 px-3">Check Out</th>
                    <th className="py-3 px-3">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((a: any) => (
                    <tr key={a._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-3">{format(new Date(a.date), 'dd MMM yyyy')}</td>
                      <td className="py-3 px-3">{a.userId?.profile?.firstName} {a.userId?.profile?.lastName} <span className="text-slate-400">({a.userId?.email})</span></td>
                      <td className="py-3 px-3">{a.checkIn ? format(new Date(a.checkIn), 'HH:mm') : '—'}</td>
                      <td className="py-3 px-3">{a.checkOut ? format(new Date(a.checkOut), 'HH:mm') : '—'}</td>
                      <td className="py-3 px-3">{duration(a.checkIn, a.checkOut)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!listLoading && !list.length && <div className="py-12 text-center text-slate-500">No attendance records for this period.</div>}
        </div>
      )}
    </div>
  );
}
