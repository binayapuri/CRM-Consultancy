import { useEffect, useState } from 'react';
import { authFetch } from '../../store/auth';
import { Building2, FileSignature, FileCheck, Clock, CheckCircle } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function SponsorDashboard() {
  const [sponsor, setSponsor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/sponsors/me')
      .then(r => r.json())
      .then(data => { setSponsor(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center gap-2 text-slate-500"><LoadingSpinner size="sm" /> Loading...</div>;
  if (!sponsor) return <div className="card p-8 text-center text-slate-500">No sponsor profile linked to your account.</div>;

  const cp = sponsor.contactPerson || {};
  const checklist = sponsor.documentChecklist || [];
  const done = checklist.filter((i: any) => i.uploaded).length;
  const total = checklist.length || 0;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900">Welcome, {cp.firstName || sponsor.companyName}</h1>
      <p className="text-slate-500 mt-1">Sponsor portal for {sponsor.companyName}</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-ori-100 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-ori-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{sponsor.companyName}</p>
            <p className="text-sm text-slate-500">Company</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <FileSignature className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{sponsor.form956Signed ? 'Signed' : 'Pending'}</p>
            <p className="text-sm text-slate-500">Form 956</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
            <FileCheck className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{sponsor.miaSigned ? 'Signed' : 'Pending'}</p>
            <p className="text-sm text-slate-500">MIA Agreement</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
            <StatusBadge status={sponsor.nominationStatus || 'PENDING'} />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Nomination</p>
            <p className="text-sm text-slate-500">Status</p>
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" /> Document Checklist
        </h3>
        <div className="space-y-2">
          {checklist.length === 0 ? (
            <p className="text-slate-500 text-sm">No documents required yet. Your migration agent will add requirements.</p>
          ) : (
            checklist.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <span className="font-medium text-slate-700">{item.name || `Document ${i + 1}`}</span>
                {item.uploaded ? <CheckCircle className="w-5 h-5 text-green-500" /> : <span className="text-amber-600 text-sm">Pending</span>}
              </div>
            ))
          )}
        </div>
        <p className="text-sm text-slate-500 mt-3">{done}/{total} documents completed</p>
      </div>

      <div className="card mt-6 border-l-4 border-ori-500">
        <h3 className="font-semibold text-slate-900">Immigration Support</h3>
        <p className="text-slate-600 mt-2 text-sm">
          As an employer sponsor, you may need to provide Form 956 (Appointment of Authorised Recipient), MIA (Migration Agent Agreement),
          and business evidence for 482, 186, or 494 nominations. Your migration agent will guide you through the process.
        </p>
      </div>
    </div>
  );
}
