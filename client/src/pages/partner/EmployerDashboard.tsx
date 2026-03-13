import { useState, useEffect } from 'react';
import { authFetch } from '../../store/auth';
import { XCircle, Briefcase, Users } from 'lucide-react';

export default function EmployerDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // For the sake of this component, let's assume the SuperAdmin or Employer fetches all jobs they posted
  // and all applications for those jobs. 
  // We'll add a new endpoint or just fetch jobs and loop.
  // Wait, I need a backend endpoint for this! Let's mock the UI first and then I'll add the endpoint.
  
  const fetchDashboardData = async () => {
    try {
      const res = await authFetch('/api/jobs/employer/dashboard');
      if (res.ok) setJobs(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const updateStatus = async (appId: string, status: string) => {
    try {
      await authFetch(`/api/jobs/applications/${appId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Employer Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your active listings and review student applications.</p>
        </div>
        <button className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm shadow-emerald-500/20 hover:bg-emerald-700 transition">
          Post New Job
        </button>
      </div>

      <div className="space-y-8">
        {jobs.length === 0 ? (
          <div className="bg-white border border-slate-200 p-12 text-center rounded-3xl">
             <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
             <p className="text-lg font-bold text-slate-900 mb-1">No Jobs Posted</p>
             <p className="text-slate-500">You haven't posted any jobs yet.</p>
          </div>
        ) : (
          jobs.map((job: any) => (
            <div key={job._id} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
              <div className="bg-slate-50 p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-emerald-600" /> {job.title}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">{job.location} • {job.type.replace('_', ' ')}</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-700">{job.applications?.length || 0} Applicants</span>
                </div>
              </div>

              <div className="divide-y divide-slate-100 p-2">
                {!job.applications || job.applications.length === 0 ? (
                  <p className="p-6 text-center text-slate-500 font-medium">No applications for this position yet.</p>
                ) : (
                  job.applications.map((app: any) => (
                    <div key={app._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50 transition-colors rounded-2xl m-2">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${
                            app.status === 'APPLIED' ? 'bg-slate-100 text-slate-700' :
                            app.status === 'SHORTLISTED' ? 'bg-amber-100 text-amber-700' :
                            app.status === 'INTERVIEW' ? 'bg-sky-100 text-sky-700' :
                            app.status === 'OFFERED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>{app.status}</span>
                          <p className="text-sm font-bold text-slate-500">{new Date(app.createdAt).toLocaleDateString()}</p>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{app.studentId?.profile?.firstName} {app.studentId?.profile?.lastName}</h3>
                        <p className="text-slate-500 text-sm mb-3">{app.studentId?.email}</p>
                        
                        <div className="flex gap-2">
                          {app.resumeUrl && <a href="#" className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition">View Resume</a>}
                          {app.coverLetterUrl && <a href="#" className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition">Cover Letter</a>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {app.status === 'APPLIED' && (
                          <button onClick={() => updateStatus(app._id, 'SHORTLISTED')} className="px-4 py-2 border border-slate-200 font-bold rounded-xl text-slate-600 hover:bg-slate-50 transition text-sm">
                            Shortlist
                          </button>
                        )}
                        {['SHORTLISTED', 'INTERVIEW'].includes(app.status) && (
                          <button onClick={() => updateStatus(app._id, 'INTERVIEW')} className="px-4 py-2 border border-sky-200 text-sky-600 font-bold rounded-xl hover:bg-sky-50 transition-colors text-sm">
                            Invite Interview
                          </button>
                        )}
                        {['APPLIED', 'SHORTLISTED', 'INTERVIEW'].includes(app.status) && (
                          <button onClick={() => updateStatus(app._id, 'OFFERED')} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-sm text-sm">
                            Send Offer
                          </button>
                        )}
                        {!['REJECTED', 'OFFERED', 'HIRED'].includes(app.status) && (
                          <button onClick={() => updateStatus(app._id, 'REJECTED')} className="px-3 py-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition text-sm">
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
