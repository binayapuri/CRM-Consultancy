import { useState, useEffect, useRef } from 'react';
import { authFetch } from '../../store/auth';
import { Trash2, FileText, File, Image, Download, CheckCircle2, AlertTriangle, Plus, X } from 'lucide-react';

const DOC_TYPES = [
  { value: 'PASSPORT', label: '🛂 Passport', visa: 'all' },
  { value: 'IELTS_TRF', label: '📝 IELTS TRF', visa: 'all' },
  { value: 'PTE_SCORE', label: '📝 PTE Score Report', visa: 'all' },
  { value: 'TOEFL_SCORE', label: '📝 TOEFL Score', visa: 'all' },
  { value: 'COE', label: '📋 Confirmation of Enrolment (CoE)', visa: '500' },
  { value: 'OSHC', label: '🏥 OSHC Certificate', visa: '500' },
  { value: 'DEGREE', label: '🎓 Degree Certificate', visa: 'all' },
  { value: 'TRANSCRIPT', label: '📑 Academic Transcript', visa: 'all' },
  { value: 'EMPLOYMENT_LETTER', label: '💼 Employment Reference Letter', visa: 'skilled' },
  { value: 'SKILLS_ASSESSMENT', label: '📊 Skills Assessment Letter', visa: 'skilled' },
  { value: 'POLICE_CLEARANCE', label: '🚔 Police Clearance', visa: 'all' },
  { value: 'HEALTH_EXAM', label: '🏨 Health Examination Report', visa: 'skilled' },
  { value: 'BIRTH_CERTIFICATE', label: '📜 Birth Certificate', visa: 'all' },
  { value: 'MARRIAGE_CERTIFICATE', label: '💍 Marriage Certificate', visa: 'all' },
  { value: 'BANK_STATEMENT', label: '🏦 Bank Statement', visa: '500' },
  { value: 'PAYSLIP', label: '💰 Payslip / Payroll Record', visa: 'skilled' },
  { value: 'OTHER', label: '📁 Other Document', visa: 'all' },
];

const CHECKLISTS = {
  student500: {
    label: 'Student Visa (Subclass 500)',
    color: '#6366F1',
    docs: ['PASSPORT', 'IELTS_TRF', 'COE', 'OSHC', 'BANK_STATEMENT', 'POLICE_CLEARANCE', 'HEALTH_EXAM'],
  },
  skilled189: {
    label: 'Skilled Independent (189)',
    color: '#F59E0B',
    docs: ['PASSPORT', 'IELTS_TRF', 'DEGREE', 'TRANSCRIPT', 'SKILLS_ASSESSMENT', 'EMPLOYMENT_LETTER', 'POLICE_CLEARANCE', 'HEALTH_EXAM'],
  },
  graduate485: {
    label: 'Graduate Visa (485)',
    color: '#10B981',
    docs: ['PASSPORT', 'IELTS_TRF', 'DEGREE', 'TRANSCRIPT', 'POLICE_CLEARANCE', 'HEALTH_EXAM'],
  },
};

