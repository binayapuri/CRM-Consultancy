import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authFetch } from '../../store/auth';
import { FileText, FileDown, ExternalLink, Download, Check, Send, Users } from 'lucide-react';

type Tab = 'templates' | 'samples' | 'checklists';

export default function Documents() {
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const [activeTab, setActiveTab] = useState<Tab>('templates');
  const [templates, setTemplates] = useState<any[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<Record<string, { label: string; items: string[] }>>({});
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendToClient, setSendToClient] = useState<{ visaKey: string; visaLabel: string } | null>(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const clientsUrl = consultancyId ? `/api/clients?consultancyId=${consultancyId}` : '/api/clients';
    Promise.all([
      authFetch('/api/constants/document-templates').then(r => r.json()),
      authFetch('/api/constants/sample-documents').then(r => r.json()),
      authFetch('/api/constants/visa-checklists').then(r => r.json()),
      authFetch(clientsUrl).then(r => r.json()),
    ]).then(([t, s, c, cl]) => {
      setTemplates(Array.isArray(t) ? t : []);
      setSamples(Array.isArray(s) ? s : []);
      setChecklists(typeof c === 'object' && c !== null ? c : {});
      setClients(Array.isArray(cl) ? cl : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [consultancyId]);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSendChecklist = async () => {
    if (!sendToClient || !selectedClientId) return;
    setSending(true);
    try {
      const items = checklists[sendToClient.visaKey]?.items || [];
      const res = await authFetch('/api/notifications/send-to-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          type: 'CHECKLIST_SENT',
          title: `${sendToClient.visaLabel} – Document Checklist`,
          message: `Your migration agent has sent you the document checklist for ${sendToClient.visaLabel}. Required items: ${items.join(', ')}. Log in to your portal to view and upload documents.`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSendToClient(null);
      setSelectedClientId('');
      showMsg('success', 'Checklist sent to client. They will see it in their notifications.');
    } catch (err) {
      showMsg('error', (err as Error).message);
    } finally {
      setSending(false);
    }
  };

  const downloadChecklist = (visaKey: string) => {
    const c = checklists[visaKey];
    if (!c) return;
    const text = `${c.label} – Document Checklist\n\nRequired documents:\n${c.items.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}\n\n— ORIVISA Consultancy`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visa-${visaKey}-checklist.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const byCategory = (items: any[]) => items.reduce((acc: Record<string, any[]>, t: any) => {
    const cat = t.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  return (
    <div className="w-full min-w-0 max-w-full">
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">Documents</h1>
        <p className="text-slate-500 mt-1">Templates, sample documents & visa checklists for all clients. Personal client documents are in each client&apos;s profile.</p>
      </div>

      {message && (
        <div className={`mt-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit mt-6 flex-wrap">
        <button onClick={() => setActiveTab('templates')} className={`px-4 py-2 rounded-md font-medium transition ${activeTab === 'templates' ? 'bg-white shadow text-ori-600' : 'text-slate-600 hover:text-slate-900'}`}>
          Templates
        </button>
        <button onClick={() => setActiveTab('samples')} className={`px-4 py-2 rounded-md font-medium transition ${activeTab === 'samples' ? 'bg-white shadow text-ori-600' : 'text-slate-600 hover:text-slate-900'}`}>
          Sample Documents
        </button>
        <button onClick={() => setActiveTab('checklists')} className={`px-4 py-2 rounded-md font-medium transition ${activeTab === 'checklists' ? 'bg-white shadow text-ori-600' : 'text-slate-600 hover:text-slate-900'}`}>
          Visa Checklists
        </button>
      </div>

      {/* Templates */}
      {activeTab === 'templates' && (
        <div className="mt-6">
          <p className="text-slate-600 mb-6">Official Home Affairs forms and templates. Download or use as reference.</p>
          {loading ? (
            <div className="card p-12 text-center text-slate-500">Loading...</div>
          ) : (
            <div className="space-y-8">
              {Object.entries(byCategory(templates)).map(([category, items]) => (
                <div key={category} className="card">
                  <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-ori-600" /> {category}</h2>
                  <div className="space-y-3">
                    {items.map((t: any) => (
                      <div key={t.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900">{t.name}</p>
                          <p className="text-sm text-slate-500 mt-0.5">{t.description}</p>
                          <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs bg-slate-200 text-slate-600">{t.category}</span>
                        </div>
                        <div className="shrink-0 sm:ml-4">
                          {t.url ? (
                            <a href={t.url} target="_blank" rel="noopener noreferrer" className="btn-primary flex items-center gap-2"><Download className="w-4 h-4" /> Download</a>
                          ) : (
                            <span className="text-slate-400 text-sm flex items-center gap-1"><ExternalLink className="w-4 h-4" /> Internal template</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sample Documents */}
      {activeTab === 'samples' && (
        <div className="mt-6">
          <p className="text-slate-600 mb-6">Common documents for all clients – MIA Agreement, service agreements, forms. Not personal client files.</p>
          {loading ? (
            <div className="card p-12 text-center text-slate-500">Loading...</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {samples.map((s: any) => (
                <div key={s.id} className="card flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-ori-100 flex items-center justify-center shrink-0">
                    <FileDown className="w-6 h-6 text-ori-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{s.name}</p>
                    <p className="text-sm text-slate-500 mt-1">{s.description}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs">{s.category}</span>
                  </div>
                  <div className="shrink-0">
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="btn-primary flex items-center gap-2 text-sm"><ExternalLink className="w-4 h-4" /> Download</a>
                    ) : (
                      <span className="text-sm text-slate-400">Available on request</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Visa Checklists */}
      {activeTab === 'checklists' && (
        <div className="mt-6">
          <p className="text-slate-600 mb-6">Downloadable document checklists for each Australian visa type. Send to clients so they know what to prepare.</p>
          {loading ? (
            <div className="card p-12 text-center text-slate-500">Loading...</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(checklists).map(([visaKey, data]) => (
                <div key={visaKey} className="card group">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-slate-900">{data.label}</h3>
                    <span className="text-xs text-slate-400">Subclass {visaKey}</span>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {data.items.slice(0, 4).map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600"><Check className="w-4 h-4 text-green-500 shrink-0" /> {item}</li>
                    ))}
                    {data.items.length > 4 && <li className="text-xs text-slate-400">+{data.items.length - 4} more</li>}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => downloadChecklist(visaKey)} className="btn-secondary text-sm flex items-center gap-1"><Download className="w-4 h-4" /> Download</button>
                    <button onClick={() => setSendToClient({ visaKey, visaLabel: data.label })} className="btn-primary text-sm flex items-center gap-1"><Send className="w-4 h-4" /> Send to Client</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Send to Client modal */}
          {sendToClient && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h3 className="font-display font-semibold text-slate-900 mb-2">Send {sendToClient.visaLabel} Checklist</h3>
                <p className="text-slate-600 text-sm mb-4">The client will receive a notification with the checklist. They must have activated their account.</p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Client</label>
                  <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="input">
                    <option value="">Choose client...</option>
                    {(Array.isArray(clients) ? clients : []).filter((c: any) => c.userId).map((c: any) => (
                      <option key={c._id} value={c._id}>{c.profile?.firstName} {c.profile?.lastName} {c.profile?.email}</option>
                    ))}
                    {(Array.isArray(clients) ? clients : []).filter((c: any) => !c.userId).length > 0 && (
                      <optgroup label="No portal access yet">
                        {(Array.isArray(clients) ? clients : []).filter((c: any) => !c.userId).map((c: any) => (
                          <option key={c._id} value={c._id} disabled>{c.profile?.firstName} {c.profile?.lastName} (invite first)</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
                <div className="flex gap-2 mt-6">
                  <button onClick={handleSendChecklist} disabled={sending || !selectedClientId} className="btn-primary flex-1 flex items-center gap-2">
                    <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Send'}
                  </button>
                  <button onClick={() => { setSendToClient(null); setSelectedClientId(''); }} className="btn-secondary">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card mt-8 p-6 bg-slate-50 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2"><Users className="w-5 h-5 text-ori-600" /> Personal Client Documents</h3>
        <p className="text-slate-600 text-sm">Photos, signatures, passports and other personal documents are stored per client. View and manage them from each client&apos;s profile → Documents tab.</p>
        <Link to="/consultancy/clients" className="text-ori-600 hover:underline text-sm font-medium mt-2 inline-block">Go to Clients →</Link>
      </div>
    </div>
  );
}
