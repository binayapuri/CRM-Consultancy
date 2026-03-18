import { useState, useEffect } from 'react';
import { authFetch } from '../../store/auth';
import { useUiStore } from '../../store/ui';
import { User, ShieldCheck, GraduationCap, Briefcase, Plane, MapPin, Heart, Target, StickyNote } from 'lucide-react';

// Sub-components
import { PersonalInfo } from './profile/Sections/PersonalInfo';
import { ImmigrationInfo } from './profile/Sections/ImmigrationInfo';
import { EducationInfo } from './profile/Sections/EducationInfo';
import { WorkInfo } from './profile/Sections/WorkInfo';
import { AddressInfo } from './profile/Sections/AddressInfo';
import { TravelInfo } from './profile/Sections/TravelInfo';
import { FamilyInfo } from './profile/Sections/FamilyInfo';
import { SkillsInfo } from './profile/Sections/SkillsInfo';
import { HealthInfo } from './profile/Sections/HealthInfo';
import { NotesInfo } from './profile/Sections/NotesInfo';
import { StudentSectionTabs } from '../../components/StudentSectionTabs';

const TABS = [
  { id: 'personal', label: 'Personal', icon: <User className="w-4 h-4" /> },
  { id: 'immigration', label: 'Immigration', icon: <Plane className="w-4 h-4" /> },
  { id: 'address', label: 'Address', icon: <MapPin className="w-4 h-4" /> },
  { id: 'education', label: 'Education', icon: <GraduationCap className="w-4 h-4" /> },
  { id: 'experience', label: 'Work', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'travel', label: 'Travel', icon: <Plane className="w-4 h-4" /> },
  { id: 'family', label: 'Family', icon: <Heart className="w-4 h-4" /> },
  { id: 'skills', label: 'Skills', icon: <Target className="w-4 h-4" /> },
  { id: 'health', label: 'Health', icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 'notes', label: 'Notes', icon: <StickyNote className="w-4 h-4" /> },
];

