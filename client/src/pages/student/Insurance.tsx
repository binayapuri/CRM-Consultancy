import { useState, useEffect } from 'react';
import { authFetch } from '../../store/auth';
import { ShieldPlus, CheckCircle, Clock } from 'lucide-react';

export default function StudentInsurance() {
  const [plans, setPlans] = useState([]);
  const [myDocs, setMyDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [pRes, mRes] = await Promise.all([
        authFetch('/api/insurance/marketplace'),
        authFetch('/api/insurance/my-applications')
      ]);
      setPlans(await pRes.json());
      setMyDocs(await mRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const purchasePlan = async (planId: string) => {
    try {
      const res = await authFetch('/api/insurance/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, notes: 'Purchased via Student Portal' })
      });
      if (res.ok) {
        alert('Insurance application submitted successfully! Pending processing.');
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Health Insurance</h1>
        <p className="text-slate-500 mt-1">Compare and purchase verified OSHC and OVHC plans for your visa.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-r from-rose-600 to-pink-600 rounded-3xl p-8 text-white mb-6 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold font-display flex items-center gap-2"><ShieldPlus className="w-6 h-6" /> Partner Marketplace</h2>
              <p className="text-rose-100 mt-1">Exclusive rates from top Australian providers</p>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {plans.map((plan: any) => (
              <div key={plan._id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-slate-900 text-lg">{plan.providerId?.companyName}</h3>
                    <span className="px-2 py-1 bg-rose-100 text-rose-700 font-bold text-[10px] uppercase rounded-md">{plan.type}</span>
                  </div>
                  <h4 className="font-bold text-slate-700">{plan.name}</h4>
                  <p className="text-3xl font-black text-slate-900 mt-2">${plan.monthlyPremium}<span className="text-sm font-medium text-slate-400">/mo</span></p>
                  
                  <div className="mt-4 space-y-2">
                    {plan.benefitsList?.slice(0, 3).map((b: string, i: number) => (
                      <p key={i} className="text-sm text-slate-500 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> {b}</p>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={() => purchasePlan(plan._id)}
                  className="mt-6 w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-sm"
                >
                  Purchase Complete Plan
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm sticky top-6">
            <div className="bg-slate-50 p-6 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><Clock className="w-5 h-5 text-slate-400" /> My Policies</h3>
            </div>
            <div className="p-4 space-y-4">
              {myDocs.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-4">You have no active or pending policies.</p>
              ) : (
                myDocs.map((doc: any) => (
                  <div key={doc._id} className="p-4 border border-slate-100 bg-slate-50 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md ${
                        doc.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                        doc.status === 'APPLIED' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-200 text-slate-700'
                      }`}>{doc.status}</span>
                      <span className="text-xs font-bold text-slate-500">{doc.planId?.type}</span>
                    </div>
                    <h4 className="font-bold text-slate-900">{doc.planId?.providerId?.companyName}</h4>
                    <p className="text-sm text-slate-600 mb-2">{doc.planId?.name}</p>
                    {doc.policyNumber && <p className="text-xs font-mono bg-white p-1 rounded text-slate-500 border border-slate-200">Policy: {doc.policyNumber}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
