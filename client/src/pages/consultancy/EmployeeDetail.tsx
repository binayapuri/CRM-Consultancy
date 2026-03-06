import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { authFetch } from '../../store/auth';
import { format } from 'date-fns';
import { ArrowLeft, ClipboardList, Pencil } from 'lucide-react';

export default function EmployeeDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const [employee, setEmployee] = useState<any>(null);
  const [jobSheet, setJobSheet] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      authFetch(`/api/employees/${id}`).then(r => r.json()).then(data => { setEmployee(data); setLoading(false); });
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      authFetch(`/api/employees/${id}/job-sheet`).then(r => r.json()).then(setJobSheet);
    }
  }, [id]);

  if (loading || !employee) return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-ori-500 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <Link to={consultancyId ? `/consultancy/employees?consultancyId=${consultancyId}` : '/consultancy/employees'} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Employees
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">{employee.profile?.firstName} {employee.profile?.lastName}</h1>
          <p className="text-slate-500">{employee.email}</p>
          <p className="text-sm text-slate-600 mt-1">{employee.role} {employee.profile?.marnNumber && `• MARN ${employee.profile.marnNumber}`}</p>
        </div>
        <Link to={consultancyId ? `/consultancy/employees?consultancyId=${consultancyId}&editId=${id}` : `/consultancy/employees?editId=${id}`} className="btn-primary flex items-center gap-2 shrink-0"><Pencil className="w-4 h-4" /> Edit Employee</Link>
      </div>

      {/* Job Sheet - same as client task sheet */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-semibold text-slate-900 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-ori-600" /> Job Sheet</h2>
            <p className="text-slate-500 text-sm mt-1">All activities where this employee is assigned — tasks, applications, documents, and more.</p>
          </div>
          <button onClick={() => id && authFetch(`/api/employees/${id}/job-sheet`).then(r => r.json()).then(setJobSheet)} className="btn-secondary text-sm">Refresh</button>
        </div>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {jobSheet.length === 0 && <p className="text-slate-500 py-8 text-center">No activity yet</p>}
          {jobSheet.map((t: any) => (
            <div key={t._id} className="p-4 rounded-lg bg-slate-50 border-l-4 border-ori-500 flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900">{t.description || `${t.action} ${t.entityType}`}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {t.entityType} • {t.action}
                  {t.visaSubclass && ` • Visa ${t.visaSubclass}`}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {t.changedBy?.profile?.firstName} {t.changedBy?.profile?.lastName} • {format(new Date(t.changedAt), 'dd MMM yyyy HH:mm')}
                </p>
              </div>
              <span className={`shrink-0 px-2 py-1 rounded text-xs ${t.action === 'CREATE' ? 'bg-green-100 text-green-700' : t.action === 'DELETE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{t.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
