import { useState, useEffect } from 'react';
import { authFetch, useAuthStore } from '../../store/auth';
import { XCircle, Briefcase, Users, Plus, Building2, Pencil, Archive, FileText, ExternalLink } from 'lucide-react';

export default function EmployerDashboard() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<any[]>([]);
  const [employers, setEmployers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showJobForm, setShowJobForm] = useState(false);
  const [showEmployerForm, setShowEmployerForm] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    location: '',
    type: 'FULL_TIME',
    description: '',
    salaryRange: '',
    visaSponsorshipAvailable: false,
    partTimeAllowed: true,
    recruiterEmployerProfileId: '',
    workRights: 'STUDENT_VISA_24_HOURS',
  });
  const [employerForm, setEmployerForm] = useState({
    companyName: '',
    abn: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });

  const fetchDashboardData = async () => {
    setError('');
    try {
      const [jobsRes, employersRes] = await Promise.all([
        authFetch('/api/jobs/employer/dashboard'),
        user?.role === 'RECRUITER' ? authFetch('/api/jobs/recruiter/employers') : Promise.resolve(null),
      ]);
      if (jobsRes.ok) {
        setJobs(await jobsRes.json());
      } else {
        const d = await jobsRes.json().catch(() => ({}));
        setError(d?.error || 'Failed to load job dashboard');
      }
      if (employersRes && employersRes.ok) setEmployers(await employersRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.role]);

  const postJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload: any = {
        title: jobForm.title,
        location: jobForm.location,
        type: jobForm.type,
        description: jobForm.description,
        salaryRange: jobForm.salaryRange,
        visaSponsorshipAvailable: jobForm.visaSponsorshipAvailable,
        partTimeAllowed: jobForm.partTimeAllowed,
        workRights: [jobForm.workRights],
      };
      if (user?.role === 'RECRUITER') payload.recruiterEmployerProfileId = jobForm.recruiterEmployerProfileId;
      else payload.company = jobForm.company;

      const res = await authFetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to post job');
      setShowJobForm(false);
      setJobForm({
        title: '',
        company: '',
        location: '',
        type: 'FULL_TIME',
        description: '',
        salaryRange: '',
        visaSponsorshipAvailable: false,
        partTimeAllowed: true,
        recruiterEmployerProfileId: '',
        workRights: 'STUDENT_VISA_24_HOURS',
      });
      fetchDashboardData();
    } catch (err: any) {
      setError(err?.message || 'Failed to post job');
    }
  };

  const addRecruiterEmployer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await authFetch('/api/jobs/recruiter/employers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employerForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to add employer profile');
      setShowEmployerForm(false);
      setEmployerForm({ companyName: '', abn: '', contactName: '', contactEmail: '', contactPhone: '' });
      fetchDashboardData();
    } catch (err: any) {
      setError(err?.message || 'Failed to add employer profile');
    }
  };

  const updateStatus = async (appId: string, status: string) => {
    try {
      await authFetch(`/api/jobs/applications/${appId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setSelectedApps(prev => { const n = new Set(prev); n.delete(appId); return n; });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const bulkUpdateStatus = async (status: string) => {
    for (const appId of selectedApps) {
      try {
        await authFetch(`/api/jobs/applications/${appId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
      } catch (e) { console.error(e); }
    }
    setSelectedApps(new Set());
    fetchDashboardData();
  };

  const toggleSelectApp = (appId: string) => {
    setSelectedApps(prev => {
      const n = new Set(prev);
      if (n.has(appId)) n.delete(appId);
      else n.add(appId);
      return n;
    });
  };

  const closeJob = async (jobId: string) => {
    if (!confirm('Close this job? It will no longer appear in search.')) return;
    try {
      await authFetch(`/api/jobs/${jobId}/close`, { method: 'PATCH' });
      fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const saveJobEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    try {
      await authFetch(`/api/jobs/${editingJob._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingJob.title,
          location: editingJob.location,
          type: editingJob.type,
          description: editingJob.description,
          salaryRange: editingJob.salaryRange,
          visaSponsorshipAvailable: editingJob.visaSponsorshipAvailable,
          partTimeAllowed: editingJob.partTimeAllowed,
        }),
      });
      setEditingJob(null);
      fetchDashboardData();
    } catch (err: any) {
      setError(err?.message || 'Update failed');
    }
  };

  const getDocUrl = (url: string) => {
    if (!url) return url;
    return url.startsWith('http') ? url : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">{user?.role === 'RECRUITER' ? 'Recruiter Dashboard' : 'Employer Dashboard'}</h1>
          <p className="text-slate-500 mt-1">Manage listings, candidate pipeline, and job lifecycle.</p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'RECRUITER' && (
            <button onClick={() => setShowEmployerForm((v) => !v)} className="border border-slate-200 bg-white text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition inline-flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Employer profile
            </button>
          )}
          <button onClick={() => setShowJobForm((v) => !v)} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm shadow-emerald-500/20 hover:bg-emerald-700 transition inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Post New Job
          </button>
        </div>
      </div>

      {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}

      {showEmployerForm && user?.role === 'RECRUITER' && (
        <form onSubmit={addRecruiterEmployer} className="bg-white border border-slate-200 rounded-2xl p-5 mb-5 grid md:grid-cols-2 gap-3">
          <input className="input" placeholder="Company name" value={employerForm.companyName} onChange={(e) => setEmployerForm((f) => ({ ...f, companyName: e.target.value }))} required />
          <input className="input" placeholder="ABN" value={employerForm.abn} onChange={(e) => setEmployerForm((f) => ({ ...f, abn: e.target.value }))} />
          <input className="input" placeholder="Contact person" value={employerForm.contactName} onChange={(e) => setEmployerForm((f) => ({ ...f, contactName: e.target.value }))} />
          <input className="input" placeholder="Contact email" value={employerForm.contactEmail} onChange={(e) => setEmployerForm((f) => ({ ...f, contactEmail: e.target.value }))} />
          <input className="input md:col-span-2" placeholder="Contact phone" value={employerForm.contactPhone} onChange={(e) => setEmployerForm((f) => ({ ...f, contactPhone: e.target.value }))} />
          <div className="md:col-span-2 flex justify-end"><button className="btn-primary px-5 py-2.5">Save employer profile</button></div>
        </form>
      )}

      {showJobForm && (
        <form onSubmit={postJob} className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 grid md:grid-cols-2 gap-3">
          <input className="input" placeholder="Job title" value={jobForm.title} onChange={(e) => setJobForm((f) => ({ ...f, title: e.target.value }))} required />
          {user?.role === 'RECRUITER' ? (
            <select className="input" value={jobForm.recruiterEmployerProfileId} onChange={(e) => setJobForm((f) => ({ ...f, recruiterEmployerProfileId: e.target.value }))} required>
              <option value="">Select employer profile</option>
              {employers.map((e: any) => <option key={e._id} value={e._id}>{e.companyName}</option>)}
            </select>
          ) : (
            <input className="input" placeholder="Company" value={jobForm.company} onChange={(e) => setJobForm((f) => ({ ...f, company: e.target.value }))} required />
          )}
          <input className="input" placeholder="Location (e.g. Sydney, NSW)" value={jobForm.location} onChange={(e) => setJobForm((f) => ({ ...f, location: e.target.value }))} required />
          <select className="input" value={jobForm.type} onChange={(e) => setJobForm((f) => ({ ...f, type: e.target.value }))}>
            {['FULL_TIME', 'PART_TIME', 'CASUAL', 'CONTRACT', 'INTERNSHIP'].map((x) => <option key={x}>{x}</option>)}
          </select>
          <input className="input" placeholder="Salary range" value={jobForm.salaryRange} onChange={(e) => setJobForm((f) => ({ ...f, salaryRange: e.target.value }))} />
          <select className="input" value={jobForm.workRights} onChange={(e) => setJobForm((f) => ({ ...f, workRights: e.target.value }))}>
            <option value="STUDENT_VISA_24_HOURS">Student visa (24h/wk)</option>
            <option value="FULL_WORK_RIGHTS">Full work rights</option>
            <option value="ANY_VALID_WORK_RIGHTS">Any valid work rights</option>
          </select>
          <textarea className="input md:col-span-2" rows={3} placeholder="Description" value={jobForm.description} onChange={(e) => setJobForm((f) => ({ ...f, description: e.target.value }))} required />
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={jobForm.visaSponsorshipAvailable} onChange={(e) => setJobForm((f) => ({ ...f, visaSponsorshipAvailable: e.target.checked }))} /> Visa sponsorship available</label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={jobForm.partTimeAllowed} onChange={(e) => setJobForm((f) => ({ ...f, partTimeAllowed: e.target.checked }))} /> Part-time allowed</label>
          <div className="md:col-span-2 flex justify-end"><button className="btn-primary px-5 py-2.5">Publish job</button></div>
        </form>
      )}

      {editingJob && (
        <form onSubmit={saveJobEdit} className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-slate-900 mb-4">Edit Job</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <input className="input" placeholder="Job title" value={editingJob.title} onChange={(e) => setEditingJob((j: any) => ({ ...j, title: e.target.value }))} required />
            <input className="input" placeholder="Location" value={editingJob.location} onChange={(e) => setEditingJob((j: any) => ({ ...j, location: e.target.value }))} required />
            <select className="input" value={editingJob.type} onChange={(e) => setEditingJob((j: any) => ({ ...j, type: e.target.value }))}>
              {['FULL_TIME', 'PART_TIME', 'CASUAL', 'CONTRACT', 'INTERNSHIP'].map((x) => <option key={x} value={x}>{x.replace('_', ' ')}</option>)}
            </select>
            <input className="input" placeholder="Salary range" value={editingJob.salaryRange || ''} onChange={(e) => setEditingJob((j: any) => ({ ...j, salaryRange: e.target.value }))} />
            <textarea className="input md:col-span-2" rows={3} placeholder="Description" value={editingJob.description || ''} onChange={(e) => setEditingJob((j: any) => ({ ...j, description: e.target.value }))} required />
            <label className="flex items-center gap-2"><input type="checkbox" checked={editingJob.visaSponsorshipAvailable} onChange={(e) => setEditingJob((j: any) => ({ ...j, visaSponsorshipAvailable: e.target.checked }))} /> Visa sponsorship</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={editingJob.partTimeAllowed} onChange={(e) => setEditingJob((j: any) => ({ ...j, partTimeAllowed: e.target.checked }))} /> Part-time allowed</label>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={() => setEditingJob(null)} className="px-4 py-2 border border-slate-200 font-bold rounded-xl">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl">Save changes</button>
          </div>
        </form>
      )}

      <div className="space-y-8">
        {jobs.length === 0 ? (
          <div className="bg-white border border-slate-200 p-12 text-center rounded-3xl">
             <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
             <p className="text-lg font-bold text-slate-900 mb-1">No Jobs Posted</p>
             <p className="text-slate-500">You haven&apos;t posted any jobs yet.</p>
          </div>
        ) : (
          jobs.map((job: any) => (
            <div key={job._id} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
              <div className="bg-slate-50 p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-emerald-600" /> {job.title}
                    {!job.isActive && <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-bold rounded">Closed</span>}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">{job.location} • {job.type?.replace('_', ' ')} • {job.company}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-700">{job.applications?.length || 0} Applicants</span>
                  </div>
                  {job.isActive !== false && (
                    <>
                      <button onClick={() => setEditingJob({ ...job })} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50" title="Edit"><Pencil className="w-4 h-4 text-slate-600" /></button>
                      <button onClick={() => closeJob(job._id)} className="p-2 rounded-lg border border-slate-200 hover:bg-rose-50 transition" title="Close job"><Archive className="w-4 h-4 text-slate-600" /></button>
                    </>
                  )}
                </div>
              </div>

              {job.applications?.length > 0 && (
                <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                  <button onClick={() => setSelectedApps(prev => job.applications.every((a: any) => prev.has(a._id)) ? new Set([...prev].filter(x => !job.applications.some((a: any) => a._id === x))) : new Set([...prev, ...job.applications.map((a: any) => a._id)]))} className="text-sm font-bold text-slate-600 hover:text-slate-900">
                    Select all
                  </button>
                  {selectedApps.size > 0 && (
                    <>
                      <span className="text-slate-400">|</span>
                      <button onClick={() => bulkUpdateStatus('SHORTLISTED')} className="text-sm font-bold text-amber-600 hover:text-amber-700">Shortlist ({selectedApps.size})</button>
                      <button onClick={() => bulkUpdateStatus('REJECTED')} className="text-sm font-bold text-rose-600 hover:text-rose-700">Reject ({selectedApps.size})</button>
                    </>
                  )}
                </div>
              )}

              <div className="divide-y divide-slate-100 p-2">
                {!job.applications || job.applications.length === 0 ? (
                  <p className="p-6 text-center text-slate-500 font-medium">No applications for this position yet.</p>
                ) : (
                  job.applications.map((app: any) => (
                    <div key={app._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50 transition-colors rounded-2xl m-2">
                      <div className="flex items-start gap-3">
                        <input type="checkbox" checked={selectedApps.has(app._id)} onChange={() => toggleSelectApp(app._id)} className="mt-1" />
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
                          <p className="text-slate-500 text-sm mb-2">{app.studentId?.email}</p>
                          <div className="flex items-center gap-3 text-sm">
                            {app.resumeUrl && (
                              <a href={getDocUrl(app.resumeUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-600 font-bold hover:underline">
                                <FileText className="w-4 h-4" /> Resume
                              </a>
                            )}
                            {app.coverLetterUrl && (
                              <a href={getDocUrl(app.coverLetterUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sky-600 font-bold hover:underline">
                                <FileText className="w-4 h-4" /> Cover
                              </a>
                            )}
                          </div>
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
