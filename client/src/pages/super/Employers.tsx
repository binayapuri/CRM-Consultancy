import { useState, useEffect } from 'react';
import { authFetch } from '../../store/auth';
import { Link } from 'react-router-dom';
import { Briefcase, Building2, Mail, ShieldCheck, ShieldAlert, ExternalLink } from 'lucide-react';

export default function Employers() {
  const [employers, setEmployers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/admin/employers')
      .then(r => r.json())
      .then(data => setEmployers(Array.isArray(data) ? data : []))
      .catch(() => setEmployers([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Employers</h1>
        <p className="text-slate-500 mt-1">All registered employers on the platform. Pending employers appear in Verifications.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        {employers.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">No employers yet</h3>
            <p className="text-slate-500">Employers register via the landing page. Pending ones appear in Verifications.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {employers.map((e: any) => (
              <div key={e._id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-slate-900">{e.companyName}</h3>
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${
                      e.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                      e.verificationStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {e.verificationStatus === 'VERIFIED' ? <><ShieldCheck className="w-3 h-3 inline mr-0.5" /> Verified</> :
                       e.verificationStatus === 'PENDING' ? <><ShieldAlert className="w-3 h-3 inline mr-0.5" /> Pending</> : 'Rejected'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    {e.userId?.email && (
                      <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {e.userId.email}</span>
                    )}
                    {e.abn && <span>ABN: {e.abn}</span>}
                    {e.industry && <span>Industry: {e.industry}</span>}
                  </div>
                </div>
                <Link
                  to={`/partner/jobs`}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition text-sm"
                >
                  View as Employer <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
