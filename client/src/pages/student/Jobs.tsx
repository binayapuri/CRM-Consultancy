import { useState, useEffect, useCallback } from 'react';
import { authFetch, useAuthStore } from '../../store/auth';
import { useUiStore } from '../../store/ui';
import { Briefcase, MapPin, Building2, Search, DollarSign, CheckCircle, Bookmark, Bell, BookmarkCheck, X, Plus } from 'lucide-react';

type Tab = 'browse' | 'saved' | 'applications' | 'alerts';

export default function Jobs() {
  const { user } = useAuthStore();
  const { openModal, closeModal, showToast } = useUiStore();
  const [activeTab, setActiveTab] = useState<Tab>('browse');
  const [jobs, setJobs] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({ search: '', location: '', type: '', visaSponsorship: '' });
  const [loading, setLoading] = useState(true);
  const [applyJobId, setApplyJobId] = useState<string | null>(null);
  const [alertsLoading, setAlertsLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [jRes, aRes, sRes, alRes] = await Promise.all([
        authFetch(`/api/jobs${Object.entries(filters).filter(([, v]) => v).length ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) as any).toString() : ''}`),
        authFetch('/api/jobs/my-applications'),
        authFetch('/api/jobs/saved'),
        authFetch('/api/jobs/alerts'),
      ]);
      setJobs(await jRes.json());
      setApplications(await aRes.json());
      const saved = await sRes.json();
      setSavedJobs(Array.isArray(saved) ? saved.map((s: any) => s.jobId || s).filter(Boolean) : []);
      setSavedIds(new Set((saved || []).map((j: any) => j.jobId?._id || j._id)));
      setAlerts(await alRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.location, filters.type, filters.visaSponsorship]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggleSave = async (jobId: string) => {
    const isSaved = savedIds.has(jobId);
    try {
      const res = isSaved
        ? await authFetch(`/api/jobs/${jobId}/save`, { method: 'DELETE' })
        : await authFetch(`/api/jobs/${jobId}/save`, { method: 'POST' });
      if (res.ok) {
        setSavedIds(prev => {
          const next = new Set(prev);
          if (isSaved) next.delete(jobId);
          else next.add(jobId);
          return next;
        });
        fetchAll();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openApplyModal = (jobId: string) => {
    setApplyJobId(jobId);
    authFetch('/api/student/documents')
      .then(r => r.json())
      .then((docs: any[]) => {
        const docList = Array.isArray(docs) ? docs : [];
        const content = (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Select documents from your vault to attach to your application.</p>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Resume / CV *</label>
              <select id="apply-resume" className="w-full px-4 py-3 rounded-xl border border-slate-200">
                <option value="">-- Select document --</option>
                {docList.filter((d: any) => !d.mimeType || d.mimeType.includes('pdf') || d.mimeType.includes('word')).map((d: any) => (
                  <option key={d._id} value={d.fileUrl || d.url || ''}>{d.name || d.originalName || 'Document'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cover Letter (optional)</label>
              <select id="apply-cover" className="w-full px-4 py-3 rounded-xl border border-slate-200">
                <option value="">-- None --</option>
                {docList.map((d: any) => (
                  <option key={d._id} value={d.fileUrl || d.url || ''}>{d.name || d.originalName || 'Document'}</option>
                ))}
              </select>
            </div>
            {docList.length === 0 && (
              <p className="text-amber-600 text-sm font-medium">No documents in vault. Upload a resume in Documents first.</p>
            )}
            <div className="flex gap-2 justify-end pt-4">
              <button type="button" onClick={() => { closeModal(); setApplyJobId(null); }} className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const resumeEl = document.getElementById('apply-resume') as HTMLSelectElement;
                  const coverEl = document.getElementById('apply-cover') as HTMLSelectElement;
                  const resumeUrl = resumeEl?.value || '';
                  if (!resumeUrl) {
                    showToast('Please select a resume', 'error');
                    return;
                  }
                  const origin = window.location.origin;
                  const resume = resumeUrl.startsWith('http') ? resumeUrl : `${origin}${resumeUrl.startsWith('/') ? '' : '/'}${resumeUrl}`;
                  const cover = coverEl?.value ? (coverEl.value.startsWith('http') ? coverEl.value : `${origin}${coverEl.value.startsWith('/') ? '' : '/'}${coverEl.value}`) : undefined;
                  try {
                    const res = await authFetch(`/api/jobs/${applyJobId}/apply`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ resumeUrl: resume, coverLetterUrl: cover }),
                    });
                    if (res.ok) {
                      closeModal();
                      setApplyJobId(null);
                      showToast('Application submitted!', 'success');
                      fetchAll();
                    } else {
                      const err = await res.json();
                      showToast(err.error || 'Apply failed', 'error');
                    }
                  } catch (e) {
                    showToast('Apply failed', 'error');
                  }
                }}
                className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
              >
                Submit Application
              </button>
            </div>
          </div>
        );
        openModal('Apply with Document Vault', () => content);
      })
      .catch(() => {
        openModal('Apply with Document Vault', () => (
          <p className="text-slate-500">Could not load documents. Upload a resume in Documents first, then try again.</p>
        ));
      });
  };

  const createAlert = () => {
    const content = (
      <form
        onSubmit={async (e: React.FormEvent) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const fd = new FormData(form);
          setAlertsLoading(true);
          try {
            const res = await authFetch('/api/jobs/alerts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                keywords: fd.get('keywords') || '',
                location: fd.get('location') || '',
                jobType: fd.get('jobType') || undefined,
                visaSponsorship: fd.get('visaSponsorship') === 'on',
              }),
            });
            if (res.ok) {
              showToast('Job alert created!', 'success');
              closeModal();
              fetchAll();
            } else {
              const err = await res.json();
              showToast(err.error || 'Failed', 'error');
            }
          } catch (e) {
            showToast('Failed to create alert', 'error');
          } finally {
            setAlertsLoading(false);
          }
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Keywords</label>
          <input name="keywords" placeholder="e.g. software developer, marketing" className="input w-full" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
          <input name="location" placeholder="e.g. Sydney, Melbourne" className="input w-full" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Job Type</label>
          <select name="jobType" className="input w-full">
            <option value="">Any</option>
            <option value="FULL_TIME">Full-time</option>
            <option value="PART_TIME">Part-time</option>
            <option value="CASUAL">Casual</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
          </select>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="visaSponsorship" />
          <span className="text-sm font-medium">Visa sponsorship available</span>
        </label>
        <div className="flex justify-end gap-2 pt-4">
          <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl border font-bold text-slate-600">Cancel</button>
          <button type="submit" disabled={alertsLoading} className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold">
            {alertsLoading ? 'Creating...' : 'Create Alert'}
          </button>
        </div>
      </form>
    );
    openModal('Create Job Alert', () => content);
  };

  const deleteAlert = async (id: string) => {
    try {
      await authFetch(`/api/jobs/alerts/${id}`, { method: 'DELETE' });
      fetchAll();
      showToast('Alert removed', 'success');
    } catch (e) {
      showToast('Failed to remove', 'error');
    }
  };

  const formatType = (type: string) => (type || '').replace('_', ' ');

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'browse', label: 'Browse Jobs', icon: Briefcase },
    { id: 'saved', label: 'Saved', icon: BookmarkCheck },
    { id: 'applications', label: 'My Applications', icon: CheckCircle },
    { id: 'alerts', label: 'Job Alerts', icon: Bell },
  ];

  const displayJobs = activeTab === 'browse' ? jobs : activeTab === 'saved' ? savedJobs : [];
  const hasApplied = (jobId: string) => applications.some((a: any) => a.jobId?._id === jobId);

  return (
    <div className="w-full min-w-0 max-w-full animate-fade-in-up">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight">Job & Pathway Matcher</h1>
        <p className="text-slate-500 mt-1">Opportunities ranked by your ANZSCO: <span className="font-bold font-mono bg-sky-100 text-sky-800 px-2 rounded">{user?.profile?.anzscoCode || 'Not Set'}</span></p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition ${
              activeTab === id ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'alerts' && (
        <div className="mb-6 flex justify-between items-center">
          <p className="text-slate-500">Get emailed when new jobs match your criteria.</p>
          <button onClick={createAlert} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700">
            <Plus className="w-4 h-4" /> New Alert
          </button>
        </div>
      )}

      {(activeTab === 'browse' || activeTab === 'saved') && (
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Search title or company..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white"
            />
          </div>
          <input placeholder="Location" value={filters.location} onChange={e => setFilters(f => ({ ...f, location: e.target.value }))} className="px-4 py-3 rounded-xl border border-slate-200 sm:w-40" />
          <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} className="px-4 py-3 rounded-xl border border-slate-200 sm:w-40">
            <option value="">All types</option>
            {['FULL_TIME', 'PART_TIME', 'CASUAL', 'CONTRACT', 'INTERNSHIP'].map(t => <option key={t} value={t}>{formatType(t)}</option>)}
          </select>
          <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white cursor-pointer">
            <input type="checkbox" checked={!!filters.visaSponsorship} onChange={e => setFilters(f => ({ ...f, visaSponsorship: e.target.checked ? '1' : '' }))} />
            <span className="text-sm font-medium">Visa sponsorship</span>
          </label>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">No job alerts yet</h3>
              <p className="text-slate-500 mb-6">Create an alert to get emailed when new jobs match your criteria.</p>
              <button onClick={createAlert} className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold">Create Alert</button>
            </div>
          ) : (
            alerts.map((a: any) => (
              <div key={a._id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{a.keywords || 'Any keywords'} · {a.location || 'Any location'}</p>
                  <p className="text-sm text-slate-500">{a.jobType ? formatType(a.jobType) : 'Any type'} {a.visaSponsorship && '· Visa sponsorship'}</p>
                </div>
                <button onClick={() => deleteAlert(a._id)} className="p-2 text-slate-400 hover:text-rose-600"><X className="w-5 h-5" /></button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">No applications yet</h3>
              <p className="text-slate-500">Apply to jobs from the Browse tab.</p>
            </div>
          ) : (
            applications.map((app: any) => (
              <div key={app._id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${
                    app.status === 'APPLIED' ? 'bg-slate-100 text-slate-700' : app.status === 'SHORTLISTED' ? 'bg-amber-100 text-amber-700' :
                    app.status === 'INTERVIEW' ? 'bg-sky-100 text-sky-700' : app.status === 'OFFERED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>{app.status}</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-2">{app.jobId?.title}</h3>
                  <p className="text-slate-500">{app.jobId?.company} · {app.jobId?.location}</p>
                  <p className="text-xs text-slate-400 mt-1">Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {(activeTab === 'browse' || activeTab === 'saved') && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" /></div>
          ) : displayJobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">{activeTab === 'saved' ? 'No saved jobs' : 'No jobs available'}</h3>
              <p className="text-slate-500">{activeTab === 'saved' ? 'Save jobs from Browse to view them here.' : 'Check back later.'}</p>
            </div>
          ) : (
            displayJobs.map((job: any) => {
              const j = job.jobId || job;
              const isMatch = Boolean(user?.profile?.anzscoCode && j.anzscoCode === user.profile.anzscoCode);
              const applied = hasApplied(j._id);
              const isSaved = savedIds.has(j._id);
              return (
                <div key={j._id} className={`bg-white rounded-lg border p-6 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${isMatch ? 'border-emerald-300 bg-emerald-50/10' : 'border-slate-200'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-lg">{formatType(j.type)}</span>
                      {isMatch && <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-lg">High Match</span>}
                      {j.visaSponsorshipAvailable && <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded-lg">Sponsorship</span>}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2">{j.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium mb-3">
                      <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-slate-400" /> {j.company}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {j.location}</span>
                      {j.salaryRange && <span className="flex items-center gap-1.5 text-emerald-600 font-bold"><DollarSign className="w-4 h-4" /> {j.salaryRange}</span>}
                    </div>
                    {j.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {j.tags.map((tag: string) => (
                          <span key={tag} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <button onClick={() => toggleSave(j._id)} className={`p-2 rounded-lg transition ${isSaved ? 'text-ori-600 bg-ori-50' : 'text-slate-400 hover:bg-slate-100'}`} title={isSaved ? 'Unsave' : 'Save'}>
                      <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                    {applied ? (
                      <div className="px-6 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Applied</div>
                    ) : (
                      <button onClick={() => openApplyModal(j._id)} className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-sm">
                        Apply with Vault
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {(activeTab === 'browse' || activeTab === 'saved') && applications.length > 0 && (
        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-bold text-slate-900 mb-4">My Applications</h3>
          <div className="flex flex-wrap gap-2">
            {applications.slice(0, 5).map((app: any) => (
              <div key={app._id} className="px-4 py-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className={`text-[10px] font-bold uppercase ${app.status === 'OFFERED' ? 'text-emerald-600' : 'text-slate-500'}`}>{app.status}</span>
                <p className="font-bold text-slate-800 text-sm">{app.jobId?.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