function FileIcon({ mime }: { mime: string }) {
  if (mime?.includes('image')) return <Image className="w-5 h-5 text-indigo-500" />;
  if (mime?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
  return <File className="w-5 h-5 text-slate-400" />;
}

function formatBytes(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documents() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedType, setSelectedType] = useState('PASSPORT');
  const [docName, setDocName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeChecklist, setActiveChecklist] = useState<keyof typeof CHECKLISTS>('student500');
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchDocs = () => {
    authFetch('/api/student/documents')
      .then(r => r.json())
      .then(d => { setDocs(Array.isArray(d) ? d : []); setLoading(false); });
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleUpload = async () => {
    if (!file) return setMsg({ type: 'error', text: 'Please select a file' });
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', selectedType);
      fd.append('name', docName || DOC_TYPES.find(d => d.value === selectedType)?.label?.replace(/^[^ ]+ /, '') || file.name);
      fd.append('description', description);
      const res = await authFetch('/api/student/documents', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setMsg({ type: 'success', text: 'Document uploaded successfully!' });
      setFile(null); setDocName(''); setDescription(''); setShowUpload(false);
      if (fileRef.current) fileRef.current.value = '';
      fetchDocs();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    const res = await authFetch(`/api/student/documents/${id}`, { method: 'DELETE' });
    if (res.ok) fetchDocs();
  };

  const uploadedTypes = new Set(docs.map(d => d.type));
  const checklist = CHECKLISTS[activeChecklist];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">📂 Document Vault</h1>
          <p className="text-slate-500 font-medium mt-2">Securely store your visa, education, and immigration documents.</p>
        </div>
        <button onClick={() => setShowUpload(!showUpload)} className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-white text-sm" style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)' }}>
          <Plus className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* Upload Panel */}
      {showUpload && (
        <div className="mb-6 bg-white rounded-3xl p-6 space-y-4 animate-fade-in-up" style={{ border: '2px solid #C7D2FE' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-lg">Upload New Document</h3>
            <button onClick={() => { setShowUpload(false); setFile(null); setMsg(null); }}><X className="w-5 h-5 text-slate-400" /></button>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Document Type</label>
            <select value={selectedType} onChange={e => { setSelectedType(e.target.value); setDocName(''); }} className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/40">
              {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Label (optional)</label>
            <input value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. IELTS result — 7.5 overall" className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/40" />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">File</label>
            <div
              className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer hover:border-indigo-400 transition-colors"
              style={{ borderColor: file ? '#6366F1' : '#CBD5E1', background: file ? '#EEF2FF' : '#F8FAFC' }}
              onClick={() => fileRef.current?.click()}
            >
              <input type="file" ref={fileRef} className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif" />
              {file ? (
                <div>
                  <div className="text-2xl mb-1">📎</div>
                  <p className="font-bold text-indigo-700 text-sm">{file.name}</p>
                  <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
                </div>
              ) : (
                <div>
                  <p className="font-bold text-slate-500 text-sm">Click to select file</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, JPG, PNG · Max 10 MB</p>
                </div>
              )}
            </div>
          </div>

          {msg && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {msg.text}
            </div>
          )}

          <button onClick={handleUpload} disabled={!file || uploading} className="w-full py-3 rounded-2xl font-black text-white text-sm disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)' }}>
            {uploading ? '⏳ Uploading...' : '⬆️ Upload Document'}
          </button>
        </div>
      )}

      {/* Visa checklist */}
      <div className="mb-6">
        <h2 className="font-black text-slate-800 mb-3">📋 Visa Document Checklist</h2>
        <div className="flex gap-2 mb-4 flex-wrap">
          {Object.entries(CHECKLISTS).map(([key, cl]) => (
            <button key={key} onClick={() => setActiveChecklist(key as keyof typeof CHECKLISTS)} className="px-4 py-2 rounded-xl font-bold text-sm transition-all" style={activeChecklist === key ? { background: cl.color, color: 'white' } : { background: '#F1F5F9', color: '#64748B' }}>
              {cl.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {checklist.docs.map(type => {
            const dt = DOC_TYPES.find(d => d.value === type);
            const done = uploadedTypes.has(type);
            return (
              <div key={type} className="p-3 rounded-2xl flex items-center gap-2" style={{ background: done ? '#F0FDF4' : '#F8FAFC', border: `1.5px solid ${done ? '#BBF7D0' : '#E2E8F0'}` }}>
                {done ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />}
                <span className={`text-xs font-bold ${done ? 'text-emerald-800' : 'text-slate-500'}`}>{dt?.label?.replace(/^[^ ]+ /, '') || type}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Document list */}
      <div>
        <h2 className="font-black text-slate-800 mb-4">My Documents ({docs.length})</h2>
        {loading ? (
          <p className="text-slate-400 text-center py-8 font-medium">Loading documents...</p>
        ) : docs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl" style={{ border: '1px solid #E8EDFB' }}>
            <div className="text-5xl mb-4">📂</div>
            <p className="font-bold text-slate-500">No documents uploaded yet</p>
            <p className="text-sm text-slate-400 mt-1">Start uploading your visa and immigration documents.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {docs.map(doc => (
              <div key={doc._id} className="bg-white rounded-2xl p-4 flex items-center gap-4" style={{ border: '1px solid #E8EDFB' }}>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <FileIcon mime={doc.mimeType} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{doc.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {DOC_TYPES.find(t => t.value === doc.type)?.label?.replace(/^[^ ]+ /, '') || doc.type}
                    </span>
                    {doc.fileSize && <span className="text-xs text-slate-400">{formatBytes(doc.fileSize)}</span>}
                    <span className="text-xs text-slate-400">{new Date(doc.createdAt).toLocaleDateString('en-AU')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center hover:bg-indigo-100 transition-colors">
                    <Download className="w-4 h-4 text-indigo-600" />
                  </a>
                  <button onClick={() => handleDelete(doc._id)} className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
