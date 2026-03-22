import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authFetch, safeJson } from '../../store/auth';
import { BadgeDollarSign, Download, FilePlus2, Filter, Mail, ReceiptText, Search, X } from 'lucide-react';

type ClientRow = {
  _id: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
};

type ApplicationRow = {
  _id: string;
  visaSubclass?: string;
  status?: string;
  clientId?: string | { _id?: string };
};

type BillingRow = {
  _id: string;
  documentType: 'QUOTE' | 'INVOICE';
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'PAID' | 'CANCELLED';
  documentNumber: string;
  title?: string;
  issueDate: string;
  dueDate?: string;
  validUntil?: string;
  total?: number;
  customer?: { name?: string; email?: string };
  clientId?: string | ClientRow;
  applicationId?: string | ApplicationRow;
  notes?: string;
  gstEnabled?: boolean;
  gstRate?: number;
  lineItems?: { description: string; quantity: number; unit?: string; unitPrice: number }[];
};

const DEFAULT_FORM = {
  documentType: 'QUOTE' as 'QUOTE' | 'INVOICE',
  clientId: '',
  applicationId: '',
  title: '',
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: '',
  validUntil: '',
  gstEnabled: false,
  gstRate: 0.1,
  notes: '',
  lineItems: [{ description: 'Professional services', quantity: 1, unit: 'fixed', unitPrice: 0 }],
};

function money(value: number | undefined) {
  return Number(value || 0).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
}

function fmtDate(value?: string) {
  if (!value) return '-';
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString('en-AU');
}

function getClientLabel(client: ClientRow | undefined) {
  if (!client) return 'Unknown client';
  return `${client.profile?.firstName || ''} ${client.profile?.lastName || ''}`.trim() || client.profile?.email || 'Unknown client';
}

