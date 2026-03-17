import { useEffect, useMemo, useRef, useState } from 'react';
import { authFetch, safeJson } from '../../store/auth';
import { Building2, FileText, Plus, Send, Download, CheckCircle2, X, Filter, Eye, FileDown, BadgeCheck, Ban, Search, MoreVertical, Pencil, Copy, Trash2, Users } from 'lucide-react';

type Employer = {
  _id: string;
  companyName: string;
  abn?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: { street?: string; city?: string; state?: string; postcode?: string; country?: string };
};

type Invoice = {
  _id: string;
  employerId: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED';
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  period?: { from?: string; to?: string };
  gstEnabled?: boolean;
  gstRate?: number;
  subtotal?: number;
  gstAmount?: number;
  total?: number;
  customer?: { name?: string; email?: string };
  supplier?: { name?: string; abn?: string };
  lineItems?: { description: string; quantity: number; unit?: string; unitPrice: number }[];
  notes?: string;
};

function money(n: any) {
  const v = Number(n || 0);
  return v.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
}

function fmtDate(d?: string) {
  if (!d) return '';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('en-AU');
}

export default function InvoicesPage() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Employer modal
  const [showEmployerModal, setShowEmployerModal] = useState(false);
  const [employerForm, setEmployerForm] = useState<any>({ companyName: '', email: '', abn: '', contactName: '', phone: '', address: { street: '', city: '', state: '', postcode: '', country: 'Australia' } });
  const [savingEmployer, setSavingEmployer] = useState(false);

  // Invoice modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState<any>({
    employerId: '',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDays: 14,
    periodFrom: '',
    periodTo: '',
    gstEnabled: false,
    gstRate: 0.1,
    notes: '',
    lineItems: [{ description: 'Contractor services', quantity: 0, unit: 'hours', unitPrice: 0 }],
  });

  // Send modal
  const [sendFor, setSendFor] = useState<Invoice | null>(null);
  const [sendForm, setSendForm] = useState({ to: '', subject: '', text: '' });
  const [sending, setSending] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterEmployerId, setFilterEmployerId] = useState<string>('ALL');
  const [filterFrom, setFilterFrom] = useState<string>('');
  const [filterTo, setFilterTo] = useState<string>('');

  // Detail modal
  const [viewInv, setViewInv] = useState<Invoice | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [tab, setTab] = useState<'OVERVIEW' | 'INVOICES' | 'EMPLOYERS'>('OVERVIEW');
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const searchTimer = useRef<number | null>(null);

  // Employer detail modal
  const [viewEmployer, setViewEmployer] = useState<Employer | null>(null);
  const [editingEmployer, setEditingEmployer] = useState(false);
  const [employerSaving, setEmployerSaving] = useState(false);
  const [employerDeleting, setEmployerDeleting] = useState(false);

  async function parseOrThrow(res: Response, fallbackMessage: string) {
    // Clone BEFORE consuming body so we can read text if JSON parse fails.
    const clone = res.clone();
    try {
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data?.error || fallbackMessage);
      return data;
    } catch (e: any) {
      const text = await clone.text().catch(() => '');
      const msg = text || e?.message || fallbackMessage;
      throw new Error(msg);
    }
  }

  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 180);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [query]);

  const employerMap = useMemo(() => {
    const m = new Map<string, Employer>();
    employers.forEach((e) => m.set(e._id, e));
    return m;
  }, [employers]);

  const refresh = async () => {
    setError(null);
    setLoading(true);
    try {
      const [eRes, iRes] = await Promise.all([authFetch('/api/student/employers'), authFetch('/api/student/invoices')]);
      const eJson = await parseOrThrow(eRes, 'Failed to load employers');
      const iJson = await parseOrThrow(iRes, 'Failed to load invoices');
      setEmployers(Array.isArray(eJson) ? eJson : []);
      setInvoices(Array.isArray(iJson) ? iJson : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load invoice manager');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filteredInvoices = useMemo(() => {
    let rows = invoices.slice();
    if (filterStatus !== 'ALL') rows = rows.filter((i) => i.status === filterStatus);
    if (filterEmployerId !== 'ALL') rows = rows.filter((i) => i.employerId === filterEmployerId);
    if (filterFrom) {
      const from = new Date(filterFrom).getTime();
      rows = rows.filter((i) => new Date(i.issueDate).getTime() >= from);
    }
    if (filterTo) {
      const to = new Date(filterTo).getTime();
      rows = rows.filter((i) => new Date(i.issueDate).getTime() <= to);
    }
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.trim().toLowerCase();
      rows = rows.filter((i) => {
        const emp = employerMap.get(i.employerId);
        const hay = [
          i.invoiceNumber,
          i.status,
          emp?.companyName,
          i.customer?.name,
          i.customer?.email,
          i.supplier?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return rows;
  }, [invoices, filterStatus, filterEmployerId, filterFrom, filterTo, debouncedQuery, employerMap]);

  const filteredEmployers = useMemo(() => {
    if (!debouncedQuery.trim()) return employers;
    const q = debouncedQuery.trim().toLowerCase();
    return employers.filter((e) => {
      const hay = [e.companyName, e.email, e.abn, e.contactName].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [employers, debouncedQuery]);

  const stats = useMemo(() => {
    const rows = filteredInvoices;
    const totalInvoices = rows.length;
    const paid = rows.filter((r) => r.status === 'PAID').reduce((s, r) => s + Number(r.total || 0), 0);
    const outstanding = rows
      .filter((r) => r.status === 'SENT' || r.status === 'DRAFT')
      .reduce((s, r) => s + Number(r.total || 0), 0);
    const cancelled = rows.filter((r) => r.status === 'CANCELLED').length;
    return { totalInvoices, paid, outstanding, cancelled };
  }, [filteredInvoices]);

  const exportAll = async () => {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'ALL') params.set('status', filterStatus);
      if (filterEmployerId !== 'ALL') params.set('employerId', filterEmployerId);
      if (filterFrom) params.set('from', filterFrom);
      if (filterTo) params.set('to', filterTo);
      const res = await authFetch(`/api/student/invoices/export?${params.toString()}`);
      if (!res.ok) throw new Error((await res.text().catch(() => '')) || 'Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-export-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const patchInvoiceStatus = async (inv: Invoice, status: Invoice['status']) => {
    setUpdatingStatus(true);
    setError(null);
    try {
      const res = await authFetch(`/api/student/invoices/${inv._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await safeJson<any>(res).catch(async () => ({ error: await res.text().catch(() => 'Failed') }));
      if (!res.ok) throw new Error(data?.error || 'Update failed');
      setViewInv(data);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const duplicateInvoice = async (inv: Invoice) => {
    setError(null);
    try {
      const res = await authFetch(`/api/student/invoices/${inv._id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDays: 14 }),
      });
      await parseOrThrow(res, 'Failed to duplicate invoice');
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setOpenMenuFor(null);
    }
  };

  const openEditDraft = (inv: Invoice) => {
    const issue = inv.issueDate ? new Date(inv.issueDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const dueDays = inv.dueDate ? Math.max(1, Math.round((new Date(inv.dueDate).getTime() - new Date(inv.issueDate).getTime()) / 86400000)) : 14;
    setInvoiceForm({
      employerId: inv.employerId,
      issueDate: issue,
      dueDays,
      periodFrom: inv.period?.from ? new Date(inv.period.from).toISOString().slice(0, 10) : '',
      periodTo: inv.period?.to ? new Date(inv.period.to).toISOString().slice(0, 10) : '',
      gstEnabled: !!inv.gstEnabled,
      gstRate: typeof inv.gstRate === 'number' ? inv.gstRate : 0.1,
      notes: inv.notes || '',
      lineItems: (inv.lineItems || []).map((li) => ({ ...li })),
      _editId: inv._id,
    });
    setShowInvoiceModal(true);
    setOpenMenuFor(null);
  };

  const totals = useMemo(() => {
    const items = Array.isArray(invoiceForm.lineItems) ? invoiceForm.lineItems : [];
    const subtotal = items.reduce((s: number, li: any) => s + (Number(li.quantity || 0) * Number(li.unitPrice || 0)), 0);
    const gstAmount = invoiceForm.gstEnabled ? subtotal * Number(invoiceForm.gstRate || 0.1) : 0;
    return { subtotal, gstAmount, total: subtotal + gstAmount };
  }, [invoiceForm.lineItems, invoiceForm.gstEnabled, invoiceForm.gstRate]);

  const openCreateInvoice = () => {
    setInvoiceForm((f: any) => ({
      ...f,
      employerId: employers[0]?._id || '',
      issueDate: new Date().toISOString().slice(0, 10),
      dueDays: 14,
      periodFrom: '',
      periodTo: '',
      notes: '',
      gstEnabled: false,
      gstRate: 0.1,
      lineItems: [{ description: 'Contractor services', quantity: 0, unit: 'hours', unitPrice: 0 }],
    }));
    setShowInvoiceModal(true);
  };

  const openCreateInvoiceForEmployer = (employerId: string) => {
    setInvoiceForm((f: any) => ({
      ...f,
      employerId,
      issueDate: new Date().toISOString().slice(0, 10),
      dueDays: 14,
      periodFrom: '',
      periodTo: '',
      notes: '',
      gstEnabled: false,
      gstRate: 0.1,
      lineItems: [{ description: 'Contractor services', quantity: 0, unit: 'hours', unitPrice: 0 }],
      _editId: undefined,
    }));
    setShowInvoiceModal(true);
  };

  const saveEmployer = async () => {
    if (!String(employerForm.companyName || '').trim()) {
      setError('Employer company name is required.');
      return;
    }
    setSavingEmployer(true);
    setError(null);
    try {
      const res = await authFetch('/api/student/employers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employerForm),
      });
      await parseOrThrow(res, 'Failed to save employer');
      setShowEmployerModal(false);
      setEmployerForm({ companyName: '', email: '', abn: '', contactName: '', phone: '', address: { street: '', city: '', state: '', postcode: '', country: 'Australia' } });
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingEmployer(false);
    }
  };

  const saveInvoice = async () => {
    if (!invoiceForm.employerId) {
      setError('Please select an employer.');
      return;
    }
    setSavingInvoice(true);
    setError(null);
    try {
      const dueDate = new Date(invoiceForm.issueDate);
      dueDate.setDate(dueDate.getDate() + Number(invoiceForm.dueDays || 14));
      const payload = {
        employerId: invoiceForm.employerId,
        issueDate: invoiceForm.issueDate,
        dueDate: dueDate.toISOString(),
        gstEnabled: !!invoiceForm.gstEnabled,
        gstRate: Number(invoiceForm.gstRate || 0.1),
        period: invoiceForm.periodFrom || invoiceForm.periodTo ? { from: invoiceForm.periodFrom || null, to: invoiceForm.periodTo || null } : undefined,
        notes: invoiceForm.notes || '',
        lineItems: (invoiceForm.lineItems || []).map((li: any) => ({
          description: li.description,
          quantity: Number(li.quantity || 0),
          unit: li.unit || 'hours',
          unitPrice: Number(li.unitPrice || 0),
        })),
      };
      const isEdit = !!invoiceForm._editId;
      const res = await authFetch(isEdit ? `/api/student/invoices/${invoiceForm._editId}` : '/api/student/invoices', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await parseOrThrow(res, isEdit ? 'Failed to update invoice' : 'Failed to create invoice');
      setShowInvoiceModal(false);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingInvoice(false);
    }
  };

  const openEmployerDetail = (e: Employer) => {
    setViewEmployer(e);
    setEditingEmployer(false);
  };

  const saveEmployerEdits = async () => {
    if (!viewEmployer) return;
    setEmployerSaving(true);
    setError(null);
    try {
      const res = await authFetch(`/api/student/employers/${viewEmployer._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(viewEmployer),
      });
      await parseOrThrow(res, 'Failed to update employer');
      setEditingEmployer(false);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setEmployerSaving(false);
    }
  };

  const deleteEmployer = async () => {
    if (!viewEmployer) return;
    if (!confirm('Delete this employer? (Invoices linked to this employer will prevent deletion)')) return;
    setEmployerDeleting(true);
    setError(null);
    try {
      const res = await authFetch(`/api/student/employers/${viewEmployer._id}`, { method: 'DELETE' });
      await parseOrThrow(res, 'Failed to delete employer');
      setViewEmployer(null);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setEmployerDeleting(false);
    }
  };

  const downloadPdf = async (inv: Invoice) => {
    setError(null);
    try {
      const res = await authFetch(`/api/student/invoices/${inv._id}/pdf`);
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Failed to download PDF');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${inv.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const openSend = (inv: Invoice) => {
    const employer = employerMap.get(inv.employerId);
    const to = employer?.email || inv.customer?.email || '';
    const period =
      inv.period?.from || inv.period?.to
        ? ` (${fmtDate(inv.period?.from)} - ${fmtDate(inv.period?.to)})`
        : '';
    const subject = `${inv.gstEnabled ? 'Tax Invoice' : 'Invoice'} ${inv.invoiceNumber}${period} — ${inv.supplier?.name || 'BIGFEW'}`;
    const text = `Hi${employer?.contactName ? ` ${employer.contactName}` : ''},\n\nPlease find attached ${inv.gstEnabled ? 'Tax Invoice' : 'Invoice'} ${inv.invoiceNumber}${period}.\n\nTotal: ${money(inv.total)}\nDue: ${inv.dueDate ? fmtDate(inv.dueDate) : '—'}\n\nRegards,\n${inv.supplier?.name || ''}`;
    setSendFor(inv);
    setSendForm({ to, subject, text });
  };

  const openMailClient = () => {
    if (!sendFor) return;
    const to = encodeURIComponent(sendForm.to || '');
    const subject = encodeURIComponent(sendForm.subject || '');
    const body = encodeURIComponent(sendForm.text || '');
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_blank');
  };

  const openGmailCompose = () => {
    if (!sendFor) return;
    // Note: Gmail compose links cannot attach files. We prefill message only.
    const to = encodeURIComponent(sendForm.to || '');
    const subject = encodeURIComponent(sendForm.subject || '');
    const body = encodeURIComponent(`${sendForm.text || ''}\n\n(Please attach the PDF you downloaded from the Invoice Manager.)`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`, '_blank', 'noopener,noreferrer');
  };

  const sendInvoice = async () => {
    if (!sendFor) return;
    setSending(true);
    setError(null);
    try {
      const res = await authFetch(`/api/student/invoices/${sendFor._id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sendForm),
      });
      await parseOrThrow(res, 'Failed to send invoice');
      setSendFor(null);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in-up space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-600" /> Invoice Manager
          </h1>
          <p className="text-slate-500 mt-1">Generate Australian invoices for ABN contracting, download as PDF, and send to employers.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowEmployerModal(true)} className="min-h-11 px-4 py-2.5 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Add Employer</span>
          </button>
          <button onClick={exportAll} className="min-h-11 px-4 py-2.5 rounded-xl font-black text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-2">
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={openCreateInvoice} className="min-h-11 px-5 py-2.5 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Invoice</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(['OVERVIEW', 'INVOICES', 'EMPLOYERS'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 rounded-xl text-sm font-black border transition ${
                tab === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t === 'OVERVIEW' ? 'Overview' : t === 'INVOICES' ? 'Invoices' : 'Employers'}
            </button>
          ))}
        </div>
        <div className="w-full lg:w-[420px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search invoices, employers, numbers, emails…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-900">Australian invoice checklist</p>
            <p className="text-xs text-slate-500 mt-1">
              Use your <span className="font-bold">ABN</span> on every invoice. Toggle <span className="font-bold">GST</span> only if you’re GST-registered. Typical payment terms: <span className="font-bold">7/14/30</span> days.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setFilterStatus('ALL'); setFilterEmployerId('ALL'); setFilterFrom(''); setFilterTo(''); }}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm font-black hover:bg-slate-100"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
          {error}
        </div>
      )}

      {tab === 'OVERVIEW' && (
        <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Invoices</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalInvoices}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Paid</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{money(stats.paid)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Outstanding</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{money(stats.outstanding)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Cancelled</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.cancelled}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-black text-slate-900">Employers</h2>
            <p className="text-xs text-slate-500 mt-1">Companies you invoice</p>
          </div>
          <div className="p-3 space-y-2">
            {filteredEmployers.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-emerald-700" />
                </div>
                <p className="mt-3 font-black text-slate-900">Add your first employer</p>
                <p className="mt-1 text-sm text-slate-500">Save employer details once and reuse for future invoices.</p>
                <button onClick={() => setShowEmployerModal(true)} className="mt-4 px-4 py-2.5 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-700">
                  + Add Employer
                </button>
              </div>
            ) : (
              filteredEmployers.map((e) => (
                <button
                  type="button"
                  key={e._id}
                  onClick={() => openEmployerDetail(e)}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition"
                >
                  <p className="font-bold text-slate-900">{e.companyName}</p>
                  <p className="text-xs text-slate-500">{e.email || 'No email'}</p>
                  {e.abn && <p className="text-[10px] font-bold text-slate-400 mt-1">ABN: {e.abn}</p>}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="font-black text-slate-900">Invoices</h2>
              <p className="text-xs text-slate-500 mt-1">Draft, send, and track payments</p>
            </div>
            <span className="text-xs font-bold text-slate-500">{filteredInvoices.length} shown</span>
          </div>
          <div className="px-5 py-3 border-b border-slate-200 bg-white">
            <div className="flex flex-col lg:flex-row lg:items-end gap-3">
              <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider">
                <Filter className="w-4 h-4" /> Filters
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Status
                  <select className="mt-1 w-full input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    {['ALL', 'DRAFT', 'SENT', 'PAID', 'CANCELLED'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Employer
                  <select className="mt-1 w-full input" value={filterEmployerId} onChange={(e) => setFilterEmployerId(e.target.value)}>
                    <option value="ALL">All</option>
                    {employers.map((e) => <option key={e._id} value={e._id}>{e.companyName}</option>)}
                  </select>
                </label>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">From
                  <input type="date" className="mt-1 w-full input" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
                </label>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">To
                  <input type="date" className="mt-1 w-full input" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
                </label>
              </div>
            </div>
          </div>
          <div className="p-3 space-y-2">
            {filteredInvoices.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-slate-700" />
                </div>
                <p className="mt-3 font-black text-slate-900">No invoices found</p>
                <p className="mt-1 text-sm text-slate-500">Create an invoice, or adjust your filters.</p>
                <button onClick={() => (filterEmployerId !== 'ALL' ? openCreateInvoiceForEmployer(filterEmployerId) : openCreateInvoice())} className="mt-4 px-5 py-2.5 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-700">
                  + Create Invoice
                </button>
              </div>
            ) : (
              filteredInvoices.map((inv) => {
                const emp = employerMap.get(inv.employerId);
                return (
                  <div key={inv._id} className="p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/10 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 truncate">{inv.invoiceNumber} · {emp?.companyName || inv.customer?.name || 'Employer'}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Issue {fmtDate(inv.issueDate)}{inv.dueDate ? ` · Due ${fmtDate(inv.dueDate)}` : ''}{inv.period?.from || inv.period?.to ? ` · Period ${fmtDate(inv.period?.from)}–${fmtDate(inv.period?.to)}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                          inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700'
                          : inv.status === 'SENT' ? 'bg-sky-100 text-sky-700'
                          : inv.status === 'CANCELLED' ? 'bg-slate-200 text-slate-600'
                          : 'bg-amber-100 text-amber-700'
                        }`}>{inv.status}</span>
                        <span className="px-2 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">{money(inv.total)}</span>
                        <button onClick={() => setViewInv(inv)} className="px-3 py-2 rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 text-sm font-black inline-flex items-center gap-2">
                          <Eye className="w-4 h-4" /> View
                        </button>
                        <button onClick={() => downloadPdf(inv)} className="px-3 py-2 rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 text-sm font-bold inline-flex items-center gap-2">
                          <Download className="w-4 h-4" /> PDF
                        </button>
                        <button onClick={() => openSend(inv)} className="px-3 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 text-sm font-black inline-flex items-center gap-2">
                          <Send className="w-4 h-4" /> Send
                        </button>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenMenuFor((cur) => (cur === inv._id ? null : inv._id))}
                            className="px-3 py-2 rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 text-sm font-black inline-flex items-center gap-2"
                            title="More actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuFor === inv._id && (
                            <div className="absolute mt-2 w-56 z-20 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden left-0 sm:left-auto sm:right-0">
                              <button className="w-full px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50 inline-flex items-center gap-2" onClick={() => { setViewInv(inv); setOpenMenuFor(null); }}>
                                <Eye className="w-4 h-4" /> View details
                              </button>
                              <button className="w-full px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50 inline-flex items-center gap-2" onClick={() => downloadPdf(inv).finally(() => setOpenMenuFor(null))}>
                                <Download className="w-4 h-4" /> Download PDF
                              </button>
                              <button className="w-full px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50 inline-flex items-center gap-2" onClick={() => duplicateInvoice(inv)}>
                                <Copy className="w-4 h-4" /> Duplicate as draft
                              </button>
                              {inv.status === 'DRAFT' && (
                                <button className="w-full px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50 inline-flex items-center gap-2" onClick={() => openEditDraft(inv)}>
                                  <Pencil className="w-4 h-4" /> Edit draft
                                </button>
                              )}
                              <div className="h-px bg-slate-200" />
                              <button className="w-full px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50 inline-flex items-center gap-2 text-slate-700" onClick={() => patchInvoiceStatus(inv, 'CANCELLED').finally(() => setOpenMenuFor(null))}>
                                <Ban className="w-4 h-4" /> Cancel invoice
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      )}

      {tab === 'INVOICES' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="font-black text-slate-900">All invoices</h2>
              <p className="text-xs text-slate-500 mt-1">Search, filter, view, export, and manage statuses</p>
            </div>
            <span className="text-xs font-bold text-slate-500">{filteredInvoices.length} shown</span>
          </div>
          <div className="p-5">
            {/* Reuse the same list section by showing Overview list */}
            <div className="space-y-2">
              {filteredInvoices.map((inv) => {
                const emp = employerMap.get(inv.employerId);
                return (
                  <button
                    key={inv._id}
                    type="button"
                    onClick={() => setViewInv(inv)}
                    className="w-full text-left p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/10 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 truncate">{inv.invoiceNumber} · {emp?.companyName || inv.customer?.name || 'Employer'}</p>
                        <p className="text-xs text-slate-500 mt-1">Issue {fmtDate(inv.issueDate)} · Total {money(inv.total)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                        inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700'
                        : inv.status === 'SENT' ? 'bg-sky-100 text-sky-700'
                        : inv.status === 'CANCELLED' ? 'bg-slate-200 text-slate-600'
                        : 'bg-amber-100 text-amber-700'
                      }`}>{inv.status}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'EMPLOYERS' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="font-black text-slate-900">All employers</h2>
              <p className="text-xs text-slate-500 mt-1">Click an employer to manage and view invoices</p>
            </div>
            <span className="text-xs font-bold text-slate-500">{filteredEmployers.length} shown</span>
          </div>
          <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredEmployers.map((e) => (
              <button
                key={e._id}
                type="button"
                onClick={() => openEmployerDetail(e)}
                className="text-left p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/10 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 truncate">{e.companyName}</p>
                    <p className="text-xs text-slate-500 truncate">{e.email || 'No email'}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Invoice detail modal */}
      {viewInv && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
            <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-black text-slate-900 truncate">{viewInv.invoiceNumber}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {viewInv.customer?.name || employerMap.get(viewInv.employerId)?.companyName || 'Employer'} · Issue {fmtDate(viewInv.issueDate)}{viewInv.dueDate ? ` · Due ${fmtDate(viewInv.dueDate)}` : ''}
                </p>
              </div>
              <button onClick={() => setViewInv(null)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                  viewInv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700'
                  : viewInv.status === 'SENT' ? 'bg-sky-100 text-sky-700'
                  : viewInv.status === 'CANCELLED' ? 'bg-slate-200 text-slate-600'
                  : 'bg-amber-100 text-amber-700'
                }`}>{viewInv.status}</span>
                <span className="px-2 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">{money(viewInv.total)}</span>
                <span className="px-2 py-1 rounded-full text-[10px] font-black bg-white border border-slate-200 text-slate-700">
                  {viewInv.gstEnabled ? 'Tax Invoice (GST)' : 'Invoice (No GST)'}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Supplier</p>
                  <p className="font-black text-slate-900 mt-1">{viewInv.supplier?.name || '—'}</p>
                  {viewInv.supplier?.abn && <p className="text-xs text-slate-500 mt-1">ABN: {viewInv.supplier?.abn}</p>}
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Customer</p>
                  <p className="font-black text-slate-900 mt-1">{viewInv.customer?.name || employerMap.get(viewInv.employerId)?.companyName || '—'}</p>
                  {viewInv.customer?.email && <p className="text-xs text-slate-500 mt-1">{viewInv.customer?.email}</p>}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <p className="font-black text-slate-900 text-sm">Line items</p>
                </div>
                <div className="p-4 space-y-2">
                  {(viewInv.lineItems || []).map((li: any, idx: number) => (
                    <div key={idx} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{li.description}</p>
                        <p className="text-xs text-slate-500">{li.quantity} {li.unit || 'hours'} × {money(li.unitPrice)}</p>
                      </div>
                      <div className="font-black text-slate-900">{money(Number(li.quantity || 0) * Number(li.unitPrice || 0))}</div>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-slate-200 flex justify-end gap-6 text-sm font-black">
                    <div className="text-right">
                      <p className="text-slate-500">Subtotal</p>
                      <p className="text-slate-900">{money(viewInv.subtotal)}</p>
                    </div>
                    {viewInv.gstEnabled && (
                      <div className="text-right">
                        <p className="text-slate-500">GST</p>
                        <p className="text-slate-900">{money(viewInv.gstAmount)}</p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-slate-500">Total</p>
                      <p className="text-emerald-700">{money(viewInv.total)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex flex-wrap justify-between gap-2 bg-white sticky bottom-0">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => downloadPdf(viewInv)} className="btn-secondary inline-flex items-center gap-2">
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button onClick={() => openSend(viewInv)} className="btn-primary inline-flex items-center gap-2">
                  <Send className="w-4 h-4" /> Send
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button disabled={updatingStatus || viewInv.status === 'SENT' || viewInv.status === 'PAID' || viewInv.status === 'CANCELLED'} onClick={() => patchInvoiceStatus(viewInv, 'SENT')} className="px-4 py-2.5 rounded-lg bg-sky-600 text-white font-black hover:bg-sky-700 disabled:opacity-50 inline-flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4" /> Mark Sent
                </button>
                <button disabled={updatingStatus || viewInv.status !== 'SENT'} onClick={() => patchInvoiceStatus(viewInv, 'PAID')} className="px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-black hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Mark Paid
                </button>
                <button disabled={updatingStatus || viewInv.status === 'CANCELLED'} onClick={() => patchInvoiceStatus(viewInv, 'CANCELLED')} className="px-4 py-2.5 rounded-lg bg-slate-700 text-white font-black hover:bg-slate-800 disabled:opacity-50 inline-flex items-center gap-2">
                  <Ban className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employer detail modal */}
      {viewEmployer && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
            <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-black text-slate-900 truncate">{viewEmployer.companyName}</p>
                <p className="text-xs text-slate-500 mt-1">{viewEmployer.email || 'No email'}{viewEmployer.abn ? ` · ABN ${viewEmployer.abn}` : ''}</p>
              </div>
              <button onClick={() => setViewEmployer(null)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { setFilterEmployerId(viewEmployer._id); setTab('INVOICES'); setViewEmployer(null); }}
                  className="px-4 py-2.5 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  View invoices for this employer
                </button>
                <button
                  type="button"
                  onClick={() => { setViewEmployer(null); openCreateInvoiceForEmployer(viewEmployer._id); }}
                  className="px-4 py-2.5 rounded-xl font-black text-slate-700 bg-white border border-slate-200 hover:bg-slate-50"
                >
                  Create invoice
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingEmployer((v) => !v); }}
                  className="px-4 py-2.5 rounded-xl font-black text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" /> {editingEmployer ? 'Stop editing' : 'Edit'}
                </button>
                <button
                  type="button"
                  onClick={deleteEmployer}
                  disabled={employerDeleting}
                  className="px-4 py-2.5 rounded-xl font-black text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> {employerDeleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Contact Name
                  <input disabled={!editingEmployer} className="mt-1 w-full input disabled:bg-slate-50" value={viewEmployer.contactName || ''} onChange={(e) => setViewEmployer((cur) => cur ? ({ ...cur, contactName: e.target.value }) : cur)} />
                </label>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Email
                  <input disabled={!editingEmployer} className="mt-1 w-full input disabled:bg-slate-50" value={viewEmployer.email || ''} onChange={(e) => setViewEmployer((cur) => cur ? ({ ...cur, email: e.target.value }) : cur)} />
                </label>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Phone
                  <input disabled={!editingEmployer} className="mt-1 w-full input disabled:bg-slate-50" value={viewEmployer.phone || ''} onChange={(e) => setViewEmployer((cur) => cur ? ({ ...cur, phone: e.target.value }) : cur)} />
                </label>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">ABN
                  <input disabled={!editingEmployer} className="mt-1 w-full input disabled:bg-slate-50" value={viewEmployer.abn || ''} onChange={(e) => setViewEmployer((cur) => cur ? ({ ...cur, abn: e.target.value }) : cur)} />
                </label>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2 bg-white sticky bottom-0">
              <button onClick={() => setViewEmployer(null)} className="btn-secondary">Close</button>
              <button onClick={saveEmployerEdits} disabled={!editingEmployer || employerSaving} className="btn-primary inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {employerSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employer modal */}
      {showEmployerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <p className="font-black text-slate-900">Add Employer</p>
              <button onClick={() => setShowEmployerModal(false)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Company Name
                <input className="mt-1 w-full input" value={employerForm.companyName} onChange={e => setEmployerForm((f: any) => ({ ...f, companyName: e.target.value }))} />
              </label>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Email
                <input className="mt-1 w-full input" value={employerForm.email} onChange={e => setEmployerForm((f: any) => ({ ...f, email: e.target.value }))} />
              </label>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">ABN (optional)
                <input className="mt-1 w-full input" value={employerForm.abn} onChange={e => setEmployerForm((f: any) => ({ ...f, abn: e.target.value }))} />
              </label>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Contact Name
                <input className="mt-1 w-full input" value={employerForm.contactName} onChange={e => setEmployerForm((f: any) => ({ ...f, contactName: e.target.value }))} />
              </label>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Phone
                <input className="mt-1 w-full input" value={employerForm.phone} onChange={e => setEmployerForm((f: any) => ({ ...f, phone: e.target.value }))} />
              </label>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Street
                <input className="mt-1 w-full input" value={employerForm.address.street} onChange={e => setEmployerForm((f: any) => ({ ...f, address: { ...f.address, street: e.target.value } }))} />
              </label>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">City
                <input className="mt-1 w-full input" value={employerForm.address.city} onChange={e => setEmployerForm((f: any) => ({ ...f, address: { ...f.address, city: e.target.value } }))} />
              </label>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">State
                <input className="mt-1 w-full input" value={employerForm.address.state} onChange={e => setEmployerForm((f: any) => ({ ...f, address: { ...f.address, state: e.target.value } }))} />
              </label>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Postcode
                <input className="mt-1 w-full input" value={employerForm.address.postcode} onChange={e => setEmployerForm((f: any) => ({ ...f, address: { ...f.address, postcode: e.target.value } }))} />
              </label>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Country
                <input className="mt-1 w-full input" value={employerForm.address.country} onChange={e => setEmployerForm((f: any) => ({ ...f, address: { ...f.address, country: e.target.value } }))} />
              </label>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2 bg-white sticky bottom-0">
              <button onClick={() => setShowEmployerModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={saveEmployer} disabled={savingEmployer} className="btn-primary inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {savingEmployer ? 'Saving...' : 'Save Employer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <p className="font-black text-slate-900">Create Invoice</p>
              <button onClick={() => setShowInvoiceModal(false)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Employer
                  <select className="mt-1 w-full input" value={invoiceForm.employerId} onChange={e => setInvoiceForm((f: any) => ({ ...f, employerId: e.target.value }))}>
                    <option value="">Select employer</option>
                    {employers.map((e) => <option key={e._id} value={e._id}>{e.companyName}</option>)}
                  </select>
                </label>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Issue Date
                  <input type="date" className="mt-1 w-full input" value={invoiceForm.issueDate} onChange={e => setInvoiceForm((f: any) => ({ ...f, issueDate: e.target.value }))} />
                </label>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Due (days)
                  <select className="mt-1 w-full input" value={invoiceForm.dueDays} onChange={e => setInvoiceForm((f: any) => ({ ...f, dueDays: Number(e.target.value) }))}>
                    {[7, 14, 21, 30].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Work Period From (optional)
                  <input type="date" className="mt-1 w-full input" value={invoiceForm.periodFrom} onChange={e => setInvoiceForm((f: any) => ({ ...f, periodFrom: e.target.value }))} />
                </label>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Work Period To (optional)
                  <input type="date" className="mt-1 w-full input" value={invoiceForm.periodTo} onChange={e => setInvoiceForm((f: any) => ({ ...f, periodTo: e.target.value }))} />
                </label>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <input type="checkbox" checked={!!invoiceForm.gstEnabled} onChange={e => setInvoiceForm((f: any) => ({ ...f, gstEnabled: e.target.checked }))} />
                  GST registered (Tax Invoice)
                </label>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <p className="font-black text-slate-900 text-sm">Line items</p>
                  <button
                    type="button"
                    onClick={() => setInvoiceForm((f: any) => ({ ...f, lineItems: [...(f.lineItems || []), { description: 'Contractor services', quantity: 0, unit: 'hours', unitPrice: 0 }] }))}
                    className="text-sm font-black text-emerald-700 hover:text-emerald-800"
                  >
                    + Add another
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  {(invoiceForm.lineItems || []).map((li: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                      <label className="sm:col-span-6 text-[10px] font-black text-slate-500 uppercase tracking-wider">Description
                        <input className="mt-1 w-full input" value={li.description} onChange={e => setInvoiceForm((f: any) => {
                          const arr = [...(f.lineItems || [])];
                          arr[idx] = { ...arr[idx], description: e.target.value };
                          return { ...f, lineItems: arr };
                        })} />
                      </label>
                      <label className="sm:col-span-2 text-[10px] font-black text-slate-500 uppercase tracking-wider">Qty
                        <input type="number" className="mt-1 w-full input" value={li.quantity} onChange={e => setInvoiceForm((f: any) => {
                          const arr = [...(f.lineItems || [])];
                          arr[idx] = { ...arr[idx], quantity: Number(e.target.value) };
                          return { ...f, lineItems: arr };
                        })} />
                      </label>
                      <label className="sm:col-span-2 text-[10px] font-black text-slate-500 uppercase tracking-wider">Unit Price
                        <input type="number" className="mt-1 w-full input" value={li.unitPrice} onChange={e => setInvoiceForm((f: any) => {
                          const arr = [...(f.lineItems || [])];
                          arr[idx] = { ...arr[idx], unitPrice: Number(e.target.value) };
                          return { ...f, lineItems: arr };
                        })} />
                      </label>
                      <div className="sm:col-span-2 text-sm font-black text-slate-900 text-right">
                        {money(Number(li.quantity || 0) * Number(li.unitPrice || 0))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Notes (optional)
                <textarea className="mt-1 w-full input" rows={3} value={invoiceForm.notes} onChange={e => setInvoiceForm((f: any) => ({ ...f, notes: e.target.value }))} />
              </label>

              <div className="flex justify-end gap-6 text-sm font-black">
                <div className="text-right">
                  <p className="text-slate-500">Subtotal</p>
                  <p className="text-slate-900">{money(totals.subtotal)}</p>
                </div>
                {invoiceForm.gstEnabled && (
                  <div className="text-right">
                    <p className="text-slate-500">GST (10%)</p>
                    <p className="text-slate-900">{money(totals.gstAmount)}</p>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-slate-500">Total</p>
                  <p className="text-emerald-700">{money(totals.total)}</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2 bg-white sticky bottom-0">
              <button onClick={() => setShowInvoiceModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={saveInvoice} disabled={savingInvoice} className="btn-primary inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {savingInvoice ? 'Saving...' : 'Save Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send modal */}
      {sendFor && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <p className="font-black text-slate-900">Send Invoice {sendFor.invoiceNumber}</p>
              <button onClick={() => setSendFor(null)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">To
                <input className="mt-1 w-full input" value={sendForm.to} onChange={e => setSendForm(f => ({ ...f, to: e.target.value }))} />
              </label>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Subject
                <input className="mt-1 w-full input" value={sendForm.subject} onChange={e => setSendForm(f => ({ ...f, subject: e.target.value }))} />
              </label>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Message
                <textarea className="mt-1 w-full input" rows={6} value={sendForm.text} onChange={e => setSendForm(f => ({ ...f, text: e.target.value }))} />
              </label>
              <p className="text-xs text-slate-500">This uses your platform SMTP settings (Super Admin → Settings). The PDF will be attached automatically.</p>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2 bg-white sticky bottom-0">
              <button onClick={() => setSendFor(null)} className="btn-secondary">Cancel</button>
              <button onClick={openMailClient} className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-black hover:bg-slate-50">
                Open Mail
              </button>
              <button onClick={openGmailCompose} className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-black hover:bg-slate-50">
                Open Gmail
              </button>
              <button onClick={sendInvoice} disabled={sending} className="btn-primary inline-flex items-center gap-2">
                <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

