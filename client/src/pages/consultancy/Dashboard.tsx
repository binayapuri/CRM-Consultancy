import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Users, FileText, Target, ArrowRight, Activity, TrendingUp, AlertTriangle, CheckSquare, User } from 'lucide-react';
import { authFetch, safeJson } from '../../store/auth';
import { useAuthStore } from '../../store/auth';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '../../components/Skeleton';

export default function ConsultancyDashboard() {
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ clients: 0, applications: 0, leads: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [allApps, setAllApps] = useState<any[]>([]);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [allClients, setAllClients] = useState<any[]>([]);
  const [allDocs, setAllDocs] = useState<any[]>([]);
  const [todayActivity, setTodayActivity] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const qs = consultancyId ? `?consultancyId=${consultancyId}` : '';
      const [clientsRes, appsRes, leadsRes, activityRes, docsRes, tasksRes] = await Promise.all([
        authFetch(`/api/clients${qs}`),
        authFetch(`/api/applications${qs}`),
        authFetch(`/api/leads${qs}`),
        authFetch(consultancyId ? `/api/audit/today?consultancyId=${consultancyId}` : '/api/audit/today').catch(() => ({ json: () => [] })),
        authFetch(consultancyId ? `/api/documents?consultancyId=${consultancyId}` : '/api/documents').catch(() => ({ json: () => [] })),
        (user?.role === 'AGENT' || user?.role === 'CONSULTANCY_ADMIN') && (user?._id || user?.id)
          ? authFetch(`/api/tasks?assignedTo=${user._id || user.id}`).catch(() => ({ ok: false, json: () => [] }))
          : Promise.resolve({ ok: false, json: () => [] }),
      ]);
      const clientsRaw = await safeJson<unknown>(clientsRes);
      const appsRaw = await safeJson<unknown>(appsRes);
      const leadsRaw = await safeJson<unknown>(leadsRes);
      const activity = await (activityRes?.ok ? activityRes.json() : []);
      const docs = await (docsRes?.ok ? safeJson<any[]>(docsRes) : []);
      const tasksRaw = await (tasksRes?.ok ? safeJson<any[]>(tasksRes) : []);
      const clients = Array.isArray(clientsRaw) ? clientsRaw : [];
      const apps = Array.isArray(appsRaw) ? appsRaw : [];
      const leads = Array.isArray(leadsRaw) ? leadsRaw : [];
      const tasks = Array.isArray(tasksRaw) ? tasksRaw.filter((t: any) => ['PENDING', 'IN_PROGRESS'].includes(t.status)) : [];
      setStats({ clients: clients.length, applications: apps.length, leads: leads.length });
      setAllClients(clients);
      setAllDocs(Array.isArray(docs) ? docs : []);
      setAllApps(apps);
      setAllLeads(leads);
      setRecent(apps.slice(0, 5));
      setTodayActivity(Array.isArray(activity) ? activity : []);
      setMyTasks(Array.isArray(tasks) ? tasks : []);
      setLoading(false);
    })();
  }, [user?.id, user?._id, user?.role, consultancyId]);

  const now = new Date();
  const inDays = (d: Date, days: number) => {
    const end = new Date(now);
    end.setDate(end.getDate() + days);
    return d >= now && d <= end;
  };
  const clientsList = Array.isArray(allClients) ? allClients : [];
  const appsList = Array.isArray(allApps) ? allApps : [];
  const leadsList = Array.isArray(allLeads) ? allLeads : [];
  const docsList = Array.isArray(allDocs) ? allDocs : [];

  const visaExpiringSoon = clientsList.filter((c: any) => {
    const exp = c.profile?.visaExpiry;
    if (!exp) return false;
    const d = new Date(exp);
    return d >= now && inDays(d, 90);
  }).slice(0, 5);

  const chartData = [
    { name: 'Onboarding', count: appsList.filter((a: any) => a.status === 'ONBOARDING').length },
    { name: 'Drafting', count: appsList.filter((a: any) => a.status === 'DRAFTING').length },
    { name: 'Pending Info', count: appsList.filter((a: any) => a.status === 'PENDING_INFO').length },
    { name: 'Review', count: appsList.filter((a: any) => a.status === 'REVIEW').length },
    { name: 'Lodged', count: appsList.filter((a: any) => a.status === 'LODGED').length },
    { name: 'Decision', count: appsList.filter((a: any) => a.status === 'DECISION').length },
    { name: 'Completed', count: appsList.filter((a: any) => a.status === 'COMPLETED').length },
  ];

  const convertedLeads = leadsList.filter((l: any) => l.status === 'CONVERTED').length;
  const conversionRate = leadsList.length > 0 ? Math.round((convertedLeads / leadsList.length) * 100) : 0;
  const overdueApps = appsList.filter((a: any) => a.stageDeadline && new Date(a.stageDeadline) < new Date() && !['LODGED', 'DECISION', 'COMPLETED'].includes(a.status));
  const coeExpiringSoon = appsList.filter((a: any) => a.visaSubclass === '500' && a.coe?.expiryDate && (() => { const d = new Date(a.coe.expiryDate); const n = new Date(); return d >= n && d <= new Date(n.getTime() + 90 * 24 * 60 * 60 * 1000); })()).slice(0, 5);
  const docsExpiringSoon = docsList.filter((d: any) => d.metadata?.expiryDate && (() => { const ed = new Date(d.metadata.expiryDate); const n = new Date(); return ed >= n && ed <= new Date(n.getTime() + 90 * 24 * 60 * 60 * 1000); })()).slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900">Dashboard</h1>
      <p className="text-slate-500 mt-1">Overview of your consultancy operations</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {loading ? (
          <>
            {[1, 2, 3].map(i => <div key={i} className="card flex items-center gap-4"><Skeleton className="w-12 h-12 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-8 w-16" /><Skeleton className="h-4 w-24" /></div></div>)}
          </>
        ) : (
        <>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-ori-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-ori-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.clients}</p>
            <p className="text-slate-500 text-sm">Active Clients</p>
          </div>
          <Link to={consultancyId ? `clients?consultancyId=${consultancyId}` : 'clients'} className="ml-auto text-ori-600 hover:underline text-sm flex items-center gap-1">
            View <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.applications}</p>
            <p className="text-slate-500 text-sm">Applications</p>
          </div>
          <Link to={consultancyId ? `kanban?consultancyId=${consultancyId}` : 'kanban'} className="ml-auto text-ori-600 hover:underline text-sm flex items-center gap-1">
            View <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <Target className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.leads}</p>
            <p className="text-slate-500 text-sm">Leads</p>
          </div>
          <Link to={consultancyId ? `leads?consultancyId=${consultancyId}` : 'leads'} className="ml-auto text-ori-600 hover:underline text-sm flex items-center gap-1">
            View <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        </>
        )}
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="card flex items-center gap-3 p-4 bg-gradient-to-br from-ori-50 to-white border-ori-100">
          <div className="w-10 h-10 rounded-lg bg-ori-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-ori-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{conversionRate}%</p>
            <p className="text-slate-500 text-sm">Lead conversion rate</p>
          </div>
        </div>
        {overdueApps.length > 0 && (
          <Link to="kanban" className="card flex items-center gap-3 p-4 bg-amber-50 border-amber-200 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-800">{overdueApps.length}</p>
              <p className="text-amber-700 text-sm">Overdue deadlines</p>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-600 ml-auto" />
          </Link>
        )}
        {visaExpiringSoon.length > 0 && (
          <Link to="clients" className="card flex items-center gap-3 p-4 bg-rose-50 border-rose-200 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-800">{visaExpiringSoon.length}</p>
              <p className="text-rose-700 text-sm">Visa expiring (90 days)</p>
            </div>
            <ArrowRight className="w-5 h-5 text-rose-600 ml-auto" />
          </Link>
        )}
        {coeExpiringSoon.length > 0 && (
          <Link to="kanban" className="card flex items-center gap-3 p-4 bg-amber-50 border-amber-200 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-800">{coeExpiringSoon.length}</p>
              <p className="text-amber-700 text-sm">CoE expiring (90 days)</p>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-600 ml-auto" />
          </Link>
        )}
        {docsExpiringSoon.length > 0 && (
          <Link to="documents" className="card flex items-center gap-3 p-4 bg-orange-50 border-orange-200 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-800">{docsExpiringSoon.length}</p>
              <p className="text-orange-700 text-sm">Docs expiring (90 days)</p>
            </div>
            <ArrowRight className="w-5 h-5 text-orange-600 ml-auto" />
          </Link>
        )}
      </div>
      {(user?.role === 'AGENT' || user?.role === 'CONSULTANCY_ADMIN') && myTasks.length > 0 && (
        <div className="card mt-6">
          <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-ori-600" /> My Active Tasks
          </h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {myTasks.slice(0, 8).map((t: any) => (
              <Link key={t._id} to="/consultancy/kanban" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition group">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${t.priority === 'CRITICAL' ? 'bg-red-500' : t.priority === 'HIGH' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                  <div>
                    <p className="font-medium text-slate-900 group-hover:text-ori-600">{t.title}</p>
                    <p className="text-sm text-slate-500">{t.clientId?.profile?.firstName} {t.clientId?.profile?.lastName} • {t.status}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-ori-600" />
              </Link>
            ))}
          </div>
          <Link to="/consultancy/kanban" className="block mt-3 text-ori-600 hover:underline text-sm font-medium">View all on Kanban →</Link>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="card">
          <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-ori-600" /> Who did what today
          </h2>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {loading ? (
              <>
                {[1, 2, 3, 4].map(i => <div key={i} className="p-2"><Skeleton className="h-8 w-full" /></div>)}
              </>
            ) : todayActivity.length ? todayActivity.slice(0, 10).map((log: any) => (
              <div key={log._id} className="p-3 rounded-lg bg-slate-50 text-sm">
                <p className="font-medium text-slate-900">{log.changedBy?.profile?.firstName} {log.changedBy?.profile?.lastName}</p>
                <p className="text-slate-600">{log.description}</p>
                <p className="text-xs text-slate-400 mt-1">{format(new Date(log.changedAt), 'HH:mm')}</p>
              </div>
            )) : <p className="text-slate-500 text-sm">No activity today</p>}
          </div>
        </div>
        <div className="card">
          <h2 className="font-display font-semibold text-slate-900 mb-4">Applications by Stage</h2>
          <div className="h-48">
            {loading ? <div className="h-full flex items-center justify-center"><Skeleton className="w-full h-full" /></div> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="card">
          <h2 className="font-display font-semibold text-slate-900 mb-4">Recent Applications</h2>
          <div className="space-y-3">
            {loading ? (
              <>
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="p-3"><Skeleton className="h-4 w-3/4 mb-2" /><Skeleton className="h-3 w-1/2" /></div>)}
              </>
            ) : recent.length ? recent.map((a: any) => (
              <Link key={a._id} to={`clients/${a.clientId?._id || a.clientId}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition">
                <div>
                  <p className="font-medium text-slate-900">
                    {a.clientId?.profile?.firstName} {a.clientId?.profile?.lastName}
                  </p>
                  <p className="text-sm text-slate-500">Subclass {a.visaSubclass}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  a.status === 'LODGED' ? 'bg-green-100 text-green-700' :
                  a.status === 'DRAFTING' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}>{a.status}</span>
              </Link>
            )) : <p className="text-slate-500 text-sm">No applications yet</p>}
          </div>
        </div>
        {visaExpiringSoon.length > 0 && (
          <div className="card">
            <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-rose-500" /> Visa Expiring Soon</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {visaExpiringSoon.map((c: any) => (
                <Link key={c._id} to={`clients/${c._id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-rose-50 transition">
                  <span className="font-medium text-slate-900">{c.profile?.firstName} {c.profile?.lastName}</span>
                  <span className="text-sm text-rose-600">{c.profile?.visaExpiry && format(new Date(c.profile.visaExpiry), 'dd MMM yyyy')}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
