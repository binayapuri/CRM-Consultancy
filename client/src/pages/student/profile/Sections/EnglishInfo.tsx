import React, { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import { ProfileCard } from '../ProfileCard';
import { SI, SS, F, formGridClassWide } from '../shared';

interface EnglishInfoProps {
  english: any;
  onSaveEnglish: (englishData: any) => Promise<void>;
}

export const EnglishInfo: React.FC<EnglishInfoProps> = ({ english, onSaveEnglish }) => {
  const [eForm, setEForm] = useState({ ...english });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEForm({ ...english });
  }, [english]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveEnglish(eForm);
    setIsSaving(false);
  };

  const handleCancel = () => {
    setEForm({ ...english });
  };

  return (
    <ProfileCard
      title="English language tests"
      icon={<Award className="w-5 h-5" />}
      isSaving={isSaving}
      onSave={handleSave}
      onCancel={handleCancel}
      isEmpty={!english.testType}
      editForm={
        <div className={formGridClassWide}>
          <F label="Test Type">
            <SS value={eForm.testType || ''} onChange={e => setEForm({ ...eForm, testType: e.target.value })}>
              <option value="">Select</option>
              <option>IELTS_AC</option>
              <option>IELTS_GT</option>
              <option>PTE</option>
              <option>TOEFL</option>
              <option>OET</option>
              <option>CAE</option>
            </SS>
          </F>
          <F label="Overall Score"><SI value={eForm.score || ''} onChange={e => setEForm({ ...eForm, score: e.target.value })} /></F>
          <F label="Test Date"><SI type="date" value={eForm.testDate ? eForm.testDate.split('T')[0] : ''} onChange={e => setEForm({ ...eForm, testDate: e.target.value })} /></F>
          <F label="Listening"><SI value={eForm.listening || ''} onChange={e => setEForm({ ...eForm, listening: e.target.value })} /></F>
          <F label="Reading"><SI value={eForm.reading || ''} onChange={e => setEForm({ ...eForm, reading: e.target.value })} /></F>
          <F label="Writing"><SI value={eForm.writing || ''} onChange={e => setEForm({ ...eForm, writing: e.target.value })} /></F>
          <F label="Speaking"><SI value={eForm.speaking || ''} onChange={e => setEForm({ ...eForm, speaking: e.target.value })} /></F>
          <F label="TRF / Reference No."><SI value={eForm.trf || ''} onChange={e => setEForm({ ...eForm, trf: e.target.value })} /></F>
        </div>
      }
    >
      <div className="space-y-6">
        <p className="text-sm text-slate-500 font-medium">
          Skilled migration usually needs <strong className="text-indigo-700">competent English</strong> at minimum; <strong>proficient</strong> or <strong>superior</strong> scores attract more points.
        </p>
        {english.testType ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Type</p>
              <p className="text-sm font-black text-indigo-600">{english.testType.replace('_', ' ')}</p>
            </div>
            <div className="bg-indigo-600 p-3 rounded-lg shadow-lg shadow-indigo-200">
              <p className="text-[10px] font-black text-indigo-200 uppercase leading-none mb-1">Overall</p>
              <p className="text-sm font-black text-white">{english.score}</p>
            </div>
            {[
              { l: 'L', v: english.listening },
              { l: 'R', v: english.reading },
              { l: 'W', v: english.writing },
              { l: 'S', v: english.speaking },
            ].map((b) => (
              <div key={b.l} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">{b.l}</p>
                <p className="text-sm font-black text-slate-700">{b.v || '-'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs font-medium text-slate-400 italic">No English test added yet — add IELTS, PTE, or other accepted tests for accurate PR estimates.</p>
        )}
      </div>
    </ProfileCard>
  );
};