export default function StudentProfile() {
  const [tab, setTab] = useState('personal');
  const [profile, setProfile] = useState<any>({});
  const [english, setEnglish] = useState<any>({});
  const [address, setAddress] = useState<any>({ current: {}, previous: [] });
  const [education, setEducation] = useState<any[]>([]);
  const [experience, setExperience] = useState<any[]>([]);
  const [travel, setTravel] = useState<any[]>([]);
  const [family, setFamily] = useState<any[]>([]);
  const [skills, setSkills] = useState<any>({});
  const [health, setHealth] = useState<any>({});
  const [notes, setNotes] = useState<any[]>([]);
  const [statement, setStatement] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const showToast = useUiStore((s) => s.showToast);

  async function fetchJson(url: string) {
    const res = await authFetch(url);
    let data: any = null;
    let text: string | null = null;
    try {
      data = await res.json();
    } catch {
      data = null;
      try {
        text = await res.clone().text();
      } catch {
        text = null;
      }
    }
    return { url, res, data, text };
  }

  const refreshData = async () => {
    try {
      setErrorBanner(null);
      const [p, a, n, f] = await Promise.all([
        fetchJson('/api/student/profile'),
        fetchJson('/api/student/addresses'),
        fetchJson('/api/student/notes'),
        fetchJson('/api/student/family-members')
      ]);

      const fmtErr = (r: { url: string; res: Response; data: any; text: string | null }, label: string) => {
        const msg = r.data?.error
          || (r.text ? String(r.text).slice(0, 180).replace(/\s+/g, ' ') : '')
          || 'No response body';
        return `${label} failed (${r.res.status}) — ${r.url} — ${msg}`;
      };

      if (!p.res.ok) throw new Error(fmtErr(p, 'Profile load'));
      if (!a.res.ok) throw new Error(fmtErr(a, 'Addresses load'));
      if (!n.res.ok) throw new Error(fmtErr(n, 'Notes load'));
      if (!f.res.ok) throw new Error(fmtErr(f, 'Family load'));

      const pRes = p.data;
      const aRes = a.data;
      const nRes = n.data;
      const fRes = f.data;

      const c = pRes.client || {};
      setProfile(c.profile || {});
      setEnglish(c.englishTest || {});
      setEducation(c.education || []);
      setExperience(c.experience || []);
      setTravel(c.travelHistory || []);
      setSkills(c.skillsData || {});
      setHealth(c.healthData || {});
      
      setAddress(aRes || { current: {}, previous: [] });
      setNotes(nRes.notes || []);
      setStatement(nRes.initialStatement || '');
      setFamily(fRes || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setErrorBanner((err as any)?.message || 'Failed to load profile data');
      setLoading(false);
    }
  };

  useEffect(() => { refreshData(); }, []);

  // API Handlers (wrapped to refresh UI)
  const wrapSave = (url: string, method: string = 'PATCH') => async (data: any) => {
    setErrorBanner(null);
    const res = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    let body: any = null;
    try { body = await res.json(); } catch { body = null; }
    if (!res.ok) {
      const msg = body?.error || `Save failed (${res.status})`;
      setErrorBanner(msg);
      showToast(msg, 'error');
      return;
    }
    await refreshData();
    showToast('Profile Updated!', 'success');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      <p className="font-black text-slate-400 text-sm tracking-widest uppercase animate-pulse">Syncing Profile...</p>
    </div>
  );

  return (
    <div className="w-full pb-20 animate-in fade-in duration-500">
      {errorBanner && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">
          {errorBanner}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-2 flex items-center gap-2">
          <User className="w-3.5 h-3.5" /> Student Portal
        </div>
        <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight mb-2">My Profile</h1>
        <p className="text-slate-500 text-sm font-medium max-w-none">
          Manage your migration journey details. This is your <span className="text-indigo-600 font-bold">"source of truth"</span>—everything here helps your agent and AI Compass work for you.
        </p>
      </div>

      {/* Modern Navigation Tabs */}
      <StudentSectionTabs tabs={TABS} activeId={tab} onChange={setTab} />

      {/* Main Content Area */}
      <div className="animate-in slide-in-from-bottom-4 duration-500">
        {tab === 'personal' && <PersonalInfo data={profile} onSave={wrapSave('/api/student/profile')} />}
        {tab === 'immigration' && <ImmigrationInfo profile={profile} english={english} onSaveImmigration={wrapSave('/api/student/immigration')} onSaveEnglish={wrapSave('/api/student/english-test')} />}
        {tab === 'address' && <AddressInfo current={address.current} previous={address.previous} onSaveCurrent={wrapSave('/api/student/addresses/current')} onAddPrevious={wrapSave('/api/student/addresses', 'POST')} onDeletePrevious={id => wrapSave(`/api/student/addresses/${id}`, 'DELETE')({})} />}
        {tab === 'education' && <EducationInfo items={education} onAdd={wrapSave('/api/student/education', 'POST')} onDelete={id => wrapSave(`/api/student/education/${id}`, 'DELETE')({})} />}
        {tab === 'experience' && <WorkInfo items={experience} onAdd={wrapSave('/api/student/experience', 'POST')} onDelete={id => wrapSave(`/api/student/experience/${id}`, 'DELETE')({})} />}
        {tab === 'travel' && <TravelInfo items={travel} onAdd={wrapSave('/api/student/travel-history', 'POST')} onDelete={id => wrapSave(`/api/student/travel-history/${id}`, 'DELETE')({})} />}
        {tab === 'family' && <FamilyInfo items={family} onAdd={wrapSave('/api/student/family-members', 'POST')} onDelete={id => wrapSave(`/api/student/family-members/${id}`, 'DELETE')({})} />}
        {tab === 'skills' && <SkillsInfo data={skills} onSave={wrapSave('/api/student/skills')} />}
        {tab === 'health' && <HealthInfo data={health} onSave={wrapSave('/api/student/health')} />}
        {tab === 'notes' && <NotesInfo notes={notes} statement={statement} onSaveStatement={txt => wrapSave('/api/student/profile/statement')({ initialStatement: txt })} onAddNote={wrapSave('/api/student/notes', 'POST')} onUpdateNote={(id, data) => wrapSave(`/api/student/notes/${id}`)(data)} onDeleteNote={id => wrapSave(`/api/student/notes/${id}`, 'DELETE')({})} onTogglePin={(id, isPinned) => wrapSave(`/api/student/notes/${id}`)({ isPinned })} />}
      </div>
    </div>
  );
}
