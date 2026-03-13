import { useState, useEffect } from 'react';
import { authFetch } from '../../store/auth';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function UniversityApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const res = await authFetch('/api/offer-letters/manage');
      if (res.ok) setApplications(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await authFetch(`/api/offer-letters/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchApplications();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Offer Letter Applications</h1>
          <p className="text-slate-500 mt-1">Review and action incoming student applications.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100">
          {applications.map((app: any) => (
            <div key={app._id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${
                    app.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                    app.status === 'OFFERED' ? 'bg-emerald-100 text-emerald-700' :
                    app.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                  }`}>{app.status.replace('_', ' ')}</span>
                  <p className="text-sm font-bold text-slate-500">{new Date(app.createdAt).toLocaleDateString()}</p>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{app.studentId?.profile?.firstName} {app.studentId?.profile?.lastName}</h3>
                <p className="text-emerald-700 font-bold text-sm mb-2">{app.courseId?.name} ({app.courseId?.level})</p>
                {app.studentNotes && <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">" {app.studentNotes} "</p>}
              </div>

              <div className="flex items-center gap-2">
                {app.status === 'PENDING' && (
                  <button onClick={() => updateStatus(app._id, 'UNDER_REVIEW')} className="px-4 py-2 border border-slate-200 font-bold rounded-xl text-slate-600 hover:bg-slate-50 transition">
                    <Clock className="w-4 h-4 inline mr-1" /> Mark Reviewing
                  </button>
                )}
                {['PENDING', 'UNDER_REVIEW'].includes(app.status) && (
                  <>
                    <button onClick={() => updateStatus(app._id, 'REJECTED')} className="flex items-center gap-2 px-4 py-2 border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-colors">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                    <button onClick={() => updateStatus(app._id, 'OFFERED')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/20">
                      <CheckCircle className="w-4 h-4" /> Issue Offer
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {applications.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-slate-500 font-medium">No applications found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
