import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { authFetch } from '../../store/auth';
import { Plus, Trash2, ArrowLeft, ChevronRight, ChevronLeft, User, GraduationCap, Briefcase, Users, FileCheck } from 'lucide-react';

type Education = { institution: string; qualification: string; fieldOfStudy: string; country: string; startDate: string; endDate: string; completed: boolean };
type Experience = { employer: string; role: string; country: string; startDate: string; endDate: string; isCurrent: boolean; description: string; fullTime: boolean };
type FamilyMember = { relationship: string; firstName: string; lastName: string; dob: string; nationality: string; includedInApplication: boolean };
type Service = { serviceType: string; visaSubclass: string; status: string; notes: string };

const emptyEducation: Education = { institution: '', qualification: '', fieldOfStudy: '', country: '', startDate: '', endDate: '', completed: false };
const emptyExperience: Experience = { employer: '', role: '', country: '', startDate: '', endDate: '', isCurrent: false, description: '', fullTime: true };
const emptyFamily: FamilyMember = { relationship: '', firstName: '', lastName: '', dob: '', nationality: '', includedInApplication: false };
const emptyService: Service = { serviceType: '', visaSubclass: '', status: 'PENDING', notes: '' };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STEPS = [
  { id: 1, label: 'Personal', icon: User },
  { id: 2, label: 'Education & Work', icon: GraduationCap },
  { id: 3, label: 'English & Family', icon: Users },
  { id: 4, label: 'Services & Visa', icon: FileCheck },
];

