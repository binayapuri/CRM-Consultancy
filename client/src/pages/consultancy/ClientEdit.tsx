import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authFetch } from '../../store/auth';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';

type Education = { institution: string; qualification: string; fieldOfStudy: string; country: string; startDate: string; endDate: string; completed: boolean };
type Experience = { employer: string; role: string; country: string; startDate: string; endDate: string; isCurrent: boolean; description: string; fullTime: boolean };
type FamilyMember = { relationship: string; firstName: string; lastName: string; dob: string; nationality: string; includedInApplication: boolean };
type Service = { serviceType: string; visaSubclass: string; status: string; notes: string };

const emptyEducation: Education = { institution: '', qualification: '', fieldOfStudy: '', country: '', startDate: '', endDate: '', completed: false };
const emptyExperience: Experience = { employer: '', role: '', country: '', startDate: '', endDate: '', isCurrent: false, description: '', fullTime: true };
const emptyFamily: FamilyMember = { relationship: '', firstName: '', lastName: '', dob: '', nationality: '', includedInApplication: false };
const emptyService: Service = { serviceType: '', visaSubclass: '', status: 'PENDING', notes: '' };

export default function ClientEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visaTypes, setVisaTypes] = useState<{ value: string; label: string }[]>([]);
  const [services, setServices] = useState<{ value: string; label: string }[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      authFetch('/api/constants/visa-types').then(r => r.json()),
      authFetch('/api/constants/services').then(r => r.json()),
      authFetch('/api/employees').then(r => r.json()),
      authFetch(`/api/clients/${id}`).then(r => r.json()),
    ]).then(([vt, svc, ag, client]) => {
      if (client?.error) throw new Error(client.error);
      setVisaTypes(vt || []);
      setServices(svc || []);
      setAgents(ag || []);
      const p = client.profile || {};
      const addr = p.address || {};
      setForm({
        profile: { firstName: p.firstName || '', lastName: p.lastName || '', email: p.email || '', phone: p.phone || '', dob: p.dob ? new Date(p.dob).toISOString().slice(0, 10) : '', gender: p.gender || '', nationality: p.nationality || '', countryOfBirth: p.countryOfBirth || '', maritalStatus: p.maritalStatus || '', passportNumber: p.passportNumber || '', passportExpiry: p.passportExpiry ? new Date(p.passportExpiry).toISOString().slice(0, 10) : '', passportCountry: p.passportCountry || '', currentVisa: p.currentVisa || '', visaExpiry: p.visaExpiry ? new Date(p.visaExpiry).toISOString().slice(0, 10) : '', address: { street: addr.street || '', city: addr.city || '', state: addr.state || '', postcode: addr.postcode || '', country: addr.country || 'Australia' }, photoUrl: p.photoUrl || '', signatureUrl: p.signatureUrl || '' },
        education: (client.education?.length ? client.education.map((e: any) => ({ ...emptyEducation, ...e, startDate: e.startDate ? new Date(e.startDate).toISOString().slice(0, 10) : '', endDate: e.endDate ? new Date(e.endDate).toISOString().slice(0, 10) : '' })) : [emptyEducation]) as Education[],
        experience: (client.experience?.length ? client.experience.map((e: any) => ({ ...emptyExperience, ...e, startDate: e.startDate ? new Date(e.startDate).toISOString().slice(0, 10) : '', endDate: e.endDate ? new Date(e.endDate).toISOString().slice(0, 10) : '' })) : [emptyExperience]) as Experience[],
        familyMembers: (client.familyMembers?.length ? client.familyMembers.map((m: any) => ({ ...emptyFamily, ...m, dob: m.dob ? new Date(m.dob).toISOString().slice(0, 10) : '' })) : [emptyFamily]) as FamilyMember[],
        services: (client.services?.length ? client.services.map((s: any) => ({ ...emptyService, ...s })) : [emptyService]) as Service[],
        englishTest: client.englishTest || { testType: client.englishTest?.type || '', score: '', testDate: '', expiryDate: '' },
        visaType: client.visaType || '',
        assignedAgentId: client.assignedAgentId?._id || client.assignedAgentId || '',
        initialNotes: client.initialNotes || '',
      });
    }).catch(() => setForm(null));
  }, [id]);

  const addEducation = () => form && setForm((f: any) => ({ ...f, education: [...f.education, { ...emptyEducation }] }));
  const removeEducation = (i: number) => setForm((f: any) => ({ ...f, education: f.education.filter((_: any, j: number) => j !== i) }));
  const updateEducation = (i: number, field: keyof Education, val: any) => setForm((f: any) => ({ ...f, education: f.education.map((e: Education, j: number) => j === i ? { ...e, [field]: val } : e) }));

  const addExperience = () => setForm((f: any) => ({ ...f, experience: [...f.experience, { ...emptyExperience }] }));
  const removeExperience = (i: number) => setForm((f: any) => ({ ...f, experience: f.experience.filter((_: any, j: number) => j !== i) }));
  const updateExperience = (i: number, field: keyof Experience, val: any) => setForm((f: any) => ({ ...f, experience: f.experience.map((e: Experience, j: number) => j === i ? { ...e, [field]: val } : e) }));

  const addFamilyMember = () => setForm((f: any) => ({ ...f, familyMembers: [...f.familyMembers, { ...emptyFamily }] }));
  const removeFamilyMember = (i: number) => setForm((f: any) => ({ ...f, familyMembers: f.familyMembers.filter((_: any, j: number) => j !== i) }));
  const updateFamilyMember = (i: number, field: keyof FamilyMember, val: any) => setForm((f: any) => ({ ...f, familyMembers: f.familyMembers.map((m: FamilyMember, j: number) => j === i ? { ...m, [field]: val } : m) }));

  const addService = () => setForm((f: any) => ({ ...f, services: [...f.services, { ...emptyService }] }));
  const removeService = (i: number) => setForm((f: any) => ({ ...f, services: f.services.filter((_: any, j: number) => j !== i) }));
  const updateService = (i: number, field: keyof Service, val: any) => setForm((f: any) => ({ ...f, services: f.services.map((s: Service, j: number) => j === i ? { ...s, [field]: val } : s) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        profile: { ...form.profile, dob: form.profile.dob || undefined },
        education: form.education.filter((e: Education) => e.institution || e.qualification),
        experience: form.experience.filter((e: Experience) => e.employer || e.role),
        familyMembers: form.familyMembers.filter((m: FamilyMember) => m.firstName || m.lastName),
        services: form.services.filter((s: Service) => s.serviceType),
        englishTest: (form.englishTest?.testType || form.englishTest?.type) ? { testType: form.englishTest.testType || form.englishTest.type, score: form.englishTest.score, testDate: form.englishTest.testDate || undefined, expiryDate: form.englishTest.expiryDate || undefined } : undefined,
        assignedAgentId: form.assignedAgentId || null,
        initialNotes: form.initialNotes || undefined,
      };
      await authFetch(`/api/clients/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      navigate(`/consultancy/clients/${id}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!form) return <div className="text-slate-500">Loading...</div>;

  return (
    <div>
      <Link to={`/consultancy/clients/${id}`} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"><ArrowLeft className="w-4 h-4" /> Back to Client</Link>
      <h1 className="text-2xl font-display font-bold text-slate-900">Edit Client</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        <div className="card">
          <h2 className="font-display font-semibold text-slate-900 mb-4">Personal Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label><input value={form.profile.firstName} onChange={e => setForm((f: any) => ({ ...f, profile: { ...f.profile, firstName: e.target.value } }))} className="input" required /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label><input value={form.profile.lastName} onChange={e => setForm((f: any) => ({ ...f, profile: { ...f.profile, lastName: e.target.value } }))} className="input" required /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Email *</label><input type="email" value={form.profile.email} onChange={e => setForm((f: any) => ({ ...f, profile: { ...f.profile, email: e.target.value } }))} className="input" required /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input value={form.profile.phone} onChange={e => setForm((f: any) => ({ ...f, profile: { ...f.profile, phone: e.target.value } }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">DOB</label><input type="date" value={form.profile.dob} onChange={e => setForm((f: any) => ({ ...f, profile: { ...f.profile, dob: e.target.value } }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Nationality</label><input value={form.profile.nationality} onChange={e => setForm((f: any) => ({ ...f, profile: { ...f.profile, nationality: e.target.value } }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Passport</label><input value={form.profile.passportNumber} onChange={e => setForm((f: any) => ({ ...f, profile: { ...f.profile, passportNumber: e.target.value } }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Passport Expiry</label><input type="date" value={form.profile.passportExpiry} onChange={e => setForm((f: any) => ({ ...f, profile: { ...f.profile, passportExpiry: e.target.value } }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Current Visa</label><input value={form.profile.currentVisa} onChange={e => setForm((f: any) => ({ ...f, profile: { ...f.profile, currentVisa: e.target.value } }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Visa Expiry</label><input type="date" value={form.profile.visaExpiry} onChange={e => setForm((f: any) => ({ ...f, profile: { ...f.profile, visaExpiry: e.target.value } }))} className="input" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Address</label><div className="grid grid-cols-2 gap-2"><input value={form.profile.address?.street} onChange={e => setForm((f: any) => ({ ...f, profile: { ...f.profile, address: { ...f.profile.address, street: e.target.value } } }))} className="input" placeholder="Street" /><input value={form.profile.address?.city} onChange={e => setForm((f: any) => ({ ...f, profile: { ...f.profile, address: { ...f.profile.address, city: e.target.value } } }))} className="input" placeholder="City" /><input value={form.profile.address?.state} onChange={e => setForm((f: any) => ({ ...f, profile: { ...f.profile, address: { ...f.profile.address, state: e.target.value } } }))} className="input" placeholder="State" /><input value={form.profile.address?.postcode} onChange={e => setForm((f: any) => ({ ...f, profile: { ...f.profile, address: { ...f.profile.address, postcode: e.target.value } } }))} className="input" placeholder="Postcode" /><input value={form.profile.address?.country} onChange={e => setForm((f: any) => ({ ...f, profile: { ...f.profile, address: { ...f.profile.address, country: e.target.value } } }))} className="input col-span-2" placeholder="Country" /></div></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Initial notes about this client</label><textarea value={form.initialNotes || ''} onChange={e => setForm((f: any) => ({ ...f, initialNotes: e.target.value }))} className="input min-h-[80px]" placeholder="Default notes shown at top of client profile" rows={3} /></div>
          </div>
        </div>
        <div className="card">
          <h2 className="font-display font-semibold text-slate-900 mb-4">English Test</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Test Type</label><select value={form.englishTest?.testType || form.englishTest?.type || ''} onChange={e => setForm((f: any) => ({ ...f, englishTest: { ...f.englishTest, testType: e.target.value } }))} className="input"><option value="">Select</option><option value="IELTS">IELTS</option><option value="PTE">PTE</option><option value="TOEFL">TOEFL</option><option value="OET">OET</option></select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Score</label><input value={form.englishTest?.score || ''} onChange={e => setForm((f: any) => ({ ...f, englishTest: { ...f.englishTest, score: e.target.value } }))} className="input" placeholder="e.g. 7.0" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Test Date</label><input type="date" value={form.englishTest?.testDate ? new Date(form.englishTest.testDate).toISOString().slice(0, 10) : ''} onChange={e => setForm((f: any) => ({ ...f, englishTest: { ...f.englishTest, testDate: e.target.value } }))} className="input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label><input type="date" value={form.englishTest?.expiryDate ? new Date(form.englishTest.expiryDate).toISOString().slice(0, 10) : ''} onChange={e => setForm((f: any) => ({ ...f, englishTest: { ...f.englishTest, expiryDate: e.target.value } }))} className="input" /></div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-4"><h2 className="font-display font-semibold text-slate-900">Education</h2><button type="button" onClick={addEducation} className="btn-secondary text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button></div>
          {form.education.map((ed: Education, i: number) => (
            <div key={i} className="p-4 rounded-lg border border-slate-200 mb-4 flex gap-4">
              <div className="flex-1 grid md:grid-cols-2 gap-3">
                <input value={ed.institution} onChange={e => updateEducation(i, 'institution', e.target.value)} className="input" placeholder="Institution" />
                <input value={ed.qualification} onChange={e => updateEducation(i, 'qualification', e.target.value)} className="input" placeholder="Qualification" />
                <input value={ed.fieldOfStudy} onChange={e => updateEducation(i, 'fieldOfStudy', e.target.value)} className="input" placeholder="Field" />
                <input value={ed.country} onChange={e => updateEducation(i, 'country', e.target.value)} className="input" placeholder="Country" />
                <input type="date" value={ed.startDate} onChange={e => updateEducation(i, 'startDate', e.target.value)} className="input" />
                <input type="date" value={ed.endDate} onChange={e => updateEducation(i, 'endDate', e.target.value)} className="input" />
              </div>
              <button type="button" onClick={() => removeEducation(i)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-4"><h2 className="font-display font-semibold text-slate-900">Experience</h2><button type="button" onClick={addExperience} className="btn-secondary text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button></div>
          {form.experience.map((ex: Experience, i: number) => (
            <div key={i} className="p-4 rounded-lg border border-slate-200 mb-4 flex gap-4">
              <div className="flex-1 grid md:grid-cols-2 gap-3">
                <input value={ex.employer} onChange={e => updateExperience(i, 'employer', e.target.value)} className="input" placeholder="Employer" />
                <input value={ex.role} onChange={e => updateExperience(i, 'role', e.target.value)} className="input" placeholder="Role" />
                <input value={ex.country} onChange={e => updateExperience(i, 'country', e.target.value)} className="input" placeholder="Country" />
                <input type="date" value={ex.startDate} onChange={e => updateExperience(i, 'startDate', e.target.value)} className="input" />
                <input type="date" value={ex.endDate} onChange={e => updateExperience(i, 'endDate', e.target.value)} className="input" disabled={ex.isCurrent} />
                <label className="flex items-center gap-2"><input type="checkbox" checked={ex.isCurrent} onChange={e => updateExperience(i, 'isCurrent', e.target.checked)} /> Current</label>
              </div>
              <button type="button" onClick={() => removeExperience(i)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-4"><h2 className="font-display font-semibold text-slate-900">Family Members</h2><button type="button" onClick={addFamilyMember} className="btn-secondary text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button></div>
          {form.familyMembers.map((m: FamilyMember, i: number) => (
            <div key={i} className="p-4 rounded-lg border border-slate-200 mb-4 flex gap-4">
              <div className="flex-1 grid md:grid-cols-2 gap-3">
                <select value={m.relationship} onChange={e => updateFamilyMember(i, 'relationship', e.target.value)} className="input"><option value="">Relationship</option><option value="Spouse">Spouse</option><option value="Child">Child</option><option value="Parent">Parent</option><option value="Sibling">Sibling</option><option value="Other">Other</option></select>
                <input value={m.firstName} onChange={e => updateFamilyMember(i, 'firstName', e.target.value)} className="input" placeholder="First Name" />
                <input value={m.lastName} onChange={e => updateFamilyMember(i, 'lastName', e.target.value)} className="input" placeholder="Last Name" />
                <input type="date" value={m.dob} onChange={e => updateFamilyMember(i, 'dob', e.target.value)} className="input" placeholder="DOB" />
                <input value={m.nationality} onChange={e => updateFamilyMember(i, 'nationality', e.target.value)} className="input" placeholder="Nationality" />
                <label className="flex items-center gap-2"><input type="checkbox" checked={m.includedInApplication} onChange={e => updateFamilyMember(i, 'includedInApplication', e.target.checked)} /> Included in application</label>
              </div>
              <button type="button" onClick={() => removeFamilyMember(i)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-4"><h2 className="font-display font-semibold text-slate-900">Services</h2><button type="button" onClick={addService} className="btn-secondary text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button></div>
          <div className="mb-4"><label className="block text-sm font-medium text-slate-700 mb-1">Visa Type</label><select value={form.visaType} onChange={e => setForm((f: any) => ({ ...f, visaType: e.target.value }))} className="input">{visaTypes.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}</select></div>
          {form.services.map((svc: Service, i: number) => (
            <div key={i} className="p-4 rounded-lg border border-slate-200 mb-4 flex gap-4">
              <div className="flex-1 grid md:grid-cols-2 gap-3">
                <select value={svc.serviceType} onChange={e => updateService(i, 'serviceType', e.target.value)} className="input">{services.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
                <select value={svc.visaSubclass} onChange={e => updateService(i, 'visaSubclass', e.target.value)} className="input">{visaTypes.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}</select>
                <select value={svc.status} onChange={e => updateService(i, 'status', e.target.value)} className="input"><option value="PENDING">Pending</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option></select>
              </div>
              <button type="button" onClick={() => removeService(i)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <div className="mt-4"><label className="block text-sm font-medium text-slate-700 mb-1">Assign Agent</label><select value={form.assignedAgentId || ''} onChange={e => setForm((f: any) => ({ ...f, assignedAgentId: e.target.value || undefined }))} className="input"><option value="">Select agent</option>{agents.map(a => <option key={a._id} value={a._id}>{a.profile?.firstName} {a.profile?.lastName}</option>)}</select></div>
        </div>
        <div className="flex gap-4"><button type="submit" disabled={loading} className="btn-primary">Save Changes</button><Link to={`/consultancy/clients/${id}`} className="btn-secondary">Cancel</Link></div>
      </form>
    </div>
  );
}
