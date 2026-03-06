import { useEffect, useState } from 'react';
import { authFetch } from '../../store/auth';
import { FileText, Check, Upload, Download, Trash2 } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function StudentDocuments() {
  const [client, setClient] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ type: 'PASSPORT', applicationId: '' as string, file: null as File | null });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      authFetch('/api/clients').then(r => r.json()),
      authFetch('/api/constants/document-types').then(r => r.json()),
      authFetch('/api/constants/document-templates').then(r => r.json()),
    ]).then(([clientsData, typesData, templatesData]) => {
      const c = Array.isArray(clientsData) ? clientsData[0] : clientsData;
      setClient(c);
      setDocTypes(typesData);
      setTemplates(templatesData);
      if (c?._id) {
        authFetch(`/api/documents?clientId=${c._id}`).then(r => r.json()).then(setDocuments);
        authFetch(`/api/clients/${c._id}/applications`).then(r => r.json()).then(setApplications);
      }
      setLoading(false);
    });
  }, []);

  const fetchDocuments = () => {
    if (client?._id) authFetch(`/api/documents?clientId=${client._id}`).then(r => r.json()).then(setDocuments);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !client?._id) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadForm.file);
      fd.append('clientId', client._id);
      fd.append('type', uploadForm.type);
      if (uploadForm.applicationId) fd.append('applicationId', uploadForm.applicationId);
      const res = await authFetch('/api/documents/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowUpload(false);
      setUploadForm({ type: 'PASSPORT', applicationId: '', file: null });
      fetchDocuments();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const deleteDoc = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      const res = await authFetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchDocuments();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  if (loading) return <div className="flex items-center gap-2 text-slate-500"><LoadingSpinner size="sm" /> Loading...</div>;

  if (!client) return (
    <div className="card p-12 text-center text-slate-500">
      No profile linked yet. Contact your consultancy to get enrolled.
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900">My Documents</h1>
      <p className="text-slate-500 mt-1">Upload and manage your visa documents</p>

      <div className="flex items-center justify-between mt-6">
        <h2 className="font-semibold text-slate-900">Your Documents</h2>
        <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2"><Upload className="w-4 h-4" /> Upload Document</button>
      </div>

      {showUpload && (
        <form onSubmit={handleUpload} className="card mt-6 max-w-xl">
          <h3 className="font-semibold text-slate-900 mb-4">Upload Document</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Document Type</label>
              <select value={uploadForm.type} onChange={e => setUploadForm(f => ({ ...f, type: e.target.value }))} className="input">
                {docTypes.map((t: any) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {applications.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">For Application (optional)</label>
                <select value={uploadForm.applicationId} onChange={e => setUploadForm(f => ({ ...f, applicationId: e.target.value }))} className="input">
                  <option value="">All applications</option>
                  {applications.map((a: any) => <option key={a._id} value={a._id}>Subclass {a.visaSubclass} ({a.status})</option>)}
                </select>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">File *</label>
              <input type="file" required onChange={e => setUploadForm(f => ({ ...f, file: e.target.files?.[0] || null }))} className="input" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn-primary" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
            <button type="button" onClick={() => setShowUpload(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {documents.map((d: any) => (
          <div key={d._id} className="card flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${d.status === 'UPLOADED' ? 'bg-green-100' : 'bg-slate-100'}`}>
              {d.status === 'UPLOADED' ? <Check className="w-5 h-5 text-green-600" /> : <FileText className="w-5 h-5 text-slate-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">{d.name}</p>
              <p className="text-sm text-slate-500">{d.type || 'Document'}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="View"><Download className="w-4 h-4" /></a>}
              <button onClick={() => deleteDoc(d._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
      {!documents.length && !showUpload && <div className="card mt-6 p-12 text-center text-slate-500">No documents yet. Click "Upload Document" to add.</div>}

      <div className="card mt-8 p-6 bg-slate-50">
        <h2 className="font-semibold text-slate-900 mb-4">Sample Forms & Templates</h2>
        <p className="text-slate-600 text-sm mb-4">Official forms from Home Affairs for your visa application.</p>
        <div className="space-y-3">
          {templates.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200">
              <div>
                <p className="font-medium text-slate-900">{t.name}</p>
                <p className="text-sm text-slate-500">{t.description}</p>
              </div>
              {t.url && <a href={t.url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm flex items-center gap-1">Download</a>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
