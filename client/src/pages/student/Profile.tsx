import { useState, useEffect } from 'react';
import { authFetch } from '../../store/auth';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Plus, Trash2, User, Plane, GraduationCap, Briefcase, Shield, FileCheck, Save, CheckCircle2 } from 'lucide-react';

// Reusable styled input
const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">{label}</label>
    {children}
  </div>
);

const inp = "w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-800 outline-none transition-all focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400";
const inputStyle = { background: '#F8FAFC', border: '1.5px solid #E2E8F0' };

const SI = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`${inp} ${props.className || ''}`} style={inputStyle} />
);
const SS = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={`${inp} ${props.className || ''}`} style={inputStyle} />
);

type Tab = 'personal' | 'immigration' | 'education' | 'experience' | 'skills' | 'health';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'personal',    label: 'Personal',         icon: <User className="w-4 h-4" /> },
  { id: 'immigration', label: 'Immigration',       icon: <Plane className="w-4 h-4" /> },
  { id: 'education',   label: 'Education',         icon: <GraduationCap className="w-4 h-4" /> },
  { id: 'experience',  label: 'Work History',      icon: <Briefcase className="w-4 h-4" /> },
  { id: 'skills',      label: 'Skills & EOI',      icon: <FileCheck className="w-4 h-4" /> },
  { id: 'health',      label: 'Health & Character',icon: <Shield className="w-4 h-4" /> },
];

