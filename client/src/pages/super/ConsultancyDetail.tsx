import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authFetch } from '../../store/auth';
import { format } from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Users,
  FileText,
  ClipboardList,
  UserPlus,
  Briefcase,
  Shield,
  DollarSign,
  Mail,
  Phone,
  Globe,
  ChevronRight,
  User,
  GraduationCap,
  FolderOpen,
  ExternalLink,
  Clock,
  History,
  AlertTriangle,
  ShieldCheck,
  CalendarClock,
  Archive,
} from 'lucide-react';
import StatCard from '../../components/StatCard';

export default function ConsultancyDetail() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    authFetch(`/api/consultancies/${id}/overview`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-slate-500">Loading...</div>;
  if (!data?.consultancy) return <div className="text-red-600">Consultancy not found</div>;

  const { consultancy, stats, recentClients, recentApplications, employeesList, appStatusBreakdown } = data;
  const complianceSummary = data.complianceSummary || {};
  const deadlineTracker = data.deadlineTracker || { items: [] };
  const operationalInsights = data.operationalInsights || { retentionCandidates: [] };
  const recentAudit = data.recentAudit || [];

  const statCards = [
    { label: 'Clients', value: stats.clients ?? 0, icon: Users, color: 'bg-blue-100 text-blue-600', to: `/consultancy/clients?consultancyId=${id}` },
    { label: 'Employees', value: stats.employees ?? 0, icon: User, color: 'bg-violet-100 text-violet-600', to: `/consultancy/employees?consultancyId=${id}` },
    { label: 'Applications', value: stats.applications ?? 0, icon: GraduationCap, color: 'bg-amber-100 text-amber-600', to: `/consultancy/kanban?consultancyId=${id}` },
    { label: 'Tasks', value: stats.tasks ?? 0, icon: ClipboardList, color: 'bg-emerald-100 text-emerald-600', to: `/consultancy/daily-tasks?consultancyId=${id}` },
    { label: 'Leads', value: stats.leads ?? 0, icon: UserPlus, color: 'bg-rose-100 text-rose-600', to: `/consultancy/leads?consultancyId=${id}` },
    { label: 'Documents', value: stats.documents ?? 0, icon: FileText, color: 'bg-sky-100 text-sky-600', to: `/consultancy/documents?consultancyId=${id}` },
    { label: 'Trust', value: `$${Number(stats.trustBalance ?? 0).toLocaleString()}`, icon: DollarSign, color: 'bg-green-100 text-green-600', to: `/consultancy/trust?consultancyId=${id}` },
    { label: 'Sponsors', value: stats.sponsors ?? 0, icon: Briefcase, color: 'bg-orange-100 text-orange-600', to: `/consultancy/sponsors?consultancyId=${id}` },
    { label: 'Colleges', value: stats.colleges ?? 0, icon: GraduationCap, color: 'bg-indigo-100 text-indigo-600', to: `/consultancy/colleges?consultancyId=${id}` },
    { label: 'OSHC', value: stats.oshc ?? 0, icon: Shield, color: 'bg-teal-100 text-teal-600', to: `/consultancy/oshc?consultancyId=${id}` },
    { label: 'Checked In Today', value: stats.attendanceToday ?? 0, icon: Clock, color: 'bg-slate-100 text-slate-600', to: `/consultancy/attendance?consultancyId=${id}` },
    { label: 'Trace History', value: <ArrowRight className="w-6 h-6 text-slate-600" aria-hidden />, icon: History, color: 'bg-slate-100 text-slate-600', to: `/consultancy/trace-history?consultancyId=${id}` },
  ];

  return (
    <div className="space-y-6">
      <Link to="/admin/consultancies" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> Back to Consultancies
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-amber-100 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">
              {consultancy.displayName || consultancy.name}
            </h1>
            <p className="text-slate-500">{consultancy.name}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-sm">
              {consultancy.abn && <span className="text-slate-600">ABN: {consultancy.abn}</span>}
              {consultancy.verified && (
                <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">Verified</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/consultancy/dashboard?consultancyId=${id}`}
            className="btn-primary flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" /> View as Consultancy
          </Link>
          <Link
            to={`/admin/consultancies/${id}/edit`}
            className="btn-secondary flex items-center gap-2"
          >
            Edit Consultancy
          </Link>
        </div>
      </div>

      {/* Contact */}
      <div className="card">
        <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-ori-600" /> Contact & Details
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {consultancy.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <a href={`mailto:${consultancy.email}`} className="text-ori-600 hover:underline">{consultancy.email}</a>
            </div>
          )}
          {consultancy.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{consultancy.phone}</span>
            </div>
          )}
          {consultancy.website && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              <a href={consultancy.website} target="_blank" rel="noreferrer" className="text-ori-600 hover:underline">{consultancy.website}</a>
            </div>
          )}
          {consultancy.address?.city && (
            <div className="md:col-span-2">
              <span className="text-slate-500">Address: </span>
              {[consultancy.address.street, consultancy.address.city, consultancy.address.state, consultancy.address.postcode]
                .filter(Boolean).join(', ')}
            </div>
          )}
          {consultancy.specializations?.length > 0 && (
            <div className="md:col-span-2">
              <span className="text-slate-500">Specializations: </span>
              {consultancy.specializations.join(', ')}
            </div>
          )}
          {consultancy.marnNumbers?.length > 0 && (
            <div>
              <span className="text-slate-500">MARN: </span>
              {consultancy.marnNumbers.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon, color, to }) => (
          <StatCard key={label} label={label} value={value} icon={icon} color={color} to={to} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" /> Compliance Snapshot
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
              <p className="text-xs uppercase font-bold text-violet-700">Guide Ack.</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{complianceSummary.consumerGuideAcknowledged || 0}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between"><span className="text-slate-500">Client notes coverage</span><span className="font-semibold text-slate-900">{complianceSummary.clientNotesCoverage || 0}%</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-500">Application notes coverage</span><span className="font-semibold text-slate-900">{complianceSummary.applicationNotesCoverage || 0}%</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-500">Communication coverage</span><span className="font-semibold text-slate-900">{complianceSummary.communicationCoverage || 0}%</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-500">Apps missing docs</span><span className="font-semibold text-rose-600">{complianceSummary.missingDocumentApplications || 0}</span></div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-amber-600" /> Deadline Tracker
          </h2>
          <div className="flex gap-3 mb-4 text-sm">
            <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-100">
              <span className="font-semibold text-rose-700">{deadlineTracker.overdueCount || 0}</span>
              <span className="text-slate-600 ml-2">overdue</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-100">
              <span className="font-semibold text-amber-700">{deadlineTracker.nextSevenDays || 0}</span>
              <span className="text-slate-600 ml-2">due in 7 days</span>
            </div>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {(deadlineTracker.items || []).length ? deadlineTracker.items.slice(0, 8).map((item: any, idx: number) => (
              <Link key={`${item.type}-${idx}`} to={item.clientId ? `/consultancy/clients/${item.clientId}?consultancyId=${id}` : `/consultancy/dashboard?consultancyId=${id}`} className="block p-3 rounded-xl bg-slate-50 hover:bg-amber-50 transition">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.clientName || 'Consultancy matter'}{item.subtitle ? ` • ${item.subtitle}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{item.dueDate ? format(new Date(item.dueDate), 'dd MMM yyyy') : '-'}</p>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${item.severity === 'OVERDUE' ? 'bg-rose-100 text-rose-700' : item.severity === 'HIGH' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>{item.severity}</span>
                  </div>
                </div>
              </Link>
            )) : <p className="text-slate-500 text-sm py-4 text-center">No urgent deadlines.</p>}
          </div>
        </div>

        {/* Employees */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-violet-600" /> Employees
            </h2>
            <Link to={`/consultancy/employees?consultancyId=${id}`} className="text-ori-600 hover:underline text-sm flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {employeesList?.length > 0 ? (
              employeesList.map((e: any) => (
                <div key={e._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100">
                  <div>
                    <p className="font-medium text-slate-900">
                      {e.profile?.firstName} {e.profile?.lastName}
                    </p>
                    <p className="text-sm text-slate-500">{e.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${e.role === 'CONSULTANCY_ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                    {e.role?.replace('_', ' ')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm py-4 text-center">No employees</p>
            )}
          </div>
        </div>

        {/* Application Status */}
        <div className="card">
          <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-600" /> Application Status Breakdown
          </h2>
          <div className="space-y-2">
            {Object.entries(appStatusBreakdown || {}).length > 0 ? (
              Object.entries(appStatusBreakdown).map(([status, count]: [string, any]) => (
                <div key={status} className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                  <span className="font-medium text-slate-700">{status}</span>
                  <span className="text-ori-600 font-semibold">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm py-4 text-center">No applications</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" /> Recent Audit Activity
          </h2>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {recentAudit.length ? recentAudit.map((log: any) => (
              <div key={log._id} className="p-3 rounded-xl bg-slate-50">
                <p className="font-medium text-slate-900">{log.changedBy?.profile?.firstName} {log.changedBy?.profile?.lastName}</p>
                <p className="text-sm text-slate-600">{log.description}</p>
                <p className="text-xs text-slate-400 mt-1">{format(new Date(log.changedAt), 'dd MMM yyyy HH:mm')}</p>
              </div>
            )) : <p className="text-slate-500 text-sm py-4 text-center">No recent audit activity.</p>}
          </div>
        </div>

        <div className="card">
          <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Archive className="w-5 h-5 text-slate-600" /> Retention Watch
          </h2>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {operationalInsights.retentionCandidates?.length ? operationalInsights.retentionCandidates.map((client: any) => (
              <Link key={client._id} to={`/consultancy/clients/${client._id}?consultancyId=${id}`} className="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{client.name}</p>
                    <p className="text-sm text-slate-500">{client.email || client.status}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-slate-100 text-slate-600">{client.archiveStatus || client.status}</span>
                      {!client.privacyComplete && <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-amber-100 text-amber-700">Consent gap</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{client.lastActivityAt ? format(new Date(client.lastActivityAt), 'dd MMM yyyy') : '-'}</p>
                    {client.archiveEligibleAt && <p className="text-[11px] text-slate-400 mt-1">Archive after {format(new Date(client.archiveEligibleAt), 'dd MMM yyyy')}</p>}
                  </div>
                </div>
              </Link>
            )) : (
              <p className="text-slate-500 text-sm py-4 text-center">No retention-risk records detected.</p>
            )}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-slate-50 text-sm">
            <p className="font-medium text-slate-900">Operational Watch</p>
            <div className="mt-2 flex items-center justify-between"><span className="text-slate-500">Overdue tasks</span><span className="font-semibold text-rose-600">{operationalInsights.overdueTasks || 0}</span></div>
            <div className="mt-1 flex items-center justify-between"><span className="text-slate-500">Expiring documents</span><span className="font-semibold text-amber-700">{operationalInsights.expiringDocuments || 0}</span></div>
            <div className="mt-1 flex items-center justify-between"><span className="text-slate-500">Privacy consent gaps</span><span className="font-semibold text-cyan-700">{operationalInsights.privacyMissingCount || 0}</span></div>
            <div className="mt-1 flex items-center justify-between"><span className="text-slate-500">Archived clients</span><span className="font-semibold text-slate-900">{operationalInsights.archivedClients || 0}</span></div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Recent Clients
            </h2>
            <Link to={`/consultancy/clients?consultancyId=${id}`} className="text-ori-600 hover:underline text-sm flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentClients?.length > 0 ? (
              recentClients.map((c: any) => (
                <Link
                  key={c._id}
                  to={`/consultancy/clients/${c._id}`}
                  className="block p-3 rounded-lg bg-slate-50 hover:bg-ori-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-900">
                        {c.profile?.firstName} {c.profile?.lastName}
                      </p>
                      <p className="text-sm text-slate-500">{c.profile?.email}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-slate-200 text-slate-600">{c.status}</span>
                  </div>
                  {c.assignedAgentId && (
                    <p className="text-xs text-slate-500 mt-1">
                      Agent: {c.assignedAgentId.profile?.firstName} {c.assignedAgentId.profile?.lastName}
                    </p>
                  )}
                </Link>
              ))
            ) : (
              <p className="text-slate-500 text-sm py-4 text-center">No clients</p>
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-900 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-amber-600" /> Recent Applications
            </h2>
            <Link to={`/consultancy/kanban?consultancyId=${id}`} className="text-ori-600 hover:underline text-sm flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentApplications?.length > 0 ? (
              recentApplications.map((a: any) => (
                <Link
                  key={a._id}
                  to={a.clientId?._id ? `/consultancy/clients/${a.clientId._id}?consultancyId=${id}` : '#'}
                  className="block p-3 rounded-lg bg-slate-50 hover:bg-ori-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-900">
                        Subclass {a.visaSubclass} — {a.clientId?.profile?.firstName} {a.clientId?.profile?.lastName}
                      </p>
                      <p className="text-sm text-slate-500">
                        Agent: {a.agentId?.profile?.firstName} {a.agentId?.profile?.lastName}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700">{a.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Updated {a.updatedAt && format(new Date(a.updatedAt), 'dd MMM yyyy')}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-slate-500 text-sm py-4 text-center">No applications</p>
            )}
          </div>
        </div>
      </div>

      {/* Super Admin Actions */}
      <div className="card border-2 border-dashed border-amber-200 bg-amber-50/30">
        <h2 className="font-display font-semibold text-slate-900 mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-600" /> Super Admin Actions
        </h2>
        <p className="text-slate-600 text-sm mb-4">
          Use <strong>View as Consultancy</strong> to access the full CRM as this consultancy. Manage users and assign agents to this consultancy from the Users page.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to={`/consultancy/dashboard?consultancyId=${id}`} className="btn-primary inline-flex items-center gap-2">
            <ExternalLink className="w-4 h-4" /> View as Consultancy
          </Link>
          <Link to={`/consultancy/settings?consultancyId=${id}`} className="btn-secondary inline-flex items-center gap-2">
            Consultancy Settings
          </Link>
          <Link to="/admin/users" className="btn-secondary inline-flex items-center gap-2">
            Manage Users
          </Link>
        </div>
      </div>
    </div>
  );
}
