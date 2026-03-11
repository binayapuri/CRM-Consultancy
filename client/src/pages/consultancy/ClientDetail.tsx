import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch, safeJson } from '../../store/auth';
import { format } from 'date-fns';
import { ArrowLeft, Edit2, Trash2, Mail, Plus, Pencil, X, FileText, Download, Upload, CheckCircle, Clock, StickyNote, ClipboardList, Award, History, User, GraduationCap, Users, Send, FileSignature, Plane } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuthStore } from '../../store/auth';

type Tab = 'overview' | 'documents' | 'applications' | 'task-sheet' | 'skill-assessments' | 'immigration-history';

export default function ClientDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [client, setClient] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [showAddApp, setShowAddApp] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [newAppVisa, setNewAppVisa] = useState('500');
  const [newAppSponsor, setNewAppSponsor] = useState('');
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [editApp, setEditApp] = useState<{ visaSubclass: string; status: string; stageDeadline?: string; sponsorId?: string } | null>(null);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [uploadForm, setUploadForm] = useState({ type: 'PASSPORT', applicationId: '' as string, file: null as File | null });
  const [uploading, setUploading] = useState(false);
  const [activity, setActivity] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState('GENERAL');
  const [addingNote, setAddingNote] = useState(false);
  const [editingNoteIdx, setEditingNoteIdx] = useState<number | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [newActivity, setNewActivity] = useState({ text: '', type: 'DAILY_UPDATE' });
  const [addingActivity, setAddingActivity] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editActivityText, setEditActivityText] = useState('');
  const [editActivityType, setEditActivityType] = useState('DAILY_UPDATE');
  const [savingActivity, setSavingActivity] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [showAddSkillAssessment, setShowAddSkillAssessment] = useState(false);
  const [showAddImmigration, setShowAddImmigration] = useState(false);
  const [newSkillAssessment, setNewSkillAssessment] = useState({ body: 'ACS', occupation: '' });
  const [newImmigration, setNewImmigration] = useState({ type: 'RFI', description: '', responseDue: '' });
  const [appNoteAppId, setAppNoteAppId] = useState<string | null>(null);
  const [appNoteText, setAppNoteText] = useState('');
  const [addingAppNote, setAddingAppNote] = useState(false);
  const [marking956, setMarking956] = useState<string | null>(null);
  const [coeAppId, setCoeAppId] = useState<string | null>(null);
  const [coeForm, setCoeForm] = useState({ number: '', institution: '', courseName: '', courseCode: '', issueDate: '', expiryDate: '', status: 'ACTIVE' });
  const [savingCoe, setSavingCoe] = useState(false);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [editingFamilyIdx, setEditingFamilyIdx] = useState<number | null>(null);
  const emptyTravel = { country: '', dateFrom: '', dateTo: '', purpose: 'TOURISM', visaType: '', notes: '' };
  const [newFamily, setNewFamily] = useState({ relationship: 'SPOUSE', firstName: '', lastName: '', dob: '', nationality: '', passportNumber: '', passportExpiry: '', includedInApplication: false, visaStatus: '', notes: '', travelHistory: [] as any[] });
  const [editFamily, setEditFamily] = useState<any>(null);
  const [savingFamily, setSavingFamily] = useState(false);
  const [sendingDoc, setSendingDoc] = useState<string | null>(null);

  useEffect(() => {
    if (!id || id === 'undefined') {
      navigate('/consultancy/clients', { replace: true });
      return;
    }
    authFetch(`/api/clients/${id}`)
      .then(r => safeJson<any>(r))
      .then(data => { if ((data as any).error) throw new Error((data as any).error); setClient(data); })
      .catch(() => navigate('/consultancy/clients', { replace: true }));
    authFetch(`/api/clients/${id}/applications`).then(r => safeJson<any[]>(r)).then(setApplications);
    authFetch('/api/constants/document-types').then(r => safeJson<any[]>(r)).then(setDocTypes);
    authFetch('/api/sponsors').then(r => safeJson<any[]>(r)).then(setSponsors).catch(() => []);
    if (id) {
      authFetch(`/api/clients/${id}/activity`).then(r => safeJson<any[]>(r)).then(setActivity);
    }
  }, [id]);

  useEffect(() => {
    if (id && tab === 'documents') {
      authFetch(`/api/documents?clientId=${id}`).then(r => safeJson<any[]>(r)).then(setDocuments);
    }
    if (id && tab === 'task-sheet') {
      authFetch(`/api/clients/${id}/activity`).then(r => safeJson<any[]>(r)).then(setActivity);
    }
  }, [id, tab]);

  const fetchApplications = () => authFetch(`/api/clients/${id}/applications`).then(r => safeJson<any[]>(r)).then(setApplications);

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
      const payload = {
        coe: {
          ...coeForm,
          issueDate: coeForm.issueDate ? new Date(coeForm.issueDate).toISOString() : undefined,
          expiryDate: coeForm.expiryDate ? new Date(coeForm.expiryDate).toISOString() : undefined,
        },
      };
      const res = await authFetch(`/api/applications/${coeAppId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await safeJson<{ error?: string }>(res)).error);
      setCoeAppId(null);
      fetchApplications();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSavingCoe(false);
    }
  };

  const handleMarkForm956 = async (appId: string) => {
    setMarking956(appId);
    try {
      const res = await authFetch(`/api/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form956Signed: true, form956SignedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error((await safeJson<{ error?: string }>(res)).error);
      fetchApplications();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setMarking956(null);
    }
  };

  const handleAddAppNote = async (e: React.FormEvent, appId: string) => {
    e.preventDefault();
    if (!appNoteText.trim()) return;
    setAddingAppNote(true);
    try {
      const res = await authFetch(`/api/applications/${appId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: appNoteText }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      setAppNoteText('');
      setAppNoteAppId(null);
      fetchApplications();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setAddingAppNote(false);
    }
  };

  const handleDeleteApplication = async (appId: string) => {
    if (!confirm('Delete this application?')) return;
    try {
      const res = await authFetch(`/api/applications/${appId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await safeJson<{ error?: string }>(res)).error);
      fetchApplications();
    } catch (e) {
      alert((e as Error).message);
    }
  };
  const fetchDocuments = () => authFetch(`/api/documents?clientId=${id}`).then(r => safeJson<any[]>(r)).then(setDocuments);

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: id, visaSubclass: newAppVisa, status: 'ONBOARDING', sponsorId: newAppSponsor || undefined }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      setShowAddApp(false);
      fetchApplications();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this client? Only admins can delete.')) return;
    try {
      await authFetch(`/api/clients/${id}`, { method: 'DELETE' });
      navigate('/consultancy/clients');
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const [sendingInvite, setSendingInvite] = useState(false);
  const handleInvite = async () => {
    setSendingInvite(true);
    try {
      const res = await authFetch(`/api/clients/${id}/invite`, { method: 'POST' });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      alert(data.emailed ? 'Invitation emailed to client.' : `Invitation link: ${data.inviteLink}`);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSendingInvite(false);
    }
  };

  const startEditApp = (a: any) => {
    setEditingAppId(a._id);
    setEditApp({
      visaSubclass: a.visaSubclass,
      status: a.status,
      stageDeadline: a.stageDeadline ? new Date(a.stageDeadline).toISOString().slice(0, 10) : '',
      sponsorId: a.sponsorId?._id || a.sponsorId || '',
    });
  };
  const cancelEditApp = () => { setEditingAppId(null); setEditApp(null); };
  const handleUpdateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppId || !editApp) return;
    try {
      const payload: Record<string, unknown> = { visaSubclass: editApp.visaSubclass, status: editApp.status };
      if (editApp.stageDeadline) payload.stageDeadline = new Date(editApp.stageDeadline).toISOString();
      if (editApp.sponsorId !== undefined) payload.sponsorId = editApp.sponsorId || null;
      const res = await authFetch(`/api/applications/${editingAppId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      cancelEditApp();
      fetchApplications();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadForm.file);
      fd.append('clientId', id!);
      fd.append('type', uploadForm.type);
      if (uploadForm.applicationId) fd.append('applicationId', uploadForm.applicationId);
      const res = await authFetch('/api/documents/upload', { method: 'POST', body: fd });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      setShowUpload(false);
      setUploadForm({ type: 'PASSPORT', applicationId: '', file: null });
      fetchDocuments();
      fetchApplications();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (docId: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      const res = await authFetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await safeJson<{ error?: string }>(res)).error);
      fetchDocuments();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await authFetch(`/api/clients/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newNote, type: newNoteType }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      setClient(data);
      setNewNote('');
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setAddingNote(false);
    }
  };

  const handleEditNote = async (idx: number) => {
    if (editNoteText === (client?.notes?.[idx]?.text || '')) { setEditingNoteIdx(null); return; }
    setSavingNote(true);
    try {
      const res = await authFetch(`/api/clients/${id}/notes/${idx}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editNoteText }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      setClient(data);
      setEditingNoteIdx(null);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (idx: number) => {
    if (!confirm('Delete this note?')) return;
    try {
      const res = await authFetch(`/api/clients/${id}/notes/${idx}`, { method: 'DELETE' });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      setClient(data);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.text.trim() || !id) return;
    setAddingActivity(true);
    try {
      const res = await authFetch(`/api/clients/${id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newActivity.text.trim(), type: newActivity.type }),
      });
      const data = await safeJson<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error || 'Failed to add activity');
      setNewActivity({ text: '', type: 'DAILY_UPDATE' });
      authFetch(`/api/clients/${id}/activity`).then(r => safeJson<any[]>(r)).then(setActivity);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setAddingActivity(false);
    }
  };

  const handleEditActivity = async () => {
    if (!editingActivityId || !id) return;
    setSavingActivity(true);
    try {
      await authFetch(`/api/clients/${id}/activities/${editingActivityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editActivityText, type: editActivityType }),
      });
      setEditingActivityId(null);
      authFetch(`/api/clients/${id}/activity`).then(r => safeJson<any[]>(r)).then(setActivity);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSavingActivity(false);
    }
  };

  const handleDeleteActivity = async (aid: string) => {
    if (!confirm('Delete this activity entry?')) return;
    try {
      await authFetch(`/api/clients/${id}/activities/${aid}`, { method: 'DELETE' });
      if (id) authFetch(`/api/clients/${id}/activity`).then(r => safeJson<any[]>(r)).then(setActivity);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('clientId', id);
      fd.append('type', 'PHOTO');
      const res = await authFetch('/api/documents/upload', { method: 'POST', body: fd });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      setClient((c: any) => ({ ...c, profile: { ...c.profile, photoUrl: data.fileUrl } }));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };
  const uploadSignature = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploadingSig(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('clientId', id);
      fd.append('type', 'CLIENT_SIGNATURE');
      const res = await authFetch('/api/documents/upload', { method: 'POST', body: fd });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      setClient((c: any) => ({ ...c, profile: { ...c.profile, signatureUrl: data.fileUrl } }));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUploadingSig(false);
      e.target.value = '';
    }
  };

  const handleAddSkillAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillAssessment.body.trim()) return;
    try {
      const res = await authFetch(`/api/clients/${id}/skill-assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSkillAssessment),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      setClient(data);
      setShowAddSkillAssessment(false);
      setNewSkillAssessment({ body: 'ACS', occupation: '' });
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleAddImmigration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch(`/api/clients/${id}/immigration-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newImmigration.type,
          description: newImmigration.description,
          responseDue: newImmigration.responseDue ? new Date(newImmigration.responseDue) : undefined,
          requestedBy: 'Department of Home Affairs',
        }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      setClient(data);
      setShowAddImmigration(false);
      setNewImmigration({ type: 'RFI', description: '', responseDue: '' });
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const updateSkillAssessmentStatus = async (idx: number, status: string) => {
    try {
      const res = await authFetch(`/api/clients/${id}/skill-assessments/${idx}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      setClient(data);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const updateImmigrationStatus = async (idx: number, status: string) => {
    try {
      const res = await authFetch(`/api/clients/${id}/immigration-history/${idx}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      setClient(data);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamily.firstName && !newFamily.lastName) return;
    setSavingFamily(true);
    try {
      const members = [...(client?.familyMembers || []), {
        relationship: newFamily.relationship,
        firstName: newFamily.firstName,
        lastName: newFamily.lastName,
        dob: newFamily.dob ? new Date(newFamily.dob).toISOString() : undefined,
        nationality: newFamily.nationality || undefined,
        passportNumber: newFamily.passportNumber || undefined,
        passportExpiry: newFamily.passportExpiry ? new Date(newFamily.passportExpiry).toISOString() : undefined,
        includedInApplication: newFamily.includedInApplication,
        visaStatus: newFamily.visaStatus || undefined,
        notes: newFamily.notes || undefined,
      }];
      const res = await authFetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyMembers: members }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      setClient(data);
      setShowAddFamily(false);
      setNewFamily({ relationship: 'SPOUSE', firstName: '', lastName: '', dob: '', nationality: '', passportNumber: '', passportExpiry: '', includedInApplication: false, visaStatus: '', notes: '', travelHistory: [] });
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSavingFamily(false);
    }
  };

  const handleUpdateFamilyMember = async (idx: number) => {
    if (!editFamily) return;
    setSavingFamily(true);
    try {
      const members = [...(client?.familyMembers || [])];
      members[idx] = {
        ...members[idx],
        relationship: editFamily.relationship,
        firstName: editFamily.firstName,
        lastName: editFamily.lastName,
        dob: editFamily.dob ? new Date(editFamily.dob).toISOString() : undefined,
        nationality: editFamily.nationality || undefined,
        passportNumber: editFamily.passportNumber || undefined,
        passportExpiry: editFamily.passportExpiry ? new Date(editFamily.passportExpiry).toISOString() : undefined,
        includedInApplication: editFamily.includedInApplication,
        visaStatus: editFamily.visaStatus || undefined,
        notes: editFamily.notes || undefined,
        travelHistory: (editFamily.travelHistory || []).filter((t: any) => t.country).map((t: any) => ({ country: t.country, dateFrom: t.dateFrom ? new Date(t.dateFrom).toISOString() : undefined, dateTo: t.dateTo ? new Date(t.dateTo).toISOString() : undefined, purpose: t.purpose, visaType: t.visaType || undefined, notes: t.notes || undefined })),
      };
      const res = await authFetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyMembers: members }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      setClient(data);
      setEditingFamilyIdx(null);
      setEditFamily(null);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSavingFamily(false);
    }
  };

  const handleDeleteFamilyMember = async (idx: number) => {
    if (!confirm('Remove this family member?')) return;
    try {
      const members = (client?.familyMembers || []).filter((_: any, i: number) => i !== idx);
      const res = await authFetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyMembers: members }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      setClient(data);
      setEditingFamilyIdx(null);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const canDelete = ['SUPER_ADMIN', 'CONSULTANCY_ADMIN'].includes(user?.role || '');
  const sendForm956 = async () => {
    setSendingDoc('956');
    try {
      const res = await authFetch(`/api/clients/${id}/send-form956`, { method: 'POST' });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      alert('Form 956 sent to client email');
    } catch (e) { alert((e as Error).message); } finally { setSendingDoc(null); }
  };
  const sendMIA = async () => {
    setSendingDoc('mia');
    try {
      const res = await authFetch(`/api/clients/${id}/send-mia`, { method: 'POST' });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      alert('MIA Agreement sent to client email');
    } catch (e) { alert((e as Error).message); } finally { setSendingDoc(null); }
  };
  const sendInitialAdvice = async () => {
    setSendingDoc('advice');
    try {
      const res = await authFetch(`/api/clients/${id}/send-initial-advice`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error);
      alert('Initial advice & fee estimation sent to client email');
    } catch (e) { alert((e as Error).message); } finally { setSendingDoc(null); }
  };

  if (!client) return <div className="flex items-center gap-2 text-slate-500"><LoadingSpinner size="sm" /> Loading...</div>;

  const p = client.profile || {};
  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: User },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'applications', label: 'Applications', icon: null },
    { key: 'task-sheet', label: 'Task Sheet', icon: ClipboardList },
    { key: 'skill-assessments', label: 'Skill Assessments', icon: Award },
    { key: 'immigration-history', label: 'Immigration History', icon: History },
  ];

  return (
    <div>
      <Link to={consultancyId ? `/consultancy/clients?consultancyId=${consultancyId}` : '/consultancy/clients'} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Clients
      </Link>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">{p.firstName} {p.lastName}</h1>
          <p className="text-slate-500">{p.email}</p>
        </div>
        <div className="flex gap-2">
          <Link to={consultancyId ? `/consultancy/clients/${id}/edit?consultancyId=${consultancyId}` : `/consultancy/clients/${id}/edit`} className="btn-primary flex items-center gap-2"><Edit2 className="w-4 h-4" /> Edit</Link>
          {!client.userId && <button onClick={handleInvite} disabled={sendingInvite} className="btn-secondary flex items-center gap-2"><Mail className="w-4 h-4" /> {sendingInvite ? 'Sending...' : 'Send Invitation'}</button>}
          {canDelete && <button onClick={handleDelete} className="btn-secondary flex items-center gap-2 text-red-600"><Trash2 className="w-4 h-4" /> Delete</button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit mb-6 overflow-x-auto max-w-full">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition ${tab === key ? 'bg-white shadow text-ori-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab - Immigration application draft style */}
      {tab === 'overview' && (
        <>
          {/* Header: Name + Photo & Signature small on right */}
          <div className="flex items-start justify-between gap-6 mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-display font-bold text-slate-900">{p.firstName} {p.lastName}</h1>
              <p className="text-slate-500">{p.email}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <label className="cursor-pointer group" title="Photo">
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt="Client" className="w-16 h-16 rounded-lg object-cover border border-slate-200 group-hover:opacity-90 transition" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-200 transition"><User className="w-8 h-8" /></div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} disabled={uploadingPhoto} />
              </label>
              <label className="cursor-pointer group" title="Signature">
                {p.signatureUrl ? (
                  <img src={p.signatureUrl} alt="Signature" className="w-20 h-12 object-contain border border-slate-200 rounded group-hover:opacity-90 transition" />
                ) : (
                  <div className="w-20 h-12 rounded bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs group-hover:bg-slate-100 transition">Sign</div>
                )}
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={uploadSignature} disabled={uploadingSig} />
              </label>
            </div>
          </div>

          {/* Send Documents */}
          {client.profile?.email && (
            <div className="card mb-6">
              <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Send className="w-5 h-5 text-ori-600" /> Send Documents to Client
              </h2>
              <p className="text-slate-600 text-sm mb-4">Automated emails with consultancy details. Configure agent details and signature in Settings.</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={sendForm956} disabled={!!sendingDoc} className="btn-secondary flex items-center gap-2">
                  <FileSignature className="w-4 h-4" /> {sendingDoc === '956' ? 'Sending...' : 'Send Form 956'}
                </button>
                <button onClick={sendMIA} disabled={!!sendingDoc} className="btn-secondary flex items-center gap-2">
                  <FileText className="w-4 h-4" /> {sendingDoc === 'mia' ? 'Sending...' : 'Send MIA Agreement'}
                </button>
                <button onClick={sendInitialAdvice} disabled={!!sendingDoc} className="btn-secondary flex items-center gap-2">
                  <Mail className="w-4 h-4" /> {sendingDoc === 'advice' ? 'Sending...' : 'Send Initial Advice & Fee'}
                </button>
              </div>
            </div>
          )}

          {/* Notes - on top */}
          <div className="card mb-6">
            <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-ori-600" />
              Notes
            </h2>
            {client.initialNotes && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 mb-4">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-xs text-slate-500 mb-1">Initial notes</p>
                  <Link to={`/consultancy/clients/${id}/edit`} className="text-ori-600 hover:text-ori-700 text-xs flex items-center gap-1 shrink-0"><Pencil className="w-3 h-3" /> Edit</Link>
                </div>
                <p className="text-sm text-slate-800">{client.initialNotes}</p>
              </div>
            )}
            <form onSubmit={handleAddNote} className="flex flex-col sm:flex-row gap-2 mb-4">
              <select value={newNoteType} onChange={e => setNewNoteType(e.target.value)} className="input w-full sm:w-40">
                <option value="GENERAL">General</option>
                <option value="DAILY_UPDATE">Daily Update</option>
                <option value="COMMUNICATION">Communication</option>
                <option value="EXTERNAL_WORK">External Work</option>
                <option value="TASK_STATUS">Task Status</option>
                <option value="OTHER">Other</option>
              </select>
              <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add notes about client here..." className="input flex-1" />
              <button type="submit" className="btn-primary shrink-0" disabled={addingNote || !newNote.trim()}>{addingNote ? 'Adding...' : 'Add Note'}</button>
            </form>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(client.notes || []).map((n: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-amber-50 border border-amber-100 group">
                  {editingNoteIdx === i ? (
                    <div className="space-y-2">
                      <textarea value={editNoteText} onChange={e => setEditNoteText(e.target.value)} className="input text-sm min-h-[60px]" rows={3} />
                      <div className="flex gap-2">
                        <button onClick={() => handleEditNote(i)} disabled={savingNote} className="btn-primary text-sm">{savingNote ? 'Saving...' : 'Save'}</button>
                        <button onClick={() => setEditingNoteIdx(null)} className="btn-secondary text-sm">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-600">{n.type || 'GENERAL'}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => { setEditingNoteIdx(i); setEditNoteText(n.text); }} className="p-1.5 rounded hover:bg-amber-100 text-slate-600" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteNote(i)} className="p-1.5 rounded hover:bg-red-100 text-red-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-800 mt-1">{n.text}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {n.addedBy?.profile?.firstName} {n.addedBy?.profile?.lastName} • {format(new Date(n.addedAt || n.createdAt), 'dd MMM yyyy HH:mm')}
                        {n.editedAt && ` • Edited ${format(new Date(n.editedAt), 'dd MMM HH:mm')}`}
                      </p>
                    </>
                  )}
                </div>
              ))}
              {(!client.notes || client.notes.length === 0) && !client.initialNotes && <p className="text-slate-500 text-sm italic">No notes yet. Add notes about client above, or set initial notes in Edit.</p>}
            </div>
          </div>

          {/* Immigration-style sections - all info with edit links */}
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-slate-900">1. Personal Details</h2>
                <Link to={`/consultancy/clients/${id}/edit`} className="text-ori-600 hover:underline text-sm flex items-center gap-1"><Pencil className="w-4 h-4" /> Edit</Link>
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div><span className="text-slate-500 block">Name</span><span className="font-medium">{p.firstName} {p.lastName}</span></div>
                <div><span className="text-slate-500 block">Email</span><span>{p.email}</span></div>
                <div><span className="text-slate-500 block">Phone</span><span>{p.phone || '-'}</span></div>
                <div><span className="text-slate-500 block">DOB</span><span>{p.dob ? format(new Date(p.dob), 'dd MMM yyyy') : '-'}</span></div>
                <div><span className="text-slate-500 block">Gender</span><span>{p.gender || '-'}</span></div>
                <div><span className="text-slate-500 block">Nationality</span><span>{p.nationality || '-'}</span></div>
                <div><span className="text-slate-500 block">Marital Status</span><span>{p.maritalStatus || '-'}</span></div>
                <div><span className="text-slate-500 block">Assigned Agent</span><span>{client.assignedAgentId ? `${client.assignedAgentId.profile?.firstName} ${client.assignedAgentId.profile?.lastName}` : '-'}</span></div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-slate-900">2. Identity & Travel</h2>
                <Link to={`/consultancy/clients/${id}/edit`} className="text-ori-600 hover:underline text-sm flex items-center gap-1"><Pencil className="w-4 h-4" /> Edit</Link>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500 block">Passport</span><span>{p.passportNumber || '-'} {p.passportCountry ? `(${p.passportCountry})` : ''} {p.passportExpiry ? `exp ${format(new Date(p.passportExpiry), 'dd/MM/yy')}` : ''}</span></div>
                <div><span className="text-slate-500 block">Current Visa</span><span>{p.currentVisa || '-'} {p.visaExpiry ? `(exp ${format(new Date(p.visaExpiry), 'dd MMM yyyy')})` : ''}</span></div>
                {(p.address?.street || p.address?.city) && <div className="md:col-span-2"><span className="text-slate-500 block">Address</span><span>{[p.address?.street, p.address?.city, p.address?.state, p.address?.postcode, p.address?.country].filter(Boolean).join(', ')}</span></div>}
              </div>
            </div>

            {(client.englishTest?.testType || client.englishTest?.type) && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-semibold text-slate-900">3. English Test</h2>
                  <Link to={`/consultancy/clients/${id}/edit`} className="text-ori-600 hover:underline text-sm flex items-center gap-1"><Pencil className="w-4 h-4" /> Edit</Link>
                </div>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-slate-500 block">Test</span><span>{(client.englishTest.testType || client.englishTest.type)} - {client.englishTest.score}</span></div>
                  <div><span className="text-slate-500 block">Test Date</span><span>{client.englishTest.testDate && format(new Date(client.englishTest.testDate), 'dd MMM yyyy')}</span></div>
                  <div><span className="text-slate-500 block">Expiry</span><span>{client.englishTest.expiryDate && format(new Date(client.englishTest.expiryDate), 'dd MMM yyyy')}</span></div>
                </div>
              </div>
            )}

          <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-slate-900">4. Education</h2>
                <Link to={`/consultancy/clients/${id}/edit`} className="text-ori-600 hover:underline text-sm flex items-center gap-1"><Pencil className="w-4 h-4" /> Edit</Link>
              </div>
              {client.education?.length > 0 ? (
                <div className="space-y-3">
                  {client.education.map((e: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-50 border-l-2 border-ori-500">
                      <p className="font-medium">{e.qualification} — {e.institution}</p>
                      <p className="text-sm text-slate-500">{e.fieldOfStudy} • {e.country} • {e.startDate && format(new Date(e.startDate), 'yyyy')} — {e.endDate ? format(new Date(e.endDate), 'yyyy') : 'Present'}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-500 text-sm">No education recorded. <Link to={`/consultancy/clients/${id}/edit`} className="text-ori-600 hover:underline">Add</Link></p>}
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-slate-900">5. Work Experience</h2>
                <Link to={`/consultancy/clients/${id}/edit`} className="text-ori-600 hover:underline text-sm flex items-center gap-1"><Pencil className="w-4 h-4" /> Edit</Link>
              </div>
              {client.experience?.length > 0 ? (
                <div className="space-y-3">
                  {client.experience.map((e: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-50 border-l-2 border-ori-500">
                      <p className="font-medium">{e.role} at {e.employer}</p>
                      <p className="text-sm text-slate-500">{e.country} • {e.startDate && format(new Date(e.startDate), 'yyyy')} — {e.isCurrent ? 'Present' : e.endDate ? format(new Date(e.endDate), 'yyyy') : '-'}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-500 text-sm">No experience recorded. <Link to={`/consultancy/clients/${id}/edit`} className="text-ori-600 hover:underline">Add</Link></p>}
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-slate-900 flex items-center gap-2"><Users className="w-5 h-5 text-ori-600" /> Family Members</h2>
                <button type="button" onClick={() => setShowAddFamily(true)} className="btn-secondary text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
              </div>
              {showAddFamily && (
                <form onSubmit={handleAddFamilyMember} className="p-4 rounded-lg border border-ori-200 bg-ori-50/30 mb-4">
                  <div className="grid md:grid-cols-2 gap-3 mb-3">
                    <select value={newFamily.relationship} onChange={e => setNewFamily(f => ({ ...f, relationship: e.target.value }))} className="input">
                      <option value="SPOUSE">Spouse</option><option value="PARTNER">Partner</option><option value="CHILD">Child</option><option value="PARENT">Parent</option><option value="SIBLING">Sibling</option><option value="OTHER">Other</option>
                    </select>
                    <input value={newFamily.firstName} onChange={e => setNewFamily(f => ({ ...f, firstName: e.target.value }))} className="input" placeholder="First Name" />
                    <input value={newFamily.lastName} onChange={e => setNewFamily(f => ({ ...f, lastName: e.target.value }))} className="input" placeholder="Last Name" />
                    <input type="date" value={newFamily.dob} onChange={e => setNewFamily(f => ({ ...f, dob: e.target.value }))} className="input" placeholder="DOB" />
                    <input value={newFamily.nationality} onChange={e => setNewFamily(f => ({ ...f, nationality: e.target.value }))} className="input" placeholder="Nationality" />
                    <input value={newFamily.passportNumber} onChange={e => setNewFamily(f => ({ ...f, passportNumber: e.target.value }))} className="input" placeholder="Passport No" />
                    <input type="date" value={newFamily.passportExpiry} onChange={e => setNewFamily(f => ({ ...f, passportExpiry: e.target.value }))} className="input" placeholder="Passport Expiry" />
                    <input value={newFamily.visaStatus} onChange={e => setNewFamily(f => ({ ...f, visaStatus: e.target.value }))} className="input" placeholder="Visa Status" />
                    <label className="flex items-center gap-2"><input type="checkbox" checked={newFamily.includedInApplication} onChange={e => setNewFamily(f => ({ ...f, includedInApplication: e.target.checked }))} /> Included in application</label>
                    <div className="md:col-span-2"><input value={newFamily.notes} onChange={e => setNewFamily(f => ({ ...f, notes: e.target.value }))} className="input" placeholder="Notes" /></div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1"><Plane className="w-4 h-4" /> Travel History (for immi)</p>
                      {(newFamily.travelHistory || []).map((t: any, ti: number) => (
                        <div key={ti} className="flex flex-wrap gap-2 mb-2 p-2 bg-white rounded border">
                          <input value={t.country} onChange={e => setNewFamily(f => ({ ...f, travelHistory: (f.travelHistory || []).map((x, i) => i === ti ? { ...x, country: e.target.value } : x) }))} className="input text-sm w-24" placeholder="Country" />
                          <input type="date" value={t.dateFrom || ''} onChange={e => setNewFamily(f => ({ ...f, travelHistory: (f.travelHistory || []).map((x, i) => i === ti ? { ...x, dateFrom: e.target.value } : x) }))} className="input text-sm" placeholder="From" />
                          <input type="date" value={t.dateTo || ''} onChange={e => setNewFamily(f => ({ ...f, travelHistory: (f.travelHistory || []).map((x, i) => i === ti ? { ...x, dateTo: e.target.value } : x) }))} className="input text-sm" placeholder="To" />
                          <select value={t.purpose || 'TOURISM'} onChange={e => setNewFamily(f => ({ ...f, travelHistory: (f.travelHistory || []).map((x, i) => i === ti ? { ...x, purpose: e.target.value } : x) }))} className="input text-sm"><option value="TOURISM">Tourism</option><option value="STUDY">Study</option><option value="WORK">Work</option><option value="FAMILY">Family</option><option value="TRANSIT">Transit</option><option value="OTHER">Other</option></select>
                          <button type="button" onClick={() => setNewFamily(f => ({ ...f, travelHistory: (f.travelHistory || []).filter((_, i) => i !== ti) }))} className="text-red-500 hover:bg-red-50 px-2 rounded"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                      <button type="button" onClick={() => setNewFamily(f => ({ ...f, travelHistory: [...(f.travelHistory || []), { ...emptyTravel }] }))} className="btn-secondary text-xs">+ Add travel</button>
                    </div>
                  </div>
                  <div className="flex gap-2"><button type="submit" disabled={savingFamily || (!newFamily.firstName && !newFamily.lastName)} className="btn-primary text-sm">{savingFamily ? 'Saving...' : 'Add'}</button><button type="button" onClick={() => setShowAddFamily(false)} className="btn-secondary text-sm">Cancel</button></div>
                </form>
              )}
              {client.familyMembers?.length > 0 ? (
                <div className="space-y-3">
                  {client.familyMembers.map((m: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-50 border-l-2 border-ori-500">
                      {editingFamilyIdx === i && editFamily ? (
                        <div className="space-y-3">
                          <div className="grid md:grid-cols-2 gap-2">
                            <select value={editFamily.relationship} onChange={e => setEditFamily((f: any) => ({ ...f!, relationship: e.target.value }))} className="input text-sm">
                              <option value="SPOUSE">Spouse</option><option value="PARTNER">Partner</option><option value="CHILD">Child</option><option value="PARENT">Parent</option><option value="SIBLING">Sibling</option><option value="OTHER">Other</option>
                            </select>
                            <input value={editFamily.firstName} onChange={e => setEditFamily((f: any) => ({ ...f!, firstName: e.target.value }))} className="input text-sm" placeholder="First Name" />
                            <input value={editFamily.lastName} onChange={e => setEditFamily((f: any) => ({ ...f!, lastName: e.target.value }))} className="input text-sm" placeholder="Last Name" />
                            <input type="date" value={editFamily.dob} onChange={e => setEditFamily((f: any) => ({ ...f!, dob: e.target.value }))} className="input text-sm" />
                            <input value={editFamily.nationality} onChange={e => setEditFamily((f: any) => ({ ...f!, nationality: e.target.value }))} className="input text-sm" placeholder="Nationality" />
                            <input value={editFamily.passportNumber} onChange={e => setEditFamily((f: any) => ({ ...f!, passportNumber: e.target.value }))} className="input text-sm" placeholder="Passport" />
                            <input type="date" value={editFamily.passportExpiry} onChange={e => setEditFamily((f: any) => ({ ...f!, passportExpiry: e.target.value }))} className="input text-sm" />
                            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editFamily.includedInApplication} onChange={e => setEditFamily((f: any) => ({ ...f!, includedInApplication: e.target.checked }))} /> In application</label>
                          </div>
                          <div className="border-t pt-3">
                            <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1"><Plane className="w-4 h-4" /> Travel History</p>
                            {(editFamily.travelHistory || []).map((t: any, ti: number) => (
                              <div key={ti} className="flex flex-wrap gap-2 mb-2 p-2 bg-white rounded border">
                                <input value={t.country || ''} onChange={e => setEditFamily((f: any) => ({ ...f!, travelHistory: (f.travelHistory || []).map((x: any, xi: number) => xi === ti ? { ...x, country: e.target.value } : x) }))} className="input text-sm w-24" placeholder="Country" />
                                <input type="date" value={t.dateFrom ? new Date(t.dateFrom).toISOString().slice(0, 10) : ''} onChange={e => setEditFamily((f: any) => ({ ...f!, travelHistory: (f.travelHistory || []).map((x: any, xi: number) => xi === ti ? { ...x, dateFrom: e.target.value } : x) }))} className="input text-sm" />
                                <input type="date" value={t.dateTo ? new Date(t.dateTo).toISOString().slice(0, 10) : ''} onChange={e => setEditFamily((f: any) => ({ ...f!, travelHistory: (f.travelHistory || []).map((x: any, xi: number) => xi === ti ? { ...x, dateTo: e.target.value } : x) }))} className="input text-sm" />
                                <select value={t.purpose || 'TOURISM'} onChange={e => setEditFamily((f: any) => ({ ...f!, travelHistory: (f.travelHistory || []).map((x: any, xi: number) => xi === ti ? { ...x, purpose: e.target.value } : x) }))} className="input text-sm"><option value="TOURISM">Tourism</option><option value="STUDY">Study</option><option value="WORK">Work</option><option value="FAMILY">Family</option><option value="TRANSIT">Transit</option><option value="OTHER">Other</option></select>
                                <button type="button" onClick={() => setEditFamily((f: any) => ({ ...f!, travelHistory: (f.travelHistory || []).filter((_: any, xi: number) => xi !== ti) }))} className="text-red-500 hover:bg-red-50 px-2 rounded"><X className="w-4 h-4" /></button>
                              </div>
                            ))}
                            <button type="button" onClick={() => setEditFamily((f: any) => ({ ...f!, travelHistory: [...(f.travelHistory || []), { ...emptyTravel }] }))} className="btn-secondary text-xs">+ Add travel</button>
                          </div>
                          <div className="flex gap-2"><button onClick={() => handleUpdateFamilyMember(i)} disabled={savingFamily} className="btn-primary text-sm">{savingFamily ? 'Saving...' : 'Save'}</button><button onClick={() => { setEditingFamilyIdx(null); setEditFamily(null); }} className="btn-secondary text-sm">Cancel</button><button onClick={() => handleDeleteFamilyMember(i)} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm">Delete</button></div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start gap-2 group">
                          <div>
                            <p className="font-medium">{m.firstName} {m.lastName} <span className="text-slate-500 font-normal">({m.relationship})</span></p>
                            <p className="text-sm text-slate-500">{m.dob && format(new Date(m.dob), 'dd MMM yyyy')} {m.nationality && `• ${m.nationality}`} {m.passportNumber && `• Passport ${m.passportNumber}`} {m.passportExpiry && `exp ${format(new Date(m.passportExpiry), 'dd/MM/yy')}`}</p>
                            {m.includedInApplication && <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">Included in application</span>}
                            {m.visaStatus && <span className="ml-1 text-xs text-slate-500">Visa: {m.visaStatus}</span>}
                            {m.notes && <p className="text-sm text-slate-600 mt-1">{m.notes}</p>}
                            {m.travelHistory?.length > 0 && (
                              <div className="mt-2 text-xs text-slate-500">
                                <span className="font-medium flex items-center gap-1"><Plane className="w-3 h-3" /> Travel:</span>
                                {m.travelHistory.map((t: any, ti: number) => (
                                  <span key={ti} className="block">{t.country} {t.dateFrom && format(new Date(t.dateFrom), 'dd/MM/yy')}–{t.dateTo ? format(new Date(t.dateTo), 'dd/MM/yy') : '?'} ({t.purpose})</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => { setEditingFamilyIdx(i); setEditFamily({ relationship: m.relationship || 'OTHER', firstName: m.firstName || '', lastName: m.lastName || '', dob: m.dob ? new Date(m.dob).toISOString().slice(0, 10) : '', nationality: m.nationality || '', passportNumber: m.passportNumber || '', passportExpiry: m.passportExpiry ? new Date(m.passportExpiry).toISOString().slice(0, 10) : '', includedInApplication: !!m.includedInApplication, visaStatus: m.visaStatus || '', notes: m.notes || '', travelHistory: (m.travelHistory || []).map((t: any) => ({ ...t, dateFrom: t.dateFrom ? new Date(t.dateFrom).toISOString().slice(0, 10) : '', dateTo: t.dateTo ? new Date(t.dateTo).toISOString().slice(0, 10) : '' })) }); }} className="p-1.5 rounded hover:bg-slate-200 text-slate-600" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteFamilyMember(i)} className="p-1.5 rounded hover:bg-red-100 text-red-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-500 text-sm">No family members. Click Add to include spouse, children, or dependents.</p>}
            </div>

            {client.services?.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-semibold text-slate-900">6. Services</h2>
                  <Link to={`/consultancy/clients/${id}/edit`} className="text-ori-600 hover:underline text-sm flex items-center gap-1"><Pencil className="w-4 h-4" /> Edit</Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {client.services.map((s: any, i: number) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-ori-100 text-ori-700 text-sm">{s.serviceType} ({s.visaSubclass || '-'})</span>
                  ))}
                </div>
              </div>
            )}

            <div className="card">
              <h2 className="font-display font-semibold text-slate-900 mb-2">Visa & Migration</h2>
              {client.visaType && <p className="font-medium text-slate-900">{client.visaType}</p>}
              <p className="text-slate-500 text-sm mt-1">See Applications tab for visa status and progress</p>
            </div>

          </div>
        </>
      )}

      {/* Documents Tab */}
      {tab === 'documents' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-slate-900">Client Documents</h2>
            <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2"><Upload className="w-4 h-4" /> Add Document</button>
          </div>
          {showUpload && (
            <form onSubmit={handleUploadDocument} className="card max-w-xl">
              <h3 className="font-semibold text-slate-900 mb-4">Upload Document</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Document Type</label>
                  <select value={uploadForm.type} onChange={e => setUploadForm(f => ({ ...f, type: e.target.value }))} className="input">
                    {docTypes.map((t: any) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                {applications.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Link to Application (optional)</label>
                    <select value={uploadForm.applicationId} onChange={e => setUploadForm(f => ({ ...f, applicationId: e.target.value }))} className="input">
                      <option value="">—</option>
                      {applications.map((a: any) => <option key={a._id} value={a._id}>Subclass {a.visaSubclass}</option>)}
                    </select>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">File *</label>
                  <input type="file" required onChange={e => setUploadForm(f => ({ ...f, file: e.target.files?.[0] || null }))} className="input" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn-primary" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
                <button type="button" onClick={() => setShowUpload(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((d: any) => (
              <div key={d._id} className="card flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${d.status === 'UPLOADED' ? 'bg-green-100' : 'bg-slate-100'}`}>
                  {d.status === 'UPLOADED' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <FileText className="w-5 h-5 text-slate-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{d.name}</p>
                  <p className="text-sm text-slate-500">{d.type || 'Document'}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="View"><Download className="w-4 h-4" /></a>}
                  <button onClick={() => deleteDocument(d._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
          {!documents.length && !showUpload && <div className="card p-12 text-center text-slate-500">No documents yet. Click "Add Document" to upload.</div>}
        </div>
      )}

      {/* Applications Tab */}
      {tab === 'applications' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-900">Applications</h2>
            <button onClick={() => setShowAddApp(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Add Application</button>
          </div>
          {showAddApp && (
            <form onSubmit={handleAddApplication} className="p-4 rounded-lg bg-slate-50 mb-4 flex flex-wrap gap-4 items-end">
              <div className="min-w-[140px]">
                <label className="block text-sm font-medium text-slate-700 mb-1">Visa Subclass</label>
                <select value={newAppVisa} onChange={e => setNewAppVisa(e.target.value)} className="input">
                  <option value="500">500 - Student</option>
                  <option value="485">485 - Graduate</option>
                  <option value="189">189 - Skilled Independent</option>
                  <option value="190">190 - Skilled Nominated</option>
                  <option value="491">491 - Skilled Regional</option>
                  <option value="482">482 - TSS</option>
                  <option value="186">186 - Employer Nominated</option>
                  <option value="600">600 - Visitor</option>
                </select>
              </div>
              {['482', '186'].includes(newAppVisa) && (
                <div className="min-w-[180px]">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sponsor (optional)</label>
                  <select value={newAppSponsor} onChange={e => setNewAppSponsor(e.target.value)} className="input">
                    <option value="">— Select —</option>
                    {sponsors.map((s: any) => <option key={s._id} value={s._id}>{s.companyName}</option>)}
                  </select>
                </div>
              )}
              <button type="submit" className="btn-primary">Create</button>
              <button type="button" onClick={() => setShowAddApp(false)} className="btn-secondary">Cancel</button>
            </form>
          )}
          <div className="space-y-3">
            {applications.map((a: any) => (
              <div key={a._id} className="p-3 rounded-lg bg-slate-50">
                {editingAppId === a._id && editApp ? (
                  <form onSubmit={handleUpdateApplication} className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Visa Subclass</label><select value={editApp.visaSubclass} onChange={e => setEditApp(x => x ? { ...x, visaSubclass: e.target.value } : editApp)} className="input"><option value="500">500 - Student</option><option value="485">485 - Graduate</option><option value="189">189 - Skilled Independent</option><option value="190">190 - Skilled Nominated</option><option value="491">491 - Skilled Regional</option><option value="482">482 - TSS</option><option value="186">186 - Employer Nominated</option><option value="600">600 - Visitor</option></select></div>
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={editApp.status} onChange={e => setEditApp(x => x ? { ...x, status: e.target.value } : editApp)} className="input"><option value="ONBOARDING">Onboarding</option><option value="DRAFTING">Drafting</option><option value="PENDING_INFO">Pending Info</option><option value="REVIEW">Review</option><option value="LODGED">Lodged</option><option value="DECISION">Decision</option><option value="COMPLETED">Completed</option></select></div>
                      {['482', '186'].includes(editApp.visaSubclass) && <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Sponsor</label><select value={editApp.sponsorId || ''} onChange={e => setEditApp(x => x ? { ...x, sponsorId: e.target.value } : editApp)} className="input"><option value="">— None —</option>{sponsors.map((s: any) => <option key={s._id} value={s._id}>{s.companyName}</option>)}</select></div>}
                      <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Stage Deadline (optional)</label><input type="date" value={editApp.stageDeadline || ''} onChange={e => setEditApp(x => x ? { ...x, stageDeadline: e.target.value } : editApp)} className="input" /></div>
                    </div>
                    <div className="flex gap-2"><button type="submit" className="btn-primary text-sm">Save</button><button type="button" onClick={cancelEditApp} className="btn-secondary text-sm flex items-center gap-1"><X className="w-4 h-4" /> Cancel</button></div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Subclass {a.visaSubclass}</p>
                      <p className="text-sm text-slate-500">{a.status} {a.sponsorId?.companyName && `• ${a.sponsorId.companyName}`}</p>
                      {a.form956Signed && <p className="text-xs text-green-600 mt-0.5">Form 956 signed {a.form956SignedAt && format(new Date(a.form956SignedAt), 'dd MMM yyyy')}</p>}
                      {a.visaSubclass === '500' && a.coe?.number && <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1"><GraduationCap className="w-3 h-3" /> CoE: {a.coe.number} {a.coe.expiryDate && `(exp ${format(new Date(a.coe.expiryDate), 'dd MMM yy')})`}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.visaSubclass === '500' && <button onClick={() => openCoeForm(a)} className={`p-1.5 rounded text-xs flex items-center gap-1 ${a.coe?.number ? 'bg-green-100 text-green-800' : 'hover:bg-slate-200 text-slate-600'}`} title="CoE"><GraduationCap className="w-3 h-3" /> CoE</button>}
                      {!a.form956Signed && <button onClick={() => handleMarkForm956(a._id)} disabled={marking956 === a._id} className="p-1.5 rounded text-xs bg-amber-100 text-amber-800 hover:bg-amber-200" title="Mark Form 956 signed">{marking956 === a._id ? '...' : 'Form 956'}</button>}
                      <button onClick={() => setAppNoteAppId(appNoteAppId === a._id ? null : a._id)} className={`p-1.5 rounded text-xs flex items-center gap-1 ${appNoteAppId === a._id ? 'bg-ori-100 text-ori-700' : 'hover:bg-slate-200 text-slate-600'}`} title="Notes"><StickyNote className="w-4 h-4" /> Notes {(a.notes || []).length > 0 && <span className="bg-ori-200 px-1 rounded">{(a.notes || []).length}</span>}</button>
                      <span className={`px-2 py-1 rounded text-xs ${a.status === 'LODGED' ? 'bg-green-100 text-green-700' : a.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>{a.status}</span>
                      <button onClick={() => startEditApp(a)} className="p-1.5 rounded hover:bg-slate-200 text-slate-600" title="Edit"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteApplication(a._id)} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
                {appNoteAppId === a._id && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Application Notes (visible to client)</h4>
                    <form onSubmit={e => handleAddAppNote(e, a._id)} className="flex gap-2 mb-3">
                      <input value={appNoteText} onChange={e => setAppNoteText(e.target.value)} placeholder="Add a note for this application..." className="input flex-1 text-sm" />
                      <button type="submit" className="btn-primary text-sm" disabled={addingAppNote || !appNoteText.trim()}>{addingAppNote ? 'Adding...' : 'Add'}</button>
                      <button type="button" onClick={() => { setAppNoteAppId(null); setAppNoteText(''); }} className="btn-secondary text-sm">Cancel</button>
                    </form>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {(a.notes || []).map((n: any, i: number) => (
                        <div key={i} className="p-2 rounded bg-amber-50 border border-amber-100 text-sm">
                          <p className="text-slate-800">{n.text}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{n.addedBy?.profile?.firstName} {n.addedBy?.profile?.lastName} • {format(new Date(n.addedAt), 'dd MMM HH:mm')}</p>
                        </div>
                      ))}
                      {(!a.notes || a.notes.length === 0) && <p className="text-slate-500 text-sm">No notes yet</p>}
                    </div>
                  </div>
                )}
                {(a.documentChecklist || []).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1"><ClipboardList className="w-4 h-4" /> Document Checklist</h4>
                    <div className="flex flex-wrap gap-2">
                      {(a.documentChecklist || []).map((item: any, i: number) => (
                        <span key={i} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${item.uploaded ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                          {item.uploaded ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {coeAppId === a._id && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1"><GraduationCap className="w-4 h-4" /> CoE (Confirmation of Enrolment)</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><label className="block text-xs text-slate-500 mb-0.5">CoE Number</label><input value={coeForm.number} onChange={e => setCoeForm(f => ({ ...f, number: e.target.value }))} className="input py-1" placeholder="e.g. 8ABC1234" /></div>
                      <div><label className="block text-xs text-slate-500 mb-0.5">Institution</label><input value={coeForm.institution} onChange={e => setCoeForm(f => ({ ...f, institution: e.target.value }))} className="input py-1" /></div>
                      <div><label className="block text-xs text-slate-500 mb-0.5">Course Name</label><input value={coeForm.courseName} onChange={e => setCoeForm(f => ({ ...f, courseName: e.target.value }))} className="input py-1" /></div>
                      <div><label className="block text-xs text-slate-500 mb-0.5">Course Code</label><input value={coeForm.courseCode} onChange={e => setCoeForm(f => ({ ...f, courseCode: e.target.value }))} className="input py-1" /></div>
                      <div><label className="block text-xs text-slate-500 mb-0.5">Issue Date</label><input type="date" value={coeForm.issueDate} onChange={e => setCoeForm(f => ({ ...f, issueDate: e.target.value }))} className="input py-1" /></div>
                      <div><label className="block text-xs text-slate-500 mb-0.5">Expiry Date</label><input type="date" value={coeForm.expiryDate} onChange={e => setCoeForm(f => ({ ...f, expiryDate: e.target.value }))} className="input py-1" /></div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={handleSaveCoe} disabled={savingCoe} className="btn-primary text-sm">{savingCoe ? 'Saving...' : 'Save CoE'}</button>
                      <button onClick={() => setCoeAppId(null)} className="btn-secondary text-sm">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {!applications.length && <p className="text-slate-500">No applications</p>}
          </div>
        </div>
      )}

      {/* Task Sheet Tab - All activities: tasks, app changes, docs, notes, tags, etc. */}
      {tab === 'task-sheet' && (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display font-semibold text-slate-900 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-ori-600" /> Task Sheet</h2>
              <p className="text-slate-500 text-sm mt-1">Every change for this client — tasks, documents, application updates, notes, tags, and more.</p>
            </div>
            <button onClick={() => id && authFetch(`/api/clients/${id}/activity`).then(r => safeJson<any[]>(r)).then(setActivity)} className="btn-secondary text-sm shrink-0">Refresh</button>
          </div>

          {/* Add Activity form */}
          <form onSubmit={handleAddActivity} className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6">
            <h3 className="font-medium text-slate-800 mb-3">Add activity / daily note</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <select value={newActivity.type} onChange={e => setNewActivity(a => ({ ...a, type: e.target.value }))} className="input w-full sm:w-44">
                <option value="DAILY_UPDATE">Daily Update</option>
                <option value="COMMUNICATION">Communication</option>
                <option value="EXTERNAL_WORK">External Work</option>
                <option value="TASK_STATUS">Task Status</option>
                <option value="NOTE">Note</option>
                <option value="DOCUMENT">Document</option>
                <option value="APPLICATION">Application</option>
                <option value="OTHER">Other</option>
              </select>
              <input value={newActivity.text} onChange={e => setNewActivity(a => ({ ...a, text: e.target.value }))} placeholder="What was done today? e.g. Called client, submitted document..." className="input flex-1" />
              <button type="submit" className="btn-primary shrink-0" disabled={addingActivity || !newActivity.text.trim()}>{addingActivity ? 'Adding...' : 'Add Activity'}</button>
            </div>
          </form>

          <div className="space-y-6 max-h-[500px] overflow-y-auto">
            {activity.length === 0 && <p className="text-slate-500 py-8 text-center">No activity yet. Add a note above or perform actions (tasks, documents, etc.) to see them here.</p>}
            {(() => {
              const byDate = activity.reduce((acc: Record<string, any[]>, t: any) => {
                const d = format(new Date(t.changedAt || t.addedAt || t.sortAt), 'yyyy-MM-dd');
                if (!acc[d]) acc[d] = [];
                acc[d].push(t);
                return acc;
              }, {});
              const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));
              return dates.map(date => (
                <div key={date}>
                  <h4 className="text-sm font-semibold text-slate-600 mb-3 sticky top-0 bg-white py-1 border-b border-slate-200">
                    {format(new Date(date), 'EEEE, d MMMM yyyy')}
                  </h4>
                  <div className="space-y-3">
                    {byDate[date].map((t: any) => (
              <div key={t._id} className={`p-4 rounded-xl border-l-4 flex justify-between items-start gap-3 group ${t.source === 'activity' ? 'bg-amber-50/50 border-amber-400' : 'bg-slate-50 border-ori-500'}`}>
                {editingActivityId === t._id && t.source === 'activity' ? (
                  <div className="flex-1 space-y-3">
                    <select value={editActivityType} onChange={e => setEditActivityType(e.target.value)} className="input text-sm w-full max-w-[180px]">
                      <option value="DAILY_UPDATE">Daily Update</option>
                      <option value="COMMUNICATION">Communication</option>
                      <option value="EXTERNAL_WORK">External Work</option>
                      <option value="TASK_STATUS">Task Status</option>
                      <option value="NOTE">Note</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <textarea value={editActivityText} onChange={e => setEditActivityText(e.target.value)} className="input text-sm min-h-[80px] w-full" rows={3} />
                    <div className="flex gap-2">
                      <button onClick={handleEditActivity} disabled={savingActivity} className="btn-primary text-sm">{savingActivity ? 'Saving...' : 'Save'}</button>
                      <button onClick={() => setEditingActivityId(null)} className="btn-secondary text-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{t.description || `${t.action || ''} ${t.entityType || ''}`.trim() || 'Activity'}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {t.entityType} {t.action && `• ${t.action}`}
                        {t.visaSubclass && ` • Visa ${t.visaSubclass}`}
                        {t.assignedAgentId?.profile && ` • Agent: ${t.assignedAgentId.profile.firstName} ${t.assignedAgentId.profile.lastName}`}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {t.changedBy?.profile?.firstName} {t.changedBy?.profile?.lastName} • {format(new Date(t.changedAt || t.addedAt), 'dd MMM yyyy HH:mm')}
                        {t.editedAt && ` • Edited ${format(new Date(t.editedAt), 'dd MMM HH:mm')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {t.source === 'activity' && (
                        <>
                          <button onClick={() => { setEditingActivityId(t._id); setEditActivityText(t.text || t.description); setEditActivityType(t.entityType || 'DAILY_UPDATE'); }} className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 opacity-0 group-hover:opacity-100 transition" title="Edit"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteActivity(t._id)} className="p-2 rounded-lg hover:bg-red-100 text-red-500 opacity-0 group-hover:opacity-100 transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                      <span className={`px-2 py-1 rounded text-xs ${t.action === 'CREATE' ? 'bg-green-100 text-green-700' : t.action === 'DELETE' ? 'bg-red-100 text-red-700' : t.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>{t.action || t.entityType}</span>
                    </div>
                  </>
                )}
              </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Skill Assessments Tab */}
      {tab === 'skill-assessments' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-900 flex items-center gap-2"><Award className="w-5 h-5 text-ori-600" /> Skill Assessments</h2>
            <button onClick={() => setShowAddSkillAssessment(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Add</button>
          </div>
          {showAddSkillAssessment && (
            <form onSubmit={handleAddSkillAssessment} className="p-4 rounded-lg bg-slate-50 mb-4">
              <h3 className="font-medium text-slate-900 mb-3">New Skill Assessment</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assessing Body</label>
                  <select value={newSkillAssessment.body} onChange={e => setNewSkillAssessment(s => ({ ...s, body: e.target.value }))} className="input">
                    <option value="ACS">ACS - Australian Computer Society</option>
                    <option value="VETASSESS">VETASSESS</option>
                    <option value="EA">Engineers Australia</option>
                    <option value="AITSL">AITSL</option>
                    <option value="ANMAC">ANMAC</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Occupation</label>
                  <input value={newSkillAssessment.occupation} onChange={e => setNewSkillAssessment(s => ({ ...s, occupation: e.target.value }))} className="input" placeholder="e.g. Software Engineer" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn-primary">Add</button>
                <button type="button" onClick={() => setShowAddSkillAssessment(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}
          <div className="space-y-4">
            {(client.skillAssessments || []).length === 0 && !showAddSkillAssessment && <p className="text-slate-500">No skill assessments. Click Add to create one.</p>}
            {(client.skillAssessments || []).map((sa: any, i: number) => (
              <div key={i} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-900">{sa.body} — {sa.occupation || 'N/A'}</p>
                    <p className="text-sm text-slate-500">{sa.referenceNumber && `Ref: ${sa.referenceNumber}`} • Requested: {sa.requestedAt ? format(new Date(sa.requestedAt), 'dd MMM yyyy') : '-'}</p>
                    {sa.outcome && <p className="text-sm text-green-700 mt-1">Outcome: {sa.outcome}</p>}
                    {sa.completedAt && <p className="text-xs text-slate-500">Completed: {format(new Date(sa.completedAt), 'dd MMM yyyy')}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {sa.status !== 'COMPLETED' && sa.status !== 'REFUSED' && (
                      <select value={sa.status} onChange={e => updateSkillAssessmentStatus(i, e.target.value)} className="input text-sm py-1">
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="REFUSED">Refused</option>
                      </select>
                    )}
                    <span className={`px-2 py-1 rounded text-xs ${sa.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : sa.status === 'REFUSED' ? 'bg-red-100 text-red-700' : sa.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{sa.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Immigration History Tab - Government requests */}
      {tab === 'immigration-history' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-slate-900 flex items-center gap-2"><History className="w-5 h-5 text-ori-600" /> Immigration History</h2>
              <p className="text-slate-500 text-sm mt-1">RFI, S56, Natural Justice, and other requests from Department of Home Affairs</p>
            </div>
            <button onClick={() => setShowAddImmigration(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Add Request</button>
          </div>
          {showAddImmigration && (
            <form onSubmit={handleAddImmigration} className="p-4 rounded-lg bg-slate-50 mb-4">
              <h3 className="font-medium text-slate-900 mb-3">New Immigration Request</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select value={newImmigration.type} onChange={e => setNewImmigration(s => ({ ...s, type: e.target.value }))} className="input">
                    <option value="RFI">RFI - Request for Information</option>
                    <option value="S56">S56 - Natural Justice</option>
                    <option value="NATURAL_JUSTICE">Natural Justice</option>
                    <option value="ADDITIONAL_INFO">Additional Info</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Response Due</label>
                  <input type="date" value={newImmigration.responseDue} onChange={e => setNewImmigration(s => ({ ...s, responseDue: e.target.value }))} className="input" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea value={newImmigration.description} onChange={e => setNewImmigration(s => ({ ...s, description: e.target.value }))} className="input" rows={3} placeholder="What was requested?" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn-primary">Add</button>
                <button type="button" onClick={() => setShowAddImmigration(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}
          <div className="space-y-4">
            {(client.immigrationHistory || []).length === 0 && !showAddImmigration && <p className="text-slate-500">No immigration requests on record. Click Add to log one.</p>}
            {(client.immigrationHistory || []).map((ih: any, i: number) => (
              <div key={i} className="p-4 rounded-lg bg-slate-50 border-l-4 border-amber-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-900">{ih.type} — {ih.requestedBy || 'Department of Home Affairs'}</p>
                    <p className="text-sm text-slate-600 mt-1">{ih.description}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Requested: {ih.requestedAt ? format(new Date(ih.requestedAt), 'dd MMM yyyy') : '-'}
                      {ih.responseDue && ` • Due: ${format(new Date(ih.responseDue), 'dd MMM yyyy')}`}
                      {ih.completedAt && ` • Responded: ${format(new Date(ih.completedAt), 'dd MMM yyyy')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(ih.status === 'PENDING' || ih.status === 'EXTENDED') && (
                      <select value={ih.status} onChange={e => updateImmigrationStatus(i, e.target.value)} className="input text-sm py-1">
                        <option value="PENDING">Pending</option>
                        <option value="RESPONDED">Responded</option>
                        <option value="EXTENDED">Extended</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    )}
                    <span className={`px-2 py-1 rounded text-xs ${ih.status === 'RESPONDED' || ih.status === 'CLOSED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{ih.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