export default function StudentProfile() {
  const [client, setClient] = useState<any>(null);
  const [profile, setProfile] = useState<any>({});
  const [education, setEducation] = useState<any[]>([]);
  const [experience, setExperience] = useState<any[]>([]);
  const [englishTest, setEnglishTest] = useState<any>({});
  const [skillsData, setSkillsData] = useState<any>({});
  const [healthData, setHealthData] = useState<any>({});

  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    authFetch('/api/clients')
      .then(r => r.json())
      .then(data => {
        const c = Array.isArray(data) ? data[0] : data;
        if (c) {
          setClient(c);
          setProfile(c.profile || {});
          setEducation(c.education || []);
          setExperience(c.experience || []);
          setEnglishTest(c.englishTest || {});
          setSkillsData(c.skillsData || {});
          setHealthData(c.healthData || {});
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const pct = (() => {
    const required = ['firstName','lastName','email','nationality','passportNumber','dob'];
    const filled = required.filter(k => profile[k] && String(profile[k]).trim()).length;
    return Math.round((filled / required.length) * 100);
  })();

  const handleSave = async () => {
    if (!client?._id) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/clients/${client._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            ...profile,
            dob: profile.dob ? new Date(profile.dob).toISOString() : undefined,
            visaExpiry: profile.visaExpiry ? new Date(profile.visaExpiry).toISOString() : undefined,
            passportExpiry: profile.passportExpiry ? new Date(profile.passportExpiry).toISOString() : undefined,
          },
          englishTest: {
            ...englishTest,
            testDate: englishTest.testDate ? new Date(englishTest.testDate).toISOString() : undefined,
            expiryDate: englishTest.expiryDate ? new Date(englishTest.expiryDate).toISOString() : undefined,
          },
          education: education.map(e => ({
            ...e,
            startDate: e.startDate ? new Date(e.startDate + '-01').toISOString() : undefined,
            endDate: e.endDate ? new Date(e.endDate + '-01').toISOString() : undefined,
          })),
          experience: experience.map(e => ({
            ...e,
            startDate: e.startDate ? new Date(e.startDate + '-01').toISOString() : undefined,
            endDate: e.endDate ? new Date(e.endDate + '-01').toISOString() : undefined,
          })),
          skillsData,
          healthData,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Save failed');
      setClient(d); setProfile(d.profile || {}); setEducation(d.education || []);
      setExperience(d.experience || []); setEnglishTest(d.englishTest || {});
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e) { alert((e as Error).message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-slate-500 font-medium mt-1">Your personal immigration file. Private unless you choose to share.</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Completeness pill */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: pct === 100 ? '#ECFDF5' : '#EEF2FF', border: `1.5px solid ${pct === 100 ? '#6EE7B7' : '#C7D2FE'}` }}>
            <div className="relative w-8 h-8">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="12" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                <circle cx="16" cy="16" r="12" fill="none" stroke={pct === 100 ? '#10B981' : '#6366F1'} strokeWidth="3" strokeDasharray={`${pct * 0.754} 100`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black" style={{ color: pct === 100 ? '#10B981' : '#6366F1' }}>{pct}%</span>
            </div>
            <span className="text-xs font-bold" style={{ color: pct === 100 ? '#065F46' : '#3730A3' }}>
              {pct === 100 ? 'Complete!' : 'Profile Completeness'}
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 shadow-lg"
            style={{ background: saved ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #6366F1, #4F46E5)', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}
          >
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}
          </button>
        </div>
      </div>

      {!client && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-3xl p-8 text-center mb-8">
          <p className="text-indigo-700 font-semibold">No migration profile found. You can still fill out your details below — they'll be saved to your account.</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Tabs sidebar */}
        <div className="lg:w-56 shrink-0 space-y-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-left"
              style={activeTab === t.id
                ? { background: 'linear-gradient(135deg, #EEF2FF, #F0FDF4)', color: '#4338CA', border: '1.5px solid #C7D2FE' }
                : { background: 'transparent', color: '#64748B', border: '1.5px solid transparent' }
              }
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div
          className="flex-1 rounded-3xl p-6 md:p-8"
          style={{ background: '#FFFFFF', border: '1px solid #E8EDFB', boxShadow: '0 2px 24px rgba(0,0,0,0.04)' }}
        >
          {/* ── PERSONAL ── */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 pb-3 border-b border-slate-100">Personal Information</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <F label="First Name"><SI value={profile.firstName||''} onChange={e=>setProfile({...profile,firstName:e.target.value})} /></F>
                <F label="Last Name"><SI value={profile.lastName||''} onChange={e=>setProfile({...profile,lastName:e.target.value})} /></F>
                <F label="Email Address"><SI type="email" value={profile.email||''} onChange={e=>setProfile({...profile,email:e.target.value})} /></F>
                <F label="Mobile / Phone"><SI value={profile.phone||''} onChange={e=>setProfile({...profile,phone:e.target.value})} /></F>
                <F label="Date of Birth"><SI type="date" value={profile.dob?new Date(profile.dob).toISOString().slice(0,10):''} onChange={e=>setProfile({...profile,dob:e.target.value})} /></F>
                <F label="Gender">
                  <SS value={profile.gender||''} onChange={e=>setProfile({...profile,gender:e.target.value})}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option>
                  </SS>
                </F>
                <F label="Country of Birth"><SI value={profile.countryOfBirth||''} onChange={e=>setProfile({...profile,countryOfBirth:e.target.value})} placeholder="e.g. Nepal" /></F>
                <F label="Nationality / Citizenship"><SI value={profile.nationality||''} onChange={e=>setProfile({...profile,nationality:e.target.value})} placeholder="e.g. Nepalese" /></F>
                <F label="Marital Status">
                  <SS value={profile.maritalStatus||''} onChange={e=>setProfile({...profile,maritalStatus:e.target.value})}>
                    <option value="">Select</option>
                    <option>Single</option><option>Married</option><option>De Facto</option><option>Divorced</option><option>Widowed</option>
                  </SS>
                </F>
                <F label="Passport Number"><SI value={profile.passportNumber||''} onChange={e=>setProfile({...profile,passportNumber:e.target.value})} placeholder="e.g. N1234567" /></F>
                <F label="Passport Country of Issue"><SI value={profile.passportCountry||''} onChange={e=>setProfile({...profile,passportCountry:e.target.value})} /></F>
                <F label="Passport Expiry Date"><SI type="date" value={profile.passportExpiry?new Date(profile.passportExpiry).toISOString().slice(0,10):''} onChange={e=>setProfile({...profile,passportExpiry:e.target.value})} /></F>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-3 mt-4">Home Country Address</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <SI className="col-span-2 md:col-span-4" value={profile.address?.street||''} onChange={e=>setProfile({...profile,address:{...profile.address,street:e.target.value}})} placeholder="Street Address" />
                  <SI value={profile.address?.city||''} onChange={e=>setProfile({...profile,address:{...profile.address,city:e.target.value}})} placeholder="City" />
                  <SI value={profile.address?.state||''} onChange={e=>setProfile({...profile,address:{...profile.address,state:e.target.value}})} placeholder="State/Province" />
                  <SI value={profile.address?.postcode||''} onChange={e=>setProfile({...profile,address:{...profile.address,postcode:e.target.value}})} placeholder="Postcode" />
                  <SI value={profile.address?.country||''} onChange={e=>setProfile({...profile,address:{...profile.address,country:e.target.value}})} placeholder="Country" />
                </div>
              </div>
            </div>
          )}

          {/* ── IMMIGRATION ── */}
          {activeTab === 'immigration' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 pb-3 border-b border-slate-100">Immigration & Visa Details</h2>
              <div className="p-4 rounded-2xl text-sm font-medium" style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#3730A3' }}>
                💡 This information stays private. It's used to personalise your PR Calculator, Visa Guide, and AI Compass.
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <F label="Current Location">
                  <SS value={profile.onshore?'true':'false'} onChange={e=>setProfile({...profile,onshore:e.target.value==='true'})}>
                    <option value="false">Offshore (Outside Australia)</option>
                    <option value="true">Onshore (Inside Australia)</option>
                  </SS>
                </F>
                <F label="Current Australian Visa Subclass">
                  <SS value={profile.currentVisa||''} onChange={e=>setProfile({...profile,currentVisa:e.target.value})}>
                    <option value="">None / Offshore</option>
                    <option value="500">500 — Student Visa</option>
                    <option value="485">485 — Graduate Temporary Visa</option>
                    <option value="482">482 — Temporary Skill Shortage</option>
                    <option value="189">189 — Skilled Independent</option>
                    <option value="190">190 — State Nominated</option>
                    <option value="491">491 — Regional Skilled</option>
                    <option value="820">820 — Partner (Onshore)</option>
                    <option value="186">186 — Employer Nomination Scheme</option>
                    <option value="other">Other</option>
                  </SS>
                </F>
                <F label="Visa Expiry / Grant Until">
                  <SI type="date" value={profile.visaExpiry?new Date(profile.visaExpiry).toISOString().slice(0,10):''} onChange={e=>setProfile({...profile,visaExpiry:e.target.value})} />
                </F>
                <F label="Target Visa Pathway">
                  <SS value={profile.targetVisa||''} onChange={e=>setProfile({...profile,targetVisa:e.target.value})}>
                    <option value="">Select your goal</option>
                    <option value="500">500 — Study in Australia</option>
                    <option value="485">485 — Graduate Work Rights</option>
                    <option value="189">189 — PR Skilled Independent</option>
                    <option value="190">190 — PR State Nominated</option>
                    <option value="491">491 — PR Regional</option>
                    <option value="482">482 — Employer Sponsored</option>
                    <option value="820">Partner Visa</option>
                  </SS>
                </F>
                <F label="ANZSCO Occupation Code (Target)">
                  <SI value={profile.anzscoCode||''} onChange={e=>setProfile({...profile,anzscoCode:e.target.value})} placeholder="e.g. 261313 — Software Engineer" className="font-mono" />
                </F>
                <F label="Have you had any visa refusals?">
                  <SS value={profile.visaRefusalHistory||''} onChange={e=>setProfile({...profile,visaRefusalHistory:e.target.value})}>
                    <option value="no">No</option>
                    <option value="yes">Yes — I will disclose to my agent</option>
                  </SS>
                </F>
              </div>

              <h3 className="text-base font-black text-slate-800 mt-6 border-b border-slate-100 pb-2">English Test Results</h3>
              <div className="grid md:grid-cols-2 gap-5">
                <F label="Test Type">
                  <SS value={englishTest.testType||''} onChange={e=>setEnglishTest({...englishTest,testType:e.target.value})}>
                    <option value="">No test taken yet</option>
                    <option value="IELTS">IELTS Academic</option>
                    <option value="IELTS_GT">IELTS General Training</option>
                    <option value="PTE">PTE Academic</option>
                    <option value="TOEFL">TOEFL iBT</option>
                    <option value="CAE">Cambridge C1 Advanced</option>
                    <option value="OET">OET (Occupational English)</option>
                  </SS>
                </F>
                <F label="Overall Band / Score"><SI value={englishTest.score||''} onChange={e=>setEnglishTest({...englishTest,score:e.target.value})} placeholder="e.g. 7.5 or 79" /></F>
                <F label="Listening"><SI value={englishTest.listening||''} onChange={e=>setEnglishTest({...englishTest,listening:e.target.value})} placeholder="e.g. 8.0" /></F>
                <F label="Reading"><SI value={englishTest.reading||''} onChange={e=>setEnglishTest({...englishTest,reading:e.target.value})} placeholder="e.g. 7.5" /></F>
                <F label="Writing"><SI value={englishTest.writing||''} onChange={e=>setEnglishTest({...englishTest,writing:e.target.value})} placeholder="e.g. 7.0" /></F>
                <F label="Speaking"><SI value={englishTest.speaking||''} onChange={e=>setEnglishTest({...englishTest,speaking:e.target.value})} placeholder="e.g. 7.5" /></F>
                <F label="Test Reference (TRF Number)"><SI value={englishTest.trf||''} onChange={e=>setEnglishTest({...englishTest,trf:e.target.value})} /></F>
                <F label="Test Date"><SI type="date" value={englishTest.testDate?new Date(englishTest.testDate).toISOString().slice(0,10):''} onChange={e=>setEnglishTest({...englishTest,testDate:e.target.value})} /></F>
                <F label="Result Expiry"><SI type="date" value={englishTest.expiryDate?new Date(englishTest.expiryDate).toISOString().slice(0,10):''} onChange={e=>setEnglishTest({...englishTest,expiryDate:e.target.value})} /></F>
              </div>
            </div>
          )}

          {/* ── EDUCATION ── */}
          {activeTab === 'education' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-xl font-black text-slate-900">Education History</h2>
                <button onClick={() => setEducation([...education, { institution:'',qualification:'',fieldOfStudy:'',country:'',cricos:'',startDate:'',endDate:'',completed:true }])} className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl transition-all hover:opacity-80" style={{ background: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE' }}>
                  <Plus className="w-4 h-4" /> Add Degree
                </button>
              </div>
              {education.length === 0 ? <p className="text-slate-400 text-center py-12 border-2 border-dashed rounded-2xl">No education added yet</p> : (
                <div className="space-y-4">
                  {education.map((e, i) => (
                    <div key={i} className="p-5 rounded-2xl relative group" style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}>
                      <button onClick={() => setEducation(ed => ed.filter((_,idx)=>idx!==i))} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-rose-50"><Trash2 className="w-4 h-4 text-rose-400" /></button>
                      <div className="grid md:grid-cols-2 gap-4">
                        <F label="Institution / University"><SI value={e.institution||''} onChange={ev=>setEducation(ed=>ed.map((x,idx)=>idx===i?{...x,institution:ev.target.value}:x))} /></F>
                        <F label="Qualification (e.g. Bachelor of IT)"><SI value={e.qualification||''} onChange={ev=>setEducation(ed=>ed.map((x,idx)=>idx===i?{...x,qualification:ev.target.value}:x))} /></F>
                        <F label="Field of Study"><SI value={e.fieldOfStudy||''} onChange={ev=>setEducation(ed=>ed.map((x,idx)=>idx===i?{...x,fieldOfStudy:ev.target.value}:x))} /></F>
                        <F label="Country"><SI value={e.country||''} onChange={ev=>setEducation(ed=>ed.map((x,idx)=>idx===i?{...x,country:ev.target.value}:x))} /></F>
                        <F label="CRICOS Code (if Australian)"><SI value={e.cricos||''} onChange={ev=>setEducation(ed=>ed.map((x,idx)=>idx===i?{...x,cricos:ev.target.value}:x))} placeholder="e.g. 02020G" /></F>
                        <F label="Duration">
                          <div className="flex gap-2">
                            <SI type="month" value={e.startDate?String(e.startDate).slice(0,7):''} onChange={ev=>setEducation(ed=>ed.map((x,idx)=>idx===i?{...x,startDate:ev.target.value}:x))} className="flex-1" placeholder="Start" />
                            <SI type="month" value={e.endDate?String(e.endDate).slice(0,7):''} onChange={ev=>setEducation(ed=>ed.map((x,idx)=>idx===i?{...x,endDate:ev.target.value}:x))} className="flex-1" placeholder="End" />
                          </div>
                        </F>
                      </div>
                      <label className="flex items-center gap-2 mt-3 cursor-pointer">
                        <input type="checkbox" checked={!!e.completed} onChange={ev=>setEducation(ed=>ed.map((x,idx)=>idx===i?{...x,completed:ev.target.checked}:x))} className="w-4 h-4 rounded" />
                        <span className="text-sm font-semibold text-slate-600">Course Completed / Graduated</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── EXPERIENCE ── */}
          {activeTab === 'experience' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Work History</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Include all work — home country and Australia. Important for PR points.</p>
                </div>
                <button onClick={() => setExperience([...experience, { employer:'',role:'',country:'',hoursPerWeek:'',startDate:'',endDate:'',isCurrent:false,description:'' }])} className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl transition-all hover:opacity-80" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                  <Plus className="w-4 h-4" /> Add Role
                </button>
              </div>
              {experience.length === 0 ? <p className="text-slate-400 text-center py-12 border-2 border-dashed rounded-2xl">No work experience added yet</p> : (
                <div className="space-y-4">
                  {experience.map((e, i) => (
                    <div key={i} className="p-5 rounded-2xl relative group" style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}>
                      <button onClick={() => setExperience(ex => ex.filter((_,idx)=>idx!==i))} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-rose-50"><Trash2 className="w-4 h-4 text-rose-400" /></button>
                      <div className="grid md:grid-cols-2 gap-4">
                        <F label="Employer / Company"><SI value={e.employer||''} onChange={ev=>setExperience(ex=>ex.map((x,idx)=>idx===i?{...x,employer:ev.target.value}:x))} /></F>
                        <F label="Job Title / Role"><SI value={e.role||''} onChange={ev=>setExperience(ex=>ex.map((x,idx)=>idx===i?{...x,role:ev.target.value}:x))} /></F>
                        <F label="Country"><SI value={e.country||''} onChange={ev=>setExperience(ex=>ex.map((x,idx)=>idx===i?{...x,country:ev.target.value}:x))} /></F>
                        <F label="Average Hours / Week"><SI type="number" value={e.hoursPerWeek||''} onChange={ev=>setExperience(ex=>ex.map((x,idx)=>idx===i?{...x,hoursPerWeek:ev.target.value}:x))} placeholder="e.g. 38" /></F>
                        <F label="Start Month"><SI type="month" value={e.startDate?String(e.startDate).slice(0,7):''} onChange={ev=>setExperience(ex=>ex.map((x,idx)=>idx===i?{...x,startDate:ev.target.value}:x))} /></F>
                        <F label="End Month"><SI type="month" value={e.endDate?String(e.endDate).slice(0,7):''} onChange={ev=>setExperience(ex=>ex.map((x,idx)=>idx===i?{...x,endDate:ev.target.value}:x))} disabled={!!e.isCurrent} /></F>
                      </div>
                      <label className="flex items-center gap-2 mt-3 cursor-pointer">
                        <input type="checkbox" checked={!!e.isCurrent} onChange={ev=>setExperience(ex=>ex.map((x,idx)=>idx===i?{...x,isCurrent:ev.target.checked}:x))} className="w-4 h-4 rounded" />
                        <span className="text-sm font-semibold text-slate-600">I currently work here</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SKILLS ASSESSMENT & EOI ── */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 pb-3 border-b border-slate-100">Skills Assessment & EOI</h2>

              <h3 className="text-base font-black text-slate-700">Skills Assessment</h3>
              <div className="p-4 rounded-2xl text-sm" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534' }}>
                📋 A positive skills assessment is required for most skilled visa subclasses (189, 190, 491). Check <a href="https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-tested" target="_blank" rel="noopener noreferrer" className="underline font-bold">IMMI Homeaffairs</a> for the right assessing body for your ANZSCO code.
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <F label="Assessing Body">
                  <SS value={skillsData.assessingBody||''} onChange={e=>setSkillsData({...skillsData,assessingBody:e.target.value})}>
                    <option value="">Not started</option>
                    <option value="EA">Engineers Australia (EA)</option>
                    <option value="VETASSESS">VETASSESS</option>
                    <option value="ACS">Australian Computer Society (ACS)</option>
                    <option value="AHPRA">AHPRA (Health)</option>
                    <option value="CPA">CPA Australia</option>
                    <option value="TEQSA">TEQSA (Education)</option>
                    <option value="AIQS">AIQS (Quantity Surveyors)</option>
                    <option value="other">Other</option>
                  </SS>
                </F>
                <F label="Application Reference Number"><SI value={skillsData.referenceNumber||''} onChange={e=>setSkillsData({...skillsData,referenceNumber:e.target.value})} /></F>
                <F label="Result">
                  <SS value={skillsData.outcome||''} onChange={e=>setSkillsData({...skillsData,outcome:e.target.value})}>
                    <option value="">Pending / Not submitted</option>
                    <option value="Suitable">Suitable (Positive)</option>
                    <option value="Not Suitable">Not Suitable</option>
                    <option value="Closely Related">Closely Related</option>
                  </SS>
                </F>
                <F label="Outcome Date"><SI type="date" value={skillsData.outcomeDate?new Date(skillsData.outcomeDate).toISOString().slice(0,10):''} onChange={e=>setSkillsData({...skillsData,outcomeDate:e.target.value})} /></F>
              </div>

              <h3 className="text-base font-black text-slate-700 mt-4">SkillSelect (EOI)</h3>
              <div className="grid md:grid-cols-2 gap-5">
                <F label="EOI Submitted?">
                  <SS value={skillsData.eoiSubmitted||''} onChange={e=>setSkillsData({...skillsData,eoiSubmitted:e.target.value})}>
                    <option value="">Not yet</option>
                    <option value="yes">Yes — EOI is active</option>
                    <option value="invited">Yes — Received an invitation</option>
                  </SS>
                </F>
                <F label="Points at EOI Submission"><SI type="number" value={skillsData.eoiPoints||''} onChange={e=>setSkillsData({...skillsData,eoiPoints:e.target.value})} placeholder="e.g. 85" /></F>
                <F label="EOI Submission Date"><SI type="date" value={skillsData.eoiDate?new Date(skillsData.eoiDate).toISOString().slice(0,10):''} onChange={e=>setSkillsData({...skillsData,eoiDate:e.target.value})} /></F>
                <F label="Invitation Received Date"><SI type="date" value={skillsData.invitationDate?new Date(skillsData.invitationDate).toISOString().slice(0,10):''} onChange={e=>setSkillsData({...skillsData,invitationDate:e.target.value})} /></F>
                <F label="State Nomination Applied?">
                  <SS value={skillsData.stateNomination||''} onChange={e=>setSkillsData({...skillsData,stateNomination:e.target.value})}>
                    <option value="">Not applicable</option>
                    <option value="applied">Applied (190/491)</option>
                    <option value="granted">Granted</option>
                    <option value="declined">Declined</option>
                  </SS>
                </F>
                <F label="Nominating State"><SI value={skillsData.nominatingState||''} onChange={e=>setSkillsData({...skillsData,nominatingState:e.target.value})} placeholder="e.g. Victoria, NSW" /></F>
              </div>
            </div>
          )}

          {/* ── HEALTH & CHARACTER ── */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 pb-3 border-b border-slate-100">Health & Character</h2>
              <div className="p-4 rounded-2xl text-sm" style={{ background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412' }}>
                ⚠️ You'll need to meet health and character requirements for most Australian visas. You do not need to disclose sensitive medical history here — just track your official checks.
              </div>

              <h3 className="text-base font-black text-slate-700">Health Examinations</h3>
              <div className="grid md:grid-cols-2 gap-5">
                <F label="Health Check Status">
                  <SS value={healthData.healthStatus||''} onChange={e=>setHealthData({...healthData,healthStatus:e.target.value})}>
                    <option value="">Not booked yet</option>
                    <option value="booked">Booked</option>
                    <option value="completed">Completed (Results awaited)</option>
                    <option value="cleared">Cleared (Medical passed)</option>
                    <option value="waiver">Waiver applied</option>
                  </SS>
                </F>
                <F label="HAP ID (Health Applicant Portal ID)"><SI value={healthData.hapId||''} onChange={e=>setHealthData({...healthData,hapId:e.target.value})} placeholder="e.g. HAP1234567" /></F>
                <F label="Health Check Date"><SI type="date" value={healthData.healthDate?new Date(healthData.healthDate).toISOString().slice(0,10):''} onChange={e=>setHealthData({...healthData,healthDate:e.target.value})} /></F>
                <F label="Chest X-Ray Required?">
                  <SS value={healthData.chestXray||''} onChange={e=>setHealthData({...healthData,chestXray:e.target.value})}>
                    <option value="">Unknown</option>
                    <option value="yes">Yes — completed</option>
                    <option value="no">No — not required</option>
                  </SS>
                </F>
              </div>

              <h3 className="text-base font-black text-slate-700 mt-4">Character</h3>
              <div className="grid md:grid-cols-2 gap-5">
                <F label="Australian Police Clearance (NPC)">
                  <SS value={healthData.australiaPCC||''} onChange={e=>setHealthData({...healthData,australiaPCC:e.target.value})}>
                    <option value="">Not started</option>
                    <option value="applied">Applied (AFP)</option>
                    <option value="obtained">Obtained — Clear</option>
                  </SS>
                </F>
                <F label="Home Country Police Clearance">
                  <SS value={healthData.homePCC||''} onChange={e=>setHealthData({...healthData,homePCC:e.target.value})}>
                    <option value="">Not started</option>
                    <option value="applied">Applied</option>
                    <option value="obtained">Obtained — Clear</option>
                  </SS>
                </F>
                <F label="Other Country PCC (if lived 12m+ elsewhere)">
                  <SI value={healthData.otherPCC||''} onChange={e=>setHealthData({...healthData,otherPCC:e.target.value})} placeholder="List countries" />
                </F>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
