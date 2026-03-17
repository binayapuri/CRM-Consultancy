import { useEffect, useMemo, useState } from 'react';
import { authFetch, safeJson } from '../../store/auth';
import { Building2, FileText, Plus, Send, Download, CheckCircle2, X } from 'lucide-react';

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
      const eJson = await safeJson<any>(eRes).catch(async (err) => {
        const msg = (await eRes.clone().text().catch(() => '')) || err?.message;
        throw new Error(msg || 'Failed to load employers');
      });
      const iJson = await safeJson<any>(iRes).catch(async (err) => {
        const msg = (await iRes.clone().text().catch(() => '')) || err?.message;
        throw new Error(msg || 'Failed to load invoices');
      });
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
      const data = await safeJson<any>(res).catch(async (err) => {
        const msg = (await res.clone().text().catch(() => '')) || err?.message;
        throw new Error(msg || 'Failed to save employer');
      });
      if (!res.ok) throw new Error(data?.error || 'Failed to save employer');
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
      const res = await authFetch('/api/student/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await safeJson<any>(res).catch(async (err) => {
        const msg = (await res.clone().text().catch(() => '')) || err?.message;
        throw new Error(msg || 'Failed to create invoice');
      });
      if (!res.ok) throw new Error(data?.error || 'Failed to create invoice');
      setShowInvoiceModal(false);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingInvoice(false);
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
      const data = await safeJson<any>(res).catch(async (err) => {
        const msg = (await res.clone().text().catch(() => '')) || err?.message;
        throw new Error(msg || 'Failed to send invoice');
      });
      if (!res.ok) throw new Error(data?.error || 'Failed to send invoice');
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
          <button onClick={() => setShowEmployerModal(true)} className="px-4 py-2.5 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50">
            <Building2 className="w-4 h-4 inline-block mr-2" />
            Add Employer
          </button>
          <button onClick={openCreateInvoice} className="px-5 py-2.5 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20">
            <Plus className="w-4 h-4 inline-block mr-2" />
            Create Invoice
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-black text-slate-900">Employers</h2>
            <p className="text-xs text-slate-500 mt-1">Companies you invoice</p>
          </div>
          <div className="p-3 space-y-2">
            {employers.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">Add an employer to start invoicing.</div>
            ) : (
              employers.map((e) => (
                <div key={e._id} className="p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition">
                  <p className="font-bold text-slate-900">{e.companyName}</p>
                  <p className="text-xs text-slate-500">{e.email || 'No email'}</p>
                  {e.abn && <p className="text-[10px] font-bold text-slate-400 mt-1">ABN: {e.abn}</p>}
                </div>
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
            <span className="text-xs font-bold text-slate-500">{invoices.length} total</span>
          </div>
          <div className="p-3 space-y-2">
            {invoices.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">No invoices yet. Create your first invoice.</div>
            ) : (
              invoices.map((inv) => {
                const emp = employerMap.get(inv.employerId);
                return (
                  <div key={inv._id} className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition">
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
                        <button onClick={() => downloadPdf(inv)} className="px-3 py-2 rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 text-sm font-bold inline-flex items-center gap-2">
                          <Download className="w-4 h-4" /> PDF
                        </button>
                        <button onClick={() => openSend(inv)} className="px-3 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 text-sm font-black inline-flex items-center gap-2">
                          <Send className="w-4 h-4" /> Send
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Employer modal */}
      {showEmployerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <p className="font-black text-slate-900">Add Employer</p>
              <button onClick={() => setShowEmployerModal(false)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
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
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <p className="font-black text-slate-900">Create Invoice</p>
              <button onClick={() => setShowInvoiceModal(false)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
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
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
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
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <p className="font-black text-slate-900">Send Invoice {sendFor.invoiceNumber}</p>
              <button onClick={() => setSendFor(null)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
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
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setSendFor(null)} className="btn-secondary">Cancel</button>
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

