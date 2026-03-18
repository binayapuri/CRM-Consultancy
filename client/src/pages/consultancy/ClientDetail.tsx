import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch, safeJson } from '../../store/auth';
import { 
  ArrowLeft, Trash2, Mail, Pencil, FileText, Download, 
  CheckCircle, StickyNote, ClipboardList, Award, History, 
  User, GraduationCap, Send, FileSignature, CheckCircle2 
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

// New Modular Profile Components
import { PersonalInfo } from '../student/profile/Sections/PersonalInfo';
import { ImmigrationInfo } from '../student/profile/Sections/ImmigrationInfo';
import { EducationInfo } from '../student/profile/Sections/EducationInfo';
import { WorkInfo } from '../student/profile/Sections/WorkInfo';
import { AddressInfo } from '../student/profile/Sections/AddressInfo';
import { TravelInfo } from '../student/profile/Sections/TravelInfo';
import { FamilyInfo } from '../student/profile/Sections/FamilyInfo';
import { SkillsInfo } from '../student/profile/Sections/SkillsInfo';
import { HealthInfo } from '../student/profile/Sections/HealthInfo';
import { NotesInfo } from '../student/profile/Sections/NotesInfo';

type Tab = 'overview' | 'documents' | 'applications' | 'task-sheet' | 'skill-assessments' | 'immigration-history' | 'profile-details';

export default function ClientDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  
  // Data States
  const [client, setClient] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [sendingDoc, setSendingDoc] = useState<string | null>(null);
  const [sendingInvite, setSendingInvite] = useState(false);

  // Sub-Tab States
  const [showAddApp, setShowAddApp] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [newAppVisa, setNewAppVisa] = useState('500');
  const [newAppSponsor, setNewAppSponsor] = useState('');
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [editApp, setEditApp] = useState<any>(null);
  const [uploadForm, setUploadForm] = useState({ type: 'PASSPORT', applicationId: '', file: null as File | null });
  const [uploading, setUploading] = useState(false);
  const [marking956, setMarking956] = useState<string | null>(null);
  const [coeAppId, setCoeAppId] = useState<string | null>(null);
  const [coeForm, setCoeForm] = useState({ number: '', institution: '', courseName: '', courseCode: '', issueDate: '', expiryDate: '', status: 'ACTIVE' });
  const [savingCoe, setSavingCoe] = useState(false);
  const [appNoteAppId, setAppNoteAppId] = useState<string | null>(null);
  const [appNoteText, setAppNoteText] = useState('');
  const [addingAppNote, setAddingAppNote] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const refreshClient = async () => {
    try {
      const res = await authFetch(`/api/clients/${id}`);
      const data = await safeJson<any>(res);
      if (data.error) throw new Error(data.error);
      setClient(data);
    } catch (err) {
      console.error(err);
      navigate('/consultancy/clients', { replace: true });
    }
  };

  const fetchApplications = () => authFetch(`/api/clients/${id}/applications`).then(r => safeJson<any[]>(r)).then(setApplications);
  const fetchDocuments = () => authFetch(`/api/documents?clientId=${id}`).then(r => safeJson<any[]>(r)).then(setDocuments);
  const fetchActivity = () => authFetch(`/api/clients/${id}/activity`).then(r => safeJson<any[]>(r)).then(setActivity);

  useEffect(() => {
    if (!id || id === 'undefined') {
      navigate('/consultancy/clients', { replace: true });
      return;
    }
    const init = async () => {
      await refreshClient();
      fetchApplications();
      authFetch('/api/constants/document-types').then(r => safeJson<any[]>(r)).then(setDocTypes);
      authFetch('/api/sponsors').then(r => safeJson<any[]>(r)).then(setSponsors).catch(() => []);
      fetchActivity();
      setLoading(false);
    };
    init();
  }, [id]);

  useEffect(() => {
    if (id && tab === 'documents') fetchDocuments();
    if (id && tab === 'task-sheet') fetchActivity();
  }, [id, tab]);

  const wrapSave = (urlSuffix: string, method: string = 'PATCH') => async (data: any) => {
    const res = await authFetch(`/api/clients/${id}${urlSuffix}`, { 
      method, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(data) 
    });
    if (res.ok) { 
      await refreshClient(); 
      showToast('Client Updated!'); 
    } else {
      const err = await safeJson<any>(res);
      alert(err.error || 'Failed to update');
    }
  };

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: id, visaSubclass: newAppVisa, status: 'ONBOARDING', sponsorId: newAppSponsor || undefined }),
      });
      if (!res.ok) throw new Error('Failed to create application');
      setShowAddApp(false);
      fetchApplications();
      showToast('Application Created');
    } catch (e: any) { alert(e.message); }
  };

  const handleUpdateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppId || !editApp) return;
    try {
      const res = await authFetch(`/api/applications/${editingAppId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editApp),
      });
      if (!res.ok) throw new Error('Update failed');
      setEditingAppId(null);
      fetchApplications();
      showToast('Application Updated');
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteApplication = async (appId: string) => {
    if (!confirm('Delete this application?')) return;
    await authFetch(`/api/applications/${appId}`, { method: 'DELETE' });
    fetchApplications();
  };

  const openCoeForm = (a: any) => {
    setCoeAppId(a._id);
    setCoeForm({
      number: a.coe?.number || '',
      institution: a.coe?.institution || '',
      courseName: a.coe?.courseName || '',
      courseCode: a.coe?.courseCode || '',
      issueDate: a.coe?.issueDate ? new Date(a.coe.issueDate).toISOString().slice(0, 10) : '',
      expiryDate: a.coe?.expiryDate ? new Date(a.coe.expiryDate).toISOString().slice(0, 10) : '',
      status: a.coe?.status || 'ACTIVE',
    });
  };

  const handleSaveCoe = async () => {
    if (!coeAppId) return;
    setSavingCoe(true);
    try {
      const payload = { coe: { ...coeForm } };
      await authFetch(`/api/applications/${coeAppId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setCoeAppId(null);
      fetchApplications();
    } finally { setSavingCoe(false); }
  };

  const handleMarkForm956 = async (appId: string) => {
    setMarking956(appId);
    await authFetch(`/api/applications/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form956Signed: true, form956SignedAt: new Date().toISOString() }),
    });
    fetchApplications();
    setMarking956(null);
  };

  const handleAddAppNote = async (e: React.FormEvent, appId: string) => {
    e.preventDefault();
    if (!appNoteText.trim()) return;
    setAddingAppNote(true);
    await authFetch(`/api/applications/${appId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: appNoteText }),
    });
    setAppNoteText('');
    setAppNoteAppId(null);
    fetchApplications();
    setAddingAppNote(false);
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', uploadForm.file);
    fd.append('clientId', id!);
    fd.append('type', uploadForm.type);
    if (uploadForm.applicationId) fd.append('applicationId', uploadForm.applicationId);
    await authFetch('/api/documents/upload', { method: 'POST', body: fd });
    setShowUpload(false);
    fetchDocuments();
    setUploading(false);
  };

  if (loading || !client) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <LoadingSpinner />
      <div className="text-slate-400 font-bold tracking-widest uppercase animate-pulse text-xs">Syncing Galaxy Data...</div>
    </div>
  );

  const p = client.profile || {};
  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: User },
    { key: 'profile-details', label: 'Full Profile', icon: ClipboardList },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'applications', label: 'Applications', icon: GraduationCap },
    { key: 'task-sheet', label: 'Task Sheet', icon: History },
    { key: 'skill-assessments', label: 'Assessments', icon: Award },
    { key: 'immigration-history', label: 'Immigration', icon: History },
  ];

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto px-2 sm:px-0 pb-20 animate-in fade-in duration-500">
       {toast && (
        <div className="fixed top-24 right-8 z-50 flex items-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl animate-in slide-in-from-right-10 duration-300">
          <div className="p-1.5 bg-emerald-500 rounded-full text-white"><CheckCircle2 className="w-4 h-4" /></div>
          <span className="font-black text-sm">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <Link to={consultancyId ? `/consultancy/clients?consultancyId=${consultancyId}` : '/consultancy/clients'} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-2 font-bold text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Clients List
          </Link>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight break-words">{p.firstName} {p.lastName}</h1>
          <p className="text-slate-500 font-bold">{p.email} · Registered {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}</p>
        </div>
        <div className="flex items-center gap-3">
           {!client.userId && (
             <button onClick={async () => {
               setSendingInvite(true);
               const res = await authFetch(`/api/clients/${id}/invite`, { method: 'POST' });
               const data = await safeJson<any>(res);
               alert(data.emailed ? 'Invitation emailed.' : `Invite Link: ${data.inviteLink}`);
               setSendingInvite(false);
             }} disabled={sendingInvite} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
               {sendingInvite ? 'Sending...' : 'Invite to Portal'}
             </button>
           )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-8 scrollbar-hide no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 border-b border-slate-100">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-[10px] tracking-widest transition-all shrink-0 uppercase
              ${tab === t.key ? 'bg-slate-900 text-white shadow-xl scale-[1.02]' : 'bg-white text-slate-400 hover:text-slate-600'}`}>
            {t.icon && <t.icon className="w-3.5 h-3.5" />} {t.label}
          </button>
        ))}
      </div>

      <div className="animate-in slide-in-from-bottom-4 duration-500">
        {tab === 'profile-details' && (
          <div className="space-y-12">
            <PersonalInfo data={p} onSave={wrapSave('/profile')} />
            <ImmigrationInfo profile={p} english={client.englishTest || {}} onSaveImmigration={wrapSave('/immigration')} onSaveEnglish={wrapSave('/english-test')} />
            <AddressInfo current={client.address?.current || {}} previous={client.address?.previous || []} onSaveCurrent={wrapSave('/addresses/current')} onAddPrevious={wrapSave('/addresses', 'POST')} onDeletePrevious={aid => wrapSave(`/addresses/${aid}`, 'DELETE')({})} />
            <EducationInfo items={client.education || []} onAdd={wrapSave('/education', 'POST')} onDelete={eid => wrapSave(`/education/${eid}`, 'DELETE')({})} />
            <WorkInfo items={client.experience || []} onAdd={wrapSave('/experience', 'POST')} onDelete={eid => wrapSave(`/experience/${eid}`, 'DELETE')({})} />
            <TravelInfo items={client.travelHistory || []} onAdd={wrapSave('/travel-history', 'POST')} onDelete={tid => wrapSave(`/travel-history/${tid}`, 'DELETE')({})} />
            <FamilyInfo items={client.familyMembers || []} onAdd={wrapSave('/family-members', 'POST')} onDelete={mid => wrapSave(`/family-members/${mid}`, 'DELETE')({})} />
            <SkillsInfo data={client.skillsData || {}} onSave={wrapSave('/skills')} />
            <HealthInfo data={client.healthData || {}} onSave={wrapSave('/health')} />
            <NotesInfo notes={client.notes || []} statement={client.initialStatement || ''} onSaveStatement={txt => wrapSave('/profile/statement')({ initialStatement: txt })} onAddNote={wrapSave('/notes', 'POST')} onDeleteNote={idx => wrapSave(`/notes/${idx}`, 'DELETE')({})} onTogglePin={async (id, isPinned) => { await wrapSave(`/notes/${id}`)({ isPinned }); }} />
          </div>
        )}

        {tab === 'overview' && <OverviewTab client={client} id={id} sendingDoc={sendingDoc} setSendingDoc={setSendingDoc} />}

        {tab === 'documents' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black text-slate-900">Documents Vault</h2>
              <button onClick={() => setShowUpload(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase">+ Add Document</button>
            </div>
            {showUpload && (
               <form onSubmit={handleUploadDocument} className="p-6 bg-white border-2 border-indigo-100 rounded-3xl mb-8 animate-in zoom-in-95">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div><label className="text-xs font-black uppercase text-slate-400 block mb-2">Type</label><select value={uploadForm.type} onChange={e => setUploadForm({...uploadForm, type: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl border-none font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 transition-all">{docTypes.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
                   <div><label className="text-xs font-black uppercase text-slate-400 block mb-2">File</label><input type="file" required onChange={e => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})} className="w-full bg-slate-50 p-2 rounded-2xl font-bold" /></div>
                 </div>
                 <div className="flex justify-end gap-3 mt-4"><button type="button" onClick={() => setShowUpload(false)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button><button type="submit" disabled={uploading} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-indigo-600/20 transition-all">{uploading ? 'Uploading...' : 'Upload'}</button></div>
               </form>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {documents.map(d => (
                 <div key={d._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4 hover:border-indigo-400 transition-all group">
                   <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all"><FileText className="w-6 h-6" /></div>
                   <div className="flex-1 min-w-0">
                     <p className="font-black text-slate-900 text-sm truncate">{d.name || d.type}</p>
                     <p className="text-[10px] font-black uppercase text-slate-400 truncate">{d.type}</p>
                     <div className="mt-3 flex items-center gap-2">
                        {d.fileUrl && <a href={d.fileUrl} target="_blank" className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-indigo-600 hover:bg-white transition-all"><Download className="w-3.5 h-3.5" /></a>}
                        <button onClick={() => { if(confirm('Delete?')) authFetch(`/api/documents/${d._id}`, {method: 'DELETE'}).then(()=>fetchDocuments()) }} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-red-600 hover:bg-white transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                     </div>
                   </div>
                 </div>
               ))}
               {!documents.length && <div className="md:col-span-3 text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-bold italic">No documents in the vault yet.</div>}
            </div>
          </div>
        )}

        {tab === 'applications' && (
          <div className="space-y-6">
             <div className="flex items-center justify-between">
               <h2 className="text-xl font-black text-slate-900">Visa Applications</h2>
               <button onClick={() => setShowAddApp(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase">+ New App</button>
             </div>
             {showAddApp && (
               <form onSubmit={handleAddApplication} className="p-6 bg-white border-2 border-indigo-100 rounded-3xl mb-8 animate-in zoom-in-95">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Visa Type</label><select value={newAppVisa} onChange={e => setNewAppVisa(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl border-none font-bold"><option value="500">500 Student</option><option value="485">485 Graduate</option><option value="189">189 Skilled</option><option value="190">190 Skilled</option><option value="600">600 Visitor</option></select></div>
                   <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Sponsor (Optional)</label><select value={newAppSponsor} onChange={e => setNewAppSponsor(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl border-none font-bold"><option value="">None</option>{sponsors.map(s=><option key={s._id} value={s._id}>{s.companyName}</option>)}</select></div>
                   <div className="flex items-end"><button type="submit" className="w-full h-[56px] bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs">Create App</button></div>
                 </div>
               </form>
             )}
             <div className="space-y-4">
               {applications.map(a => (
                 <div key={a._id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                   <div className="flex items-start justify-between">
                     <div>
                       <h3 className="text-lg font-black text-slate-900">Visa Subclass {a.visaSubclass}</h3>
                       <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{a.status}</span>
                          {a.form956Signed && <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">956 Signed</span>}
                          {a.sponsorId && <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">Sponsor: {a.sponsorId.companyName}</span>}
                       </div>
                     </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openCoeForm(a)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"><GraduationCap className="w-5 h-5" /></button>
                        <button onClick={() => { setEditingAppId(a._id); setEditApp({...a}); }} className="p-2 hover:bg-indigo-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"><Pencil className="w-4 h-4" /></button>
                        {!a.form956Signed && <button onClick={() => handleMarkForm956(a._id)} disabled={marking956 === a._id} className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg font-black text-[9px] uppercase hover:bg-amber-100 transition-all">Mark 956</button>}
                        <button onClick={() => setAppNoteAppId(appNoteAppId === a._id ? null : a._id)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"><StickyNote className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteApplication(a._id)} className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-600 transition-all"><Trash2 className="w-5 h-5" /></button>
                     </div>
                   </div>

                   {editingAppId === a._id && editApp && (
                     <form onSubmit={handleUpdateApplication} className="p-6 bg-slate-50 rounded-2xl border border-indigo-100 space-y-4 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Status</label><select value={editApp.status} onChange={e => setEditApp({...editApp, status: e.target.value})} className="w-full bg-white p-3 rounded-xl border border-slate-100 font-bold text-sm"><option value="ONBOARDING">Onboarding</option><option value="DRAFTING">Drafting</option><option value="REVIEW">Review</option><option value="LODGED">Lodged</option><option value="DECISION">Decision</option><option value="COMPLETED">Completed</option></select></div>
                           <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Visa Subclass</label><input value={editApp.visaSubclass} onChange={e => setEditApp({...editApp, visaSubclass: e.target.value})} className="w-full bg-white p-3 rounded-xl border border-slate-100 font-bold text-sm" /></div>
                        </div>
                        <div className="flex gap-2"><button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px]">SaveChanges</button><button type="button" onClick={() => setEditingAppId(null)} className="px-4 py-2 text-slate-500 font-bold text-[10px]">Cancel</button></div>
                     </form>
                   )}

                   {appNoteAppId === a._id && (
                     <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-4 animate-in slide-in-from-top-2">
                        <h4 className="font-black text-amber-800 text-xs uppercase flex items-center gap-2"><StickyNote className="w-4 h-4" /> Application Notes</h4>
                        <div className="space-y-2">
                           {a.notes?.map((n: any, i: number) => (
                             <div key={i} className="bg-white/50 p-3 rounded-xl border border-amber-200"><p className="text-sm font-medium text-slate-800">{n.text}</p><p className="text-[10px] font-bold text-slate-400 mt-1">{n.addedBy?.profile?.firstName} • {new Date(n.addedAt).toLocaleDateString()}</p></div>
                           ))}
                        </div>
                        <form onSubmit={e => handleAddAppNote(e, a._id)} className="flex gap-2">
                           <input value={appNoteText} onChange={e => setAppNoteText(e.target.value)} placeholder="Add note..." className="flex-1 bg-white p-3 rounded-xl border border-amber-200 text-sm outline-none" />
                           <button type="submit" disabled={addingAppNote} className="px-6 py-2 bg-amber-600 text-white rounded-xl font-black uppercase text-[10px]">{addingAppNote ? '...' : 'Add'}</button>
                        </form>
                     </div>
                   )}

                   {coeAppId === a._id && (
                     <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in slide-in-from-top-2">
                       <h4 className="font-black text-slate-800 text-xs uppercase flex items-center gap-2"><GraduationCap className="w-4 h-4 text-indigo-500" /> Confirmation of Enrolment</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-white p-3 rounded-xl border border-slate-100"><label className="text-[10px] font-black text-slate-400 uppercase">CoE Number</label><input value={coeForm.number} onChange={e => setCoeForm({...coeForm, number: e.target.value})} className="w-full font-bold text-sm text-slate-800 outline-none" /></div>
                          <div className="bg-white p-3 rounded-xl border border-slate-100"><label className="text-[10px] font-black text-slate-400 uppercase">Institution</label><input value={coeForm.institution} onChange={e => setCoeForm({...coeForm, institution: e.target.value})} className="w-full font-bold text-sm text-slate-800 outline-none" /></div>
                       </div>
                       <button onClick={handleSaveCoe} disabled={savingCoe} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all">{savingCoe ? 'Saving...' : 'Update CoE Details'}</button>
                     </div>
                   )}
                 </div>
               ))}
               {!applications.length && <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-bold italic">No visa applications logged for this client.</div>}
             </div>
          </div>
        )}

        {tab === 'task-sheet' && (
          <div className="space-y-8">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><History className="w-5 h-5 text-indigo-600" /> Full Audit Trail & History</h2>
            <div className="space-y-4">
               {activity.map((t, i) => (
                 <div key={i} className="flex gap-4 relative">
                   {i < activity.length - 1 && <div className="absolute left-6 top-10 bottom-0 w-0.5 bg-slate-100" />}
                   <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center shrink-0 z-10 text-slate-400 group-hover:border-indigo-400 transition-all"><ClipboardList className="w-5 h-5" /></div>
                   <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex-1">
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{t.action || t.source}</span>
                         <span className="text-[10px] font-bold text-slate-400">{new Date(t.changedAt || t.addedAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 leading-relaxed">{t.description || t.text}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">— {t.changedBy?.profile?.firstName || 'System'} {t.changedBy?.profile?.lastName}</p>
                   </div>
                 </div>
               ))}
               {!activity.length && <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-bold italic">No activity history found.</div>}
            </div>
          </div>
        )}

        {(tab === 'skill-assessments' || tab === 'immigration-history') && (
          <div className="p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
             <p className="font-bold text-slate-400 italic mb-4">You can now manage these directly in the "Full Profile" tab for a more integrated experience.</p>
             <button onClick={() => setTab('profile-details')} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Open Full Profile</button>
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewTab({ client, id, sendingDoc, setSendingDoc }: any) {
  const p = client.profile || {};
  const sendDoc = async (type: string, url: string) => {
    setSendingDoc(type);
    try {
      const res = await authFetch(url, { method: 'POST' });
      const data = await safeJson<any>(res);
      if (data.error) throw new Error(data.error);
      alert('Document sent successfully.');
    } catch (e: any) { alert(e.message); } finally { setSendingDoc(null); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><Send className="w-5 h-5 text-indigo-600" /> Administrative Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <button onClick={() => sendDoc('956', `/api/clients/${id}/send-form956`)} disabled={!!sendingDoc} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left hover:border-indigo-500 hover:bg-white transition-all group">
                <FileSignature className="w-5 h-5 mb-2 text-slate-400 group-hover:text-indigo-600" />
                <p className="font-black text-xs uppercase tracking-widest text-slate-800">Send Form 956</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Appointment of agent</p>
             </button>
             <button onClick={() => sendDoc('mia', `/api/clients/${id}/send-mia`)} disabled={!!sendingDoc} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left hover:border-indigo-500 hover:bg-white transition-all group">
                <FileText className="w-5 h-5 mb-2 text-slate-400 group-hover:text-indigo-600" />
                <p className="font-black text-xs uppercase tracking-widest text-slate-800">MIA Agreement</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Direct Contract</p>
             </button>
             <button onClick={() => sendDoc('advice', `/api/clients/${id}/send-initial-advice`)} disabled={!!sendingDoc} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left hover:border-indigo-500 hover:bg-white transition-all group">
                <Mail className="w-5 h-5 mb-2 text-slate-400 group-hover:text-indigo-600" />
                <p className="font-black text-xs uppercase tracking-widest text-slate-800">Migration Advice</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Send PDF Advice</p>
             </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><StickyNote className="w-5 h-5 text-amber-500" /> Internal Notes</h2>
          <div className="space-y-4">
            {client.notes?.slice(0, 5).map((n: any, i: number) => (
              <div key={i} className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">{n.type}</span>
                  <span className="text-[10px] font-bold text-slate-400">{new Date(n.addedAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-medium text-slate-800 leading-relaxed">{n.text}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">— {n.addedBy?.profile?.firstName || 'Orivisa Agent'}</p>
              </div>
            ))}
            {!client.notes?.length && <p className="text-center py-8 text-slate-400 font-bold italic">No notes yet.</p>}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-indigo-50 flex items-center justify-center text-3xl font-black text-indigo-600 border border-indigo-100">
            {p.firstName?.[0]}{p.lastName?.[0]}
          </div>
          <h3 className="font-black text-slate-900">{p.firstName} {p.lastName}</h3>
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-1">Prospect Profile</p>
        </div>
        
        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl">
           <p className="text-white font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Compliance Status</p>
           <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase"><span className="text-slate-400">Passport</span><span className={p.passportNumber ? 'text-emerald-400' : 'text-red-400'}>{p.passportNumber ? 'Verified' : 'Missing'}</span></div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase"><span className="text-slate-400">956 Status</span><span className="text-slate-400">Pending</span></div>
           </div>
        </div>
      </div>
    </div>
  );
}
