import React, { useState } from 'react';
import { Plane, FileCheck, Award, Calendar, Globe } from 'lucide-react';
import { ProfileCard } from '../ProfileCard';
import { SI, SS, F, DataRow } from '../shared';

interface ImmigrationInfoProps {
  profile: any;
  english: any;
  onSaveImmigration: (profileData: any) => Promise<void>;
  onSaveEnglish: (englishData: any) => Promise<void>;
}

export const ImmigrationInfo: React.FC<ImmigrationInfoProps> = ({ profile, english, onSaveImmigration, onSaveEnglish }) => {
  const [pForm, setPForm] = useState({ ...profile });
  const [eForm, setEForm] = useState({ ...english });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await Promise.all([
      onSaveImmigration(pForm),
      onSaveEnglish(eForm)
    ]);
    setIsSaving(false);
  };

  const handleCancel = () => {
    setPForm({ ...profile });
    setEForm({ ...english });
  };

  return (
    <ProfileCard
      title="Immigration & English"
      icon={<Plane className="w-5 h-5" />}
      isSaving={isSaving}
      onSave={handleSave}
      onCancel={handleCancel}
      isEmpty={!profile.currentVisa && !english.testType}
      editForm={
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <F label="Currently in Australia?">
              <SS value={pForm.onshore ? 'yes' : 'no'} onChange={e => setPForm({...pForm, onshore: e.target.value === 'yes'})}>
                <option value="no">No — Offshore</option>
                <option value="yes">Yes — Onshore</option>
              </SS>
            </F>
            <F label="Current Visa Subclass"><SI value={pForm.currentVisa || ''} onChange={e => setPForm({...pForm, currentVisa: e.target.value})} placeholder="e.g. 500" /></F>
            <F label="Visa Expiry Date"><SI type="date" value={pForm.visaExpiry ? pForm.visaExpiry.split('T')[0] : ''} onChange={e => setPForm({...pForm, visaExpiry: e.target.value})} /></F>
            <F label="Target Visa"><SI value={pForm.targetVisa || ''} onChange={e => setPForm({...pForm, targetVisa: e.target.value})} placeholder="e.g. 485" /></F>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-500" /> English Test Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <F label="Test Type">
                <SS value={eForm.testType || ''} onChange={e => setEForm({...eForm, testType: e.target.value})}>
                  <option value="">Select</option>
                  <option>IELTS_AC</option>
                  <option>IELTS_GT</option>
                  <option>PTE</option>
                  <option>TOEFL</option>
                  <option>OET</option>
                  <option>CAE</option>
                </SS>
              </F>
              <F label="Overall Score"><SI value={eForm.score || ''} onChange={e => setEForm({...eForm, score: e.target.value})} /></F>
              <F label="Test Date"><SI type="date" value={eForm.testDate ? eForm.testDate.split('T')[0] : ''} onChange={e => setEForm({...eForm, testDate: e.target.value})} /></F>
              <F label="Listening"><SI value={eForm.listening || ''} onChange={e => setEForm({...eForm, listening: e.target.value})} /></F>
              <F label="Reading"><SI value={eForm.reading || ''} onChange={e => setEForm({...eForm, reading: e.target.value})} /></F>
              <F label="Writing"><SI value={eForm.writing || ''} onChange={e => setEForm({...eForm, writing: e.target.value})} /></F>
              <F label="Speaking"><SI value={eForm.speaking || ''} onChange={e => setEForm({...eForm, speaking: e.target.value})} /></F>
              <F label="TRF / Reference No."><SI value={eForm.trf || ''} onChange={e => setEForm({...eForm, trf: e.target.value})} /></F>
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
          <DataRow label="Location Status" value={profile.onshore ? '📍 Onshore (Australia)' : '🌎 Offshore'} icon={<Globe className="w-4 h-4" />} />
          <DataRow label="Current Visa" value={profile.currentVisa} icon={<FileCheck className="w-4 h-4" />} />
          <DataRow label="Visa Expiry" value={profile.visaExpiry ? new Date(profile.visaExpiry).toLocaleDateString() : ''} icon={<Calendar className="w-4 h-4" />} />
          <DataRow label="Target Visa" value={profile.targetVisa} icon={<Award className="w-4 h-4" />} />
        </div>

        <div className="pt-4 border-t border-slate-50">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 ml-1 flex items-center gap-2">
             <Award className="w-3.5 h-3.5 text-indigo-400" /> English Proficiency
          </p>
          {english.testType ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Type</p>
                <p className="text-sm font-black text-indigo-600">{english.testType.replace('_', ' ')}</p>
              </div>
              <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
                <p className="text-[10px] font-black text-indigo-200 uppercase leading-none mb-1">Overall</p>
                <p className="text-sm font-black text-white">{english.score}</p>
              </div>
              {[
                { l: 'L', v: english.listening },
                { l: 'R', v: english.reading },
                { l: 'W', v: english.writing },
                { l: 'S', v: english.speaking }
              ].map(b => (
                <div key={b.l} className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">{b.l}</p>
                  <p className="text-sm font-black text-slate-700">{b.v || '-'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs font-medium text-slate-400 italic ml-1">No English test data provided</p>
          )}
        </div>
      </div>
    </ProfileCard>
  );
};
