import { ConsultancyService } from '../services/consultancy.service.js';
import archiver from 'archiver';

const esc = (value) => {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

const toCsv = (headers, rows) => [
  headers.join(','),
  ...rows.map((row) => headers.map((header) => esc(row[header])).join(',')),
].join('\n');

const emptyOverview = () => ({
  consultancy: null,
  stats: {
    clients: 0,
    employees: 0,
    applications: 0,
    tasks: 0,
    leads: 0,
    documents: 0,
    trustEntries: 0,
    sponsors: 0,
    colleges: 0,
    oshc: 0,
    attendanceToday: 0,
    trustBalance: 0,
  },
  recentClients: [],
  recentApplications: [],
  employeesList: [],
  appStatusBreakdown: {},
  complianceSummary: {
    form956Sent: 0,
    form956Signed: 0,
    miaSent: 0,
    initialAdviceSent: 0,
    sponsorshipPackageSent: 0,
    consumerGuideAcknowledged: 0,
    missingDocumentApplications: 0,
    clientNotesCoverage: 0,
    applicationNotesCoverage: 0,
    communicationCoverage: 0,
    privacyConsentCoverage: 0,
  },
  deadlineTracker: {
    overdueCount: 0,
    nextSevenDays: 0,
    items: [],
  },
  operationalInsights: {
    overdueTasks: 0,
    expiringDocuments: 0,
    retentionCandidates: [],
    privacyMissingCount: 0,
    archivedClients: 0,
  },
  recentAudit: [],
});

export class ConsultancyController {
  static async uploadSignature(req, res) {
    const cid = req.user.profile?.consultancyId;
    if (!req.file) throw Object.assign(new Error('No file uploaded'), { status: 400 });
    const fileUrl = `/uploads/${req.file.filename}`;
    const result = await ConsultancyService.uploadSignature(cid, fileUrl);
    res.json(result);
  }

  static async uploadConsumerGuide(req, res) {
    const cid = req.user.profile?.consultancyId;
    if (!req.file) throw Object.assign(new Error('No file uploaded'), { status: 400 });
    const fileUrl = `/uploads/${req.file.filename}`;
    const result = await ConsultancyService.uploadConsumerGuide(cid, fileUrl);
    res.json(result);
  }

  static async getAll(req, res) {
    const result = await ConsultancyService.getAllConsultancies(req.user);
    res.json(result);
  }

  static async search(req, res) {
    const result = await ConsultancyService.searchConsultancies(req.query);
    res.json(result);
  }

  static async getMe(req, res) {
    let cid = req.user.profile?.consultancyId;
    if (req.user.role === 'SUPER_ADMIN' && req.query.consultancyId) cid = req.query.consultancyId;
    if (!cid) return res.json(null);
    const result = await ConsultancyService.getConsultancyById(cid);
    res.json(result);
  }

  static async getById(req, res) {
    const result = await ConsultancyService.getConsultancyById(req.params.id);
    res.json(result);
  }

  static async getMyOverview(req, res) {
    let cid = req.user.profile?.consultancyId;
    if (req.user.role === 'SUPER_ADMIN' && req.query.consultancyId) cid = req.query.consultancyId;
    if (!cid) return res.json(emptyOverview());
    const result = await ConsultancyService.getOverview(cid);
    res.json(result);
  }

  static async exportReport(req, res) {
    let cid = req.user.profile?.consultancyId;
    if (req.user.role === 'SUPER_ADMIN' && req.query.consultancyId) cid = req.query.consultancyId;
    if (!cid) throw Object.assign(new Error('No consultancy assigned'), { status: 404 });

    const { overview, clientRows, applicationRows, billingRows } = await ConsultancyService.getReportExport(cid);
    const today = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="consultancy-report-${today}.zip"`);

    const zip = archiver('zip', { zlib: { level: 9 } });
    zip.on('error', (err) => {
      try {
        res.status(500).end();
      } catch { }
      throw err;
    });
    zip.pipe(res);

    const summaryRows = [
      { metric: 'clients', value: overview?.stats?.clients || 0 },
      { metric: 'applications', value: overview?.stats?.applications || 0 },
      { metric: 'leads', value: overview?.stats?.leads || 0 },
      { metric: 'documents', value: overview?.stats?.documents || 0 },
      { metric: 'overdueDeadlines', value: overview?.deadlineTracker?.overdueCount || 0 },
      { metric: 'nextSevenDaysDeadlines', value: overview?.deadlineTracker?.nextSevenDays || 0 },
      { metric: 'privacyConsentCoverage', value: overview?.complianceSummary?.privacyConsentCoverage || 0 },
      { metric: 'communicationCoverage', value: overview?.complianceSummary?.communicationCoverage || 0 },
      { metric: 'expiringDocuments', value: overview?.operationalInsights?.expiringDocuments || 0 },
      { metric: 'privacyMissingCount', value: overview?.operationalInsights?.privacyMissingCount || 0 },
      { metric: 'archivedClients', value: overview?.operationalInsights?.archivedClients || 0 },
    ];
    zip.append(toCsv(['metric', 'value'], summaryRows), { name: 'summary.csv' });

    const clientsCsvRows = (clientRows || []).map((client) => ({
      name: `${client.profile?.firstName || ''} ${client.profile?.lastName || ''}`.trim(),
      email: client.profile?.email || '',
      status: client.status || '',
      assignedAgent: `${client.assignedAgentId?.profile?.firstName || ''} ${client.assignedAgentId?.profile?.lastName || ''}`.trim(),
      currentVisa: client.profile?.currentVisa || '',
      visaExpiry: client.profile?.visaExpiry ? new Date(client.profile.visaExpiry).toISOString().slice(0, 10) : '',
      privacyDataCollection: client.privacyConsent?.dataCollection ? 'yes' : 'no',
      privacyDataSharing: client.privacyConsent?.dataSharing ? 'yes' : 'no',
      marketingConsent: client.privacyConsent?.marketing ? 'yes' : 'no',
      archiveStatus: client.retention?.archiveStatus || '',
      archiveEligibleAt: client.retention?.archiveEligibleAt ? new Date(client.retention.archiveEligibleAt).toISOString().slice(0, 10) : '',
      archivedAt: client.retention?.archivedAt ? new Date(client.retention.archivedAt).toISOString().slice(0, 10) : '',
      lastActivityAt: client.lastActivityAt ? new Date(client.lastActivityAt).toISOString().slice(0, 10) : '',
    }));
    zip.append(toCsv(['name', 'email', 'status', 'assignedAgent', 'currentVisa', 'visaExpiry', 'privacyDataCollection', 'privacyDataSharing', 'marketingConsent', 'archiveStatus', 'archiveEligibleAt', 'archivedAt', 'lastActivityAt'], clientsCsvRows), { name: 'clients.csv' });

    const applicationsCsvRows = (applicationRows || []).map((application) => ({
      clientName: `${application.clientId?.profile?.firstName || ''} ${application.clientId?.profile?.lastName || ''}`.trim(),
      visaSubclass: application.visaSubclass || '',
      status: application.status || '',
      stageDeadline: application.stageDeadline ? new Date(application.stageDeadline).toISOString().slice(0, 10) : '',
      coeExpiry: application.coe?.expiryDate ? new Date(application.coe.expiryDate).toISOString().slice(0, 10) : '',
      form956SentAt: application.compliance?.form956SentAt ? new Date(application.compliance.form956SentAt).toISOString().slice(0, 10) : '',
      miaSentAt: application.compliance?.miaSentAt ? new Date(application.compliance.miaSentAt).toISOString().slice(0, 10) : '',
      agent: `${application.agentId?.profile?.firstName || ''} ${application.agentId?.profile?.lastName || ''}`.trim(),
      updatedAt: application.updatedAt ? new Date(application.updatedAt).toISOString().slice(0, 10) : '',
    }));
    zip.append(toCsv(['clientName', 'visaSubclass', 'status', 'stageDeadline', 'coeExpiry', 'form956SentAt', 'miaSentAt', 'agent', 'updatedAt'], applicationsCsvRows), { name: 'applications.csv' });

    const deadlinesCsvRows = (overview?.deadlineTracker?.items || []).map((item) => ({
      type: item.type || '',
      severity: item.severity || '',
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : '',
      title: item.title || '',
      clientName: item.clientName || '',
      subtitle: item.subtitle || '',
    }));
    zip.append(toCsv(['type', 'severity', 'dueDate', 'title', 'clientName', 'subtitle'], deadlinesCsvRows), { name: 'deadlines.csv' });

    const billingCsvRows = (billingRows || []).map((row) => ({
      documentNumber: row.documentNumber || '',
      documentType: row.documentType || '',
      status: row.status || '',
      clientName: `${row.clientId?.profile?.firstName || ''} ${row.clientId?.profile?.lastName || ''}`.trim(),
      issueDate: row.issueDate ? new Date(row.issueDate).toISOString().slice(0, 10) : '',
      dueDate: row.dueDate ? new Date(row.dueDate).toISOString().slice(0, 10) : '',
      total: row.total ?? 0,
      currency: row.currency || 'AUD',
    }));
    zip.append(toCsv(['documentNumber', 'documentType', 'status', 'clientName', 'issueDate', 'dueDate', 'total', 'currency'], billingCsvRows), { name: 'billing.csv' });

    await zip.finalize();
  }

  static async getOverview(req, res) {
    const result = await ConsultancyService.getOverview(req.params.id);
    res.json(result);
  }

  static async register(req, res) {
    // Schema guarantees all fields exist
    const result = await ConsultancyService.registerConsultancy(req.body);
    res.status(201).json(result);
  }

  static async create(req, res) {
    const result = await ConsultancyService.createConsultancy(req.body);
    res.status(201).json(result);
  }

  static async updateMe(req, res) {
    let cid = req.user.profile?.consultancyId;
    if (req.user.role === 'SUPER_ADMIN' && req.body.consultancyId) {
      cid = req.body.consultancyId;
      delete req.body.consultancyId;
    }
    if (!cid) throw Object.assign(new Error('No consultancy assigned. Use consultancyId in body when Super Admin.'), { status: 404 });
    const result = await ConsultancyService.updateOwnConsultancy(cid, req.body);
    res.json(result);
  }

  static async updateById(req, res) {
    const cid = req.user.profile?.consultancyId;
    if (['CONSULTANCY_ADMIN', 'MANAGER'].includes(req.user.role) && cid?.toString() !== req.params.id) {
       throw Object.assign(new Error('Can only update your own consultancy'), { status: 403 });
    }
    const result = await ConsultancyService.updateConsultancyById(req.params.id, req.body);
    res.json(result);
  }

  static async delete(req, res) {
    const result = await ConsultancyService.deleteConsultancy(req.params.id);
    res.json(result);
  }
}
