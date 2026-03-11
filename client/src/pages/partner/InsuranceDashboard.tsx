import { useState, useEffect } from 'react';
import { authFetch } from '../../store/auth';
import { CheckCircle, XCircle } from 'lucide-react';

export default function InsuranceDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const res = await authFetch('/api/insurance/partner/applications');
      if (res.ok) setApplications(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const issuePolicy = async (id: string) => {
    const policyNumber = prompt('Enter the generated Policy Number for this student:');
    if (!policyNumber) return;
    try {
      await authFetch(`/api/insurance/partner/applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE', policyNumber, startDate: new Date().toISOString() })
      });
      fetchApplications();
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await authFetch(`/api/insurance/partner/applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchApplications();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Policy Applications</h1>
          <p className="text-slate-500 mt-1">Review pending insurance applications and issue policies.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100">
          {applications.map((app: any) => (
            <div key={app._id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${
                    app.status === 'APPLIED' ? 'bg-amber-100 text-amber-700' :
                    app.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                    app.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                  }`}>{app.status.replace('_', ' ')}</span>
                  <p className="text-sm font-bold text-slate-500">{new Date(app.createdAt).toLocaleDateString()}</p>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{app.studentId?.profile?.firstName} {app.studentId?.profile?.lastName}</h3>
                <p className="text-rose-700 font-bold text-sm mb-2">{app.planId?.name} ({app.planId?.type})</p>
                {app.notes && <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">" {app.notes} "</p>}
                {app.policyNumber && <p className="text-xs font-mono bg-white p-1 rounded mt-2 text-slate-500 border border-slate-200 w-max">Policy: {app.policyNumber}</p>}
              </div>

              <div className="flex items-center gap-2">
                {app.status === 'APPLIED' && (
                  <>
                    <button onClick={() => updateStatus(app._id, 'REJECTED')} className="flex items-center gap-2 px-4 py-2 border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-colors">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                    <button onClick={() => issuePolicy(app._id)} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-sm shadow-rose-500/20">
                      <CheckCircle className="w-4 h-4" /> Issue Policy
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {applications.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-slate-500 font-medium">No pending policy applications found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
