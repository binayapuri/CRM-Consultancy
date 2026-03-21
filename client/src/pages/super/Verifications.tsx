import { useState, useEffect } from 'react';
import { authFetch } from '../../store/auth';
import { CheckCircle, XCircle, ShieldCheck } from 'lucide-react';

export default function Verifications() {
  const [data, setData] = useState({ consultancies: [], employers: [], insurers: [] });
  const [loading, setLoading] = useState(true);

  const fetchVerifications = async () => {
    try {
      const res = await authFetch('/api/admin/verifications');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleAction = async (type: string, id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await authFetch(`/api/admin/verify/${type}/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        fetchVerifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-ori-500 border-t-transparent animate-spin" /></div>;

  const allItems = [...data.consultancies, ...data.employers, ...data.insurers].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="w-full animate-fade-in-up">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Verification Queue</h1>
          <p className="text-slate-500 mt-1">Review and approve new partners applying for platform access.</p>
        </div>
        <div className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-sm border border-indigo-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> root access
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        {allItems.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Queue is empty</h3>
            <p className="text-slate-500 font-medium">All pending requests have been processed.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {allItems.map((item: any) => (
              <div key={item.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${
                      item.type === 'CONSULTANCY' ? 'bg-indigo-100 text-indigo-700' :
                      item.type === 'EMPLOYER' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
                    }`}>{item.type}</span>
                    <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                  </div>
                  <div className="text-sm text-slate-500 flex items-center gap-4 flex-wrap">
                    {item.email && <span>Email: {item.email}</span>}
                    {item.abn && <span>ABN: {item.abn}</span>}
                    {item.marn && <span>MARN: {item.marn}</span>}
                    {item.type === 'EMPLOYER' && item.industry && <span>Industry: {item.industry}</span>}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleAction(item.type, item.id, 'REJECT')}
                    className="flex items-center gap-2 px-4 py-2 border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button 
                    onClick={() => handleAction(item.type, item.id, 'APPROVE')}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
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
