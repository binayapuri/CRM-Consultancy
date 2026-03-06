import { useEffect, useState } from 'react';
import { authFetch } from '../../store/auth';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const STEPS_500 = [
  { id: 'course', label: 'Research & Choose Course', desc: 'Select a CRICOS-registered course', checklistKey: null },
  { id: 'coe', label: 'Get CoE', desc: 'Confirmation of Enrolment from institution', checklistKey: 'CoE' },
  { id: 'oshc', label: 'Arrange OSHC', desc: 'Overseas Student Health Cover', checklistKey: 'OSHC' },
  { id: 'passport', label: 'Valid Passport', desc: 'Passport with sufficient validity', checklistKey: 'Passport' },
  { id: 'english', label: 'English Test', desc: 'IELTS, PTE or equivalent', checklistKey: 'English Test' },
  { id: 'gte', label: 'Genuine Student Statement', desc: 'Address GS criteria', checklistKey: 'GTE/GS Statement' },
  { id: 'financial', label: 'Financial Evidence', desc: 'Proof of funds', checklistKey: 'Financial Evidence' },
  { id: 'lodge', label: 'Lodge Application', desc: 'Submit via ImmiAccount', checklistKey: null },
  { id: 'decision', label: 'Decision', desc: 'Await DHA decision', checklistKey: null },
];

export default function VisaRoadmap() {
  const [client, setClient] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/clients').then(r => r.json()).then(data => {
      const c = Array.isArray(data) ? data[0] : data;
      setClient(c);
      if (c?._id) authFetch(`/api/clients/${c._id}/applications`).then(r => r.json()).then(setApplications);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const app500 = applications.find((a: any) => a.visaSubclass === '500');
  const checklist = app500?.documentChecklist || [];
  const completedCount = checklist.filter((i: any) => i.uploaded).length;
  const totalChecklist = checklist.length;
  const progressPct = totalChecklist > 0 ? Math.round((completedCount / totalChecklist) * 100) : 0;

  const isStepDone = (step: typeof STEPS_500[0]) => {
    if (!step.checklistKey) {
      if (step.id === 'lodge') return app500?.status === 'LODGED' || app500?.status === 'DECISION' || app500?.status === 'COMPLETED';
      if (step.id === 'decision') return app500?.status === 'COMPLETED';
      if (step.id === 'course') return !!app500;
      return false;
    }
    return checklist.some((i: any) => (i.name || '').toLowerCase().includes((step.checklistKey || '').toLowerCase()) && i.uploaded);
  };

  if (loading) return <div className="text-slate-500">Loading...</div>;

  if (!client) return (
    <div className="card p-12 text-center">
      <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
      <h2 className="font-display font-semibold text-slate-900 mb-2">No Profile Linked</h2>
      <p className="text-slate-600 mb-4">Contact a consultancy to get enrolled. Your visa roadmap will show your progress.</p>
      <Link to="consultancies" className="btn-primary inline-flex items-center gap-2">Find Consultancy</Link>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900">Visa Roadmap</h1>
      <p className="text-slate-500 mt-1">Student visa (500) preparation guide — your progress</p>

      {app500 && (
        <div className="card mt-6 p-4 bg-ori-50 border border-ori-100">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-slate-900">Document Checklist Progress</span>
            <span className="text-ori-600 font-semibold">{completedCount}/{totalChecklist} uploaded</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-ori-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <Link to="applications" className="text-sm text-ori-600 hover:underline mt-2 inline-block">View applications →</Link>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {STEPS_500.map((step) => {
          const done = isStepDone(step);
          return (
            <div key={step.id} className={`card flex items-start gap-4 ${done ? 'border-l-4 border-ori-500' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-ori-100' : 'bg-slate-100'}`}>
                {done ? <CheckCircle className="w-5 h-5 text-ori-600" /> : <Circle className="w-5 h-5 text-slate-300" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">{step.label}</p>
                <p className="text-sm text-slate-500 mt-0.5">{step.desc}</p>
                {done && <p className="text-xs text-ori-600 mt-1">✓ Done</p>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card mt-8 p-6 bg-slate-50">
        <h3 className="font-semibold text-slate-900 mb-2">Need Help?</h3>
        <p className="text-sm text-slate-600">Your migration agent manages the lodgement. Upload documents promptly and contact them for any questions.</p>
      </div>
    </div>
  );
}
