import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bell, Shield, Save, Building2, FileSignature, CreditCard, Upload, Users, ChevronDown, ChevronUp, Mail, Plus, X, FileText } from 'lucide-react';

const SettingsBlock = ({ title, icon: Icon, desc, children, empty, sample }: { title: string; icon: any; desc: string; children: React.ReactNode; empty?: boolean; sample?: React.ReactNode }) => (
  <div className="card">
    <h2 className="font-display font-semibold text-slate-900 mb-2 flex items-center gap-2"><Icon className="w-5 h-5 text-ori-600" /> {title}</h2>
    <p className="text-slate-600 text-sm mb-4">{desc}</p>
    {empty && sample ? <div className="p-4 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-slate-500 text-sm">{sample}</div> : children}
  </div>
);
import { authFetch, safeJson } from '../../store/auth';
import { useAuthStore } from '../../store/auth';
import { resolveFileUrl } from '../../lib/imageUrl';

const DEFAULT_ROLE_PERMISSIONS = [
  { role: 'CONSULTANCY_ADMIN', permissions: { clients: { view: true, create: true, edit: true, delete: true }, applications: { view: true, create: true, edit: true, delete: true }, tasks: { view: true, create: true, edit: true, delete: true }, kanban: { view: true, edit: true }, leads: { view: true, create: true, edit: true, delete: true }, documents: { view: true, upload: true, delete: true }, trustLedger: { view: true, edit: true }, billing: { view: true, create: true, edit: true, delete: true }, employees: { view: true, manage: true }, traceHistory: { view: true }, settings: { view: true, edit: true }, colleges: { view: true, manage: true }, oshc: { view: true, manage: true }, sponsors: { view: true, create: true, edit: true, delete: true }, sendDocuments: true, sendAdvice: true } },
  { role: 'AGENT', permissions: { clients: { view: true, create: true, edit: true, delete: false }, applications: { view: true, create: true, edit: true, delete: false }, tasks: { view: true, create: true, edit: true, delete: false }, kanban: { view: true, edit: true }, leads: { view: true, create: true, edit: true, delete: false }, documents: { view: true, upload: true, delete: false }, trustLedger: { view: false, edit: false }, billing: { view: true, create: true, edit: true, delete: false }, employees: { view: true, manage: false }, traceHistory: { view: false }, settings: { view: false, edit: false }, colleges: { view: true, manage: false }, oshc: { view: true, manage: false }, sponsors: { view: true, create: true, edit: true, delete: false }, sendDocuments: true, sendAdvice: true } },
  { role: 'SUPPORT', permissions: { clients: { view: true, create: false, edit: true, delete: false }, applications: { view: true, create: false, edit: true, delete: false }, tasks: { view: true, create: true, edit: true, delete: false }, kanban: { view: true, edit: true }, leads: { view: true, create: true, edit: true, delete: false }, documents: { view: true, upload: true, delete: false }, trustLedger: { view: false, edit: false }, billing: { view: true, create: false, edit: false, delete: false }, employees: { view: false, manage: false }, traceHistory: { view: false }, settings: { view: false, edit: false }, colleges: { view: true, manage: false }, oshc: { view: true, manage: false }, sponsors: { view: true, create: false, edit: true, delete: false }, sendDocuments: true, sendAdvice: false } },
];

