import { useState, useEffect } from 'react';
import { authFetch } from '../../store/auth';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Plus, Trash2 } from 'lucide-react';

export default function StudentProfile() {
  const [client, setClient] = useState<any>(null);
  const [profile, setProfile] = useState<any>({});
  const [education, setEducation] = useState<any[]>([]);
  const [experience, setExperience] = useState<any[]>([]);
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
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
            dob: profile.dob ? new Date(profile.dob) : undefined,
            visaExpiry: profile.visaExpiry ? new Date(profile.visaExpiry) : undefined,
          },
          education: education.map(e => ({ ...e, startDate: e.startDate ? new Date(e.startDate + '-01').toISOString() : undefined, endDate: e.endDate ? new Date(e.endDate + '-01').toISOString() : undefined })),
          experience: experience.map(e => ({ ...e, startDate: e.startDate ? new Date(e.startDate + '-01').toISOString() : undefined, endDate: e.endDate ? new Date(e.endDate + '-01').toISOString() : undefined })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setClient(data);
      setProfile(data.profile || {});
      setEducation(data.education || []);
      setExperience(data.experience || []);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addEducation = () => setEducation([...education, { institution: '', qualification: '', fieldOfStudy: '', country: '', startDate: '', endDate: '', completed: true }]);
  const updateEducation = (i: number, field: string, val: string | boolean) => setEducation(ed => ed.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  const removeEducation = (i: number) => setEducation(ed => ed.filter((_, idx) => idx !== i));

  const addExperience = () => setExperience([...experience, { employer: '', role: '', country: '', startDate: '', endDate: '', isCurrent: false }]);
  const updateExperience = (i: number, field: string, val: string | boolean) => setExperience(ex => ex.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  const removeExperience = (i: number) => setExperience(ex => ex.filter((_, idx) => idx !== i));

  if (loading) return <div className="flex items-center gap-2 text-slate-500"><LoadingSpinner size="sm" /> Loading profile...</div>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900">My Profile</h1>
      <p className="text-slate-500 mt-1">Your migration profile and details</p>
      {!client ? (
        <div className="card mt-6 p-12 text-center text-slate-500">No profile linked yet. Contact your consultancy to get enrolled.</div>
      ) : (
        <div className="card mt-6 max-w-2xl">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input value={profile.firstName || ''} onChange={e => setProfile({ ...profile, firstName: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input value={profile.lastName || ''} onChange={e => setProfile({ ...profile, lastName: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={profile.email || ''} onChange={e => setProfile({ ...profile, email: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input value={profile.phone || ''} onChange={e => setProfile({ ...profile, phone: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
              <input type="date" value={profile.dob ? new Date(profile.dob).toISOString().slice(0, 10) : ''} onChange={e => setProfile({ ...profile, dob: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nationality</label>
              <input value={profile.nationality || ''} onChange={e => setProfile({ ...profile, nationality: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Visa</label>
              <input value={profile.currentVisa || ''} placeholder="e.g. 500, 485" onChange={e => setProfile({ ...profile, currentVisa: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Visa Expiry</label>
              <input type="date" value={profile.visaExpiry ? new Date(profile.visaExpiry).toISOString().slice(0, 10) : ''} onChange={e => setProfile({ ...profile, visaExpiry: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Passport Number</label>
              <input value={profile.passportNumber || ''} onChange={e => setProfile({ ...profile, passportNumber: e.target.value })} className="input" placeholder="e.g. N1234567" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Passport Expiry</label>
              <input type="date" value={profile.passportExpiry ? new Date(profile.passportExpiry).toISOString().slice(0, 10) : ''} onChange={e => setProfile({ ...profile, passportExpiry: e.target.value })} className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <input value={profile.address?.street || ''} onChange={e => setProfile({ ...profile, address: { ...profile.address, street: e.target.value } })} className="input" placeholder="Street" />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input value={profile.address?.city || ''} onChange={e => setProfile({ ...profile, address: { ...profile.address, city: e.target.value } })} className="input" placeholder="City" />
                <input value={profile.address?.state || ''} onChange={e => setProfile({ ...profile, address: { ...profile.address, state: e.target.value } })} className="input" placeholder="State" />
                <input value={profile.address?.postcode || ''} onChange={e => setProfile({ ...profile, address: { ...profile.address, postcode: e.target.value } })} className="input" placeholder="Postcode" />
                <input value={profile.address?.country || ''} onChange={e => setProfile({ ...profile, address: { ...profile.address, country: e.target.value } })} className="input" placeholder="Country" />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center justify-between">
              Education
              <button type="button" onClick={addEducation} className="text-ori-600 hover:text-ori-700 text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
            </h3>
            <div className="space-y-3">
              {education.map((e, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="grid md:grid-cols-2 gap-2 mb-2">
                    <input value={e.institution || ''} onChange={ev => updateEducation(i, 'institution', ev.target.value)} className="input py-1.5" placeholder="Institution" />
                    <input value={e.qualification || ''} onChange={ev => updateEducation(i, 'qualification', ev.target.value)} className="input py-1.5" placeholder="Qualification" />
                    <input value={e.fieldOfStudy || ''} onChange={ev => updateEducation(i, 'fieldOfStudy', ev.target.value)} className="input py-1.5" placeholder="Field of study" />
                    <input value={e.country || ''} onChange={ev => updateEducation(i, 'country', ev.target.value)} className="input py-1.5" placeholder="Country" />
                    <input type="month" value={e.startDate ? String(e.startDate).slice(0, 7) : ''} onChange={ev => updateEducation(i, 'startDate', ev.target.value)} className="input py-1.5" placeholder="Start" />
                    <input type="month" value={e.endDate ? String(e.endDate).slice(0, 7) : ''} onChange={ev => updateEducation(i, 'endDate', ev.target.value)} className="input py-1.5" placeholder="End" />
                  </div>
                  <button type="button" onClick={() => removeEducation(i)} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"><Trash2 className="w-4 h-4" /> Remove</button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center justify-between">
              Work Experience
              <button type="button" onClick={addExperience} className="text-ori-600 hover:text-ori-700 text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
            </h3>
            <div className="space-y-3">
              {experience.map((e, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="grid md:grid-cols-2 gap-2 mb-2">
                    <input value={e.employer || ''} onChange={ev => updateExperience(i, 'employer', ev.target.value)} className="input py-1.5" placeholder="Employer" />
                    <input value={e.role || ''} onChange={ev => updateExperience(i, 'role', ev.target.value)} className="input py-1.5" placeholder="Role" />
                    <input value={e.country || ''} onChange={ev => updateExperience(i, 'country', ev.target.value)} className="input py-1.5" placeholder="Country" />
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!e.isCurrent} onChange={ev => updateExperience(i, 'isCurrent', ev.target.checked)} /> Current</label>
                    <input type="month" value={e.startDate ? String(e.startDate).slice(0, 7) : ''} onChange={ev => updateExperience(i, 'startDate', ev.target.value)} className="input py-1.5" placeholder="Start" />
                    <input type="month" value={e.endDate ? String(e.endDate).slice(0, 7) : ''} onChange={ev => updateExperience(i, 'endDate', ev.target.value)} className="input py-1.5" placeholder="End" disabled={!!e.isCurrent} />
                  </div>
                  <button type="button" onClick={() => removeExperience(i)} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"><Trash2 className="w-4 h-4" /> Remove</button>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary mt-6">
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}
          </button>
        </div>
      )}
    </div>
  );
}
