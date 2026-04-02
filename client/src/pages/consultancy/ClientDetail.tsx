import { useEffect, useId, useState, type FormEvent } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch, safeJson, useAuthStore } from '../../store/auth';
import { 
  ArrowLeft, Trash2, Mail, Pencil, FileText, Download, UserMinus,
  CheckCircle, StickyNote, ClipboardList, Award, History, 
  User, GraduationCap, Send, FileSignature, CheckCircle2, Eye, X, Briefcase, ShieldCheck, CircleHelp
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { resolveFileUrl } from '../../lib/imageUrl';

// New Modular Profile Components
import { PersonalInfo } from '../student/profile/Sections/PersonalInfo';
import { ImmigrationInfo } from '../student/profile/Sections/ImmigrationInfo';
import { EducationInfo } from '../student/profile/Sections/EducationInfo';
import { WorkInfo } from '../student/profile/Sections/WorkInfo';
import { AddressInfo } from '../student/profile/Sections/AddressInfo';
import { TravelInfo } from '../student/profile/Sections/TravelInfo';
import { FamilyInfo } from '../student/profile/Sections/FamilyInfo';
import { SkillsInfo } from '../student/profile/Sections/SkillsInfo';
import { HealthInfo } from '../student/profile/Sections/HealthInfo';
import { NotesInfo } from '../student/profile/Sections/NotesInfo';

type Tab = 'overview' | 'documents' | 'applications' | 'task-sheet' | 'skill-assessments' | 'immigration-history' | 'profile-details';
type ComposerKind = 'FORM_956' | 'MIA' | 'INITIAL_ADVICE' | 'SPONSOR_PACKAGE';
const WORKFLOW_STEPS: ComposerKind[] = ['INITIAL_ADVICE', 'FORM_956', 'MIA'];

const DEFAULT_SAMPLE_ATTACHMENTS = [
  'sample-job-description',
  'sample-list-of-applicants',
  'genuine-position-report',
  'work-reference-sample',
];

const TITLE_OPTIONS = ['Mr', 'Mrs', 'Ms', 'Miss', 'Mx', 'Dr', 'Prof', 'Other'];
const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other'];
const LANGUAGE_OPTIONS = [
  'English', 'Hindi', 'Nepali', 'Punjabi', 'Urdu', 'Bengali', 'Mandarin', 'Cantonese',
  'Vietnamese', 'Korean', 'Japanese', 'Thai', 'Sinhala', 'Tamil', 'Arabic', 'Spanish',
  'French', 'Portuguese', 'German', 'Italian', 'Other',
];
const COUNTRY_OPTIONS = [
  'Afghanistan', 'Argentina', 'Australia', 'Bangladesh', 'Bhutan', 'Brazil', 'Cambodia', 'Canada',
  'Chile', 'China', 'Colombia', 'Fiji', 'France', 'Germany', 'Ghana', 'Hong Kong', 'India',
  'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Italy', 'Japan', 'Kenya', 'Korea, South', 'Malaysia',
  'Maldives', 'Mauritius', 'Myanmar', 'Nepal', 'Netherlands', 'New Zealand', 'Nigeria', 'Pakistan',
  'Papua New Guinea', 'Philippines', 'Saudi Arabia', 'Singapore', 'South Africa', 'Spain', 'Sri Lanka',
  'Thailand', 'Turkey', 'United Arab Emirates', 'United Kingdom', 'United States', 'Vietnam', 'Zimbabwe', 'Other',
];

export default function ClientDetail() {
  const { user } = useAuthStore();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const navigate = useNavigate();
  const [branches, setBranches] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>('overview');
  
  // Data States
  const [client, setClient] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [sendingInvite, setSendingInvite] = useState(false);

  // Sub-Tab States
  const [showAddApp, setShowAddApp] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [newAppVisa, setNewAppVisa] = useState('500');
  const [newAppSponsor, setNewAppSponsor] = useState('');
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [editApp, setEditApp] = useState<any>(null);
  const [uploadForm, setUploadForm] = useState({
    type: 'PASSPORT',
    applicationId: '',
    files: [] as File[],
    replaceDocumentId: '',
    expiryDate: '',
    issueDate: '',
    shareWithClient: true,
    shareWithSponsor: false,
  });
  const [uploading, setUploading] = useState(false);
  const [versionHistoryDoc, setVersionHistoryDoc] = useState<any | null>(null);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [editingDocument, setEditingDocument] = useState<any | null>(null);
  const [docMetaForm, setDocMetaForm] = useState({
    expiryDate: '',
    issueDate: '',
    status: 'UPLOADED',
    shareWithClient: true,
    shareWithSponsor: false,
  });
  const [marking956, setMarking956] = useState<string | null>(null);
  const [coeAppId, setCoeAppId] = useState<string | null>(null);
  const [coeForm, setCoeForm] = useState({ number: '', institution: '', courseName: '', courseCode: '', issueDate: '', expiryDate: '', status: 'ACTIVE' });
  const [savingCoe, setSavingCoe] = useState(false);
  const [appNoteAppId, setAppNoteAppId] = useState<string | null>(null);
  const [appNoteText, setAppNoteText] = useState('');
  const [addingAppNote, setAddingAppNote] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerLoading, setComposerLoading] = useState(false);
  const [composerSending, setComposerSending] = useState(false);
  const [composerError, setComposerError] = useState('');
  const [composerKind, setComposerKind] = useState<ComposerKind>('FORM_956');
  const [composerTarget, setComposerTarget] = useState<{ clientId?: string; sponsorId?: string; applicationId?: string }>({});
  const [composerPreview, setComposerPreview] = useState<any>(null);
  const [workflowHelpOpen, setWorkflowHelpOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingPortal, setRemovingPortal] = useState(false);
  const [composerDraft, setComposerDraft] = useState<any>({
    applicationId: '',
    subject: '',
    customBody: '',
    form956Profile: {
      title: '',
      preferredLanguage: 'English',
      nationality: '',
      countryOfBirth: '',
      passportCountry: '',
      countryOfResidence: '',
      gender: '',
      phone: '',
      email: '',
    },
    includeConsumerGuide: true,
    includeForm956Attachment: false,
    feeBlocks: [],
    governmentFeeBlocks: [],
    checklistItems: [],
    sampleAttachments: DEFAULT_SAMPLE_ATTACHMENTS,
    occupation: '',
    anzscoCode: '',
    positionTitle: '',
    sbsStatus: '',
    recipientName: '',
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const refreshClient = async () => {
    try {
      const res = await authFetch(`/api/clients/${id}`);
      const data = await safeJson<any>(res);
      if (data.error) throw new Error(data.error);
      setClient(data);
    } catch (err) {
      console.error(err);
      navigate('/consultancy/clients', { replace: true });
    }
  };

  const fetchApplications = () => authFetch(`/api/clients/${id}/applications`).then(r => safeJson<any[]>(r)).then(setApplications);
  const fetchDocuments = () => authFetch(`/api/documents?clientId=${id}`).then(r => safeJson<any[]>(r)).then(setDocuments);
  const fetchActivity = () => authFetch(`/api/clients/${id}/activity`).then(r => safeJson<any[]>(r)).then(setActivity);

  useEffect(() => {
    if (!id || id === 'undefined') {
      navigate('/consultancy/clients', { replace: true });
      return;
    }
    const init = async () => {
      await refreshClient();
      fetchApplications();
      authFetch('/api/constants/document-types').then(r => safeJson<any[]>(r)).then(setDocTypes);
      authFetch('/api/sponsors').then(r => safeJson<any[]>(r)).then(setSponsors).catch(() => []);
      fetchActivity();
      setLoading(false);
    };
    init();
  }, [id]);

  useEffect(() => {
    if (id && tab === 'documents') fetchDocuments();
    if (id && tab === 'task-sheet') fetchActivity();
  }, [id, tab]);

  useEffect(() => {
    if (!user?.role || !['CONSULTANCY_ADMIN', 'MANAGER', 'AGENT', 'SUPER_ADMIN'].includes(user.role)) return;
    authFetch('/api/branches')
      .then((r) => r.json())
      .then((d) => setBranches(Array.isArray(d) ? d : []))
      .catch(() => setBranches([]));
  }, [user?.role]);

  const handleDeleteClient = async () => {
    if (!confirm('Delete this client record? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await authFetch(`/api/clients/${id}`, { method: 'DELETE' });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      navigate(consultancyId ? `/consultancy/clients?consultancyId=${consultancyId}` : '/consultancy/clients');
    } catch (e: any) {
      alert(e.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveFromPortal = async () => {
    if (!confirm('Remove portal access? The student can no longer open this client in the app; your CRM case file stays.')) return;
    setRemovingPortal(true);
    try {
      const res = await authFetch(`/api/clients/${id}/remove-portal`, { method: 'POST' });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error || 'Failed');
      await refreshClient();
      showToast('Portal access removed');
    } catch (e: any) {
      alert(e.message || 'Failed');
    } finally {
      setRemovingPortal(false);
    }
  };

  const wrapSave = (urlSuffix: string, method: string = 'PATCH') => async (data: any) => {
    const res = await authFetch(`/api/clients/${id}${urlSuffix}`, { 
      method, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(data) 
    });
    if (res.ok) { 
      await refreshClient(); 
      showToast('Client Updated!'); 
    } else {
      const err = await safeJson<any>(res);
      alert(err.error || 'Failed to update');
    }
  };

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: id, visaSubclass: newAppVisa, status: 'ONBOARDING', sponsorId: newAppSponsor || undefined }),
      });
      if (!res.ok) throw new Error('Failed to create application');
      setShowAddApp(false);
      fetchApplications();
      showToast('Application Created');
    } catch (e: any) { alert(e.message); }
  };

  const handleUpdateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppId || !editApp) return;
    try {
      const res = await authFetch(`/api/applications/${editingAppId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editApp),
      });
      if (!res.ok) throw new Error('Update failed');
      setEditingAppId(null);
      fetchApplications();
      showToast('Application Updated');
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteApplication = async (appId: string) => {
    if (!confirm('Delete this application?')) return;
    await authFetch(`/api/applications/${appId}`, { method: 'DELETE' });
    fetchApplications();
  };

  const openCoeForm = (a: any) => {
    setCoeAppId(a._id);
    setCoeForm({
      number: a.coe?.number || '',
      institution: a.coe?.institution || '',
      courseName: a.coe?.courseName || '',
      courseCode: a.coe?.courseCode || '',
      issueDate: a.coe?.issueDate ? new Date(a.coe.issueDate).toISOString().slice(0, 10) : '',
      expiryDate: a.coe?.expiryDate ? new Date(a.coe.expiryDate).toISOString().slice(0, 10) : '',
      status: a.coe?.status || 'ACTIVE',
    });
  };

  const handleSaveCoe = async () => {
    if (!coeAppId) return;
    setSavingCoe(true);
    try {
      const payload = { coe: { ...coeForm } };
      await authFetch(`/api/applications/${coeAppId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setCoeAppId(null);
      fetchApplications();
    } finally { setSavingCoe(false); }
  };

  const handleMarkForm956 = async (appId: string) => {
    setMarking956(appId);
    await authFetch(`/api/applications/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form956Signed: true, form956SignedAt: new Date().toISOString() }),
    });
    fetchApplications();
    setMarking956(null);
  };

  const handleAddAppNote = async (e: React.FormEvent, appId: string) => {
    e.preventDefault();
    if (!appNoteText.trim()) return;
    setAddingAppNote(true);
    await authFetch(`/api/applications/${appId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: appNoteText }),
    });
    setAppNoteText('');
    setAppNoteAppId(null);
    fetchApplications();
    setAddingAppNote(false);
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.files.length) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('clientId', id!);
    fd.append('type', uploadForm.type);
    if (uploadForm.applicationId) fd.append('applicationId', uploadForm.applicationId);
    if (uploadForm.expiryDate) fd.append('expiryDate', uploadForm.expiryDate);
    if (uploadForm.issueDate) fd.append('issueDate', uploadForm.issueDate);
    fd.append('shareWithClient', String(uploadForm.shareWithClient));
    fd.append('shareWithSponsor', String(uploadForm.shareWithSponsor));
    const singleVersionUpload = !!uploadForm.replaceDocumentId && uploadForm.files.length === 1;
    if (singleVersionUpload) {
      fd.append('file', uploadForm.files[0]);
      fd.append('replaceDocumentId', uploadForm.replaceDocumentId);
      await authFetch('/api/documents/upload', { method: 'POST', body: fd });
    } else {
      uploadForm.files.forEach((file) => fd.append('files', file));
      await authFetch('/api/documents/bulk-upload', { method: 'POST', body: fd });
    }
    setShowUpload(false);
    setUploadForm({ type: 'PASSPORT', applicationId: '', files: [], replaceDocumentId: '', expiryDate: '', issueDate: '', shareWithClient: true, shareWithSponsor: false });
    fetchDocuments();
    setUploading(false);
  };

  const openVersionHistory = async (doc: any) => {
    const res = await authFetch(`/api/documents/${doc._id}/versions`);
    const data = await safeJson<any[]>(res);
    setVersionHistoryDoc(doc);
    setVersionHistory(Array.isArray(data) ? data : []);
  };

  const startReplaceVersion = (doc: any) => {
    setShowUpload(true);
    setUploadForm({
      type: doc.type || 'PASSPORT',
      applicationId: doc.applicationId?._id || doc.applicationId || '',
      files: [],
      replaceDocumentId: doc._id,
      expiryDate: doc.metadata?.expiryDate ? new Date(doc.metadata.expiryDate).toISOString().slice(0, 10) : '',
      issueDate: doc.metadata?.issueDate ? new Date(doc.metadata.issueDate).toISOString().slice(0, 10) : '',
      shareWithClient: doc.visibility?.client !== false,
      shareWithSponsor: !!doc.visibility?.sponsor,
    });
  };

  const openDocumentSettings = (doc: any) => {
    setEditingDocument(doc);
    setDocMetaForm({
      expiryDate: doc.metadata?.expiryDate ? new Date(doc.metadata.expiryDate).toISOString().slice(0, 10) : '',
      issueDate: doc.metadata?.issueDate ? new Date(doc.metadata.issueDate).toISOString().slice(0, 10) : '',
      status: doc.status || 'UPLOADED',
      shareWithClient: doc.visibility?.client !== false,
      shareWithSponsor: !!doc.visibility?.sponsor,
    });
  };

  const saveDocumentSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingDocument) return;
    await authFetch(`/api/documents/${editingDocument._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: docMetaForm.status,
        expiryDate: docMetaForm.expiryDate || undefined,
        issueDate: docMetaForm.issueDate || undefined,
        shareWithClient: docMetaForm.shareWithClient,
        shareWithSponsor: docMetaForm.shareWithSponsor,
      }),
    });
    setEditingDocument(null);
    fetchDocuments();
  };

  const buildDraftFromApplication = (app?: any) => {
    const existing = app?.communicationDraft || {};
    const fallbackForm956Profile = {
      title: '',
      preferredLanguage: 'English',
      nationality: client?.profile?.nationality || '',
      countryOfBirth: client?.profile?.countryOfBirth || '',
      passportCountry: client?.profile?.passportCountry || '',
      countryOfResidence: client?.profile?.address?.country || 'Australia',
      gender: client?.profile?.gender || '',
      phone: client?.profile?.phone || app?.sponsorId?.contactPerson?.phone || app?.sponsorId?.phone || '',
      email: client?.profile?.email || app?.sponsorId?.contactPerson?.email || app?.sponsorId?.email || '',
    };
    return {
      applicationId: app?._id || '',
      subject: existing.subject || '',
      customBody: existing.body || '',
      form956Profile: { ...fallbackForm956Profile, ...(existing.form956Profile || {}) },
      includeConsumerGuide: existing.includeConsumerGuide ?? true,
      includeForm956Attachment: existing.includeForm956Attachment ?? false,
      feeBlocks: Array.isArray(existing.feeBlocks) ? existing.feeBlocks : [],
      governmentFeeBlocks: Array.isArray(existing.governmentFeeBlocks) ? existing.governmentFeeBlocks : [],
      checklistItems: Array.isArray(existing.checklistItems) ? existing.checklistItems : [],
      sampleAttachments: Array.isArray(existing.sampleAttachments) && existing.sampleAttachments.length ? existing.sampleAttachments : DEFAULT_SAMPLE_ATTACHMENTS,
      occupation: existing.occupation || client?.profile?.targetOccupation || 'Chef',
      anzscoCode: existing.anzscoCode || client?.profile?.anzscoCode || '351311',
      positionTitle: existing.positionTitle || 'Chef',
      sbsStatus: existing.sbsStatus || app?.sponsorId?.sbsStatus || 'approved',
      recipientName: existing.recipientName || app?.sponsorId?.contactPerson?.firstName || '',
    };
  };

  const getPreviewUrl = (kind: ComposerKind, target: { clientId?: string; sponsorId?: string }) => {
    if (kind === 'SPONSOR_PACKAGE' && target.sponsorId) return `/api/sponsors/${target.sponsorId}/preview-sponsorship-package`;
    if (kind === 'FORM_956' && target.clientId) return `/api/clients/${target.clientId}/preview-form956`;
    if (kind === 'MIA' && target.clientId) return `/api/clients/${target.clientId}/preview-mia`;
    if (kind === 'INITIAL_ADVICE' && target.clientId) return `/api/clients/${target.clientId}/preview-initial-advice`;
    return '';
  };

  const getSendUrl = (kind: ComposerKind, target: { clientId?: string; sponsorId?: string }) => {
    if (kind === 'SPONSOR_PACKAGE' && target.sponsorId) return `/api/sponsors/${target.sponsorId}/send-sponsorship-package`;
    if (kind === 'FORM_956' && target.clientId) return `/api/clients/${target.clientId}/send-form956`;
    if (kind === 'MIA' && target.clientId) return `/api/clients/${target.clientId}/send-mia`;
    if (kind === 'INITIAL_ADVICE' && target.clientId) return `/api/clients/${target.clientId}/send-initial-advice`;
    return '';
  };

  const getApiErrorMessage = (data: any, fallback: string) => {
    const base = data?.error || fallback;
    const details = Array.isArray(data?.details)
      ? data.details
          .map((item: any) => item?.message)
          .filter(Boolean)
      : [];

    if (!details.length) return base;

    const uniqueDetails = Array.from(new Set(details));
    return `${base}\n• ${uniqueDetails.join('\n• ')}`;
  };

  const refreshComposerPreview = async (kind: ComposerKind, target: { clientId?: string; sponsorId?: string; applicationId?: string }, draft: any) => {
    const url = getPreviewUrl(kind, target);
    if (!url) return;
    setComposerLoading(true);
    setComposerError('');
    try {
      const res = await authFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await safeJson<any>(res);
      if (!res.ok || data?.error) throw new Error(getApiErrorMessage(data, 'Failed to load preview'));
      setComposerPreview(data);
      if (!draft?.subject?.trim() && data?.subject) {
        setComposerDraft((prev: any) => {
          if (prev?.subject?.trim()) return prev;
          return { ...prev, subject: data.subject };
        });
      }
    } catch (err: any) {
      setComposerError(err?.message || 'Failed to load preview');
    } finally {
      setComposerLoading(false);
    }
  };

  const openComposer = async (kind: ComposerKind, app?: any) => {
    const target = kind === 'SPONSOR_PACKAGE'
      ? { sponsorId: app?.sponsorId?._id, applicationId: app?._id }
      : { clientId: id, applicationId: app?._id };
    const draft = buildDraftFromApplication(app);
    setComposerKind(kind);
    setComposerTarget(target);
    setComposerDraft(draft);
    setComposerPreview(null);
    setComposerOpen(true);
    await refreshComposerPreview(kind, target, draft);
  };

  const handleComposerKindChange = async (kind: ComposerKind) => {
    const nextDraft = kind === 'INITIAL_ADVICE'
      ? composerDraft
      : { ...composerDraft, subject: '', customBody: '' };
    setComposerKind(kind);
    setComposerDraft(nextDraft);
    await refreshComposerPreview(kind, composerTarget, nextDraft);
  };

  const getNextWorkflowStep = (kind: ComposerKind) => {
    const index = WORKFLOW_STEPS.indexOf(kind);
    return index >= 0 ? WORKFLOW_STEPS[index + 1] : undefined;
  };

  const handleSendComposer = async () => {
    const url = getSendUrl(composerKind, composerTarget);
    if (!url) return;
    setComposerSending(true);
    setComposerError('');
    try {
      const res = await authFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(composerDraft),
      });
      const data = await safeJson<any>(res);
      if (!res.ok || data?.error) throw new Error(getApiErrorMessage(data, 'Failed to send'));
      fetchApplications();
      const nextStep = getNextWorkflowStep(composerKind);
      if (nextStep) {
        setComposerPreview(null);
        showToast(`${composerKind === 'INITIAL_ADVICE' ? 'Initial advice' : composerKind === 'FORM_956' ? 'Form 956' : 'MIA'} sent. Moving to next step.`);
        await handleComposerKindChange(nextStep);
      } else {
        setComposerOpen(false);
        setComposerPreview(null);
        showToast('Communication sent');
      }
    } catch (err: any) {
      setComposerError(err?.message || 'Failed to send');
    } finally {
      setComposerSending(false);
    }
  };

  const handleMarkConsumerGuideReceived = async (app: any) => {
    const nextValue = !app?.communicationDraft?.consumerGuideAcknowledged;
    await authFetch(`/api/applications/${app._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        communicationDraft: {
          ...(app.communicationDraft || {}),
          consumerGuideAcknowledged: nextValue,
          consumerGuideAcknowledgedAt: nextValue ? new Date().toISOString() : null,
        },
        compliance: {
          ...(app.compliance || {}),
          consumerGuideAcknowledgedAt: nextValue ? new Date().toISOString() : null,
        },
      }),
    });
    fetchApplications();
  };

  if (loading || !client) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <LoadingSpinner />
      <div className="text-slate-400 font-bold tracking-widest uppercase animate-pulse text-xs">Syncing Galaxy Data...</div>
    </div>
  );

  const p = client.profile || {};
  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: User },
    { key: 'profile-details', label: 'Full Profile', icon: ClipboardList },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'applications', label: 'Applications', icon: GraduationCap },
    { key: 'task-sheet', label: 'Task Sheet', icon: History },
    { key: 'skill-assessments', label: 'Assessments', icon: Award },
    { key: 'immigration-history', label: 'Immigration', icon: History },
  ];

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto px-2 sm:px-0 pb-20 animate-in fade-in duration-500">
       {toast && (
        <div className="fixed top-24 right-8 z-50 flex items-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl animate-in slide-in-from-right-10 duration-300">
          <div className="p-1.5 bg-emerald-500 rounded-full text-white"><CheckCircle2 className="w-4 h-4" /></div>
          <span className="font-black text-sm">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <Link to={consultancyId ? `/consultancy/clients?consultancyId=${consultancyId}` : '/consultancy/clients'} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-2 font-bold text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Clients List
          </Link>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight break-words">{p.firstName} {p.lastName}</h1>
          <p className="text-slate-500 font-bold">{p.email} · Registered {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {branches.length > 0 && ['CONSULTANCY_ADMIN', 'SUPER_ADMIN'].includes(user?.role || '') && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-black text-slate-500 uppercase">Branch</label>
              <select
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-white"
                value={typeof client.branchId === 'object' && client.branchId?._id ? client.branchId._id : client.branchId || ''}
                onChange={async (e) => {
                  const v = e.target.value;
                  await wrapSave('')({ branchId: v || null });
                }}
              >
                <option value="">— Unassigned —</option>
                {branches.map((b: any) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
           {!client.userId && (
             <button onClick={async () => {
               setSendingInvite(true);
               const res = await authFetch(`/api/clients/${id}/invite`, { method: 'POST' });
               const data = await safeJson<any>(res);
               alert(data.emailed ? 'Invitation emailed.' : `Invite Link: ${data.inviteLink}`);
               setSendingInvite(false);
             }} disabled={sendingInvite} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
               {sendingInvite ? 'Sending...' : 'Invite to Portal'}
             </button>
           )}
           {client.userId && ['CONSULTANCY_ADMIN', 'MANAGER', 'AGENT', 'SUPER_ADMIN'].includes(user?.role || '') && (
             <button
               type="button"
               onClick={handleRemoveFromPortal}
               disabled={removingPortal}
               className="px-5 py-3 bg-white border border-amber-200 text-amber-900 rounded-2xl font-black text-xs uppercase hover:bg-amber-50 transition-all inline-flex items-center gap-2"
             >
               <UserMinus className="w-4 h-4" /> {removingPortal ? 'Removing…' : 'Remove from portal'}
             </button>
           )}
           {['CONSULTANCY_ADMIN', 'SUPER_ADMIN'].includes(user?.role || '') && (
             <button
               type="button"
               onClick={handleDeleteClient}
               disabled={deleting}
               className="px-5 py-3 bg-white border border-rose-200 text-rose-700 rounded-2xl font-black text-xs uppercase hover:bg-rose-50 transition-all inline-flex items-center gap-2"
             >
               <Trash2 className="w-4 h-4" /> {deleting ? 'Deleting…' : 'Delete client'}
             </button>
           )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-8 scrollbar-hide no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 border-b border-slate-100">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-[10px] tracking-widest transition-all shrink-0 uppercase
              ${tab === t.key ? 'bg-slate-900 text-white shadow-xl scale-[1.02]' : 'bg-white text-slate-400 hover:text-slate-600'}`}>
            {t.icon && <t.icon className="w-3.5 h-3.5" />} {t.label}
          </button>
        ))}
      </div>

      <div className="animate-in slide-in-from-bottom-4 duration-500">
        {tab === 'profile-details' && (
          <div className="space-y-12">
            <PersonalInfo data={p} onSave={wrapSave('/profile')} />
            <ImmigrationInfo profile={p} english={client.englishTest || {}} onSaveImmigration={wrapSave('/immigration')} onSaveEnglish={wrapSave('/english-test')} />
            <AddressInfo current={client.address?.current || {}} previous={client.address?.previous || []} onSaveCurrent={wrapSave('/addresses/current')} onAddPrevious={wrapSave('/addresses', 'POST')} onDeletePrevious={aid => wrapSave(`/addresses/${aid}`, 'DELETE')({})} />
            <EducationInfo items={client.education || []} onAdd={wrapSave('/education', 'POST')} onDelete={eid => wrapSave(`/education/${eid}`, 'DELETE')({})} />
            <WorkInfo items={client.experience || []} onAdd={wrapSave('/experience', 'POST')} onDelete={eid => wrapSave(`/experience/${eid}`, 'DELETE')({})} />
            <TravelInfo items={client.travelHistory || []} onAdd={wrapSave('/travel-history', 'POST')} onDelete={tid => wrapSave(`/travel-history/${tid}`, 'DELETE')({})} />
            <FamilyInfo items={client.familyMembers || []} onAdd={wrapSave('/family-members', 'POST')} onDelete={mid => wrapSave(`/family-members/${mid}`, 'DELETE')({})} />
            <SkillsInfo data={client.skillsData || {}} onSave={wrapSave('/skills')} />
            <HealthInfo data={client.healthData || {}} onSave={wrapSave('/health')} />
            <NotesInfo notes={client.notes || []} statement={client.initialStatement || ''} onSaveStatement={txt => wrapSave('/profile/statement')({ initialStatement: txt })} onAddNote={wrapSave('/notes', 'POST')} onDeleteNote={idx => wrapSave(`/notes/${idx}`, 'DELETE')({})} onTogglePin={async (id, isPinned) => { await wrapSave(`/notes/${id}`)({ isPinned }); }} />
          </div>
        )}

        {tab === 'overview' && <OverviewTab client={client} onCompose={openComposer} onSaveClient={wrapSave('')} />}

        {tab === 'documents' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black text-slate-900">Documents Vault</h2>
              <button onClick={() => setShowUpload(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase">+ Add Document</button>
            </div>
            {showUpload && (
               <form onSubmit={handleUploadDocument} className="p-6 bg-white border-2 border-indigo-100 rounded-3xl mb-8 animate-in zoom-in-95">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div><label className="text-xs font-black uppercase text-slate-400 block mb-2">Type</label><select value={uploadForm.type} onChange={e => setUploadForm({...uploadForm, type: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl border-none font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 transition-all">{docTypes.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
                   <div><label className="text-xs font-black uppercase text-slate-400 block mb-2">Application</label><select value={uploadForm.applicationId} onChange={e => setUploadForm({...uploadForm, applicationId: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl border-none font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 transition-all"><option value="">General client document</option>{applications.map(app => <option key={app._id} value={app._id}>Subclass {app.visaSubclass} • {app.status}</option>)}</select></div>
                   <div><label className="text-xs font-black uppercase text-slate-400 block mb-2">{uploadForm.replaceDocumentId ? 'New Version File' : 'Files'}</label><input type="file" multiple={!uploadForm.replaceDocumentId} required onChange={e => setUploadForm({...uploadForm, files: Array.from(e.target.files || [])})} className="w-full bg-slate-50 p-2 rounded-2xl font-bold" /></div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                   <div><label className="text-xs font-black uppercase text-slate-400 block mb-2">Issue Date</label><input type="date" value={uploadForm.issueDate} onChange={e => setUploadForm({...uploadForm, issueDate: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl border-none font-bold text-slate-600" /></div>
                   <div><label className="text-xs font-black uppercase text-slate-400 block mb-2">Expiry Date</label><input type="date" value={uploadForm.expiryDate} onChange={e => setUploadForm({...uploadForm, expiryDate: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl border-none font-bold text-slate-600" /></div>
                   <label className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl font-bold text-slate-600"><input type="checkbox" checked={uploadForm.shareWithClient} onChange={e => setUploadForm({...uploadForm, shareWithClient: e.target.checked})} /> Share with client</label>
                   <label className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl font-bold text-slate-600"><input type="checkbox" checked={uploadForm.shareWithSponsor} onChange={e => setUploadForm({...uploadForm, shareWithSponsor: e.target.checked})} /> Share with sponsor</label>
                 </div>
                 <div className="mt-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                   {uploadForm.replaceDocumentId ? 'Uploading a new version will preserve document history.' : 'You can upload multiple files at once.'}
                 </div>
                 <div className="flex justify-end gap-3 mt-4"><button type="button" onClick={() => { setShowUpload(false); setUploadForm({ type: 'PASSPORT', applicationId: '', files: [], replaceDocumentId: '', expiryDate: '', issueDate: '', shareWithClient: true, shareWithSponsor: false }); }} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button><button type="submit" disabled={uploading} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-indigo-600/20 transition-all">{uploading ? 'Uploading...' : uploadForm.replaceDocumentId ? 'Upload Version' : 'Upload'}</button></div>
               </form>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {documents.map(d => (
                 <div key={d._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4 hover:border-indigo-400 transition-all group">
                   <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all"><FileText className="w-6 h-6" /></div>
                   <div className="flex-1 min-w-0">
                     <p className="font-black text-slate-900 text-sm truncate">{d.name || d.type}</p>
                     <p className="text-[10px] font-black uppercase text-slate-400 truncate">{d.type}</p>
                     <div className="mt-2 flex flex-wrap gap-2">
                       <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-slate-100 text-slate-500">v{d.version || 1}</span>
                       {d.isLatest && <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Latest</span>}
                       <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${d.status === 'EXPIRED' ? 'bg-rose-100 text-rose-700' : d.status === 'VERIFIED' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{d.status}</span>
                     </div>
                     <div className="mt-2 space-y-1">
                       {d.metadata?.expiryDate && <p className={`text-[11px] font-bold ${new Date(d.metadata.expiryDate) < new Date() ? 'text-rose-600' : 'text-amber-600'}`}>Expiry: {new Date(d.metadata.expiryDate).toLocaleDateString()}</p>}
                       <div className="flex flex-wrap gap-2">
                         {d.visibility?.client !== false && <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">Client shared</span>}
                         {d.visibility?.sponsor && <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-amber-100 text-amber-700">Sponsor shared</span>}
                         {d.visibility?.client === false && !d.visibility?.sponsor && <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-slate-200 text-slate-600">Internal only</span>}
                       </div>
                     </div>
                     <div className="mt-3 flex items-center gap-2">
                        {d.fileUrl && <a href={resolveFileUrl(d.fileUrl)} target="_blank" rel="noreferrer" className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-indigo-600 hover:bg-white transition-all"><Download className="w-3.5 h-3.5" /></a>}
                        <button onClick={() => openVersionHistory(d)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-violet-600 hover:bg-white transition-all" title="Version history"><History className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openDocumentSettings(d)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-emerald-600 hover:bg-white transition-all" title="Sharing & expiry"><ShieldCheck className="w-3.5 h-3.5" /></button>
                        <button onClick={() => startReplaceVersion(d)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-amber-600 hover:bg-white transition-all" title="Upload new version"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { if(confirm('Delete?')) authFetch(`/api/documents/${d._id}`, {method: 'DELETE'}).then(()=>fetchDocuments()) }} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-red-600 hover:bg-white transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                     </div>
                   </div>
                 </div>
               ))}
               {!documents.length && <div className="md:col-span-3 text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-bold italic">No documents in the vault yet.</div>}
            </div>
            {versionHistoryDoc && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setVersionHistoryDoc(null); setVersionHistory([]); }}>
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div>
                      <h3 className="font-display font-bold text-slate-900">Version History</h3>
                      <p className="text-xs font-bold uppercase text-slate-400 mt-1">{versionHistoryDoc.name || versionHistoryDoc.type}</p>
                    </div>
                    <button onClick={() => { setVersionHistoryDoc(null); setVersionHistory([]); }} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="p-4 overflow-y-auto space-y-3">
                    {versionHistory.map(doc => (
                      <div key={doc._id} className="rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-black text-slate-900 text-sm">Version {doc.version || 1}</p>
                          <p className="text-xs text-slate-500">{doc.name}</p>
                          <p className="text-[10px] font-bold uppercase text-slate-400 mt-1">{doc.createdAt ? new Date(doc.createdAt).toLocaleString() : ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.isLatest && <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Latest</span>}
                          {doc.fileUrl && <a href={resolveFileUrl(doc.fileUrl)} target="_blank" rel="noreferrer" className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-indigo-600 hover:bg-white transition-all"><Download className="w-3.5 h-3.5" /></a>}
                        </div>
                      </div>
                    ))}
                    {!versionHistory.length && <div className="text-center py-10 text-slate-400 font-bold italic">No version history yet.</div>}
                  </div>
                </div>
              </div>
            )}
            {editingDocument && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingDocument(null)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
                  <form onSubmit={saveDocumentSettings} className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display font-bold text-slate-900">Document Controls</h3>
                        <p className="text-xs font-bold uppercase text-slate-400 mt-1">{editingDocument.name || editingDocument.type}</p>
                      </div>
                      <button type="button" onClick={() => setEditingDocument(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="text-xs font-black uppercase text-slate-400 block mb-2">Issue Date</label><input type="date" value={docMetaForm.issueDate} onChange={e => setDocMetaForm(f => ({ ...f, issueDate: e.target.value }))} className="w-full bg-slate-50 p-4 rounded-2xl border-none font-bold text-slate-600" /></div>
                      <div><label className="text-xs font-black uppercase text-slate-400 block mb-2">Expiry Date</label><input type="date" value={docMetaForm.expiryDate} onChange={e => setDocMetaForm(f => ({ ...f, expiryDate: e.target.value }))} className="w-full bg-slate-50 p-4 rounded-2xl border-none font-bold text-slate-600" /></div>
                      <div className="sm:col-span-2"><label className="text-xs font-black uppercase text-slate-400 block mb-2">Status</label><select value={docMetaForm.status} onChange={e => setDocMetaForm(f => ({ ...f, status: e.target.value }))} className="w-full bg-slate-50 p-4 rounded-2xl border-none font-bold text-slate-600"><option value="PENDING">Pending</option><option value="UPLOADED">Uploaded</option><option value="VERIFIED">Verified</option><option value="EXPIRED">Expired</option></select></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl font-bold text-slate-600"><input type="checkbox" checked={docMetaForm.shareWithClient} onChange={e => setDocMetaForm(f => ({ ...f, shareWithClient: e.target.checked }))} /> Share with client portal</label>
                      <label className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl font-bold text-slate-600"><input type="checkbox" checked={docMetaForm.shareWithSponsor} onChange={e => setDocMetaForm(f => ({ ...f, shareWithSponsor: e.target.checked }))} /> Share with sponsor</label>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => setEditingDocument(null)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button>
                      <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-indigo-600/20 transition-all">Save</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'applications' && (
          <div className="space-y-6">
             <div className="flex items-center justify-between">
               <h2 className="text-xl font-black text-slate-900">Visa Applications</h2>
               <button onClick={() => setShowAddApp(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase">+ New App</button>
             </div>
             {showAddApp && (
               <form onSubmit={handleAddApplication} className="p-6 bg-white border-2 border-indigo-100 rounded-3xl mb-8 animate-in zoom-in-95">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Visa Type</label><select value={newAppVisa} onChange={e => setNewAppVisa(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl border-none font-bold"><option value="500">500 Student</option><option value="485">485 Graduate</option><option value="189">189 Skilled</option><option value="190">190 Skilled</option><option value="600">600 Visitor</option></select></div>
                   <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Sponsor (Optional)</label><select value={newAppSponsor} onChange={e => setNewAppSponsor(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl border-none font-bold"><option value="">None</option>{sponsors.map(s=><option key={s._id} value={s._id}>{s.companyName}</option>)}</select></div>
                   <div className="flex items-end"><button type="submit" className="w-full h-[56px] bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs">Create App</button></div>
                 </div>
               </form>
             )}
             <div className="space-y-4">
               {applications.map(a => (
                 <div key={a._id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                   <div className="flex items-start justify-between">
                     <div>
                       <h3 className="text-lg font-black text-slate-900">Visa Subclass {a.visaSubclass}</h3>
                       <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{a.status}</span>
                          {a.form956Signed && <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">956 Signed</span>}
                          {a.sponsorId && <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">Sponsor: {a.sponsorId.companyName}</span>}
                          {a.communicationDraft?.consumerGuideAcknowledged && <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Guide Received</span>}
                       </div>
                     </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openCoeForm(a)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"><GraduationCap className="w-5 h-5" /></button>
                        <button onClick={() => { setEditingAppId(a._id); setEditApp({...a}); }} className="p-2 hover:bg-indigo-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"><Pencil className="w-4 h-4" /></button>
                        {!a.form956Signed && <button onClick={() => handleMarkForm956(a._id)} disabled={marking956 === a._id} className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg font-black text-[9px] uppercase hover:bg-amber-100 transition-all">Mark 956</button>}
                        <button onClick={() => setAppNoteAppId(appNoteAppId === a._id ? null : a._id)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"><StickyNote className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteApplication(a._id)} className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-600 transition-all"><Trash2 className="w-5 h-5" /></button>
                     </div>
                   </div>

                   <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                     <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Communication Workflow</p>
                         <h4 className="mt-1 text-sm sm:text-base font-black text-slate-900">Initial Advice -&gt; Form 956 -&gt; MIA</h4>
                         <p className="mt-1 text-xs font-medium text-slate-500">One responsive flow with auto consumer-guide attachment and optional auto-filled Form 956 inside the first email.</p>
                       </div>
                       <div className="flex flex-wrap gap-2">
                         <button onClick={() => setWorkflowHelpOpen((open) => !open)} className="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-slate-700 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all inline-flex items-center gap-2">
                           <CircleHelp className="w-4 h-4 text-indigo-600" />
                           {workflowHelpOpen ? 'Hide Help' : 'Setup Help'}
                         </button>
                         <button onClick={() => openComposer('INITIAL_ADVICE', a)} className="px-4 py-2 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all">
                           Open Workflow
                         </button>
                         {a.sponsorId && String(a.visaSubclass) === '482' && (
                           <button onClick={() => openComposer('SPONSOR_PACKAGE', a)} className="px-4 py-2 rounded-2xl bg-amber-100 text-amber-800 font-black text-[10px] uppercase tracking-widest hover:bg-amber-200 transition-all">
                             482 Sponsor Pack
                           </button>
                         )}
                       </div>
                     </div>
                     {workflowHelpOpen && (
                       <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                         <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Step-by-step setup</p>
                         <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3 text-sm text-slate-600">
                           <div className="flex items-start gap-3">
                             <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white border border-indigo-100 text-indigo-600"><Mail className="w-4 h-4" /></div>
                             <div><p className="font-bold text-slate-900">1. Configure email first</p><p>Go to Consultancy Settings and add an active default SMTP profile in Email Configuration.</p></div>
                           </div>
                           <div className="flex items-start gap-3">
                             <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white border border-indigo-100 text-indigo-600"><FileSignature className="w-4 h-4" /></div>
                             <div><p className="font-bold text-slate-900">2. Complete Form 956 details</p><p>Upload the agent signature and fill in agent name, MARN, office address, phone, and email in Settings.</p></div>
                           </div>
                           <div className="flex items-start gap-3">
                             <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white border border-indigo-100 text-indigo-600"><FileText className="w-4 h-4" /></div>
                             <div><p className="font-bold text-slate-900">3. Check templates and fees</p><p>Update Initial Advice template text, fee blocks, government fees, checklist items, and bank details if needed.</p></div>
                           </div>
                           <div className="flex items-start gap-3">
                             <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white border border-indigo-100 text-indigo-600"><CheckCircle2 className="w-4 h-4" /></div>
                             <div><p className="font-bold text-slate-900">4. Open the workflow and send in order</p><p>Start with Initial Advice, then Form 956, then MIA. Refresh preview before send and confirm attachments are shown.</p></div>
                           </div>
                         </div>
                         <div className="mt-4">
                           <Link to={consultancyId ? `/consultancy/settings?consultancyId=${consultancyId}` : '/consultancy/settings'} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-700 hover:underline">
                             <CircleHelp className="w-4 h-4" /> Open Settings To Configure
                           </Link>
                         </div>
                       </div>
                     )}
                     <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                       <div className="rounded-2xl border border-slate-200 bg-white p-4">
                         <Mail className="w-5 h-5 text-indigo-600 mb-2" />
                         <p className="font-black text-xs uppercase tracking-widest text-slate-800">1. Initial Advice</p>
                         <p className="mt-1 text-[11px] text-slate-500">Starts the sequence and attaches the consumer guide automatically.</p>
                       </div>
                       <div className="rounded-2xl border border-slate-200 bg-white p-4">
                         <FileSignature className="w-5 h-5 text-indigo-600 mb-2" />
                         <p className="font-black text-xs uppercase tracking-widest text-slate-800">2. Form 956</p>
                         <p className="mt-1 text-[11px] text-slate-500">Official Home Affairs PDF, pre-filled from consultancy settings and client/application data.</p>
                       </div>
                       <div className="rounded-2xl border border-slate-200 bg-white p-4">
                         <FileText className="w-5 h-5 text-indigo-600 mb-2" />
                         <p className="font-black text-xs uppercase tracking-widest text-slate-800">3. MIA</p>
                         <p className="mt-1 text-[11px] text-slate-500">Final editable agreement step in the same review flow.</p>
                       </div>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                     <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">956 Sent</p>
                       <p className="mt-1 text-sm font-bold text-slate-800">{a.compliance?.form956SentAt ? new Date(a.compliance.form956SentAt).toLocaleDateString() : 'Pending'}</p>
                     </div>
                     <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">MIA Sent</p>
                       <p className="mt-1 text-sm font-bold text-slate-800">{a.compliance?.miaSentAt ? new Date(a.compliance.miaSentAt).toLocaleDateString() : 'Pending'}</p>
                     </div>
                     <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Advice Sent</p>
                       <p className="mt-1 text-sm font-bold text-slate-800">{a.compliance?.initialAdviceSentAt ? new Date(a.compliance.initialAdviceSentAt).toLocaleDateString() : 'Pending'}</p>
                     </div>
                     <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Consumer Guide</p>
                       <div className="mt-1 flex items-center justify-between gap-2">
                         <span className="text-sm font-bold text-slate-800">{a.communicationDraft?.consumerGuideAcknowledged ? 'Received' : 'Pending'}</span>
                         <button onClick={() => handleMarkConsumerGuideReceived(a)} className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-100">
                           {a.communicationDraft?.consumerGuideAcknowledged ? 'Undo' : 'Mark received'}
                         </button>
                       </div>
                     </div>
                   </div>

                   {editingAppId === a._id && editApp && (
                     <form onSubmit={handleUpdateApplication} className="p-6 bg-slate-50 rounded-2xl border border-indigo-100 space-y-4 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Status</label><select value={editApp.status} onChange={e => setEditApp({...editApp, status: e.target.value})} className="w-full bg-white p-3 rounded-xl border border-slate-100 font-bold text-sm"><option value="ONBOARDING">Onboarding</option><option value="DRAFTING">Drafting</option><option value="REVIEW">Review</option><option value="LODGED">Lodged</option><option value="DECISION">Decision</option><option value="COMPLETED">Completed</option></select></div>
                           <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Visa Subclass</label><input value={editApp.visaSubclass} onChange={e => setEditApp({...editApp, visaSubclass: e.target.value})} className="w-full bg-white p-3 rounded-xl border border-slate-100 font-bold text-sm" /></div>
                        </div>
                        <div className="flex gap-2"><button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px]">SaveChanges</button><button type="button" onClick={() => setEditingAppId(null)} className="px-4 py-2 text-slate-500 font-bold text-[10px]">Cancel</button></div>
                     </form>
                   )}

                   {appNoteAppId === a._id && (
                     <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-4 animate-in slide-in-from-top-2">
                        <h4 className="font-black text-amber-800 text-xs uppercase flex items-center gap-2"><StickyNote className="w-4 h-4" /> Application Notes</h4>
                        <div className="space-y-2">
                           {a.notes?.map((n: any, i: number) => (
                             <div key={i} className="bg-white/50 p-3 rounded-xl border border-amber-200"><p className="text-sm font-medium text-slate-800">{n.text}</p><p className="text-[10px] font-bold text-slate-400 mt-1">{n.addedBy?.profile?.firstName} • {new Date(n.addedAt).toLocaleDateString()}</p></div>
                           ))}
                        </div>
                        <form onSubmit={e => handleAddAppNote(e, a._id)} className="flex gap-2">
                           <input value={appNoteText} onChange={e => setAppNoteText(e.target.value)} placeholder="Add note..." className="flex-1 bg-white p-3 rounded-xl border border-amber-200 text-sm outline-none" />
                           <button type="submit" disabled={addingAppNote} className="px-6 py-2 bg-amber-600 text-white rounded-xl font-black uppercase text-[10px]">{addingAppNote ? '...' : 'Add'}</button>
                        </form>
                     </div>
                   )}

                   {coeAppId === a._id && (
                     <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in slide-in-from-top-2">
                       <h4 className="font-black text-slate-800 text-xs uppercase flex items-center gap-2"><GraduationCap className="w-4 h-4 text-indigo-500" /> Confirmation of Enrolment</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-white p-3 rounded-xl border border-slate-100"><label className="text-[10px] font-black text-slate-400 uppercase">CoE Number</label><input value={coeForm.number} onChange={e => setCoeForm({...coeForm, number: e.target.value})} className="w-full font-bold text-sm text-slate-800 outline-none" /></div>
                          <div className="bg-white p-3 rounded-xl border border-slate-100"><label className="text-[10px] font-black text-slate-400 uppercase">Institution</label><input value={coeForm.institution} onChange={e => setCoeForm({...coeForm, institution: e.target.value})} className="w-full font-bold text-sm text-slate-800 outline-none" /></div>
                       </div>
                       <button onClick={handleSaveCoe} disabled={savingCoe} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all">{savingCoe ? 'Saving...' : 'Update CoE Details'}</button>
                     </div>
                   )}
                 </div>
               ))}
               {!applications.length && <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-bold italic">No visa applications logged for this client.</div>}
             </div>
          </div>
        )}

        {tab === 'task-sheet' && (
          <div className="space-y-8">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><History className="w-5 h-5 text-indigo-600" /> Full Audit Trail & History</h2>
            <div className="space-y-4">
               {activity.map((t, i) => (
                 <div key={i} className="flex gap-4 relative">
                   {i < activity.length - 1 && <div className="absolute left-6 top-10 bottom-0 w-0.5 bg-slate-100" />}
                   <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center shrink-0 z-10 text-slate-400 group-hover:border-indigo-400 transition-all"><ClipboardList className="w-5 h-5" /></div>
                   <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex-1">
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{t.action || t.source}</span>
                         <span className="text-[10px] font-bold text-slate-400">{new Date(t.changedAt || t.addedAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 leading-relaxed">{t.description || t.text}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">— {t.changedBy?.profile?.firstName || 'System'} {t.changedBy?.profile?.lastName}</p>
                   </div>
                 </div>
               ))}
               {!activity.length && <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-bold italic">No activity history found.</div>}
            </div>
          </div>
        )}

        {(tab === 'skill-assessments' || tab === 'immigration-history') && (
          <div className="p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
             <p className="font-bold text-slate-400 italic mb-4">You can now manage these directly in the "Full Profile" tab for a more integrated experience.</p>
             <button onClick={() => setTab('profile-details')} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Open Full Profile</button>
          </div>
        )}
      </div>

      {composerOpen && (
        <CommunicationComposer
          kind={composerKind}
          draft={composerDraft}
          preview={composerPreview}
          loading={composerLoading}
          sending={composerSending}
          error={composerError}
          onClose={() => setComposerOpen(false)}
          onKindChange={handleComposerKindChange}
          onChange={setComposerDraft}
          onRefresh={() => refreshComposerPreview(composerKind, composerTarget, composerDraft)}
          onSend={handleSendComposer}
        />
      )}
    </div>
  );
}

function OverviewTab({ client, onCompose, onSaveClient }: any) {
  const p = client.profile || {};
  const privacy = client.privacyConsent || {};
  const retention = client.retention || {};
  const [showWorkflowHelp, setShowWorkflowHelp] = useState(false);
  const [privacyForm, setPrivacyForm] = useState({
    dataCollection: !!privacy.dataCollection,
    dataSharing: !!privacy.dataSharing,
    marketing: !!privacy.marketing,
    consentedAt: privacy.consentedAt ? new Date(privacy.consentedAt).toISOString().slice(0, 10) : '',
    consentSource: privacy.consentSource || 'PORTAL',
    notes: privacy.notes || '',
  });
  const [retentionForm, setRetentionForm] = useState({
    archiveStatus: retention.archiveStatus || (client.status === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE'),
    archiveEligibleAt: retention.archiveEligibleAt ? new Date(retention.archiveEligibleAt).toISOString().slice(0, 10) : '',
    archiveReason: retention.archiveReason || '',
    lastReviewedAt: retention.lastReviewedAt ? new Date(retention.lastReviewedAt).toISOString().slice(0, 10) : '',
  });
  const [savingCompliance, setSavingCompliance] = useState(false);

  useEffect(() => {
    setPrivacyForm({
      dataCollection: !!client.privacyConsent?.dataCollection,
      dataSharing: !!client.privacyConsent?.dataSharing,
      marketing: !!client.privacyConsent?.marketing,
      consentedAt: client.privacyConsent?.consentedAt ? new Date(client.privacyConsent.consentedAt).toISOString().slice(0, 10) : '',
      consentSource: client.privacyConsent?.consentSource || 'PORTAL',
      notes: client.privacyConsent?.notes || '',
    });
    setRetentionForm({
      archiveStatus: client.retention?.archiveStatus || (client.status === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE'),
      archiveEligibleAt: client.retention?.archiveEligibleAt ? new Date(client.retention.archiveEligibleAt).toISOString().slice(0, 10) : '',
      archiveReason: client.retention?.archiveReason || '',
      lastReviewedAt: client.retention?.lastReviewedAt ? new Date(client.retention.lastReviewedAt).toISOString().slice(0, 10) : '',
    });
  }, [client]);

  const saveCompliance = async () => {
    setSavingCompliance(true);
    try {
      const payload: any = {
        privacyConsent: {
          ...privacyForm,
          consentedAt: privacyForm.consentedAt || undefined,
        },
        retention: {
          ...retentionForm,
          archiveEligibleAt: retentionForm.archiveEligibleAt || undefined,
          lastReviewedAt: retentionForm.lastReviewedAt || undefined,
        },
      };
      if (client.status === 'ARCHIVED' || retentionForm.archiveStatus === 'ARCHIVED') {
        payload.status = retentionForm.archiveStatus === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE';
      }
      await onSaveClient(payload);
    } finally {
      setSavingCompliance(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><Send className="w-5 h-5 text-indigo-600" /> Administrative Actions</h2>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
               <div>
                 <p className="font-black text-xs uppercase tracking-widest text-slate-800">Communication Workflow</p>
                 <p className="text-[11px] font-bold text-slate-400 mt-1">One responsive send flow: Initial Advice -&gt; Form 956 -&gt; MIA</p>
               </div>
               <div className="flex flex-wrap gap-2">
                 <button onClick={() => setShowWorkflowHelp((open) => !open)} className="px-4 py-3 border border-slate-200 bg-white text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all inline-flex items-center gap-2">
                   <CircleHelp className="w-4 h-4 text-indigo-600" />
                   {showWorkflowHelp ? 'Hide Help' : 'Setup Help'}
                 </button>
                 <button onClick={() => onCompose('INITIAL_ADVICE')} className="px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
                   Open Workflow
                 </button>
               </div>
             </div>
             {showWorkflowHelp && (
               <div className="mt-4 rounded-2xl border border-indigo-100 bg-white p-4 space-y-3">
                 <div className="flex items-start gap-3">
                   <Mail className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-600"><span className="font-bold text-slate-900">Step 1:</span> Add an active SMTP profile in Settings / Email Configuration.</p>
                 </div>
                 <div className="flex items-start gap-3">
                   <FileSignature className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-600"><span className="font-bold text-slate-900">Step 2:</span> Fill Settings / Form 956 &amp; Document Details, especially agent signature and MARN details.</p>
                 </div>
                 <div className="flex items-start gap-3">
                   <FileText className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                   <p className="text-sm text-slate-600"><span className="font-bold text-slate-900">Step 3:</span> Update Initial Advice template and bank details if your office uses custom wording or payment instructions.</p>
                 </div>
                 <div className="flex items-start gap-3">
                   <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                   <p className="text-sm text-slate-600"><span className="font-bold text-slate-900">Step 4:</span> Return here, open the workflow, refresh preview, then send each step in sequence.</p>
                 </div>
               </div>
             )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><StickyNote className="w-5 h-5 text-amber-500" /> Internal Notes</h2>
          <div className="space-y-4">
            {client.notes?.slice(0, 5).map((n: any, i: number) => (
              <div key={i} className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">{n.type}</span>
                  <span className="text-[10px] font-bold text-slate-400">{new Date(n.addedAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-medium text-slate-800 leading-relaxed">{n.text}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">— {n.addedBy?.profile?.firstName || 'Orivisa Agent'}</p>
              </div>
            ))}
            {!client.notes?.length && <p className="text-center py-8 text-slate-400 font-bold italic">No notes yet.</p>}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-indigo-50 flex items-center justify-center text-3xl font-black text-indigo-600 border border-indigo-100 overflow-hidden">
            {p.photoUrl ? (
              <img
                src={resolveFileUrl(p.photoUrl)}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <>{p.firstName?.[0]}{p.lastName?.[0]}</>
            )}
          </div>
          <h3 className="font-black text-slate-900">{p.firstName} {p.lastName}</h3>
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-1">Prospect Profile</p>
        </div>
        
        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl">
           <p className="text-white font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Compliance Status</p>
           <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase"><span className="text-slate-400">Passport</span><span className={p.passportNumber ? 'text-emerald-400' : 'text-red-400'}>{p.passportNumber ? 'Verified' : 'Missing'}</span></div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase"><span className="text-slate-400">Outbound Docs</span><span className="text-emerald-400">Use review mode</span></div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase"><span className="text-slate-400">Privacy Consent</span><span className={privacy.dataCollection && privacy.dataSharing ? 'text-emerald-400' : 'text-amber-300'}>{privacy.dataCollection && privacy.dataSharing ? 'Captured' : 'Review needed'}</span></div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase"><span className="text-slate-400">Archive Status</span><span className={retention.archiveStatus === 'ARCHIVED' ? 'text-slate-200' : retention.archiveStatus === 'READY_TO_ARCHIVE' ? 'text-amber-300' : 'text-emerald-400'}>{retention.archiveStatus || 'Active'}</span></div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="font-black text-xs uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-cyan-600" /> Privacy Consent</p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={privacyForm.dataCollection} onChange={(e) => setPrivacyForm((f) => ({ ...f, dataCollection: e.target.checked }))} /> Consent to collect/store personal data</label>
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={privacyForm.dataSharing} onChange={(e) => setPrivacyForm((f) => ({ ...f, dataSharing: e.target.checked }))} /> Consent to share data for visa processing</label>
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={privacyForm.marketing} onChange={(e) => setPrivacyForm((f) => ({ ...f, marketing: e.target.checked }))} /> Marketing updates allowed</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Consented At</label>
                <input type="date" value={privacyForm.consentedAt} onChange={(e) => setPrivacyForm((f) => ({ ...f, consentedAt: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Source</label>
                <select value={privacyForm.consentSource} onChange={(e) => setPrivacyForm((f) => ({ ...f, consentSource: e.target.value }))} className="input">
                  <option value="PORTAL">Portal</option>
                  <option value="FORM">Form</option>
                  <option value="EMAIL">Email</option>
                  <option value="VERBAL">Verbal</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Notes</label>
              <textarea value={privacyForm.notes} onChange={(e) => setPrivacyForm((f) => ({ ...f, notes: e.target.value }))} className="input min-h-[100px]" placeholder="Record how consent was collected or any privacy limitations." />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="font-black text-xs uppercase tracking-widest text-slate-800 mb-4">Retention & Archive</p>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Archive Status</label>
              <select value={retentionForm.archiveStatus} onChange={(e) => setRetentionForm((f) => ({ ...f, archiveStatus: e.target.value }))} className="input">
                <option value="ACTIVE">Active</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="READY_TO_ARCHIVE">Ready to Archive</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Archive Eligible At</label>
                <input type="date" value={retentionForm.archiveEligibleAt} onChange={(e) => setRetentionForm((f) => ({ ...f, archiveEligibleAt: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Last Reviewed</label>
                <input type="date" value={retentionForm.lastReviewedAt} onChange={(e) => setRetentionForm((f) => ({ ...f, lastReviewedAt: e.target.value }))} className="input" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Archive Reason</label>
              <textarea value={retentionForm.archiveReason} onChange={(e) => setRetentionForm((f) => ({ ...f, archiveReason: e.target.value }))} className="input min-h-[100px]" placeholder="Why this record is being reviewed or archived." />
            </div>
            <button onClick={saveCompliance} disabled={savingCompliance} className="w-full px-4 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-60">
              {savingCompliance ? 'Saving...' : 'Save Privacy & Retention'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommunicationComposer({ kind, draft, preview, loading, sending, error, onClose, onKindChange, onChange, onRefresh, onSend }: {
  kind: ComposerKind;
  draft: any;
  preview: any;
  loading: boolean;
  sending: boolean;
  error: string;
  onClose: () => void;
  onKindChange: (kind: ComposerKind) => Promise<void> | void;
  onChange: React.Dispatch<React.SetStateAction<any>>;
  onRefresh: () => void;
  onSend: () => void;
}) {
  const titleMap: Record<ComposerKind, string> = {
    FORM_956: 'Step 2 - Form 956',
    MIA: 'Step 3 - MIA Agreement',
    INITIAL_ADVICE: 'Step 1 - Initial Advice',
    SPONSOR_PACKAGE: 'Review 482 Sponsorship Package',
  };
  const isDetailed = kind === 'INITIAL_ADVICE' || kind === 'SPONSOR_PACKAGE';
  const isWorkflow = kind !== 'SPONSOR_PACKAGE';

  const updateField = (field: string, value: any) => onChange((prev: any) => ({ ...prev, [field]: value }));
  const updateForm956Field = (field: string, value: string) => onChange((prev: any) => ({
    ...prev,
    form956Profile: {
      ...(prev.form956Profile || {}),
      [field]: value,
    },
  }));
  const updateArrayValue = (field: 'checklistItems' | 'sampleAttachments', index: number, value: string) => onChange((prev: any) => {
    const next = [...(prev[field] || [])];
    next[index] = value;
    return { ...prev, [field]: next };
  });
  const removeArrayValue = (field: 'checklistItems' | 'sampleAttachments', index: number) => onChange((prev: any) => ({
    ...prev,
    [field]: (prev[field] || []).filter((_: string, i: number) => i !== index),
  }));
  const addArrayValue = (field: 'checklistItems' | 'sampleAttachments', value = '') => onChange((prev: any) => ({
    ...prev,
    [field]: [...(prev[field] || []), value],
  }));
  const updateBlocks = (field: 'feeBlocks' | 'governmentFeeBlocks', index: number, key: string, value: string) => onChange((prev: any) => {
    const next = [...(prev[field] || [])];
    next[index] = { ...next[index], [key]: value };
    return { ...prev, [field]: next };
  });
  const removeBlock = (field: 'feeBlocks' | 'governmentFeeBlocks', index: number) => onChange((prev: any) => ({
    ...prev,
    [field]: (prev[field] || []).filter((_: any, i: number) => i !== index),
  }));
  const addBlock = (field: 'feeBlocks' | 'governmentFeeBlocks') => onChange((prev: any) => ({
    ...prev,
    [field]: [...(prev[field] || []), { label: '', amount: '', description: '', payer: '' }],
  }));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-6xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[96vh] sm:max-h-[90vh] flex flex-col">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">{titleMap[kind]}</h3>
            <p className="text-sm text-slate-500 mt-1">{isWorkflow ? 'Edit and send this step, then continue through the sequence.' : 'Review the draft, attachments, and preview before sending.'}</p>
          </div>
          <button onClick={onClose} className="self-end sm:self-auto p-2 rounded-xl hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-0 flex-1 min-h-0">
          <div className="p-4 sm:p-6 overflow-y-auto xl:border-r border-slate-200 space-y-5">
            {error && <div role="alert" aria-live="assertive" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 whitespace-pre-line">{error}</div>}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Subject</label>
              <input value={draft.subject || ''} onChange={(e) => updateField('subject', e.target.value)} className="input" placeholder="Email subject" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Body / instructions</label>
              <textarea value={draft.customBody || ''} onChange={(e) => updateField('customBody', e.target.value)} className="input min-h-[180px]" placeholder="Edit the draft or leave blank to use the template." />
            </div>

            {isWorkflow && (
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Workflow Steps</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {WORKFLOW_STEPS.map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => onKindChange(step)}
                      className={`px-4 py-3 rounded-2xl border text-left transition-all ${kind === step ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'}`}
                    >
                      <p className="font-black text-[10px] uppercase tracking-widest">{step === 'INITIAL_ADVICE' ? 'Initial Advice' : step === 'FORM_956' ? 'Form 956' : 'MIA'}</p>
                      <p className={`mt-1 text-[11px] ${kind === step ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {step === 'INITIAL_ADVICE' ? 'Consumer guide auto attached' : step === 'FORM_956' ? 'Official pre-filled PDF' : 'Final agreement step'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {kind === 'INITIAL_ADVICE' && (
              <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Initial Advice Attachments</p>
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input type="checkbox" checked={draft.includeConsumerGuide !== false} onChange={(e) => updateField('includeConsumerGuide', e.target.checked)} className="mt-1 rounded" />
                  <span>
                    <span className="font-semibold text-slate-900 block">Attach Consumer Guide PDF</span>
                    <span className="text-slate-500">Automatically included for MARA compliance.</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input type="checkbox" checked={!!draft.includeForm956Attachment} onChange={(e) => updateField('includeForm956Attachment', e.target.checked)} className="mt-1 rounded" />
                  <span>
                    <span className="font-semibold text-slate-900 block">Also attach auto-filled Form 956 PDF</span>
                    <span className="text-slate-500">Include the official pre-filled Form 956 in the first email, while still keeping a separate Form 956 step.</span>
                  </span>
                </label>
              </div>
            )}

            {kind === 'FORM_956' && (
              <Form956DetailsEditor
                profile={draft.form956Profile || {}}
                onChange={updateForm956Field}
              />
            )}

            {isDetailed && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Occupation</label>
                    <input value={draft.occupation || ''} onChange={(e) => updateField('occupation', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">ANZSCO</label>
                    <input value={draft.anzscoCode || ''} onChange={(e) => updateField('anzscoCode', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Position title</label>
                    <input value={draft.positionTitle || ''} onChange={(e) => updateField('positionTitle', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">SBS status</label>
                    <input value={draft.sbsStatus || ''} onChange={(e) => updateField('sbsStatus', e.target.value)} className="input" />
                  </div>
                </div>

                <ComposerBlocksEditor title="Professional fee blocks" blocks={draft.feeBlocks || []} onAdd={() => addBlock('feeBlocks')} onRemove={(i: number) => removeBlock('feeBlocks', i)} onChange={(i: number, key: string, value: string) => updateBlocks('feeBlocks', i, key, value)} showPayer={false} />
                <ComposerBlocksEditor title="Government fees" blocks={draft.governmentFeeBlocks || []} onAdd={() => addBlock('governmentFeeBlocks')} onRemove={(i: number) => removeBlock('governmentFeeBlocks', i)} onChange={(i: number, key: string, value: string) => updateBlocks('governmentFeeBlocks', i, key, value)} showPayer />
                <ComposerListEditor title="Checklist items" items={draft.checklistItems || []} onAdd={() => addArrayValue('checklistItems')} onRemove={(i: number) => removeArrayValue('checklistItems', i)} onChange={(i: number, value: string) => updateArrayValue('checklistItems', i, value)} />
              </>
            )}

            {kind === 'SPONSOR_PACKAGE' && (
              <ComposerListEditor title="Sample attachments" items={draft.sampleAttachments || []} onAdd={() => addArrayValue('sampleAttachments')} onRemove={(i: number) => removeArrayValue('sampleAttachments', i)} onChange={(i: number, value: string) => updateArrayValue('sampleAttachments', i, value)} />
            )}
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">Recipient</p>
                  <p className="text-sm font-bold text-slate-900 mt-1 break-all">{preview?.to || '—'}</p>
                </div>
                <button onClick={onRefresh} disabled={loading || sending} className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-black text-xs uppercase hover:bg-slate-50 disabled:opacity-50">
                  {loading ? 'Refreshing...' : 'Refresh Preview'}
                </button>
              </div>
              <div className="mt-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Attachments</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(preview?.attachments || []).map((item: any) => (
                    <span key={item.name} className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700">{item.name}</span>
                  ))}
                  {!(preview?.attachments || []).length && <span className="text-sm text-slate-500">No file attachments.</span>}
                </div>
                {preview?.consumerGuideLink && <p className="text-xs text-slate-500 mt-3">Official Consumer Guide link included: {preview.consumerGuideLink}</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">HTML Preview</p>
              </div>
              <div aria-live="polite" className="p-4 max-h-[45vh] xl:max-h-[420px] overflow-y-auto break-words">
                {preview?.html ? (
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: preview.html }} />
                ) : (
                  <p className="text-sm text-slate-500">Preview will appear here.</p>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button onClick={onClose} className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">Close</button>
              <button onClick={onSend} disabled={loading || sending} className="w-full sm:w-auto px-5 py-2 rounded-xl bg-indigo-600 text-white font-black hover:bg-indigo-700 disabled:opacity-50">
                {sending ? 'Sending...' : 'Send Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Form956DetailsEditor({ profile, onChange }: { profile: any; onChange: (field: string, value: string) => void }) {
  const baseId = useId();

  const renderSelect = (field: string, label: string, options: string[], hint: string) => {
    const id = `${baseId}-${field}`;
    const hintId = `${id}-hint`;
    return (
      <div>
        <label htmlFor={id} className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">{label}</label>
        <select
          id={id}
          value={profile?.[field] || ''}
          onChange={(e) => onChange(field, e.target.value)}
          aria-describedby={hintId}
          className="input"
        >
          <option value="">Select</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <p id={hintId} className="mt-1 text-xs text-slate-500">{hint}</p>
      </div>
    );
  };

  const renderInput = (field: string, label: string, type = 'text', autoComplete?: string, hint?: string) => {
    const id = `${baseId}-${field}`;
    const hintId = `${id}-hint`;
    return (
      <div>
        <label htmlFor={id} className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">{label}</label>
        <input
          id={id}
          type={type}
          value={profile?.[field] || ''}
          onChange={(e) => onChange(field, e.target.value)}
          autoComplete={autoComplete}
          aria-describedby={hint ? hintId : undefined}
          className="input"
        />
        {hint && <p id={hintId} className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
    );
  };

  return (
    <fieldset className="rounded-2xl border border-slate-200 p-4 space-y-4" aria-describedby={`${baseId}-desc`}>
      <legend className="px-2 text-xs font-black uppercase tracking-widest text-slate-500">Form 956 Recipient Details</legend>
      <p id={`${baseId}-desc`} className="text-sm text-slate-600">
        These fields are auto-filled from the client profile. Update them only if this specific matter needs different details, similar to an ImmiAccount-style form review.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderSelect('title', 'Title', TITLE_OPTIONS, 'Used as the recipient title for this Form 956 matter.')}
        {renderSelect('preferredLanguage', 'Preferred Language', LANGUAGE_OPTIONS, 'Helps staff review what language the client or contact prefers.')}
        {renderSelect('gender', 'Gender', GENDER_OPTIONS, 'Keeps the matter-specific Form 956 profile aligned with the recipient details.')}
        {renderSelect('nationality', 'Nationality', COUNTRY_OPTIONS, 'Select the nationality used for this appointment record.')}
        {renderSelect('countryOfBirth', 'Country of Birth', COUNTRY_OPTIONS, 'Used to review identity details before sending the PDF.')}
        {renderSelect('passportCountry', 'Passport Country', COUNTRY_OPTIONS, 'Select the issuing country of the passport.')}
        {renderSelect('countryOfResidence', 'Country of Residence', COUNTRY_OPTIONS, 'Used when confirming the current country for the recipient.')}
        {renderInput('phone', 'Recipient Phone', 'text', 'tel', 'Override the phone number for this matter if needed.')}
        <div className="md:col-span-2">
          {renderInput('email', 'Recipient Email', 'email', 'email', 'Override the recipient email only if the matter should be sent to a different address.')}
        </div>
      </div>
    </fieldset>
  );
}

function ComposerBlocksEditor({ title, blocks, onAdd, onRemove, onChange, showPayer = false }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">{title}</p>
        <button type="button" onClick={onAdd} className="text-xs font-black uppercase text-indigo-600">Add block</button>
      </div>
      <div className="space-y-3">
        {blocks.map((block: any, index: number) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <input value={block.label || ''} onChange={(e) => onChange(index, 'label', e.target.value)} className="input md:col-span-1" placeholder="Label" />
            <input value={block.amount || ''} onChange={(e) => onChange(index, 'amount', e.target.value)} className="input md:col-span-1" placeholder="Amount" />
            <input value={block.description || ''} onChange={(e) => onChange(index, 'description', e.target.value)} className="input md:col-span-1" placeholder="Description" />
            <div className="flex flex-col sm:flex-row gap-2">
              {showPayer && <input value={block.payer || ''} onChange={(e) => onChange(index, 'payer', e.target.value)} className="input flex-1" placeholder="Payer" />}
              <button type="button" onClick={() => onRemove(index)} className="px-3 rounded-xl border border-rose-200 text-rose-700 font-black text-xs hover:bg-rose-50">Remove</button>
            </div>
          </div>
        ))}
        {!blocks.length && <p className="text-sm text-slate-500">No blocks added yet.</p>}
      </div>
    </div>
  );
}

function ComposerListEditor({ title, items, onAdd, onRemove, onChange }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">{title}</p>
        <button type="button" onClick={onAdd} className="text-xs font-black uppercase text-indigo-600">Add item</button>
      </div>
      <div className="space-y-2">
        {items.map((item: string, index: number) => (
          <div key={index} className="flex flex-col sm:flex-row gap-2">
            <input value={item || ''} onChange={(e) => onChange(index, e.target.value)} className="input flex-1" placeholder="Value" />
            <button type="button" onClick={() => onRemove(index)} className="px-3 rounded-xl border border-rose-200 text-rose-700 font-black text-xs hover:bg-rose-50">Remove</button>
          </div>
        ))}
        {!items.length && <p className="text-sm text-slate-500">No items added yet.</p>}
      </div>
    </div>
  );
}
