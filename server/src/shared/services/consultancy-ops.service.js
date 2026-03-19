import Client from '../models/Client.js';
import Application from '../models/Application.js';
import Lead from '../models/Lead.js';
import Task from '../models/Task.js';
import Sponsor from '../models/Sponsor.js';
import ConsultancyBilling from '../models/ConsultancyBilling.js';

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getConsultancyId(user, explicitConsultancyId) {
  if (user.role === 'SUPER_ADMIN' && explicitConsultancyId) return explicitConsultancyId;
  return user.profile?.consultancyId || null;
}

function buildHref(base, consultancyId, isSuperAdmin) {
  if (!isSuperAdmin || !consultancyId) return base;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}consultancyId=${consultancyId}`;
}

export class ConsultancyOpsService {
  static async search(user, query) {
    const consultancyId = getConsultancyId(user, query.consultancyId);
    if (!consultancyId) throw Object.assign(new Error('No consultancy assigned'), { status: 403 });

    const q = String(query.q || '').trim();
    if (!q) return { query: '', results: [] };

    const regex = new RegExp(escapeRegex(q), 'i');
    const limit = Math.max(1, Math.min(Number(query.limit) || 5, 10));
    const isSuperAdmin = user.role === 'SUPER_ADMIN';

    const [clients, applications, leads, tasks, sponsors, billing] = await Promise.all([
      Client.find({
        consultancyId,
        $or: [
          { 'profile.firstName': regex },
          { 'profile.lastName': regex },
          { 'profile.email': regex },
          { 'profile.phone': regex },
          { 'profile.businessName': regex },
          { 'profile.currentVisa': regex },
          { 'profile.targetVisa': regex },
        ],
      })
        .select('profile status')
        .limit(limit)
        .lean(),
      Application.find({
        consultancyId,
        $or: [
          { visaSubclass: regex },
          { status: regex },
          { immiAccountRef: regex },
          { 'communicationDraft.positionTitle': regex },
          { 'communicationDraft.occupation': regex },
          { 'communicationDraft.anzscoCode': regex },
        ],
      })
        .populate('clientId', 'profile')
        .limit(limit)
        .lean(),
      Lead.find({
        consultancyId,
        $or: [
          { 'profile.firstName': regex },
          { 'profile.lastName': regex },
          { 'profile.email': regex },
          { 'profile.phone': regex },
          { 'profile.interest': regex },
        ],
      })
        .limit(limit)
        .lean(),
      Task.find({
        consultancyId,
        $or: [
          { title: regex },
          { description: regex },
          { type: regex },
          { status: regex },
          { priority: regex },
          { tags: regex },
        ],
      })
        .populate('clientId', 'profile')
        .limit(limit)
        .lean(),
      Sponsor.find({
        consultancyId,
        $or: [
          { companyName: regex },
          { abn: regex },
          { acn: regex },
          { email: regex },
          { 'contactPerson.firstName': regex },
          { 'contactPerson.lastName': regex },
          { industry: regex },
        ],
      })
        .limit(limit)
        .lean(),
      ConsultancyBilling.find({
        consultancyId,
        $or: [
          { documentNumber: regex },
          { title: regex },
          { 'customer.name': regex },
          { 'customer.email': regex },
          { status: regex },
        ],
      })
        .limit(limit)
        .lean(),
    ]);

    const results = [
      ...clients.map((client) => ({
        id: `client-${client._id}`,
        type: 'Client',
        title: `${client.profile?.firstName || ''} ${client.profile?.lastName || ''}`.trim() || client.profile?.email || 'Client',
        subtitle: [client.profile?.email, client.profile?.currentVisa, client.status].filter(Boolean).join(' • '),
        href: buildHref(`/consultancy/clients/${client._id}`, consultancyId, isSuperAdmin),
      })),
      ...applications.map((application) => ({
        id: `application-${application._id}`,
        type: 'Application',
        title: `Subclass ${application.visaSubclass || ''}`.trim(),
        subtitle: [
          application.clientId?.profile ? `${application.clientId.profile.firstName || ''} ${application.clientId.profile.lastName || ''}`.trim() : '',
          application.status,
          application.immiAccountRef,
        ].filter(Boolean).join(' • '),
        href: buildHref(
          application.clientId?._id ? `/consultancy/clients/${application.clientId._id}` : '/consultancy/kanban',
          consultancyId,
          isSuperAdmin
        ),
      })),
      ...leads.map((lead) => ({
        id: `lead-${lead._id}`,
        type: 'Lead',
        title: `${lead.profile?.firstName || ''} ${lead.profile?.lastName || ''}`.trim() || lead.profile?.email || 'Lead',
        subtitle: [lead.profile?.email, lead.profile?.interest, lead.status].filter(Boolean).join(' • '),
        href: buildHref(`/consultancy/leads/${lead._id}`, consultancyId, isSuperAdmin),
      })),
      ...tasks.map((task) => ({
        id: `task-${task._id}`,
        type: 'Task',
        title: task.title || 'Task',
        subtitle: [
          task.clientId?.profile ? `${task.clientId.profile.firstName || ''} ${task.clientId.profile.lastName || ''}`.trim() : '',
          task.priority,
          task.status,
        ].filter(Boolean).join(' • '),
        href: buildHref('/consultancy/kanban', consultancyId, isSuperAdmin),
      })),
      ...sponsors.map((sponsor) => ({
        id: `sponsor-${sponsor._id}`,
        type: 'Sponsor',
        title: sponsor.companyName || 'Sponsor',
        subtitle: [sponsor.abn, sponsor.contactPerson?.email || sponsor.email, sponsor.status].filter(Boolean).join(' • '),
        href: buildHref('/consultancy/sponsors', consultancyId, isSuperAdmin),
      })),
      ...billing.map((doc) => ({
        id: `billing-${doc._id}`,
        type: doc.documentType === 'QUOTE' ? 'Quote' : 'Invoice',
        title: `${doc.documentNumber}${doc.title ? ` - ${doc.title}` : ''}`,
        subtitle: [doc.customer?.name, doc.status, doc.total != null ? `$${Number(doc.total).toFixed(2)}` : ''].filter(Boolean).join(' • '),
        href: buildHref('/consultancy/billing', consultancyId, isSuperAdmin),
      })),
    ];

    const typePriority = { Client: 0, Application: 1, Lead: 2, Task: 3, Sponsor: 4, Quote: 5, Invoice: 6 };
    results.sort((a, b) => {
      const typeDelta = (typePriority[a.type] ?? 99) - (typePriority[b.type] ?? 99);
      if (typeDelta !== 0) return typeDelta;
      return a.title.localeCompare(b.title);
    });

    return { query: q, results: results.slice(0, limit * 6) };
  }
}
