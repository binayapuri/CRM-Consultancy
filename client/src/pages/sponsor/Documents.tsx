import { useEffect, useState } from 'react';
import { authFetch } from '../../store/auth';
import { FileText, FileSignature, FileCheck } from 'lucide-react';

export default function SponsorDocuments() {
  const [sponsor, setSponsor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/sponsors/me')
      .then(r => r.json())
      .then(data => { setSponsor(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500">Loading...</div>;
  if (!sponsor) return <div className="card p-8 text-center text-slate-500">No sponsor profile.</div>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900">Documents</h1>
      <p className="text-slate-500 mt-1">Forms and agreements for your sponsorship</p>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <FileSignature className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Form 956</h3>
              <p className="text-sm text-slate-500">Appointment of Authorised Recipient</p>
            </div>
          </div>
          <p className="text-slate-600 text-sm mb-4">Appoints your migration agent to receive correspondence from the Department of Home Affairs on your behalf.</p>
          <div className={`px-3 py-2 rounded-lg text-sm ${sponsor.form956Signed ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            {sponsor.form956Signed ? '✓ Signed' : 'Pending – your agent will send this for signature'}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">MIA Agreement</h3>
              <p className="text-sm text-slate-500">Migration Agent Agreement</p>
            </div>
          </div>
          <p className="text-slate-600 text-sm mb-4">Service agreement between your company and the migration agency.</p>
          <div className={`px-3 py-2 rounded-lg text-sm ${sponsor.miaSigned ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            {sponsor.miaSigned ? '✓ Signed' : 'Pending – your agent will send this for signature'}
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <h3 className="font-semibold text-slate-900 mb-3">Document Checklist</h3>
        <p className="text-slate-600 text-sm">Your migration agent will add required documents (LMT, GPR, financials, etc.) as needed for your nomination.</p>
        <div className="mt-4 space-y-2">
          {(sponsor.documentChecklist || []).map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <span>{item.name || `Item ${i + 1}`}</span>
              <span className={item.uploaded ? 'text-green-600 text-sm' : 'text-amber-600 text-sm'}>{item.uploaded ? 'Uploaded' : 'Pending'}</span>
            </div>
          ))}
          {(!sponsor.documentChecklist || sponsor.documentChecklist.length === 0) && (
            <p className="text-slate-500 text-sm">No documents in checklist yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
