import { useEffect, useState } from 'react';
import { authFetch } from '../../store/auth';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

export default function CompanyInfo() {
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

  const addr = sponsor.address || {};
  const cp = sponsor.contactPerson || {};

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900">Company Info</h1>
      <p className="text-slate-500 mt-1">Your sponsorship details</p>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-ori-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-ori-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Company</h3>
          </div>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-slate-500">Name</dt><dd className="font-medium">{sponsor.companyName}</dd></div>
            {sponsor.abn && <div><dt className="text-slate-500">ABN</dt><dd>{sponsor.abn}</dd></div>}
            {sponsor.acn && <div><dt className="text-slate-500">ACN</dt><dd>{sponsor.acn}</dd></div>}
            {sponsor.industry && <div><dt className="text-slate-500">Industry</dt><dd>{sponsor.industry}</dd></div>}
            <div><dt className="text-slate-500">Nomination Status</dt><dd><StatusBadge status={sponsor.nominationStatus || 'PENDING'} /></dd></div>
          </dl>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Address</h3>
          </div>
          <p className="text-slate-700 text-sm">
            {[addr.street, addr.city, addr.state, addr.postcode].filter(Boolean).join(', ') || '—'}
          </p>
          {addr.country && <p className="text-slate-500 text-sm mt-1">{addr.country}</p>}
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Contact</h3>
          </div>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-slate-500">Name</dt><dd>{cp.firstName} {cp.lastName}</dd></div>
            <div><dt className="text-slate-500">Email</dt><dd><a href={`mailto:${cp.email || sponsor.email}`} className="text-ori-600 hover:underline">{cp.email || sponsor.email || '—'}</a></dd></div>
            <div><dt className="text-slate-500">Phone</dt><dd><a href={`tel:${cp.phone || sponsor.phone}`} className="text-ori-600 hover:underline">{cp.phone || sponsor.phone || '—'}</a></dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
}
