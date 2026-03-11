import React, { useState } from 'react';
import { Target, FileCheck, MapPin, Award } from 'lucide-react';
import { ProfileCard } from '../ProfileCard';
import { SI, SS, F, DataRow } from '../shared';

interface SkillsInfoProps {
  data: any;
  onSave: (newData: any) => Promise<void>;
}

export const SkillsInfo: React.FC<SkillsInfoProps> = ({ data, onSave }) => {
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

  const BODIES = ['ACS', 'EA', 'VETASSESS', 'AHPRA', 'CPA', 'CAANZ', 'AITSL', 'TRA', 'Other'];
  const STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'];

  return (
    <ProfileCard title="Skills Assessment & EOI" icon={<Target className="w-5 h-5" />} isSaving={isSaving} onSave={handleSave} onCancel={handleCancel} isEmpty={!data.assessingBody}
      editForm={
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <F label="Assessing Body"><SS value={form.assessingBody || ''} onChange={e => setForm({...form, assessingBody: e.target.value})}><option value="">Select</option>{BODIES.map(b=><option key={b}>{b}</option>)}</SS></F>
            <F label="Reference Number"><SI value={form.referenceNumber || ''} onChange={e => setForm({...form, referenceNumber: e.target.value})} /></F>
            <F label="Outcome"><SS value={form.outcome || ''} onChange={e => setForm({...form, outcome: e.target.value})}><option value="">Select</option><option>Suitable</option><option>Closely Related</option><option>Not Suitable</option><option>Pending</option></SS></F>
            <F label="Outcome Date"><SI type="date" value={form.outcomeDate ? form.outcomeDate.split('T')[0] : ''} onChange={e => setForm({...form, outcomeDate: e.target.value})} /></F>
            <F label="EOI Overall Points"><SI type="number" value={form.eoiPoints || ''} onChange={e => setForm({...form, eoiPoints: Number(e.target.value)})} /></F>
            <F label="EOI Date"><SI type="date" value={form.eoiDate ? form.eoiDate.split('T')[0] : ''} onChange={e => setForm({...form, eoiDate: e.target.value})} /></F>
            <F label="Nominating State"><SS value={form.nominatingState || ''} onChange={e => setForm({...form, nominatingState: e.target.value})}><option value="">None / Select</option>{STATES.map(s=><option key={s}>{s}</option>)}</SS></F>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
        <DataRow label="Assessing Body" value={data.assessingBody} icon={<FileCheck className="w-4 h-4" />} />
        <DataRow label="Reference No." value={data.referenceNumber} />
        <DataRow label="Outcome Status" value={data.outcome} icon={<Award className="w-4 h-4" />} />
        <DataRow label="Outcome Date" value={data.outcomeDate ? new Date(data.outcomeDate).toLocaleDateString() : ''} />
        <DataRow label="EOI Points" value={data.eoiPoints ? `${data.eoiPoints} Points` : ''} icon={<Target className="w-4 h-4" />} />
        <DataRow label="EOI Date Submitted" value={data.eoiDate ? new Date(data.eoiDate).toLocaleDateString() : ''} />
        <DataRow label="Target State" value={data.nominatingState} icon={<MapPin className="w-4 h-4" />} />
      </div>
    </ProfileCard>
  );
};
