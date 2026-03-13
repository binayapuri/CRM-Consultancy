import React, { useState } from 'react';
import { User, Calendar, Mail, Phone, Globe, CreditCard, Heart } from 'lucide-react';
import { ProfileCard } from '../ProfileCard';
import { SI, SS, F, DataRow, formGridClass } from '../shared';

interface PersonalInfoProps {
  data: any;
  onSave: (newData: any) => Promise<void>;
}

export const PersonalInfo: React.FC<PersonalInfoProps> = ({ data, onSave }) => {
  const [form, setForm] = useState({ ...data });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(form);
    setIsSaving(false);
  };

  const handleCancel = () => {
    setForm({ ...data });
  };

  return (
    <ProfileCard
      title="Personal Information"
      icon={<User className="w-5 h-5" />}
      isSaving={isSaving}
      onSave={handleSave}
      onCancel={handleCancel}
      isEmpty={!data.firstName && !data.lastName}
      editForm={
        <div className={formGridClass}>
          <F label="First Name"><SI value={form.firstName || ''} onChange={e => setForm({...form, firstName: e.target.value})} /></F>
          <F label="Last Name"><SI value={form.lastName || ''} onChange={e => setForm({...form, lastName: e.target.value})} /></F>
          <F label="Date of Birth"><SI type="date" value={form.dob ? form.dob.split('T')[0] : ''} onChange={e => setForm({...form, dob: e.target.value})} /></F>
          <F label="Gender">
            <SS value={form.gender || ''} onChange={e => setForm({...form, gender: e.target.value})}>
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Non-binary</option>
              <option>Prefer not to say</option>
            </SS>
          </F>
          <F label="Nationality"><SI value={form.nationality || ''} onChange={e => setForm({...form, nationality: e.target.value})} /></F>
          <F label="Country of Birth"><SI value={form.countryOfBirth || ''} onChange={e => setForm({...form, countryOfBirth: e.target.value})} /></F>
          <F label="Marital Status">
            <SS value={form.maritalStatus || ''} onChange={e => setForm({...form, maritalStatus: e.target.value})}>
              <option value="">Select</option>
              <option>Single</option>
              <option>Married</option>
              <option>De Facto</option>
              <option>Divorced</option>
              <option>Widowed</option>
            </SS>
          </F>
          <F label="Phone"><SI value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} /></F>
          <F label="Passport Number"><SI value={form.passportNumber || ''} onChange={e => setForm({...form, passportNumber: e.target.value})} /></F>
          <F label="Passport Country"><SI value={form.passportCountry || ''} onChange={e => setForm({...form, passportCountry: e.target.value})} /></F>
          <F label="Passport Expiry"><SI type="date" value={form.passportExpiry ? form.passportExpiry.split('T')[0] : ''} onChange={e => setForm({...form, passportExpiry: e.target.value})} /></F>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
        <DataRow label="Full Name" value={`${data.firstName || ''} ${data.lastName || ''}`} icon={<User className="w-4 h-4" />} />
        <DataRow label="Email Address" value={data.email} icon={<Mail className="w-4 h-4" />} />
        <DataRow label="Date of Birth" value={data.dob ? new Date(data.dob).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) : ''} icon={<Calendar className="w-4 h-4" />} />
        <DataRow label="Gender" value={data.gender} icon={<User className="w-4 h-4" />} />
        <DataRow label="Nationality" value={data.nationality} icon={<Globe className="w-4 h-4" />} />
        <DataRow label="Country of Birth" value={data.countryOfBirth} icon={<Globe className="w-4 h-4" />} />
        <DataRow label="Marital Status" value={data.maritalStatus} icon={<Heart className="w-4 h-4" />} />
        <DataRow label="Phone Number" value={data.phone} icon={<Phone className="w-4 h-4" />} />
        <DataRow label="Passport" value={data.passportNumber} icon={<CreditCard className="w-4 h-4" />} />
        <DataRow label="Passport Country" value={data.passportCountry} icon={<Globe className="w-4 h-4" />} />
        <DataRow label="Passport Expiry" value={data.passportExpiry ? new Date(data.passportExpiry).toLocaleDateString() : ''} icon={<Calendar className="w-4 h-4" />} />
      </div>
    </ProfileCard>
  );
};
