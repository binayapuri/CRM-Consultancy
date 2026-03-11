import React, { useState } from 'react';
import { ShieldCheck, FileText, Calendar, Heart, Search } from 'lucide-react';
import { ProfileCard } from '../ProfileCard';
import { SI, SS, F, DataRow } from '../shared';

interface HealthInfoProps {
  data: any;
  onSave: (newData: any) => Promise<void>;
}

export const HealthInfo: React.FC<HealthInfoProps> = ({ data, onSave }) => {
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
    <ProfileCard title="Health & Character Verifications" icon={<ShieldCheck className="w-5 h-5" />} isSaving={isSaving} onSave={handleSave} onCancel={handleCancel} isEmpty={!data.healthStatus && !data.hapId}
      editForm={
        <div className="space-y-8">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <F label="Health Exam Status"><SS value={form.healthStatus || ''} onChange={e => setForm({...form, healthStatus: e.target.value})}><option value="">Select</option><option>not-started</option><option>booked</option><option>completed</option><option>cleared</option></SS></F>
            <F label="HAP ID"><SI value={form.hapId || ''} onChange={e => setForm({...form, hapId: e.target.value})} placeholder="HAP-XXXXXXXX" /></F>
            <F label="Health Exam Date"><SI type="date" value={form.healthDate ? form.healthDate.split('T')[0] : ''} onChange={e => setForm({...form, healthDate: e.target.value})} /></F>
            <F label="Australia PCC (AFP)"><SS value={form.australiaPCC || ''} onChange={e => setForm({...form, australiaPCC: e.target.value})}><option value="">Not Required</option><option>Applied</option><option>Obtained</option></SS></F>
            <F label="Home Country PCC"><SS value={form.homePCC || ''} onChange={e => setForm({...form, homePCC: e.target.value})}><option value="">Not Required</option><option>Applied</option><option>Obtained</option></SS></F>
            <F label="Other countries PCC (if any)"><SS value={form.otherPCC || ''} onChange={e => setForm({...form, otherPCC: e.target.value})}><option value="">Not Required</option><option>Applied</option><option>Obtained</option></SS></F>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
        <DataRow label="Health Exam" value={data.healthStatus} icon={<Heart className="w-4 h-4" />} />
        <DataRow label="HAP ID" value={data.hapId} icon={<Search className="w-4 h-4" />} />
        <DataRow label="Exam Date" value={data.healthDate ? new Date(data.healthDate).toLocaleDateString() : ''} icon={<Calendar className="w-4 h-4" />} />
        <DataRow label="Australian PCC" value={data.australiaPCC} icon={<FileText className="w-4 h-4" />} />
        <DataRow label="Home Country PCC" value={data.homePCC} icon={<FileText className="w-4 h-4" />} />
        <DataRow label="Other Global PCC" value={data.otherPCC} icon={<FileText className="w-4 h-4" />} />
      </div>
    </ProfileCard>
  );
};
