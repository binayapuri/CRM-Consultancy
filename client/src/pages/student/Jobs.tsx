import { useState, useEffect } from 'react';
import { authFetch, useAuthStore } from '../../store/auth';
import { Briefcase, MapPin, Building2, Search, DollarSign, CheckCircle } from 'lucide-react';

export default function Jobs() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [jRes, aRes] = await Promise.all([
        authFetch('/api/jobs'),
        authFetch('/api/jobs/my-applications')
      ]);
      setJobs(await jRes.json());
      setApplications(await aRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const applyForJob = async (jobId: string) => {
    try {
      const res = await authFetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeUrl: 'DocumentVault/resume.pdf', coverLetterUrl: 'DocumentVault/cover.pdf' })
      });
      if (res.ok) {
        alert('Application submitted using Vault documents!');
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatType = (type: string) => type.replace('_', ' ');

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Job & Pathway Matcher</h1>
        <p className="text-slate-500 mt-1">Opportunities organically ranked by your ANZSCO code: <span className="font-bold font-mono bg-sky-100 text-sky-800 px-2 rounded">{user?.profile?.anzscoCode || 'Not Set'}</span></p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3">
          <div className="flex gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search title or company..." className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition" />
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" /></div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">No jobs available</h3>
                <p className="text-slate-500 font-medium">Check back later.</p>
              </div>
            ) : (
              jobs.map(job => {
                const isMatch = Boolean(user?.profile?.anzscoCode && job.anzscoCode === user.profile.anzscoCode);
                const hasApplied = applications.some(a => a.jobId?._id === job._id);

                return (
                  <div key={job._id} className={`bg-white rounded-2xl border p-6 shadow-sm transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6 ${isMatch ? 'border-emerald-300 bg-emerald-50/10' : 'border-slate-200'}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-lg">
                          {formatType(job.type)}
                        </span>
                        {isMatch && <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-lg">High Match</span>}
                        {job.visaSponsorshipAvailable && <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded-lg">Sponsorship Avail</span>}
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2">{job.title}</h3>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium mb-3">
                        <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-slate-400" /> {job.company}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {job.location}</span>
                        {job.salaryRange && <span className="flex items-center gap-1.5 text-emerald-600 font-bold"><DollarSign className="w-4 h-4" /> {job.salaryRange}</span>}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {job.tags?.map((tag: string) => (
                          <span key={tag} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center justify-center">
                       {hasApplied ? (
                         <div className="px-6 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl flex items-center gap-2">
                           <CheckCircle className="w-4 h-4" /> Applied
                         </div>
                       ) : (
                         <button 
                            onClick={() => applyForJob(job._id)}
                            className="w-full md:w-auto px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-sm shadow-emerald-500/20 active:scale-95 whitespace-nowrap"
                         >
                           1-Click Apply
                         </button>
                       )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:w-1/3 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm sticky top-6">
            <div className="bg-slate-50 p-6 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">My Applications</h3>
            </div>
            <div className="p-4 space-y-2">
              {applications.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-8">You haven't applied to any jobs yet.</p>
              ) : (
                applications.map((app: any) => (
                  <div key={app._id} className="p-4 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 text-[10px] uppercase font-bold text-white rounded-md ${
                        app.status === 'APPLIED' ? 'bg-slate-400' :
                        app.status === 'SHORTLISTED' ? 'bg-amber-500' :
                        app.status === 'INTERVIEW' ? 'bg-sky-500' :
                        app.status === 'OFFERED' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}>{app.status}</span>
                      <span className="text-[10px] font-bold text-slate-400">{new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 leading-tight mb-1">{app.jobId?.title}</h4>
                    <p className="text-xs font-bold text-slate-500">{app.jobId?.company}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