export default function ClientEnroll() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const consultancyId = searchParams.get('consultancyId');
  const [step, setStep] = useState(1);
  const [visaTypes, setVisaTypes] = useState<{ value: string; label: string }[]>([]);
  const [services, setServices] = useState<{ value: string; label: string }[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    profile: { firstName: '', lastName: '', email: '', phone: '', dob: '', gender: '', nationality: '', countryOfBirth: '', maritalStatus: '', passportNumber: '', passportExpiry: '', passportCountry: '', currentVisa: '', visaExpiry: '', address: { street: '', city: '', state: '', postcode: '', country: 'Australia' } },
    education: [emptyEducation] as Education[],
    experience: [emptyExperience] as Experience[],
    familyMembers: [emptyFamily] as FamilyMember[],
    services: [emptyService] as Service[],
    englishTest: { testType: '', score: '', testDate: '', expiryDate: '' },
    visaType: '',
    assignedAgentId: '',
    initialNotes: '',
  });

  useEffect(() => {
    Promise.all([
      authFetch('/api/constants/visa-types').then(r => r.json()),
      authFetch('/api/constants/services').then(r => r.json()),
      authFetch('/api/employees').then(r => r.json()),
    ]).then(([vt, svc, ag]) => {
      setVisaTypes(vt);
      setServices(svc);
      setAgents(ag);
    });
  }, []);

  const addEducation = () => setForm(f => ({ ...f, education: [...f.education, { ...emptyEducation }] }));
  const removeEducation = (i: number) => setForm(f => ({ ...f, education: f.education.filter((_, j) => j !== i) }));
  const updateEducation = (i: number, field: keyof Education, val: any) =>
    setForm(f => ({ ...f, education: f.education.map((e, j) => j === i ? { ...e, [field]: val } : e) }));

  const addExperience = () => setForm(f => ({ ...f, experience: [...f.experience, { ...emptyExperience }] }));
  const removeExperience = (i: number) => setForm(f => ({ ...f, experience: f.experience.filter((_, j) => j !== i) }));
  const updateExperience = (i: number, field: keyof Experience, val: any) =>
    setForm(f => ({ ...f, experience: f.experience.map((e, j) => j === i ? { ...e, [field]: val } : e) }));

  const addFamily = () => setForm(f => ({ ...f, familyMembers: [...f.familyMembers, { ...emptyFamily }] }));
  const removeFamily = (i: number) => setForm(f => ({ ...f, familyMembers: f.familyMembers.filter((_, j) => j !== i) }));
  const updateFamily = (i: number, field: keyof FamilyMember, val: any) =>
    setForm(f => ({ ...f, familyMembers: f.familyMembers.map((m, j) => j === i ? { ...m, [field]: val } : m) }));

  const addService = () => setForm(f => ({ ...f, services: [...f.services, { ...emptyService }] }));
  const removeService = (i: number) => setForm(f => ({ ...f, services: f.services.filter((_, j) => j !== i) }));
  const updateService = (i: number, field: keyof Service, val: any) =>
    setForm(f => ({ ...f, services: f.services.map((s, j) => j === i ? { ...s, [field]: val } : s) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fn = (form.profile.firstName || '').trim();
    const ln = (form.profile.lastName || '').trim();
    const email = (form.profile.email || '').trim();
    if (!fn) { setError('First name is required.'); return; }
    if (!ln) { setError('Last name is required.'); return; }
    if (!email) { setError('Email is required.'); return; }
    if (!EMAIL_REGEX.test(email)) { setError('Please enter a valid email address.'); return; }
    setLoading(true);
    setError('');
    try {
      const payload: any = {
        ...form,
        profile: { ...form.profile, dob: form.profile.dob || undefined },
        education: form.education.filter(e => e.institution || e.qualification),
        experience: form.experience.filter(e => e.employer || e.role),
        familyMembers: form.familyMembers.filter(m => m.firstName || m.lastName),
        services: form.services.filter(s => s.serviceType),
        englishTest: form.englishTest.testType ? { ...form.englishTest, testType: form.englishTest.testType, testDate: form.englishTest.testDate || undefined, expiryDate: form.englishTest.expiryDate || undefined } : undefined,
        assignedAgentId: form.assignedAgentId || undefined,
        initialNotes: form.initialNotes?.trim() || undefined,
      };
      if (consultancyId) payload.consultancyId = consultancyId;
      const res = await authFetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const client = await res.json();
      if (!res.ok) throw new Error(client.error || 'Failed to create client');
      const id = client._id || client.id;
      if (!id) throw new Error('Server did not return client ID');
      navigate(consultancyId ? `/consultancy/clients/${id}?consultancyId=${consultancyId}` : `/consultancy/clients/${id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link to={consultancyId ? `/consultancy/clients?consultancyId=${consultancyId}` : '/consultancy/clients'} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Clients
      </Link>
      <h1 className="text-2xl font-display font-bold text-slate-900">Enroll Student / Client</h1>
      <p className="text-slate-500 mt-1">Step-by-step onboarding. Only name and email are required.</p>

      {/* Step indicator */}
      <div className="flex gap-2 mt-6 mb-6 overflow-x-auto">
        {STEPS.map((s) => {
          const Icon = s.icon;
          return (
            <button key={s.id} type="button" onClick={() => setStep(s.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition shrink-0 ${step === s.id ? 'bg-ori-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              <Icon className="w-4 h-4" /> {s.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && <div className="p-4 rounded-lg bg-red-50 text-red-600">{error}</div>}

        {step === 1 && (
        <div className="card">
          <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2"><User className="w-5 h-5 text-ori-600" /> Personal Details (Required: Name & Email)</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label><input value={form.profile.firstName} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, firstName: e.target.value } }))} className="input" required /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label><input value={form.profile.lastName} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, lastName: e.target.value } }))} className="input" required /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Email *</label><input type="email" value={form.profile.email} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, email: e.target.value } }))} className="input" required /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input value={form.profile.phone} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, phone: e.target.value } }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label><input type="date" value={form.profile.dob} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, dob: e.target.value } }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Gender</label><select value={form.profile.gender} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, gender: e.target.value } }))} className="input"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Nationality</label><input value={form.profile.nationality} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, nationality: e.target.value } }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Country of Birth</label><input value={form.profile.countryOfBirth} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, countryOfBirth: e.target.value } }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Marital Status</label><select value={form.profile.maritalStatus} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, maritalStatus: e.target.value } }))} className="input"><option value="">Select</option><option value="Single">Single</option><option value="Married">Married</option><option value="De facto">De facto</option><option value="Divorced">Divorced</option><option value="Widowed">Widowed</option></select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Passport Number</label><input value={form.profile.passportNumber} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, passportNumber: e.target.value } }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Passport Expiry</label><input type="date" value={form.profile.passportExpiry} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, passportExpiry: e.target.value } }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Current Visa</label><input value={form.profile.currentVisa} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, currentVisa: e.target.value } }))} className="input" placeholder="e.g. 500, 485" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Visa Expiry</label><input type="date" value={form.profile.visaExpiry} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, visaExpiry: e.target.value } }))} className="input" /></div>
          </div>
          <div className="mt-4"><label className="block text-sm font-medium text-slate-700 mb-1">Address</label><div className="grid md:grid-cols-2 gap-2"><input value={form.profile.address?.street} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, address: { ...f.profile.address!, street: e.target.value } } }))} className="input" placeholder="Street" /><input value={form.profile.address?.city} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, address: { ...f.profile.address!, city: e.target.value } } }))} className="input" placeholder="City" /><input value={form.profile.address?.state} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, address: { ...f.profile.address!, state: e.target.value } } }))} className="input" placeholder="State" /><input value={form.profile.address?.postcode} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, address: { ...f.profile.address!, postcode: e.target.value } } }))} className="input" placeholder="Postcode" /><input value={form.profile.address?.country} onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, address: { ...f.profile.address!, country: e.target.value } } }))} className="input" placeholder="Country" /></div></div>
        </div>
        )}

        {step === 2 && (
        <>
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-900 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-ori-600" /> Education</h2>
            <button type="button" onClick={addEducation} className="btn-secondary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Add another</button>
          </div>
          {form.education.map((ed, i) => (
            <div key={i} className="p-4 rounded-lg border border-slate-200 mb-4 flex gap-4">
              <div className="flex-1 grid md:grid-cols-2 gap-3">
                <input value={ed.institution} onChange={e => updateEducation(i, 'institution', e.target.value)} className="input" placeholder="Institution" />
                <input value={ed.qualification} onChange={e => updateEducation(i, 'qualification', e.target.value)} className="input" placeholder="Qualification" />
                <input value={ed.fieldOfStudy} onChange={e => updateEducation(i, 'fieldOfStudy', e.target.value)} className="input" placeholder="Field of Study" />
                <input value={ed.country} onChange={e => updateEducation(i, 'country', e.target.value)} className="input" placeholder="Country" />
                <input type="date" value={ed.startDate} onChange={e => updateEducation(i, 'startDate', e.target.value)} className="input" placeholder="Start" />
                <input type="date" value={ed.endDate} onChange={e => updateEducation(i, 'endDate', e.target.value)} className="input" placeholder="End" />
                <label className="flex items-center gap-2"><input type="checkbox" checked={ed.completed} onChange={e => updateEducation(i, 'completed', e.target.checked)} /> Completed</label>
              </div>
              <button type="button" onClick={() => removeEducation(i)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-900 flex items-center gap-2"><Briefcase className="w-5 h-5 text-ori-600" /> Work Experience</h2>
            <button type="button" onClick={addExperience} className="btn-secondary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Add another</button>
          </div>
          {form.experience.map((ex, i) => (
            <div key={i} className="p-4 rounded-lg border border-slate-200 mb-4 flex gap-4">
              <div className="flex-1 grid md:grid-cols-2 gap-3">
                <input value={ex.employer} onChange={e => updateExperience(i, 'employer', e.target.value)} className="input" placeholder="Employer" />
                <input value={ex.role} onChange={e => updateExperience(i, 'role', e.target.value)} className="input" placeholder="Role" />
                <input value={ex.country} onChange={e => updateExperience(i, 'country', e.target.value)} className="input" placeholder="Country" />
                <input type="date" value={ex.startDate} onChange={e => updateExperience(i, 'startDate', e.target.value)} className="input" placeholder="Start" />
                <input type="date" value={ex.endDate} onChange={e => updateExperience(i, 'endDate', e.target.value)} className="input" placeholder="End" disabled={ex.isCurrent} />
                <label className="flex items-center gap-2"><input type="checkbox" checked={ex.isCurrent} onChange={e => updateExperience(i, 'isCurrent', e.target.checked)} /> Current</label>
                <label className="flex items-center gap-2 md:col-span-2"><input type="checkbox" checked={ex.fullTime} onChange={e => updateExperience(i, 'fullTime', e.target.checked)} /> Full-time</label>
                <textarea value={ex.description} onChange={e => updateExperience(i, 'description', e.target.value)} className="input md:col-span-2" placeholder="Description" rows={2} />
              </div>
              <button type="button" onClick={() => removeExperience(i)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        </>
        )}

        {step === 3 && (
        <>
        <div className="card">
          <h2 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-ori-600" /> English Test</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Test Type</label><select value={form.englishTest.testType} onChange={e => setForm(f => ({ ...f, englishTest: { ...f.englishTest, testType: e.target.value } }))} className="input"><option value="">Select</option><option value="IELTS">IELTS</option><option value="PTE">PTE</option><option value="TOEFL">TOEFL</option><option value="OET">OET</option></select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Score</label><input value={form.englishTest.score} onChange={e => setForm(f => ({ ...f, englishTest: { ...f.englishTest, score: e.target.value } }))} className="input" placeholder="e.g. 7.0" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Test Date</label><input type="date" value={form.englishTest.testDate} onChange={e => setForm(f => ({ ...f, englishTest: { ...f.englishTest, testDate: e.target.value } }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label><input type="date" value={form.englishTest.expiryDate} onChange={e => setForm(f => ({ ...f, englishTest: { ...f.englishTest, expiryDate: e.target.value } }))} className="input" /></div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-900">Family Members</h2>
            <button type="button" onClick={addFamily} className="btn-secondary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Add another</button>
          </div>
          {form.familyMembers.map((fm, i) => (
            <div key={i} className="p-4 rounded-lg border border-slate-200 mb-4 flex gap-4">
              <div className="flex-1 grid md:grid-cols-2 gap-3">
                <select value={fm.relationship} onChange={e => updateFamily(i, 'relationship', e.target.value)} className="input"><option value="">Relationship</option><option value="Spouse">Spouse</option><option value="Child">Child</option><option value="Parent">Parent</option><option value="Other">Other</option></select>
                <input value={fm.firstName} onChange={e => updateFamily(i, 'firstName', e.target.value)} className="input" placeholder="First Name" />
                <input value={fm.lastName} onChange={e => updateFamily(i, 'lastName', e.target.value)} className="input" placeholder="Last Name" />
                <input type="date" value={fm.dob} onChange={e => updateFamily(i, 'dob', e.target.value)} className="input" placeholder="DOB" />
                <input value={fm.nationality} onChange={e => updateFamily(i, 'nationality', e.target.value)} className="input" placeholder="Nationality" />
                <label className="flex items-center gap-2"><input type="checkbox" checked={fm.includedInApplication} onChange={e => updateFamily(i, 'includedInApplication', e.target.checked)} /> Include in application</label>
              </div>
              <button type="button" onClick={() => removeFamily(i)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        </>
        )}

        {step === 4 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-900 flex items-center gap-2"><FileCheck className="w-5 h-5 text-ori-600" /> Services & Visa</h2>
            <button type="button" onClick={addService} className="btn-secondary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Add service</button>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Primary Visa Type</label>
            <select value={form.visaType} onChange={e => setForm(f => ({ ...f, visaType: e.target.value }))} className="input">
              <option value="">Select visa type</option>
              {visaTypes.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </div>
          {form.services.map((svc, i) => (
            <div key={i} className="p-4 rounded-lg border border-slate-200 mb-4 flex gap-4">
              <div className="flex-1 grid md:grid-cols-2 gap-3">
                <select value={svc.serviceType} onChange={e => updateService(i, 'serviceType', e.target.value)} className="input">
                  <option value="">Service type</option>
                  {services.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <select value={svc.visaSubclass} onChange={e => updateService(i, 'visaSubclass', e.target.value)} className="input">
                  <option value="">Visa subclass</option>
                  {visaTypes.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
                <select value={svc.status} onChange={e => updateService(i, 'status', e.target.value)} className="input"><option value="PENDING">Pending</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option></select>
                <input value={svc.notes} onChange={e => updateService(i, 'notes', e.target.value)} className="input md:col-span-2" placeholder="Notes" />
              </div>
              <button type="button" onClick={() => removeService(i)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Assign Agent</label>
            <select value={form.assignedAgentId} onChange={e => setForm(f => ({ ...f, assignedAgentId: e.target.value }))} className="input">
              <option value="">Select agent</option>
              {agents.map(a => <option key={a._id} value={a._id}>{a.profile?.firstName} {a.profile?.lastName}</option>)}
            </select>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Initial notes about this client</label>
            <textarea value={form.initialNotes} onChange={e => setForm(f => ({ ...f, initialNotes: e.target.value }))} className="input min-h-[80px]" placeholder="e.g. Student visa 500, targeting Feb 2026 intake, IELTS pending..." rows={3} />
          </div>
        </div>
        )}

        <div className="flex gap-4 items-center">
          {step > 1 && <button type="button" onClick={() => setStep(s => s - 1)} className="btn-secondary flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Back</button>}
          {step < 4 ? <button type="button" onClick={() => setStep(s => s + 1)} className="btn-primary flex items-center gap-1">Next <ChevronRight className="w-4 h-4" /></button> : <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Enrolling...' : 'Enroll Client'}</button>}
          <Link to="/consultancy/clients" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
