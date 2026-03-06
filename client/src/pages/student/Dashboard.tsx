import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authFetch } from '../../store/auth';
import { format } from 'date-fns';
import { User, Calculator, Compass, Search, Map, FileText, FileCheck, ClipboardList, AlertCircle, CheckCircle, ArrowRight, Upload, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import LoadingSpinner from '../../components/LoadingSpinner';

const quickLinks = [
  { to: 'profile', icon: User, label: 'My Profile', desc: 'Update your details' },
  { to: 'documents', icon: FileText, label: 'Documents', desc: 'Upload visa documents' },
  { to: 'calculator', icon: Calculator, label: 'PR Calculator', desc: 'Check skilled migration points' },
  { to: 'compass', icon: Compass, label: 'AI Compass', desc: 'Get factual migration info' },
  { to: 'consultancies', icon: Search, label: 'Find Consultancy', desc: 'Connect with verified agents' },
  { to: 'roadmap', icon: Map, label: 'Visa Roadmap', desc: 'Track your visa journey' },
];

function ProfileCompleteness({ client }: { client: any }) {
  const p = client?.profile || {};
  const required = ['firstName', 'lastName', 'email', 'dob', 'nationality', 'passportNumber'];
  const filled = required.filter(k => p[k] && String(p[k]).trim()).length;
  const pct = Math.round((filled / required.length) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-ori-100 flex items-center justify-center">
        <span className="text-lg font-bold text-ori-600">{pct}%</span>
      </div>
      <div className="flex-1">
        <p className="font-medium text-slate-900">Profile completeness</p>
        <div className="h-2 bg-slate-200 rounded-full mt-1 overflow-hidden">
          <div className="h-full bg-ori-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {pct < 100 && <Link to="profile" className="text-ori-600 text-sm font-medium hover:underline">Complete</Link>}
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [client, setClient] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/clients')
      .then(r => r.json())
      .then(data => {
        const c = Array.isArray(data) ? data[0] : data;
        setClient(c);
        if (c?._id) {
          Promise.all([
            authFetch(`/api/clients/${c._id}/applications`).then(r => r.json()),
            authFetch('/api/tasks').then(r => r.json()),
            authFetch(`/api/documents?clientId=${c._id}`).then(r => r.json()),
          ]).then(([apps, t, docs]) => {
            setApplications(apps);
            setTasks(t);
            setDocuments(docs);
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const pendingTasks = tasks.filter((t: any) => t.status !== 'COMPLETED');
  const appsNeedingDocs = applications.filter((a: any) => {
    const checklist = a.documentChecklist || [];
    const uploaded = checklist.filter((i: any) => i.uploaded).length;
    return uploaded < checklist.length && checklist.length > 0;
  });
  const actionItems = [
    ...pendingTasks.slice(0, 3).map((t: any) => ({ type: 'task', title: t.title, due: t.dueDate, link: 'tasks' })),
    ...appsNeedingDocs.slice(0, 2).map((a: any) => ({ type: 'doc', title: `Upload documents for Subclass ${a.visaSubclass}`, due: null, link: 'documents' })),
  ];

  if (loading) return <div className="flex items-center gap-2 text-slate-500"><LoadingSpinner size="sm" /> Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900">
        Welcome back, {user?.profile?.firstName || 'Student'}!
      </h1>
      <p className="text-slate-500 mt-1">Your Australian migration companion</p>

      {client ? (
        <>
          {/* Profile completeness */}
          <div className="card mt-6">
            <ProfileCompleteness client={client} />
          </div>

          {/* Action items */}
          {actionItems.length > 0 && (
            <div className="card mt-6">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" /> Action Required
              </h3>
              <div className="space-y-2">
                {actionItems.map((item, i) => (
                  <Link key={i} to={item.link} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 hover:bg-amber-100 transition group">
                    <div className="flex items-center gap-3">
                      {item.type === 'task' ? <Clock className="w-5 h-5 text-amber-600" /> : <Upload className="w-5 h-5 text-amber-600" />}
                      <div>
                        <p className="font-medium text-slate-900">{item.title}</p>
                        {item.due && <p className="text-xs text-slate-500">Due {format(new Date(item.due), 'dd MMM yyyy')}</p>}
                        {!item.due && item.type === 'doc' && <p className="text-xs text-slate-500">Required for application</p>}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-ori-600 transition" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Stats cards */}
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <Link to="applications" className="card flex items-center gap-4 hover:shadow-md transition group">
              <div className="w-12 h-12 rounded-xl bg-ori-100 flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-ori-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{applications.length} Application{applications.length !== 1 ? 's' : ''}</p>
                <p className="text-sm text-slate-500">Track visa progress</p>
              </div>
            </Link>
            <Link to="tasks" className="card flex items-center gap-4 hover:shadow-md transition group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{pendingTasks.length} Pending Task{pendingTasks.length !== 1 ? 's' : ''}</p>
                <p className="text-sm text-slate-500">From your agent</p>
              </div>
            </Link>
            <Link to="documents" className="card flex items-center gap-4 hover:shadow-md transition group">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{documents.length} Documents</p>
                <p className="text-sm text-slate-500">Uploaded</p>
              </div>
            </Link>
          </div>

          {/* Applications preview */}
          {applications.length > 0 && (
            <div className="card mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">Your Applications</h3>
                <Link to="applications" className="text-ori-600 text-sm font-medium hover:underline flex items-center gap-1">View all <ArrowRight className="w-4 h-4" /></Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {applications.slice(0, 6).map((a: any) => {
                  const checklist = a.documentChecklist || [];
                  const done = checklist.filter((i: any) => i.uploaded).length;
                  const total = checklist.length || 1;
                  const complete = done >= total;
                  return (
                    <Link key={a._id} to="applications" className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition">
                      <div className="flex items-center gap-3">
                        {complete ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> : <Clock className="w-5 h-5 text-amber-500 shrink-0" />}
                        <div>
                          <span className="font-medium text-slate-900">Subclass {a.visaSubclass}</span>
                          <p className="text-xs text-slate-500">{done}/{total} docs</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs ${a.status === 'LODGED' ? 'bg-green-100 text-green-700' : a.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{a.status.replace('_', ' ')}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card mt-6 p-12 text-center max-w-xl mx-auto">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="font-display font-semibold text-slate-900 mb-2">Get Started</h2>
          <p className="text-slate-600 mb-4">Connect with a registered migration agent to begin your Australian visa journey.</p>
          <div className="space-y-3 text-left bg-slate-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-700"><strong>Option 1:</strong> If your consultancy has enrolled you, check your email for an invitation link. Click it to activate your portal access.</p>
            <p className="text-sm text-slate-700"><strong>Option 2:</strong> Search for verified consultancies and reach out to get enrolled.</p>
          </div>
          <Link to="consultancies" className="btn-primary inline-flex items-center gap-2">Find Consultancy <ArrowRight className="w-4 h-4" /></Link>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {quickLinks.map(({ to, icon: Icon, label, desc }) => (
          <Link key={to} to={to} className="card hover:shadow-md transition group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-ori-100 flex items-center justify-center group-hover:bg-ori-200 transition">
                <Icon className="w-6 h-6 text-ori-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900 group-hover:text-ori-600 transition">{label}</p>
                <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="card mt-8 border-l-4 border-ori-500">
        <h2 className="font-display font-semibold text-slate-900">Quick Tip</h2>
        <p className="text-slate-600 mt-2 text-sm">
          The AI Compass provides factual information only. For personal advice about your situation,
          consult a registered migration agent (MARN). Data is hosted in Australia.
        </p>
      </div>
    </div>
  );
}
