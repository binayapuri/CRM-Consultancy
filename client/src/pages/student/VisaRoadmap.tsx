import { useEffect, useState } from 'react';
import { authFetch } from '../../store/auth';
import { CheckCircle, Circle, AlertCircle, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function VisaRoadmap() {
  const [timeline, setTimeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/visa-timeline/my-timeline')
      .then(r => r.json())
      .then(setTimeline)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" /></div>;

  if (!timeline) return (
    <div className="card p-12 text-center bg-white border border-slate-200">
      <AlertCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
      <h2 className="font-display font-semibold text-slate-900 mb-2 text-2xl">No Journey Started</h2>
      <p className="text-slate-500 mb-4 max-w-sm mx-auto">Your timeline has not been initialized. Contact your agent to start your roadmap.</p>
    </div>
  );

  const completed = timeline.milestones.filter((m: any) => m.status === 'COMPLETED').length;
  const total = timeline.milestones.length;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">My PR Journey</h1>
        <p className="text-slate-500 mt-2">Your personalized pathway to Australian Permanent Residency</p>
      </div>

      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white mb-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-1">Current Stage</p>
            <h2 className="text-3xl font-display font-black">{timeline.currentStage.replace('_', ' ')}</h2>
            {timeline.targetVisa && <p className="text-slate-300 mt-1">Target Visa: Subclass {timeline.targetVisa}</p>}
          </div>
          <div className="flex-shrink-0 bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10 text-center min-w-[160px]">
            <p className="text-xs text-slate-300 uppercase font-bold tracking-wider mb-2">Overall Progress</p>
            <div className="text-4xl font-black font-display text-emerald-400">{progressPct}%</div>
            <div className="h-2 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000" style={{ width: `${progressPct}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-8 top-8 bottom-8 w-1 bg-slate-100 rounded-full"></div>
        
        <div className="space-y-6">
          {timeline.milestones.map((milestone: any, idx: number) => {
            const isCompleted = milestone.status === 'COMPLETED';
            const isBlocked = milestone.status === 'BLOCKED';
            const isInProgress = milestone.status === 'IN_PROGRESS';
            
            return (
              <div key={milestone._id || idx} className={`relative flex items-start gap-6 group transition-all duration-300 ${isCompleted ? 'opacity-70 hover:opacity-100' : ''}`}>
                <div className="relative z-10 w-16 flex flex-col items-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 shadow-sm transition-transform group-hover:scale-110 ${
                    isCompleted ? 'bg-emerald-500 border-white text-white' :
                    isBlocked ? 'bg-rose-50 border-rose-200 text-rose-500' :
                    isInProgress ? 'bg-amber-400 border-white text-white shadow-amber-400/30' :
                    'bg-white border-slate-200 text-slate-300'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> :
                     isBlocked ? <AlertTriangle className="w-6 h-6" /> :
                     isInProgress ? <TrendingUp className="w-6 h-6" /> :
                     <Circle className="w-6 h-6" />}
                  </div>
                </div>

                <div className={`flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm transition-colors ${
                  isInProgress ? 'border-amber-200 ring-4 ring-amber-50' : 
                  isBlocked ? 'border-rose-200 bg-rose-50/50' : ''
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                    <h3 className={`text-xl font-bold ${isCompleted ? 'text-slate-600' : 'text-slate-900'}`}>{milestone.title}</h3>
                    <span className={`px-2.5 py-1 rounded w-max text-[10px] uppercase font-bold tracking-wider ${
                      milestone.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                      milestone.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{milestone.priority} PRIORITY</span>
                  </div>
                  <p className="text-slate-500 mb-4">{milestone.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm font-semibold">
                    {isCompleted ? (
                      <span className="text-emerald-600 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Goal Achieved</span>
                    ) : isBlocked ? (
                      <span className="text-rose-600 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Blocked</span>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Action Required</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-12 bg-sky-50 border border-sky-100 rounded-2xl p-6 text-center">
        <h3 className="font-bold text-sky-900 mb-2">Ready to take the next step?</h3>
        <p className="text-sky-700 mb-4 text-sm">Review your document checklist and ensure you have all evidence prepared for your upcoming milestones.</p>
        <Link to="/student/documents" className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition shadow-sm shadow-sky-600/20 active:scale-95">
          View Vault <CheckCircle className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
