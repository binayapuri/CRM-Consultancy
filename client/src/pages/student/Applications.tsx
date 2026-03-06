import { useEffect, useState } from 'react';
import { authFetch } from '../../store/auth';
import { format } from 'date-fns';
import { FileText, CheckCircle, Clock, AlertCircle, ChevronRight, ExternalLink, StickyNote, ChevronDown, ChevronUp, Upload, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';

const VISA_LABELS: Record<string, string> = {
  '500': 'Student Visa (500)',
  '485': 'Temporary Graduate (485)',
  '189': 'Skilled Independent (189)',
  '190': 'Skilled Nominated (190)',
  '491': 'Skilled Regional (491)',
  '482': 'TSS (482)',
  '600': 'Visitor (600)',
};

const STATUS_COLORS: Record<string, string> = {
  ONBOARDING: 'bg-slate-100 text-slate-700',
  DRAFTING: 'bg-blue-100 text-blue-700',
  PENDING_INFO: 'bg-amber-100 text-amber-700',
  REVIEW: 'bg-purple-100 text-purple-700',
  LODGED: 'bg-green-100 text-green-700',
  DECISION: 'bg-ori-100 text-ori-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
};

export default function StudentApplications() {
  const [client, setClient] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [checklistMapping, setChecklistMapping] = useState<Record<string, string>>({});
  const [uploadFor, setUploadFor] = useState<{ appId: string; itemIndex: number; itemName: string } | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    authFetch('/api/constants/checklist-doc-mapping').then(r => r.json()).then(setChecklistMapping).catch(() => ({}));
    authFetch('/api/clients')
      .then(r => r.json())
      .then(data => {
        const c = Array.isArray(data) ? data[0] : data;
        setClient(c);
        if (c?._id) {
          authFetch(`/api/clients/${c._id}/applications`).then(r => r.json()).then(setApplications);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const refreshApplications = () => {
    if (client?._id) authFetch(`/api/clients/${client._id}/applications`).then(r => r.json()).then(setApplications);
  };

  const handleChecklistUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFor || !uploadFile || !client?._id) return;
    setUploading(true);
    try {
      const docType = checklistMapping[uploadFor.itemName] || 'OTHER';
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('clientId', client._id);
      fd.append('applicationId', uploadFor.appId);
      fd.append('type', docType);
      const res = await authFetch('/api/documents/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUploadFor(null);
      setUploadFile(null);
      refreshApplications();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const getChecklistProgress = (app: any) => {
    const checklist = app.documentChecklist || [];
    const total = checklist.length || 1;
    const uploaded = checklist.filter((i: any) => i.uploaded).length;
    return { uploaded, total, pct: Math.round((uploaded / total) * 100) };
  };

  if (loading) return <div className="flex items-center gap-2 text-slate-500"><LoadingSpinner size="sm" /> Loading...</div>;

  if (!client) return (
    <div className="card p-12 text-center">
      <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
      <h2 className="font-display font-semibold text-slate-900 mb-2">No Profile Linked</h2>
      <p className="text-slate-600 mb-4">Contact a consultancy to get enrolled. Once enrolled, your applications will appear here.</p>
      <Link to="consultancies" className="btn-primary inline-flex items-center gap-2">Find Consultancy <ChevronRight className="w-4 h-4" /></Link>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900">My Applications</h1>
      <p className="text-slate-500 mt-1">Track your visa applications and document checklist</p>

      {applications.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="font-semibold text-slate-900 mb-2">No Applications Yet</h2>
          <p className="text-slate-600">Your migration agent will create applications for you. Check back soon or contact your consultancy.</p>
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          {applications.map((app: any) => {
            const progress = getChecklistProgress(app);
            return (
              <div key={app._id} className="card overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b border-slate-100">
                  <div>
                    <h2 className="font-display font-semibold text-slate-900">{VISA_LABELS[app.visaSubclass] || `Subclass ${app.visaSubclass}`}</h2>
                    <p className="text-sm text-slate-500 mt-1">Created {app.createdAt && format(new Date(app.createdAt), 'dd MMM yyyy')}</p>
                    {app.visaSubclass === '500' && app.coe?.number && (
                      <p className="text-sm text-slate-600 mt-1">CoE: {app.coe.number} • {app.coe.institution} {app.coe.expiryDate && `• Expires ${format(new Date(app.coe.expiryDate), 'dd MMM yyyy')}`}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[app.status] || 'bg-slate-100 text-slate-700'}`}>{app.status.replace('_', ' ')}</span>
                    {app.lodgedAt && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Lodged {format(new Date(app.lodgedAt), 'dd MMM yyyy')}</span>}
                  </div>
                </div>
                <div className="p-4 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-700">Document Checklist</span>
                    <span className="text-sm text-slate-500">{progress.uploaded}/{progress.total} uploaded</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-ori-500 rounded-full transition-all" style={{ width: `${progress.pct}%` }} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {(app.documentChecklist || []).map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-100">
                        <div className="flex items-center gap-2 min-w-0">
                          {item.uploaded ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> : <Clock className="w-5 h-5 text-amber-500 shrink-0" />}
                          <span className={item.uploaded ? 'text-slate-700' : 'text-slate-500'}>{item.name}</span>
                          {item.required && <span className="text-xs text-slate-400">Required</span>}
                        </div>
                        {!item.uploaded && (
                          <button type="button" onClick={() => setUploadFor({ appId: app._id, itemIndex: i, itemName: item.name })} className="btn-secondary text-xs py-1 px-2 flex items-center gap-1 shrink-0">
                            <Upload className="w-3 h-3" /> Upload
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {(app.notes || []).length > 0 && (
                  <div className="px-4 py-3 border-t border-slate-100 bg-amber-50/50">
                    <button onClick={() => setExpandedNotes(x => ({ ...x, [app._id]: !x[app._id] }))} className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 w-full">
                      <StickyNote className="w-4 h-4 text-ori-500" /> Agent Notes ({(app.notes || []).length})
                      {expandedNotes[app._id] ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                    </button>
                    {expandedNotes[app._id] && (
                      <div className="mt-2 space-y-2">
                        {(app.notes || []).map((n: any, i: number) => (
                          <div key={i} className="p-3 rounded-lg bg-white border border-amber-100 text-sm">
                            <p className="text-slate-800">{n.text}</p>
                            <p className="text-xs text-slate-500 mt-1">{n.addedBy?.profile?.firstName} {n.addedBy?.profile?.lastName} • {format(new Date(n.addedAt), 'dd MMM yyyy HH:mm')}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4 border-t border-slate-100 flex justify-between items-center">
                  <Link to="documents" className="text-ori-600 hover:text-ori-700 text-sm font-medium flex items-center gap-1">
                    Upload documents <ExternalLink className="w-4 h-4" />
                  </Link>
                  {app.agentId && <p className="text-xs text-slate-500">Agent: {app.agentId.profile?.firstName} {app.agentId.profile?.lastName}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card mt-8 p-6 bg-ori-50 border border-ori-100">
        <h3 className="font-semibold text-slate-900 mb-2">Australian Visa Process</h3>
        <p className="text-sm text-slate-600">Your migration agent manages the lodgement with the Department of Home Affairs. Upload requested documents promptly to avoid delays. Form 956 (Agent Nomination) is required when using a registered migration agent.</p>
      </div>

      {uploadFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-slate-900">Upload: {uploadFor.itemName}</h3>
              <button onClick={() => { setUploadFor(null); setUploadFile(null); }} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleChecklistUpload}>
              <input type="file" required accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="input mb-4" />
              <div className="flex gap-2">
                <button type="submit" disabled={uploading || !uploadFile} className="btn-primary flex-1">{uploading ? 'Uploading...' : 'Upload'}</button>
                <button type="button" onClick={() => { setUploadFor(null); setUploadFile(null); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