export default function ConsultancyBillingPage() {
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const qs = consultancyId ? `?consultancyId=${consultancyId}` : '';

  const [rows, setRows] = useState<BillingRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [sendFor, setSendFor] = useState<BillingRow | null>(null);
  const [sendForm, setSendForm] = useState({ to: '', subject: '', text: '' });
  const [filters, setFilters] = useState({ documentType: 'ALL', status: 'ALL', clientId: 'ALL', q: '' });

  async function refresh() {
    setLoading(true);
    setError(null);
    const base = new URLSearchParams();
    if (consultancyId) base.set('consultancyId', consultancyId);
    try {
      const [billingRes, clientsRes, applicationsRes] = await Promise.all([
        authFetch(`/api/consultancy-billing?${base.toString()}`),
        authFetch(`/api/clients${qs}`),
        authFetch(`/api/applications${qs}`),
      ]);
      if (billingRes.status === 403) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      const [billingJson, clientsJson, applicationsJson] = await Promise.all([
        safeJson<any[]>(billingRes),
        safeJson<any[]>(clientsRes),
        safeJson<any[]>(applicationsRes),
      ]);
      if (!billingRes.ok) throw new Error((billingJson as any)?.error || 'Failed to load billing records');
      setRows(Array.isArray(billingJson) ? billingJson : []);
      setClients(Array.isArray(clientsJson) ? clientsJson : []);
      setApplications(Array.isArray(applicationsJson) ? applicationsJson : []);
      setAccessDenied(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to load billing workspace');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [consultancyId]);

  const clientMap = useMemo(() => new Map(clients.map((client) => [client._id, client])), [clients]);
  const applicationOptions = useMemo(
    () =>
      applications.filter((app) => {
        if (!form.clientId) return true;
        const appClientId = typeof app.clientId === 'string' ? app.clientId : app.clientId?._id;
        return appClientId === form.clientId;
      }),
    [applications, form.clientId]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (filters.documentType !== 'ALL' && row.documentType !== filters.documentType) return false;
      if (filters.status !== 'ALL' && row.status !== filters.status) return false;
      const clientId = typeof row.clientId === 'string' ? row.clientId : row.clientId?._id;
      if (filters.clientId !== 'ALL' && clientId !== filters.clientId) return false;
      if (filters.q.trim()) {
        const q = filters.q.trim().toLowerCase();
        const hay = [row.documentNumber, row.title, row.customer?.name, row.customer?.email, row.status]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filters, rows]);

  const stats = useMemo(() => {
    const quotes = filteredRows.filter((row) => row.documentType === 'QUOTE');
    const invoices = filteredRows.filter((row) => row.documentType === 'INVOICE');
    return {
      totalQuotes: quotes.length,
      totalInvoices: invoices.length,
      quotedValue: quotes.reduce((sum, row) => sum + Number(row.total || 0), 0),
      receivableValue: invoices.filter((row) => row.status !== 'PAID' && row.status !== 'CANCELLED').reduce((sum, row) => sum + Number(row.total || 0), 0),
    };
  }, [filteredRows]);

  function setLineItem(index: number, patch: Partial<(typeof form.lineItems)[number]>) {
    setForm((current) => ({
      ...current,
      lineItems: current.lineItems.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    }));
  }

  async function createRecord(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const payload: any = {
        ...form,
        consultancyId: consultancyId || undefined,
        applicationId: form.applicationId || undefined,
        dueDate: form.documentType === 'INVOICE' ? form.dueDate || undefined : undefined,
        validUntil: form.documentType === 'QUOTE' ? form.validUntil || undefined : undefined,
      };
      const res = await authFetch('/api/consultancy-billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data?.error || data?.details?.[0]?.message || 'Failed to create record');
      setShowCreate(false);
      setForm(DEFAULT_FORM);
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to create record');
    } finally {
      setCreating(false);
    }
  }

  async function patchStatus(row: BillingRow, status: BillingRow['status']) {
    setError(null);
    try {
      const suffix = consultancyId ? `?consultancyId=${consultancyId}` : '';
      const res = await authFetch(`/api/consultancy-billing/${row._id}${suffix}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data?.error || 'Failed to update status');
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to update status');
    }
  }

  async function cancelRecord(row: BillingRow) {
    if (!window.confirm(`Cancel ${row.documentNumber}?`)) return;
    setError(null);
    try {
      const suffix = consultancyId ? `?consultancyId=${consultancyId}` : '';
      const res = await authFetch(`/api/consultancy-billing/${row._id}${suffix}`, { method: 'DELETE' });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data?.error || 'Failed to cancel record');
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel record');
    }
  }

  async function sendRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!sendFor) return;
    setSendingId(sendFor._id);
    setError(null);
    try {
      const suffix = consultancyId ? `?consultancyId=${consultancyId}` : '';
      const res = await authFetch(`/api/consultancy-billing/${sendFor._id}/send${suffix}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sendForm),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data?.error || 'Failed to send email');
      setSendFor(null);
      setSendForm({ to: '', subject: '', text: '' });
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to send email');
    } finally {
      setSendingId(null);
    }
  }

  function openSend(row: BillingRow) {
    setSendFor(row);
    setSendForm({
      to: row.customer?.email || '',
      subject: `${row.documentType} ${row.documentNumber} from Abroad Up`,
      text: `Hello,\n\nPlease find attached ${row.documentType.toLowerCase()} ${row.documentNumber}.\n\nRegards,\nAbroad Up`,
    });
  }

  async function downloadPdf(row: BillingRow) {
    setError(null);
    try {
      const suffix = consultancyId ? `?consultancyId=${consultancyId}` : '';
      const res = await authFetch(`/api/consultancy-billing/${row._id}/pdf${suffix}`);
      if (!res.ok) {
        const data = await safeJson<any>(res);
        throw new Error(data?.error || 'Failed to download PDF');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${row.documentNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || 'Failed to download PDF');
    }
  }

  if (accessDenied) {
    return (
      <div className="card p-12 text-center">
        <ReceiptText className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="font-display font-semibold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-slate-600">You don&apos;t have permission to view billing and quotes. Contact your consultancy admin to enable billing access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Billing & Quotes</h1>
          <p className="text-slate-500 mt-1">Create formal quotes and invoices tied to consultancy clients and visa matters.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex items-center justify-center gap-2">
          <FilePlus2 className="w-4 h-4" /> New Quote / Invoice
        </button>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <p className="text-xs uppercase font-bold tracking-wide text-slate-500">Quotes</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalQuotes}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase font-bold tracking-wide text-slate-500">Invoices</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalInvoices}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase font-bold tracking-wide text-slate-500">Quoted Value</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{money(stats.quotedValue)}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase font-bold tracking-wide text-slate-500">Outstanding</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{money(stats.receivableValue)}</p>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={filters.q}
              onChange={(e) => setFilters((current) => ({ ...current, q: e.target.value }))}
              placeholder="Search number, client, title or email"
              className="input pl-9"
            />
          </div>
          <button onClick={() => setShowFilters((current) => !current)} className="btn-secondary inline-flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
            <select value={filters.documentType} onChange={(e) => setFilters((current) => ({ ...current, documentType: e.target.value }))} className="input">
              <option value="ALL">All document types</option>
              <option value="QUOTE">Quotes</option>
              <option value="INVOICE">Invoices</option>
            </select>
            <select value={filters.status} onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))} className="input">
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select value={filters.clientId} onChange={(e) => setFilters((current) => ({ ...current, clientId: e.target.value }))} className="input">
              <option value="ALL">All clients</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>{getClientLabel(client)}</option>
              ))}
            </select>
          </div>
        )}

        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Document</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Client</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Dates</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Total</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row._id} className="border-b border-slate-100">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-900">{row.documentNumber}</div>
                    <div className="text-slate-500">{row.title || row.documentType}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-slate-900">{row.customer?.name || '-'}</div>
                    <div className="text-slate-500">{row.customer?.email || '-'}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <div>Issued: {fmtDate(row.issueDate)}</div>
                    <div>{row.documentType === 'QUOTE' ? `Valid until: ${fmtDate(row.validUntil)}` : `Due: ${fmtDate(row.dueDate)}`}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{row.status}</span>
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-slate-900">{money(row.total)}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button onClick={() => downloadPdf(row)} className="btn-secondary inline-flex items-center gap-2 text-xs">
                        <Download className="w-4 h-4" /> PDF
                      </button>
                      <button onClick={() => openSend(row)} className="btn-secondary inline-flex items-center gap-2 text-xs">
                        <Mail className="w-4 h-4" /> Send
                      </button>
                      {row.documentType === 'QUOTE' && row.status !== 'ACCEPTED' && row.status !== 'CANCELLED' && (
                        <button onClick={() => patchStatus(row, 'ACCEPTED')} className="btn-secondary text-xs">Mark Accepted</button>
                      )}
                      {row.documentType === 'INVOICE' && row.status !== 'PAID' && row.status !== 'CANCELLED' && (
                        <button onClick={() => patchStatus(row, 'PAID')} className="btn-secondary text-xs">Mark Paid</button>
                      )}
                      {row.status !== 'CANCELLED' && (
                        <button onClick={() => cancelRecord(row)} className="btn-secondary text-xs text-rose-600">Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 xl:hidden">
          {filteredRows.map((row) => (
            <div key={row._id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{row.documentNumber}</p>
                  <p className="text-sm text-slate-500">{row.title || row.documentType}</p>
                </div>
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{row.status}</span>
              </div>
              <div className="mt-3 text-sm text-slate-600 space-y-1">
                <p>{row.customer?.name || '-'}</p>
                <p>{row.customer?.email || '-'}</p>
                <p>Issued: {fmtDate(row.issueDate)}</p>
                <p>{row.documentType === 'QUOTE' ? `Valid until: ${fmtDate(row.validUntil)}` : `Due: ${fmtDate(row.dueDate)}`}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-semibold text-slate-500">Total</p>
                  <p className="text-lg font-bold text-slate-900">{money(row.total)}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button onClick={() => downloadPdf(row)} className="btn-secondary inline-flex items-center gap-2 text-xs">
                    <Download className="w-4 h-4" /> PDF
                  </button>
                  <button onClick={() => openSend(row)} className="btn-secondary inline-flex items-center gap-2 text-xs">
                    <Mail className="w-4 h-4" /> Send
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && !filteredRows.length && (
          <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center">
            <BadgeDollarSign className="w-12 h-12 mx-auto text-slate-300" />
            <p className="mt-3 text-slate-600">No quotes or invoices match the current filters.</p>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 p-4 overflow-y-auto">
          <div className="mx-auto max-w-4xl rounded-3xl bg-white shadow-2xl">
            <form onSubmit={createRecord} className="p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-display font-bold text-slate-900">Create Quote / Invoice</h2>
                  <p className="text-sm text-slate-500 mt-1">Build a client-facing quote or invoice with PDF export and email delivery.</p>
                </div>
                <button type="button" onClick={() => setShowCreate(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <select value={form.documentType} onChange={(e) => setForm((current) => ({ ...current, documentType: e.target.value as 'QUOTE' | 'INVOICE' }))} className="input">
                  <option value="QUOTE">Quote</option>
                  <option value="INVOICE">Invoice</option>
                </select>
                <select value={form.clientId} onChange={(e) => setForm((current) => ({ ...current, clientId: e.target.value, applicationId: '' }))} className="input" required>
                  <option value="">Select client</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>{getClientLabel(client)}</option>
                  ))}
                </select>
                <select value={form.applicationId} onChange={(e) => setForm((current) => ({ ...current, applicationId: e.target.value }))} className="input">
                  <option value="">Optional linked application</option>
                  {applicationOptions.map((app) => (
                    <option key={app._id} value={app._id}>{app.visaSubclass || 'Matter'} • {app.status || 'Open'}</option>
                  ))}
                </select>
                <input value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} className="input" placeholder="Document title" />
                <input type="date" value={form.issueDate} onChange={(e) => setForm((current) => ({ ...current, issueDate: e.target.value }))} className="input" />
                {form.documentType === 'QUOTE' ? (
                  <input type="date" value={form.validUntil} onChange={(e) => setForm((current) => ({ ...current, validUntil: e.target.value }))} className="input" />
                ) : (
                  <input type="date" value={form.dueDate} onChange={(e) => setForm((current) => ({ ...current, dueDate: e.target.value }))} className="input" />
                )}
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  <input type="checkbox" checked={form.gstEnabled} onChange={(e) => setForm((current) => ({ ...current, gstEnabled: e.target.checked }))} />
                  Apply GST
                </label>
                <input type="number" step="0.01" min="0" value={form.gstRate} onChange={(e) => setForm((current) => ({ ...current, gstRate: Number(e.target.value) }))} className="input" placeholder="GST rate" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Line Items</h3>
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, lineItems: [...current.lineItems, { description: '', quantity: 1, unit: 'fixed', unitPrice: 0 }] }))}
                    className="btn-secondary text-sm"
                  >
                    Add line
                  </button>
                </div>
                <div className="space-y-3">
                  {form.lineItems.map((item, index) => (
                    <div key={`${index}-${item.description}`} className="grid gap-3 md:grid-cols-[minmax(0,2fr)_110px_110px_130px_auto]">
                      <input value={item.description} onChange={(e) => setLineItem(index, { description: e.target.value })} className="input" placeholder="Description" required />
                      <input type="number" step="0.01" min="0" value={item.quantity} onChange={(e) => setLineItem(index, { quantity: Number(e.target.value) })} className="input" placeholder="Qty" />
                      <input value={item.unit} onChange={(e) => setLineItem(index, { unit: e.target.value })} className="input" placeholder="Unit" />
                      <input type="number" step="0.01" min="0" value={item.unitPrice} onChange={(e) => setLineItem(index, { unitPrice: Number(e.target.value) })} className="input" placeholder="Unit price" />
                      <button
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, lineItems: current.lineItems.filter((_, idx) => idx !== index) || [] }))}
                        className="btn-secondary"
                        disabled={form.lineItems.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <textarea value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} className="input min-h-[120px]" placeholder="Notes, payment terms, assumptions or scope" />

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create Document'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {sendFor && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 p-4 overflow-y-auto">
          <div className="mx-auto max-w-2xl rounded-3xl bg-white shadow-2xl p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-display font-bold text-slate-900">Send {sendFor.documentType.toLowerCase()}</h2>
                <p className="text-sm text-slate-500 mt-1">{sendFor.documentNumber} will be attached automatically as a PDF.</p>
              </div>
              <button type="button" onClick={() => setSendFor(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={sendRecord} className="mt-6 space-y-4">
              <input value={sendForm.to} onChange={(e) => setSendForm((current) => ({ ...current, to: e.target.value }))} className="input" placeholder="Recipient email" required />
              <input value={sendForm.subject} onChange={(e) => setSendForm((current) => ({ ...current, subject: e.target.value }))} className="input" placeholder="Subject" required />
              <textarea value={sendForm.text} onChange={(e) => setSendForm((current) => ({ ...current, text: e.target.value }))} className="input min-h-[180px]" placeholder="Email body" required />
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setSendFor(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={sendingId === sendFor._id}>{sendingId === sendFor._id ? 'Sending...' : 'Send Email'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