export default function ConsultancySettings() {
  const [searchParams] = useSearchParams();
  const viewConsultancyId = searchParams.get('consultancyId');
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'CONSULTANCY_ADMIN' || user?.role === 'SUPER_ADMIN';
  const effectiveConsultancyId = user?.role === 'SUPER_ADMIN' && viewConsultancyId ? viewConsultancyId : null;
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyTasks, setNotifyTasks] = useState(true);
  const [notifyDocuments, setNotifyDocuments] = useState(true);
  const [_, setConsultancy] = useState<any>(null);
  const [rolePermsExpanded, setRolePermsExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    displayName: '',
    form956Details: { agentName: '', marnNumber: '', companyName: '', address: '', phone: '', email: '', signatureUrl: '', consumerGuideUrl: '' },
    bankDetails: { accountName: '', bank: '', bsb: '', accountNumber: '' },
    initialAdviceTemplate: {
      subject: '',
      body: '',
      sponsorship482Body: '',
      feeBlocks: [] as { label: string; amount: string; description: string }[],
      governmentFeeBlocks: [] as { label: string; amount: string; description: string; payer?: string }[],
      checklistItems: [] as string[],
    },
    rolePermissions: [] as any[],
    emailProfiles: [] as { _id?: string; name: string; host: string; port: number; secure: boolean; user: string; pass: string; from: string; isDefault: boolean; active: boolean }[],
  });
  const [saving, setSaving] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [uploadingCg, setUploadingCg] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem('orivisa-settings');
      if (s) {
        const parsed = JSON.parse(s);
        setNotifyEmail(parsed.notifyEmail ?? true);
        setNotifyTasks(parsed.notifyTasks ?? true);
        setNotifyDocuments(parsed.notifyDocuments ?? true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (isAdmin) {
      const url = effectiveConsultancyId ? `/api/consultancies/me?consultancyId=${effectiveConsultancyId}` : '/api/consultancies/me';
      authFetch(url).then(r => safeJson<any>(r)).then(c => {
        setConsultancy(c);
        setForm({
          displayName: c?.displayName || c?.name || '',
          form956Details: {
            agentName: c?.form956Details?.agentName || '',
            marnNumber: c?.form956Details?.marnNumber || '',
            companyName: c?.form956Details?.companyName || '',
            address: c?.form956Details?.address || '',
            phone: c?.form956Details?.phone || '',
            email: c?.form956Details?.email || '',
            signatureUrl: c?.form956Details?.signatureUrl || '',
            consumerGuideUrl: c?.form956Details?.consumerGuideUrl || '',
          },
          bankDetails: {
            accountName: c?.bankDetails?.accountName || '',
            bank: c?.bankDetails?.bank || '',
            bsb: c?.bankDetails?.bsb || '',
            accountNumber: c?.bankDetails?.accountNumber || '',
          },
          initialAdviceTemplate: {
            subject: c?.initialAdviceTemplate?.subject || 'Initial Advice & Fee Estimation',
            body: c?.initialAdviceTemplate?.body || '',
            sponsorship482Body: c?.initialAdviceTemplate?.sponsorship482Body || '',
            feeBlocks: c?.initialAdviceTemplate?.feeBlocks?.length ? c.initialAdviceTemplate.feeBlocks : [],
            governmentFeeBlocks: c?.initialAdviceTemplate?.governmentFeeBlocks?.length ? c.initialAdviceTemplate.governmentFeeBlocks : [],
            checklistItems: c?.initialAdviceTemplate?.checklistItems?.length ? c.initialAdviceTemplate.checklistItems : [],
          },
          rolePermissions: c?.rolePermissions?.length ? c.rolePermissions : DEFAULT_ROLE_PERMISSIONS,
          emailProfiles: (c?.emailProfiles || []).map((ep: any) => ({ ...ep, pass: ep.pass ? '••••••••' : '' })),
        });
      }).catch(() => {});
    }
  }, [isAdmin, effectiveConsultancyId]);

  const handleSaveSignature = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;
    setUploadingSig(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await authFetch('/api/consultancies/me/signature', { method: 'POST', body: fd });
      const data = await safeJson(res);
      if (!res.ok) throw new Error((data as any).error);
      setForm(f => ({ ...f, form956Details: { ...f.form956Details, signatureUrl: (data as any).signatureUrl } }));
      alert('Signature uploaded');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUploadingSig(false);
      e.target.value = '';
    }
  };

  const handleUploadConsumerGuide = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;
    setUploadingCg(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await authFetch('/api/consultancies/me/consumer-guide', { method: 'POST', body: fd });
      const data = await safeJson(res);
      if (!res.ok) throw new Error((data as any).error);
      setForm(f => ({ ...f, form956Details: { ...f.form956Details, consumerGuideUrl: (data as any).consumerGuideUrl } }));
      alert('Consumer Guide uploaded');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUploadingCg(false);
      e.target.value = '';
    }
  };

  const addFeeBlock = () => setForm(f => ({ ...f, initialAdviceTemplate: { ...f.initialAdviceTemplate, feeBlocks: [...(f.initialAdviceTemplate.feeBlocks || []), { label: '', amount: '', description: '' }] } }));
  const removeFeeBlock = (i: number) => setForm(f => ({ ...f, initialAdviceTemplate: { ...f.initialAdviceTemplate, feeBlocks: (f.initialAdviceTemplate.feeBlocks || []).filter((_, j) => j !== i) } }));
  const updateFeeBlock = (i: number, field: string, val: string) => setForm(f => {
    const blocks = [...(f.initialAdviceTemplate.feeBlocks || [])];
    blocks[i] = { ...blocks[i], [field]: val };
    return { ...f, initialAdviceTemplate: { ...f.initialAdviceTemplate, feeBlocks: blocks } };
  });
  const addGovFeeBlock = () => setForm(f => ({ ...f, initialAdviceTemplate: { ...f.initialAdviceTemplate, governmentFeeBlocks: [...(f.initialAdviceTemplate.governmentFeeBlocks || []), { label: '', amount: '', description: '', payer: '' }] } }));
  const removeGovFeeBlock = (i: number) => setForm(f => ({ ...f, initialAdviceTemplate: { ...f.initialAdviceTemplate, governmentFeeBlocks: (f.initialAdviceTemplate.governmentFeeBlocks || []).filter((_, j) => j !== i) } }));
  const updateGovFeeBlock = (i: number, field: string, val: string) => setForm(f => {
    const blocks = [...(f.initialAdviceTemplate.governmentFeeBlocks || [])];
    blocks[i] = { ...blocks[i], [field]: val };
    return { ...f, initialAdviceTemplate: { ...f.initialAdviceTemplate, governmentFeeBlocks: blocks } };
  });
  const addChecklistItem = () => setForm(f => ({ ...f, initialAdviceTemplate: { ...f.initialAdviceTemplate, checklistItems: [...(f.initialAdviceTemplate.checklistItems || []), ''] } }));
  const updateChecklistItem = (i: number, val: string) => setForm(f => {
    const items = [...(f.initialAdviceTemplate.checklistItems || [])];
    items[i] = val;
    return { ...f, initialAdviceTemplate: { ...f.initialAdviceTemplate, checklistItems: items } };
  });
  const removeChecklistItem = (i: number) => setForm(f => ({ ...f, initialAdviceTemplate: { ...f.initialAdviceTemplate, checklistItems: (f.initialAdviceTemplate.checklistItems || []).filter((_, j) => j !== i) } }));

  const handleSave = () => {
    try {
      localStorage.setItem('orivisa-settings', JSON.stringify({ notifyEmail, notifyTasks, notifyDocuments }));
      alert('Notification settings saved');
    } catch {}
  };

  const handleSaveConsultancy = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        displayName: form.displayName || undefined,
        form956Details: form.form956Details,
        bankDetails: form.bankDetails,
        initialAdviceTemplate: form.initialAdviceTemplate,
        rolePermissions: form.rolePermissions?.length ? form.rolePermissions : undefined,
        emailProfiles: form.emailProfiles?.length ? form.emailProfiles.map(ep => {
          const { pass, ...rest } = ep;
          const out: any = { ...rest, port: ep.port || 587 };
          if (pass && pass !== '••••••••') out.pass = pass;
          return out;
        }).filter((ep: any) => ep.name && ep.host && ep.user) : undefined,
      };
      if (effectiveConsultancyId) payload.consultancyId = effectiveConsultancyId;
      const res = await authFetch('/api/consultancies/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error((data as any).error);
      setConsultancy(data);
      alert('Consultancy settings saved');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900">Settings</h1>
      <p className="text-slate-500 mt-1">Manage your CRM preferences</p>

      <div className="mt-6 space-y-6 max-w-2xl">
        {isAdmin && (
          <SettingsBlock title="Consultancy Branding" icon={Building2} desc="This name appears in the sidebar header. Leave blank to use the default consultancy name.">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Display Name (in header)</label>
              <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} className="input" placeholder="e.g. ORIVISA Migration" />
            </div>
          </SettingsBlock>
        )}

        {isAdmin && (
          <SettingsBlock title="Form 956 & Document Details" icon={FileSignature} desc="Used to pre-fill the official Home Affairs Form 956 PDF and to send compliant Initial Advice / MIA communication.">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Agent Signature (for Form 956 & MIA)</label>
                <div className="flex items-center gap-4">
                  {form.form956Details.signatureUrl ? (
                    <img src={resolveFileUrl(form.form956Details.signatureUrl)} alt="Signature" className="h-12 object-contain border rounded" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <div className="w-24 h-12 rounded border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs">No signature</div>
                  )}
                  <label className="btn-secondary cursor-pointer flex items-center gap-2"><Upload className="w-4 h-4" /> {uploadingSig ? 'Uploading...' : 'Upload'}<input type="file" accept="image/*,.pdf" className="hidden" onChange={handleSaveSignature} disabled={uploadingSig} /></label>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Agent Name</label><input value={form.form956Details.agentName} onChange={e => setForm(f => ({ ...f, form956Details: { ...f.form956Details, agentName: e.target.value } }))} className="input" placeholder="Registered migration agent" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">MARN Number</label><input value={form.form956Details.marnNumber} onChange={e => setForm(f => ({ ...f, form956Details: { ...f.form956Details, marnNumber: e.target.value } }))} className="input" placeholder="e.g. 1234567" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label><input value={form.form956Details.companyName} onChange={e => setForm(f => ({ ...f, form956Details: { ...f.form956Details, companyName: e.target.value } }))} className="input" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Address</label><input value={form.form956Details.address} onChange={e => setForm(f => ({ ...f, form956Details: { ...f.form956Details, address: e.target.value } }))} className="input" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input value={form.form956Details.phone} onChange={e => setForm(f => ({ ...f, form956Details: { ...f.form956Details, phone: e.target.value } }))} className="input" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" value={form.form956Details.email} onChange={e => setForm(f => ({ ...f, form956Details: { ...f.form956Details, email: e.target.value } }))} className="input" /></div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Consumer Guide PDF (attached to Form 956 & Initial Advice emails)</label>
                <div className="flex items-center gap-4">
                  {form.form956Details.consumerGuideUrl ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium">
                      <FileText className="w-4 h-4" /> Custom Consumer Guide uploaded
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500">
                      <FileText className="w-4 h-4" /> Using default guide (or none)
                    </div>
                  )}
                  <label className="btn-secondary cursor-pointer flex items-center gap-2"><Upload className="w-4 h-4" /> {uploadingCg ? 'Uploading...' : 'Upload PDF'}<input type="file" accept="application/pdf" className="hidden" onChange={handleUploadConsumerGuide} disabled={uploadingCg} /></label>
                </div>
                <p className="text-xs text-slate-400 mt-1">The PDF will be auto-attached when sending Initial Advice and Form 956 emails.</p>
              </div>
            </div>
          </SettingsBlock>
        )}

        {isAdmin && (
          <SettingsBlock title="Initial Advice Template" icon={FileText} desc="Default template for initial advice and fee estimation emails. Customize per client when sending.">
            <button type="button" onClick={async () => {
              try {
                const t = await authFetch('/api/constants/email-templates').then(r => safeJson(r)) as any;
                if (t?.initialAdvice) {
                  setForm(f => ({
                    ...f,
                    initialAdviceTemplate: {
                      subject: t.initialAdvice.subject || f.initialAdviceTemplate.subject,
                      body: t.initialAdvice.bodyIntro || f.initialAdviceTemplate.body,
                      sponsorship482Body: f.initialAdviceTemplate.sponsorship482Body,
                      feeBlocks: t.initialAdvice.defaultFeeBlocks?.length ? t.initialAdvice.defaultFeeBlocks : f.initialAdviceTemplate.feeBlocks,
                      governmentFeeBlocks: f.initialAdviceTemplate.governmentFeeBlocks,
                      checklistItems: f.initialAdviceTemplate.checklistItems,
                    },
                  }));
                  alert('Loaded research-based default templates');
                }
              } catch { alert('Could not load templates'); }
            }} className="btn-secondary text-sm mb-4">Load default templates (MARA-compliant)</button>
            <button type="button" onClick={() => setForm(f => ({
              ...f,
              initialAdviceTemplate: {
                ...f.initialAdviceTemplate,
                subject: 'Sponsorship of {{occupation}} for Subclass 482 Visa – {{companyName}}',
                sponsorship482Body: `Dear Management Team,\n\nI hope this email finds you well.\n\nThank you for contacting us regarding the Subclass 482 application for {{clientName}}. We understand that the Standard Business Sponsorship (SBS) for {{companyName}} has already been {{sbsStatus}}.\n\nTo proceed with the next stages, could you please supply the Sponsorship Approval notice and copies of your job advertisements with receipts?\n\nPlease note that you must provide at least two different advertisements from different platforms, and they must not be older than four months to comply with Labour Market Testing requirements.\n\nAs a Registered Migration Agent, I am required by law to provide you with the attached Consumer Guide. Please reply to this email with: \"Copy of consumer guide received.\"\n\nThe 482 Visa Process\nStep 2: Nomination - The employer nominates the position ({{occupation}}, ANZSCO {{anzscoCode}}) and demonstrates a genuine need and lack of local candidates.\nStep 3: Visa Application - The nominee must meet health, character, English proficiency, and skills/experience requirements.`,
                governmentFeeBlocks: [
                  { label: 'Application fee for Nomination', amount: '$330', description: 'Paid by Employer', payer: 'Employer' },
                  { label: 'Skilling Australians Fund (SAF)', amount: '$2,400 or $3,600', description: '2-year visa depending on turnover', payer: 'Employer' },
                  { label: 'Visa Application (Main Applicant)', amount: '$3,210', description: 'Paid by Employer or Applicant', payer: 'Employer or Applicant' },
                ],
                checklistItems: [
                  'Copy of your Standard Business Sponsorship (SBS) Approval',
                  'LMT evidence: 2 advertisements and payment receipts',
                  'Company tax returns and financial statements for the last 2 years',
                  'Business Activity Statements (BAS) for the last 2 years',
                  'Organizational chart displaying the kitchen hierarchy',
                  'Payroll information for all current employees',
                ],
              },
            }))} className="btn-secondary text-sm mb-4 ml-2">Load 482 sponsorship template</button>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Email Subject</label><input value={form.initialAdviceTemplate.subject} onChange={e => setForm(f => ({ ...f, initialAdviceTemplate: { ...f.initialAdviceTemplate, subject: e.target.value } }))} className="input" placeholder="Initial Advice & Fee Estimation" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Email Body (optional)</label><textarea value={form.initialAdviceTemplate.body} onChange={e => setForm(f => ({ ...f, initialAdviceTemplate: { ...f.initialAdviceTemplate, body: e.target.value } }))} className="input min-h-[100px]" placeholder="Custom message..." /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">482 Sponsorship Body</label><textarea value={form.initialAdviceTemplate.sponsorship482Body} onChange={e => setForm(f => ({ ...f, initialAdviceTemplate: { ...f.initialAdviceTemplate, sponsorship482Body: e.target.value } }))} className="input min-h-[180px]" placeholder="Used as the default draft for Subclass 482 sponsor package emails." /></div>
              <div><div className="flex justify-between items-center mb-2"><label className="text-sm font-medium text-slate-700">Fee Blocks</label><button type="button" onClick={addFeeBlock} className="text-ori-600 text-sm">+ Add</button></div>
                {(form.initialAdviceTemplate.feeBlocks || []).map((b, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={b.label} onChange={e => updateFeeBlock(i, 'label', e.target.value)} className="input flex-1" placeholder="Label" />
                    <input value={b.amount} onChange={e => updateFeeBlock(i, 'amount', e.target.value)} className="input w-24" placeholder="Amount" />
                    <input value={b.description} onChange={e => updateFeeBlock(i, 'description', e.target.value)} className="input flex-1" placeholder="Description" />
                    <button type="button" onClick={() => removeFeeBlock(i)} className="text-red-500 p-2">×</button>
                  </div>
                ))}
              </div>
              <div><div className="flex justify-between items-center mb-2"><label className="text-sm font-medium text-slate-700">Government Fee Blocks</label><button type="button" onClick={addGovFeeBlock} className="text-ori-600 text-sm">+ Add</button></div>
                {(form.initialAdviceTemplate.governmentFeeBlocks || []).map((b, i) => (
                  <div key={i} className="grid md:grid-cols-4 gap-2 mb-2">
                    <input value={b.label} onChange={e => updateGovFeeBlock(i, 'label', e.target.value)} className="input" placeholder="Fee Type" />
                    <input value={b.amount} onChange={e => updateGovFeeBlock(i, 'amount', e.target.value)} className="input" placeholder="Amount" />
                    <input value={b.payer || ''} onChange={e => updateGovFeeBlock(i, 'payer', e.target.value)} className="input" placeholder="Payer" />
                    <div className="flex gap-2">
                      <input value={b.description} onChange={e => updateGovFeeBlock(i, 'description', e.target.value)} className="input flex-1" placeholder="Description" />
                      <button type="button" onClick={() => removeGovFeeBlock(i)} className="text-red-500 p-2">×</button>
                    </div>
                  </div>
                ))}
              </div>
              <div><div className="flex justify-between items-center mb-2"><label className="text-sm font-medium text-slate-700">Default Checklist Items</label><button type="button" onClick={addChecklistItem} className="text-ori-600 text-sm">+ Add</button></div>
                {(form.initialAdviceTemplate.checklistItems || []).map((item, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={item} onChange={e => updateChecklistItem(i, e.target.value)} className="input flex-1" placeholder="Checklist item" />
                    <button type="button" onClick={() => removeChecklistItem(i)} className="text-red-500 p-2">×</button>
                  </div>
                ))}
              </div>
            </div>
          </SettingsBlock>
        )}

        {isAdmin && (
          <SettingsBlock title="Email Configuration" icon={Mail} desc="Add multiple SMTP profiles. Employees can use the default or choose their own in Profile. Common: Gmail (smtp.gmail.com:587), Office365. Use app password for Gmail.">
            <p className="text-slate-600 text-sm mb-4">Add multiple SMTP profiles. Employees can use the default or choose their own in Profile. Used when sending Form 956, MIA, Initial Advice.</p>
            <p className="text-slate-500 text-xs mb-4">Common: Gmail (smtp.gmail.com:587), Office365 (smtp.office365.com:587), SendGrid, Mailgun. Use app password for Gmail.</p>
            <div className="space-y-4">
              {(form.emailProfiles || []).map((ep, i) => (
                <div key={ep._id || i} className="p-4 border rounded-lg bg-slate-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-800">{ep.name || `Profile ${i + 1}`}</span>
                    <button type="button" onClick={() => setForm(f => ({ ...f, emailProfiles: (f.emailProfiles || []).filter((_, j) => j !== i) }))} className="text-red-500 hover:bg-red-50 p-1 rounded"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">Name *</label><input value={ep.name} onChange={e => setForm(f => { const p = [...(f.emailProfiles || [])]; p[i] = { ...p[i], name: e.target.value }; return { ...f, emailProfiles: p }; })} className="input text-sm" placeholder="e.g. Main Office" /></div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">SMTP Host *</label><input value={ep.host} onChange={e => setForm(f => { const p = [...(f.emailProfiles || [])]; p[i] = { ...p[i], host: e.target.value }; return { ...f, emailProfiles: p }; })} className="input text-sm" placeholder="smtp.gmail.com" /></div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">Port</label><input type="number" value={ep.port || 587} onChange={e => setForm(f => { const p = [...(f.emailProfiles || [])]; p[i] = { ...p[i], port: parseInt(e.target.value) || 587 }; return { ...f, emailProfiles: p }; })} className="input text-sm" /></div>
                    <div className="flex items-center gap-2 pt-6"><label className="flex items-center gap-2"><input type="checkbox" checked={ep.secure} onChange={e => setForm(f => { const p = [...(f.emailProfiles || [])]; p[i] = { ...p[i], secure: e.target.checked }; return { ...f, emailProfiles: p }; })} /> SSL/TLS</label></div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">User *</label><input value={ep.user} onChange={e => setForm(f => { const p = [...(f.emailProfiles || [])]; p[i] = { ...p[i], user: e.target.value }; return { ...f, emailProfiles: p }; })} className="input text-sm" placeholder="email@domain.com" /></div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">Password</label><input type="password" value={ep.pass} onChange={e => setForm(f => { const p = [...(f.emailProfiles || [])]; p[i] = { ...p[i], pass: e.target.value }; return { ...f, emailProfiles: p }; })} className="input text-sm" placeholder={ep.pass ? '••••••••' : 'Leave blank to keep'} /></div>
                    <div className="sm:col-span-2"><label className="block text-xs font-medium text-slate-600 mb-1">From (optional)</label><input value={ep.from || ''} onChange={e => setForm(f => { const p = [...(f.emailProfiles || [])]; p[i] = { ...p[i], from: e.target.value }; return { ...f, emailProfiles: p }; })} className="input text-sm" placeholder="ORIVISA &lt;info@orivisa.com&gt;" /></div>
                    <div className="flex gap-4 sm:col-span-2">
                      <label className="flex items-center gap-2"><input type="checkbox" checked={ep.isDefault} onChange={e => setForm(f => { const p = (f.emailProfiles || []).map((x, j) => ({ ...x, isDefault: j === i ? e.target.checked : false })); return { ...f, emailProfiles: p }; })} /> Default (used by employees who don&apos;t choose)</label>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={ep.active !== false} onChange={e => setForm(f => { const p = [...(f.emailProfiles || [])]; p[i] = { ...p[i], active: e.target.checked }; return { ...f, emailProfiles: p }; })} /> Active</label>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setForm(f => ({ ...f, emailProfiles: [...(f.emailProfiles || []), { name: '', host: '', port: 587, secure: false, user: '', pass: '', from: '', isDefault: (f.emailProfiles || []).length === 0, active: true }] }))} className="btn-secondary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Email Profile</button>
            </div>
          </SettingsBlock>
        )}

        {isAdmin && (
          <SettingsBlock title="Role Permissions" icon={Users} desc="Configure feature access per role. CONSULTANCY_ADMIN has full access. AGENT and SUPPORT permissions can be restricted.">
            <div className="space-y-3">
              {(form.rolePermissions || DEFAULT_ROLE_PERMISSIONS).map((rp, rIdx) => (
                <div key={rp.role} className="border rounded-lg overflow-hidden">
                  <button type="button" onClick={() => setRolePermsExpanded(rolePermsExpanded === rp.role ? null : rp.role)} className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100">
                    <span className="font-medium text-slate-900">{rp.role.replace(/_/g, ' ')}</span>
                    {rolePermsExpanded === rp.role ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  {rolePermsExpanded === rp.role && rp.permissions && (
                    <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {Object.entries(rp.permissions).map(([key, val]) => (
                        <div key={key} className="space-y-1">
                          <span className="font-medium text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          {typeof val === 'boolean' ? (
                            <label className="flex items-center gap-2 mt-1"><input type="checkbox" checked={!!val} onChange={e => setForm(f => {
                              const rps = [...(f.rolePermissions || DEFAULT_ROLE_PERMISSIONS)];
                              rps[rIdx] = { ...rps[rIdx], permissions: { ...rps[rIdx].permissions, [key]: e.target.checked } };
                              return { ...f, rolePermissions: rps };
                            })} className="rounded" /> Allow</label>
                          ) : (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {Object.keys(val as object).map((ak) => (
                                <label key={ak} className="flex items-center gap-1"><input type="checkbox" checked={!!(val as any)[ak]} onChange={e => setForm(f => {
                                  const rps = [...(f.rolePermissions || DEFAULT_ROLE_PERMISSIONS)];
                                  const perms = { ...rps[rIdx].permissions, [key]: { ...(rps[rIdx].permissions as any)[key], [ak]: e.target.checked } };
                                  rps[rIdx] = { ...rps[rIdx], permissions: perms };
                                  return { ...f, rolePermissions: rps };
                                })} className="rounded" /> {ak}</label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SettingsBlock>
        )}

        {isAdmin && (
          <SettingsBlock title="Bank Details (for fee advice)" icon={CreditCard} desc="Shown in initial advice and fee estimation emails.">
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Account Name</label><input value={form.bankDetails.accountName} onChange={e => setForm(f => ({ ...f, bankDetails: { ...f.bankDetails, accountName: e.target.value } }))} className="input" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Bank</label><input value={form.bankDetails.bank} onChange={e => setForm(f => ({ ...f, bankDetails: { ...f.bankDetails, bank: e.target.value } }))} className="input" placeholder="e.g. Westpac" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">BSB</label><input value={form.bankDetails.bsb} onChange={e => setForm(f => ({ ...f, bankDetails: { ...f.bankDetails, bsb: e.target.value } }))} className="input" placeholder="e.g. 037 001" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label><input value={form.bankDetails.accountNumber} onChange={e => setForm(f => ({ ...f, bankDetails: { ...f.bankDetails, accountNumber: e.target.value } }))} className="input" /></div>
            </div>
          </SettingsBlock>
        )}

        <div className="card">
          <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-ori-600" /> Notifications</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700">Email notifications</span>
              <input type="checkbox" checked={notifyEmail} onChange={e => setNotifyEmail(e.target.checked)} className="rounded" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700">Task reminders</span>
              <input type="checkbox" checked={notifyTasks} onChange={e => setNotifyTasks(e.target.checked)} className="rounded" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700">Document upload alerts</span>
              <input type="checkbox" checked={notifyDocuments} onChange={e => setNotifyDocuments(e.target.checked)} className="rounded" />
            </label>
          </div>
        </div>

        <div className="card">
          <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-ori-600" /> Security</h2>
          <p className="text-slate-600 text-sm">Change password and security options in your Profile.</p>
        </div>

        <div className="flex gap-3">
          <button onClick={handleSave} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save Notifications</button>
          {isAdmin && <button onClick={handleSaveConsultancy} disabled={saving} className="btn-primary flex items-center gap-2">{saving ? 'Saving...' : 'Save Consultancy'}</button>}
        </div>
      </div>
    </div>
  );
}
