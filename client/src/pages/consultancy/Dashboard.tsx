import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Users, FileText, Target, ArrowRight, Activity, TrendingUp, AlertTriangle, CheckSquare, ShieldCheck, CalendarClock, Archive, ReceiptText, Download, Mail, X, Save } from 'lucide-react';
import { authFetch, safeJson } from '../../store/auth';
import { useAuthStore } from '../../store/auth';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '../../components/Skeleton';

export default function ConsultancyDashboard() {
  const CAMPAIGNS = [
    { key: 'VISA_EXPIRY_30', label: 'Visa expiry reminders', hint: 'Clients with visas expiring in 30 days' },
    { key: 'DOCUMENT_EXPIRY_30', label: 'Document expiry reminders', hint: 'Clients with documents expiring in 30 days' },
    { key: 'RFI_RESPONSE_7', label: 'RFI response reminders', hint: 'Clients due to answer within 7 days' },
    { key: 'PRIVACY_CONSENT_GAP', label: 'Privacy consent follow-up', hint: 'Clients missing consent confirmation' },
  ] as const;
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
  const [overview, setOverview] = useState<any>(null);
  const [billingRows, setBillingRows] = useState<any[]>([]);
  const [campaignHistory, setCampaignHistory] = useState<any>({ rows: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignPreviewLoading, setCampaignPreviewLoading] = useState(false);
  const [campaignSendLoading, setCampaignSendLoading] = useState(false);
  const [campaignData, setCampaignData] = useState<any | null>(null);
  const [campaignDraft, setCampaignDraft] = useState({ subject: '', body: '' });
  const [campaignPreview, setCampaignPreview] = useState<any | null>(null);
  const [campaignSchedules, setCampaignSchedules] = useState<Record<string, any>>({});
  const [savingCampaignSchedules, setSavingCampaignSchedules] = useState(false);

  const defaultCampaignSchedules = {
    VISA_EXPIRY_30: { enabled: false, frequency: 'DAILY', weekday: 1, hour: 9, minute: 0 },
    DOCUMENT_EXPIRY_30: { enabled: false, frequency: 'DAILY', weekday: 1, hour: 9, minute: 15 },
    RFI_RESPONSE_7: { enabled: false, frequency: 'DAILY', weekday: 1, hour: 9, minute: 30 },
    PRIVACY_CONSENT_GAP: { enabled: false, frequency: 'WEEKLY', weekday: 1, hour: 10, minute: 0 },
  } as const;
  const weekdayOptions = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  useEffect(() => {
    (async () => {
      const qs = consultancyId ? `?consultancyId=${consultancyId}` : '';
      const responses = await Promise.all([
        authFetch(`/api/clients${qs}`),
        authFetch(`/api/applications${qs}`),
        authFetch(`/api/leads${qs}`),
        authFetch(consultancyId ? `/api/audit/today?consultancyId=${consultancyId}` : '/api/audit/today').catch(() => ({ json: () => [] })),
        authFetch(consultancyId ? `/api/documents?consultancyId=${consultancyId}` : '/api/documents').catch(() => ({ json: () => [] })),
        authFetch(consultancyId ? `/api/consultancies/me/overview?consultancyId=${consultancyId}` : '/api/consultancies/me/overview').catch(() => ({ ok: false, json: () => null })),
        authFetch(consultancyId ? `/api/consultancy-billing?consultancyId=${consultancyId}` : '/api/consultancy-billing').catch(() => ({ ok: false, json: () => [] })),
        authFetch(consultancyId ? `/api/clients/campaign-history?consultancyId=${consultancyId}` : '/api/clients/campaign-history').catch(() => ({ ok: false, json: () => ({ rows: [], stats: {} }) })),
        (user?.role === 'AGENT' || user?.role === 'CONSULTANCY_ADMIN') && (user?._id || user?.id)
          ? authFetch(`/api/tasks?assignedTo=${user._id || user.id}`).catch(() => ({ ok: false, json: () => [] }))
          : Promise.resolve({ ok: false, json: () => [] }),
      ]);
      const [clientsRes, appsRes, leadsRes, activityRes, docsRes, overviewRes, billingRes, campaignHistoryRes, tasksRes] = responses as any[];
      const clientsRaw = await safeJson<unknown>(clientsRes);
      const appsRaw = await safeJson<unknown>(appsRes);
      const leadsRaw = await safeJson<unknown>(leadsRes);
      const activity = await (activityRes?.ok ? activityRes.json() : []);
      const docs = await (docsRes?.ok ? safeJson<any[]>(docsRes) : []);
      const overviewData = await (overviewRes?.ok ? safeJson<any>(overviewRes) : null);
      const billing = await (billingRes?.ok ? safeJson<any[]>(billingRes) : []);
      const campaignHistoryData = await (campaignHistoryRes?.ok ? safeJson<any>(campaignHistoryRes) : { rows: [], stats: {} });
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
      setOverview(overviewData);
      setBillingRows(Array.isArray(billing) ? billing : []);
      setCampaignHistory(campaignHistoryData || { rows: [], stats: {} });
      setLoading(false);
    })();
  }, [user?.id, user?._id, user?.role, consultancyId]);

  useEffect(() => {
    const schedules = overview?.consultancy?.campaignAutomation?.schedules || {};
    setCampaignSchedules({
      VISA_EXPIRY_30: { ...defaultCampaignSchedules.VISA_EXPIRY_30, ...(schedules.VISA_EXPIRY_30 || {}) },
      DOCUMENT_EXPIRY_30: { ...defaultCampaignSchedules.DOCUMENT_EXPIRY_30, ...(schedules.DOCUMENT_EXPIRY_30 || {}) },
      RFI_RESPONSE_7: { ...defaultCampaignSchedules.RFI_RESPONSE_7, ...(schedules.RFI_RESPONSE_7 || {}) },
      PRIVACY_CONSENT_GAP: { ...defaultCampaignSchedules.PRIVACY_CONSENT_GAP, ...(schedules.PRIVACY_CONSENT_GAP || {}) },
    });
  }, [overview]);

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
  const complianceSummary = overview?.complianceSummary || {};
  const deadlineTracker = overview?.deadlineTracker || { items: [] };
  const operationalInsights = overview?.operationalInsights || { retentionCandidates: [] };
  const activityFeed = overview?.recentAudit || todayActivity || [];
  const outstandingBilling = billingRows
    .filter((b: any) => b.documentType === 'INVOICE' && !['PAID', 'CANCELLED'].includes(b.status))
    .reduce((sum: number, b: any) => sum + Number(b.total || 0), 0);
  const quotePipeline = billingRows
    .filter((b: any) => b.documentType === 'QUOTE' && b.status !== 'CANCELLED')
    .reduce((sum: number, b: any) => sum + Number(b.total || 0), 0);
  const paidInvoices = billingRows.filter((b: any) => b.documentType === 'INVOICE' && b.status === 'PAID').length;
  const scopedPath = (path: string) => (consultancyId ? `${path}${path.includes('?') ? '&' : '?'}consultancyId=${consultancyId}` : path);
  const canManageCampaignSchedules = ['CONSULTANCY_ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(user?.role || '');

  const describeSchedule = (schedule: any) => {
    if (!schedule?.enabled) return 'Manual only';
    const hour = String(schedule.hour ?? 9).padStart(2, '0');
    const minute = String(schedule.minute ?? 0).padStart(2, '0');
    if (schedule.frequency === 'WEEKLY') {
      return `Weekly on ${weekdayOptions.find((option) => option.value === Number(schedule.weekday ?? 1))?.label || 'Monday'} at ${hour}:${minute}`;
    }
    return `Daily at ${hour}:${minute}`;
  };

  const updateCampaignSchedule = (campaignKey: string, patch: Record<string, any>) => {
    setCampaignSchedules((current) => ({
      ...current,
      [campaignKey]: {
        ...(current[campaignKey] || defaultCampaignSchedules[campaignKey as keyof typeof defaultCampaignSchedules]),
        ...patch,
      },
    }));
  };

  const saveCampaignSchedules = async () => {
    if (!canManageCampaignSchedules) return;
    setSavingCampaignSchedules(true);
    try {
      const res = await authFetch('/api/consultancies/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultancyId: consultancyId || undefined,
          campaignAutomation: {
            schedules: campaignSchedules,
          },
        }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data?.error || 'Failed to save campaign automation');
      setOverview((current: any) => current ? ({
        ...current,
        consultancy: {
          ...current.consultancy,
          campaignAutomation: data?.campaignAutomation || { schedules: campaignSchedules },
        },
      }) : current);
      alert('Campaign automation saved.');
    } catch (err: any) {
      alert(err.message || 'Failed to save campaign automation');
    } finally {
      setSavingCampaignSchedules(false);
    }
  };

  const handleExportReports = async () => {
    setExporting(true);
    try {
      const qs = consultancyId ? `?consultancyId=${consultancyId}` : '';
      const res = await authFetch(`/api/consultancies/me/report-export${qs}`);
      if (!res.ok) throw new Error('Failed to export reports');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consultancy-report-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to export reports');
    } finally {
      setExporting(false);
    }
  };

  const openCampaign = async (campaignKey: string) => {
    setCampaignModalOpen(true);
    setCampaignLoading(true);
    setCampaignPreview(null);
    try {
      const res = await authFetch('/api/clients/campaign-audience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultancyId: consultancyId || undefined,
          campaignKey,
        }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data?.error || 'Failed to load campaign');
      setCampaignData(data);
      setCampaignDraft({ subject: data.subject || '', body: data.body || '' });
    } catch (err: any) {
      alert(err.message || 'Failed to load campaign');
      setCampaignModalOpen(false);
    } finally {
      setCampaignLoading(false);
    }
  };

  const previewCampaign = async () => {
    if (!campaignData?.clientIds?.length) return;
    setCampaignPreviewLoading(true);
    try {
      const res = await authFetch('/api/clients/bulk-email-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultancyId: consultancyId || undefined,
          clientIds: campaignData.clientIds,
          subject: campaignDraft.subject,
          body: campaignDraft.body,
          mergeData: campaignData.mergeData,
        }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data?.error || 'Failed to preview campaign');
      setCampaignPreview(data);
    } catch (err: any) {
      alert(err.message || 'Failed to preview campaign');
    } finally {
      setCampaignPreviewLoading(false);
    }
  };

  const sendCampaign = async () => {
    if (!campaignData?.clientIds?.length) return;
    setCampaignSendLoading(true);
    try {
      const res = await authFetch('/api/clients/bulk-email-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultancyId: consultancyId || undefined,
          clientIds: campaignData.clientIds,
          subject: campaignDraft.subject,
          body: campaignDraft.body,
          mergeData: campaignData.mergeData,
          campaignKey: campaignData.campaignKey,
          campaignLabel: campaignData.label,
          audience: campaignData.audience,
        }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data?.error || 'Failed to send campaign');
      alert(`Campaign sent to ${data.sent || data.sentCount || 0} clients${data.failed ? `, with ${data.failed} failed deliveries` : ''}.`);
      const historyRes = await authFetch(consultancyId ? `/api/clients/campaign-history?consultancyId=${consultancyId}` : '/api/clients/campaign-history');
      if (historyRes.ok) {
        const historyData = await safeJson<any>(historyRes);
        setCampaignHistory(historyData || { rows: [], stats: {} });
      }
      setCampaignModalOpen(false);
      setCampaignData(null);
      setCampaignPreview(null);
    } catch (err: any) {
      alert(err.message || 'Failed to send campaign');
    } finally {
      setCampaignSendLoading(false);
    }
  };

  const relaunchCampaign = (row: any) => {
    const audience = Array.isArray(row?.metadata?.audienceSnapshot) ? row.metadata.audienceSnapshot : [];
    const clientIds = Array.isArray(row?.recipientClientIds)
      ? row.recipientClientIds.map((id: any) => String(id))
      : [];
    setCampaignData({
      campaignKey: row.campaignKey || 'CUSTOM_BULK_EMAIL',
      label: row.campaignLabel || 'Previous Campaign',
      description: 'Relaunch this previous campaign with the saved audience and copy.',
      clientIds,
      audience,
      mergeData: row?.metadata?.mergeData || {},
    });
    setCampaignDraft({
      subject: row.subject || '',
      body: row.bodySnapshot || '',
    });
    setCampaignPreview(null);
    setCampaignModalOpen(true);
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your consultancy operations</p>
        </div>
        <button onClick={handleExportReports} disabled={exporting} className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-60">
          <Download className="w-4 h-4" />
          {exporting ? 'Exporting...' : 'Export Reports'}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="card">
          <h2 className="font-display font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-indigo-600" /> Campaign History
          </h2>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Campaigns logged</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{campaignHistory?.stats?.totalCampaigns || 0}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Recipients reached</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{campaignHistory?.stats?.totalRecipients || 0}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Email opens</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{campaignHistory?.stats?.totalOpened || 0}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Open rate</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{campaignHistory?.stats?.openRate || 0}%</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Failed sends</p>
              <p className="mt-1 text-2xl font-bold text-rose-700">{campaignHistory?.stats?.totalFailed || 0}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Reminder waves</p>
              <p className="mt-1 text-2xl font-bold text-indigo-700">{campaignHistory?.stats?.reminderCampaigns || 0}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Custom bulk emails</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{campaignHistory?.stats?.customCampaigns || 0}</p>
            </div>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {loading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
            ) : campaignHistory?.rows?.length ? (
              campaignHistory.rows.slice(0, 6).map((row: any) => (
                <div key={row._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{row.campaignLabel || 'Bulk Email'}</p>
                      <p className="text-sm text-slate-500 mt-1">{row.subject || 'No subject'}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <span className="inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 border border-slate-200">
                        {row.sentCount || 0} sent
                      </span>
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 border border-emerald-100">
                        {row.openedCount || 0} opened
                      </span>
                      {!!row.failedCount && (
                        <span className="inline-flex rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-700 border border-rose-100">
                          {row.failedCount} failed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-bold text-slate-500">
                    <span>{row.createdBy?.profile?.firstName || 'Team member'}</span>
                    <span>{row.createdAt ? format(new Date(row.createdAt), 'dd MMM HH:mm') : '-'}</span>
                    <span>{row.campaignKey || 'CUSTOM_BULK_EMAIL'}</span>
                    <span>{row.openRate || 0}% open rate</span>
                    <span>{row?.metadata?.triggerSource === 'SCHEDULED' ? 'Scheduled' : 'Manual'}</span>
                  </div>
                  <div className="mt-3">
                    <button onClick={() => relaunchCampaign(row)} className="text-sm font-medium text-indigo-600 hover:underline">
                      Relaunch campaign
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No campaign history yet.</p>
            )}
          </div>
        </div>
      </div>
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
          <Link to={scopedPath('clients')} className="ml-auto text-ori-600 hover:underline text-sm flex items-center gap-1">
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
          <Link to={scopedPath('kanban')} className="ml-auto text-ori-600 hover:underline text-sm flex items-center gap-1">
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
          <Link to={scopedPath('leads')} className="ml-auto text-ori-600 hover:underline text-sm flex items-center gap-1">
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
          <Link to={scopedPath('kanban')} className="card flex items-center gap-3 p-4 bg-amber-50 border-amber-200 hover:shadow-md transition">
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
          <Link to={scopedPath('clients')} className="card flex items-center gap-3 p-4 bg-rose-50 border-rose-200 hover:shadow-md transition">
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
          <Link to={scopedPath('kanban')} className="card flex items-center gap-3 p-4 bg-amber-50 border-amber-200 hover:shadow-md transition">
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
          <Link to={scopedPath('documents')} className="card flex items-center gap-3 p-4 bg-orange-50 border-orange-200 hover:shadow-md transition">
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
        <Link to={scopedPath('clients')} className="card flex items-center gap-3 p-4 bg-cyan-50 border-cyan-200 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-cyan-700" />
          </div>
          <div>
            <p className="text-2xl font-bold text-cyan-900">{complianceSummary.privacyConsentCoverage || 0}%</p>
            <p className="text-cyan-800 text-sm">Privacy consent coverage</p>
          </div>
          <ArrowRight className="w-5 h-5 text-cyan-600 ml-auto" />
        </Link>
      </div>
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <Link to={consultancyId ? `billing?consultancyId=${consultancyId}` : 'billing'} className="card flex items-center gap-3 p-4 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <ReceiptText className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">${outstandingBilling.toFixed(0)}</p>
            <p className="text-slate-500 text-sm">Outstanding invoices</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 ml-auto" />
        </Link>
        <Link to={consultancyId ? `billing?consultancyId=${consultancyId}` : 'billing'} className="card flex items-center gap-3 p-4 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <ReceiptText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">${quotePipeline.toFixed(0)}</p>
            <p className="text-slate-500 text-sm">Active quote pipeline</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 ml-auto" />
        </Link>
        <Link to={consultancyId ? `billing?consultancyId=${consultancyId}` : 'billing'} className="card flex items-center gap-3 p-4 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
            <ReceiptText className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{paidInvoices}</p>
            <p className="text-slate-500 text-sm">Paid invoices</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 ml-auto" />
        </Link>
      </div>
      {(user?.role === 'AGENT' || user?.role === 'CONSULTANCY_ADMIN') && myTasks.length > 0 && (
        <div className="card mt-6">
          <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-ori-600" /> My Active Tasks
          </h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {myTasks.slice(0, 8).map((t: any) => (
              <Link key={t._id} to={scopedPath('/consultancy/kanban')} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition group">
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
          <Link to={scopedPath('/consultancy/kanban')} className="block mt-3 text-ori-600 hover:underline text-sm font-medium">View all on Kanban →</Link>
        </div>
      )}

      <div className="grid xl:grid-cols-3 gap-6 mt-6">
        <div className="card xl:col-span-1">
          <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" /> Compliance Cockpit
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
              <p className="text-xs uppercase font-bold text-emerald-700">Form 956 Sent</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{complianceSummary.form956Sent || 0}</p>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
              <p className="text-xs uppercase font-bold text-blue-700">Initial Advice</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{complianceSummary.initialAdviceSent || 0}</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
              <p className="text-xs uppercase font-bold text-amber-700">MIA Sent</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{complianceSummary.miaSent || 0}</p>
            </div>
            <div className="rounded-xl bg-violet-50 border border-violet-100 p-3">
              <p className="text-xs uppercase font-bold text-violet-700">Guide Acknowledged</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{complianceSummary.consumerGuideAcknowledged || 0}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between"><span className="text-slate-500">Client notes coverage</span><span className="font-semibold text-slate-900">{complianceSummary.clientNotesCoverage || 0}%</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-500">Application notes coverage</span><span className="font-semibold text-slate-900">{complianceSummary.applicationNotesCoverage || 0}%</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-500">Communication coverage</span><span className="font-semibold text-slate-900">{complianceSummary.communicationCoverage || 0}%</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-500">Apps missing required docs</span><span className="font-semibold text-rose-600">{complianceSummary.missingDocumentApplications || 0}</span></div>
          </div>
        </div>

        <div className="card xl:col-span-2">
          <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-amber-600" /> Deadline Tracker
          </h2>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-100 text-sm">
              <span className="text-rose-700 font-semibold">{deadlineTracker.overdueCount || 0}</span>
              <span className="text-slate-600 ml-2">overdue items</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 text-sm">
              <span className="text-amber-700 font-semibold">{deadlineTracker.nextSevenDays || 0}</span>
              <span className="text-slate-600 ml-2">due in 7 days</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm">
              <span className="text-slate-900 font-semibold">{operationalInsights.expiringDocuments || 0}</span>
              <span className="text-slate-600 ml-2">documents expiring soon</span>
            </div>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {(deadlineTracker.items || []).length ? deadlineTracker.items.slice(0, 8).map((item: any, idx: number) => (
              <div key={`${item.type}-${item.clientId || idx}`} className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.clientName || 'Unassigned'}{item.subtitle ? ` • ${item.subtitle}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{item.dueDate ? format(new Date(item.dueDate), 'dd MMM yyyy') : '-'}</p>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${item.severity === 'OVERDUE' ? 'bg-rose-100 text-rose-700' : item.severity === 'HIGH' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>{item.severity}</span>
                  </div>
                </div>
              </div>
            )) : <p className="text-slate-500 text-sm">No urgent deadlines right now.</p>}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="card">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-ori-600" /> Activity Feed
            </h2>
            <Link to={scopedPath('trace-history')} className="text-sm font-medium text-ori-600 hover:underline">
              Open trace history
            </Link>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {loading ? (
              <>
                {[1, 2, 3, 4].map(i => <div key={i} className="p-2"><Skeleton className="h-8 w-full" /></div>)}
              </>
            ) : activityFeed.length ? activityFeed.slice(0, 12).map((log: any) => (
              <div key={log._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{log.changedBy?.profile?.firstName} {log.changedBy?.profile?.lastName || 'System'}</p>
                    <p className="mt-1 text-slate-600">{log.description || `${log.entityType} ${String(log.action || '').toLowerCase()}`}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 border border-slate-200">
                      {log.entityType}
                    </span>
                    <p className="mt-2 text-xs text-slate-400">{log.changedAt ? format(new Date(log.changedAt), 'dd MMM HH:mm') : '-'}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' :
                    log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                    log.action === 'SEND' ? 'bg-violet-100 text-violet-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {log.action}
                  </span>
                  {log.visaSubclass && (
                    <span className="inline-flex rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 border border-amber-100">
                      {log.visaSubclass}
                    </span>
                  )}
                </div>
              </div>
            )) : <p className="text-slate-500 text-sm">No recent activity yet</p>}
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

      <div className="card mt-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display font-semibold text-slate-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600" /> Reminder Campaigns
            </h2>
            <p className="text-sm text-slate-500 mt-1">Launch guided outreach based on live compliance and deadline cohorts.</p>
          </div>
          {canManageCampaignSchedules && (
            <button onClick={saveCampaignSchedules} disabled={savingCampaignSchedules} className="btn-secondary inline-flex items-center gap-2">
              <Save className="w-4 h-4" />
              {savingCampaignSchedules ? 'Saving...' : 'Save Automation'}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {CAMPAIGNS.map((campaign) => (
            <div
              key={campaign.key}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{campaign.label}</p>
                  <p className="text-sm text-slate-500 mt-1">{campaign.hint}</p>
                </div>
                <button
                  onClick={() => openCampaign(campaign.key)}
                  className="shrink-0 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-indigo-700"
                >
                  Launch
                </button>
              </div>
              <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                {describeSchedule(campaignSchedules[campaign.key])}
              </div>
              <div className="mt-3 text-xs text-slate-500 space-y-1">
                {campaignSchedules[campaign.key]?.lastRunAt && <p>Last run: {format(new Date(campaignSchedules[campaign.key].lastRunAt), 'dd MMM HH:mm')}</p>}
                {typeof campaignSchedules[campaign.key]?.lastSentCount === 'number' && (
                  <p>Last result: {campaignSchedules[campaign.key]?.lastSentCount || 0} sent, {campaignSchedules[campaign.key]?.lastFailedCount || 0} failed, audience {campaignSchedules[campaign.key]?.lastAudienceCount || 0}</p>
                )}
                {campaignSchedules[campaign.key]?.lastError && <p className="text-rose-600">{campaignSchedules[campaign.key].lastError}</p>}
              </div>
              {canManageCampaignSchedules && (
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  <label className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
                    <span>Enable schedule</span>
                    <input
                      type="checkbox"
                      checked={!!campaignSchedules[campaign.key]?.enabled}
                      onChange={(e) => updateCampaignSchedule(campaign.key, { enabled: e.target.checked })}
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={campaignSchedules[campaign.key]?.frequency || 'DAILY'}
                      onChange={(e) => updateCampaignSchedule(campaign.key, { frequency: e.target.value })}
                      className="input"
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                    </select>
                    <input
                      type="time"
                      value={`${String(campaignSchedules[campaign.key]?.hour ?? 9).padStart(2, '0')}:${String(campaignSchedules[campaign.key]?.minute ?? 0).padStart(2, '0')}`}
                      onChange={(e) => {
                        const [hour, minute] = e.target.value.split(':').map(Number);
                        updateCampaignSchedule(campaign.key, { hour, minute });
                      }}
                      className="input"
                    />
                  </div>
                  {campaignSchedules[campaign.key]?.frequency === 'WEEKLY' && (
                    <select
                      value={campaignSchedules[campaign.key]?.weekday ?? 1}
                      onChange={(e) => updateCampaignSchedule(campaign.key, { weekday: Number(e.target.value) })}
                      className="input"
                    >
                      {weekdayOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {campaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">{campaignData?.label || 'Reminder Campaign'}</h3>
                <p className="text-sm text-slate-500 mt-1">{campaignData?.description || 'Prepare and send a guided reminder campaign.'}</p>
              </div>
              <button onClick={() => setCampaignModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="p-6 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-100">
                {campaignLoading ? (
                  <Skeleton className="h-80 w-full rounded-2xl" />
                ) : (
                  <>
                    <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                      Audience size: <span className="font-bold text-slate-900">{campaignData?.clientIds?.length || 0}</span>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Subject</label>
                      <input value={campaignDraft.subject} onChange={(e) => setCampaignDraft((current) => ({ ...current, subject: e.target.value }))} className="input" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Body</label>
                      <textarea value={campaignDraft.body} onChange={(e) => setCampaignDraft((current) => ({ ...current, body: e.target.value }))} className="input min-h-[240px]" />
                    </div>
                    <div className="flex flex-wrap gap-3 justify-end">
                      <button type="button" onClick={previewCampaign} disabled={campaignPreviewLoading || !(campaignData?.clientIds?.length)} className="btn-secondary">
                        {campaignPreviewLoading ? 'Loading Preview...' : 'Preview'}
                      </button>
                      <button type="button" onClick={sendCampaign} disabled={campaignSendLoading || !(campaignData?.clientIds?.length)} className="btn-primary">
                        {campaignSendLoading ? 'Sending...' : 'Send Campaign'}
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="p-6 bg-slate-50/70">
                <h3 className="font-semibold text-slate-900 mb-4">Audience & Preview</h3>
                {campaignLoading ? (
                  <Skeleton className="h-80 w-full rounded-2xl" />
                ) : campaignData?.audience?.length ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 max-h-48 overflow-y-auto">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Recipients</p>
                      <div className="space-y-2">
                        {campaignData.audience.slice(0, 8).map((person: any) => (
                          <div key={person.clientId} className="flex items-center justify-between gap-3 text-sm">
                            <div>
                              <p className="font-medium text-slate-900">{person.name}</p>
                              <p className="text-slate-500">{person.email}</p>
                            </div>
                            <div className="text-right text-xs text-slate-400">
                              {person.dueDate ? <p>{person.dueDate}</p> : null}
                              {person.deadlineType ? <p>{person.deadlineType}</p> : null}
                            </div>
                          </div>
                        ))}
                        {campaignData.audience.length > 8 && <p className="text-xs text-slate-400">+{campaignData.audience.length - 8} more recipients</p>}
                      </div>
                    </div>
                    {campaignPreview?.previewRecipients?.length ? (
                      <div className="space-y-3">
                        {campaignPreview.previewRecipients.map((recipient: any) => (
                          <div key={recipient.clientId} className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="text-xs uppercase font-bold tracking-widest text-slate-400">{recipient.name} • {recipient.email}</p>
                            <p className="mt-3 text-sm font-semibold text-slate-900">{recipient.subject}</p>
                            <div className="mt-3 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{recipient.body}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
                        Generate a preview to review the personalized campaign copy before sending.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
                    No matching clients for this campaign right now.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="card">
          <h2 className="font-display font-semibold text-slate-900 mb-4">Recent Applications</h2>
          <div className="space-y-3">
            {loading ? (
              <>
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="p-3"><Skeleton className="h-4 w-3/4 mb-2" /><Skeleton className="h-3 w-1/2" /></div>)}
              </>
            ) : recent.length ? recent.map((a: any) => (
              <Link key={a._id} to={scopedPath(`clients/${a.clientId?._id || a.clientId}`)} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition">
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
                <Link key={c._id} to={scopedPath(`clients/${c._id}`)} className="flex items-center justify-between p-2 rounded-lg hover:bg-rose-50 transition">
                  <span className="font-medium text-slate-900">{c.profile?.firstName} {c.profile?.lastName}</span>
                  <span className="text-sm text-rose-600">{c.profile?.visaExpiry && format(new Date(c.profile.visaExpiry), 'dd MMM yyyy')}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {!!operationalInsights.retentionCandidates?.length && (
        <div className="card mt-6">
          <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Archive className="w-5 h-5 text-slate-600" /> Retention Watch
          </h2>
          <div className="space-y-2">
            {operationalInsights.retentionCandidates.slice(0, 6).map((client: any) => (
              <Link key={client._id} to={scopedPath(`clients/${client._id}`)} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50">
                <div>
                  <p className="font-medium text-slate-900">{client.name}</p>
                  <p className="text-sm text-slate-500">{client.email || client.status}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-slate-100 text-slate-600">{client.archiveStatus || client.status}</span>
                    {!client.privacyComplete && <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-amber-100 text-amber-700">Consent gap</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">{client.lastActivityAt ? format(new Date(client.lastActivityAt), 'dd MMM yyyy') : '-'}</p>
                  {client.archiveEligibleAt && <p className="text-[11px] text-slate-400 mt-1">Archive after {format(new Date(client.archiveEligibleAt), 'dd MMM yyyy')}</p>}
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Privacy gaps</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">{operationalInsights.privacyMissingCount || 0}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Archived clients</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{operationalInsights.archivedClients || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
