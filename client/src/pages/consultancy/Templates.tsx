import { useEffect, useState } from 'react';
import { authFetch } from '../../store/auth';
import { FileText, Download, ExternalLink } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  Forms: 'bg-amber-100 text-amber-800',
  Templates: 'bg-blue-100 text-blue-800',
};

export default function Templates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authFetch('/api/constants/document-templates')
      .then(r => r.json())
      .then(data => {
        setTemplates(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch(e => { setError((e as Error).message); setTemplates([]); })
      .finally(() => setLoading(false));
  }, []);

  const byCategory = templates.reduce((acc: Record<string, any[]>, t: any) => {
    const cat = t.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900">Document Templates</h1>
      <p className="text-slate-500 mt-1">Official Home Affairs forms and templates for visa applications</p>

      {error ? <div className="card mt-6 p-4 bg-red-50 border border-red-100 text-red-700">{error}</div> : null}
      {loading ? (
        <div className="card mt-6 p-12 text-center text-slate-500">Loading...</div>
      ) : (
        <div className="mt-6 space-y-8">
          {(Object.entries(byCategory) as [string, any[]][]).map(([category, items]) => (
            <div key={category} className="card">
              <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-ori-600" />
                {category}
              </h2>
              <div className="space-y-3">
                {items.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{t.name}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{t.description}</p>
                      <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${CATEGORY_COLORS[category] || 'bg-slate-100 text-slate-600'}`}>{category}</span>
                    </div>
                    <div className="shrink-0 ml-4">
                      {t.url ? (
                        <a href={t.url} target="_blank" rel="noopener noreferrer" className="btn-primary flex items-center gap-2">
                          <Download className="w-4 h-4" /> Download
                        </a>
                      ) : (
                        <span className="text-slate-400 text-sm flex items-center gap-1">
                          <ExternalLink className="w-4 h-4" /> Internal template
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card mt-8 p-6 bg-ori-50 border border-ori-100">
        <h3 className="font-semibold text-slate-900 mb-2">Form 956 & 956A</h3>
        <p className="text-sm text-slate-600">When using a registered migration agent, clients must complete Form 956 (Appointment of a registered migration agent). Form 956A is used to appoint an authorised recipient for correspondence. Both forms are available from the Department of Home Affairs.</p>
      </div>
    </div>
  );
}
