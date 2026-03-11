import React, { useState } from 'react';
import { GraduationCap, Plus, Trash2, Calendar, MapPin, Building2 } from 'lucide-react';
import { ProfileCard } from '../ProfileCard';
import { SI, F } from '../shared';

interface EducationInfoProps {
  items: any[];
  onAdd: (entry: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const EducationInfo: React.FC<EducationInfoProps> = ({ items, onAdd, onDelete }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState<any>({
    institution: '',
    qualification: '',
    fieldOfStudy: '',
    country: '',
    startDate: '',
    endDate: '',
    completed: false
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    setIsSaving(true);
    await onAdd(newEntry);
    setNewEntry({
      institution: '', qualification: '', fieldOfStudy: '', country: '',
      startDate: '', endDate: '', completed: false
    });
    setShowAddForm(false);
    setIsSaving(false);
  };

  return (
    <ProfileCard
      title="Education History"
      icon={<GraduationCap className="w-5 h-5" />}
      isSaving={isSaving}
      onSave={async () => {}} // Not used as we save per entry
      isEmpty={items.length === 0}
      editForm={null} // Controlled manually within the card for list CRUD
    >
      <div className="space-y-6">
        {/* List of existing items */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item._id} className="relative group bg-slate-50/50 p-5 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-white transition-all">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-black text-slate-800 text-base">{item.qualification}</h4>
                  <p className="font-bold text-indigo-600 text-sm flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> {item.institution}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {new Date(item.startDate).getFullYear()} - {item.completed ? new Date(item.endDate).getFullYear() : 'Present'}
                    </span>
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {item.country}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => onDelete(item._id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Form / Button */}
        {!showAddForm ? (
          <button 
            onClick={() => setShowAddForm(true)}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-black text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Education Qualification
          </button>
        ) : (
          <div className="bg-slate-50 p-6 rounded-3xl border-2 border-indigo-100 space-y-4 animate-in slide-in-from-bottom-2">
            <h4 className="font-black text-slate-800 text-sm flex items-center gap-2 mb-2">
              <GraduationCap className="w-4 h-4 text-indigo-500" /> New Qualification
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <F label="Institution"><SI value={newEntry.institution} onChange={e => setNewEntry({...newEntry, institution: e.target.value})} placeholder="e.g. University of Sydney" /></F>
              <F label="Qualification"><SI value={newEntry.qualification} onChange={e => setNewEntry({...newEntry, qualification: e.target.value})} placeholder="e.g. Bachelor of IT" /></F>
              <F label="Field of Study"><SI value={newEntry.fieldOfStudy} onChange={e => setNewEntry({...newEntry, fieldOfStudy: e.target.value})} /></F>
              <F label="Country"><SI value={newEntry.country} onChange={e => setNewEntry({...newEntry, country: e.target.value})} /></F>
              <F label="Start Date (YYYY-MM)"><SI type="month" value={newEntry.startDate} onChange={e => setNewEntry({...newEntry, startDate: e.target.value})} /></F>
              <F label="End Date (YYYY-MM)"><SI type="month" value={newEntry.endDate} onChange={e => setNewEntry({...newEntry, endDate: e.target.value})} /></F>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={newEntry.completed} 
                    onChange={e => setNewEntry({...newEntry, completed: e.target.checked})}
                    className="w-4 h-4 rounded accent-indigo-600"
                  />
                  <span className="text-sm font-bold text-slate-600 group-hover:text-slate-800">Has Completed?</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                onClick={handleAdd}
                className="px-6 py-2 text-xs font-black text-white bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
                disabled={isSaving}
              >
                {isSaving ? 'Processing...' : 'Add Opportunity'}
              </button>
            </div>
          </div>
        )}
      </div>
    </ProfileCard>
  );
};
