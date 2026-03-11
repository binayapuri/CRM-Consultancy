import React, { useState } from 'react';
import { Briefcase, Plus, Trash2, Calendar, MapPin, Building2, Clock } from 'lucide-react';
import { ProfileCard } from '../ProfileCard';
import { SI, F, TA } from '../shared';

interface WorkInfoProps {
  items: any[];
  onAdd: (entry: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const WorkInfo: React.FC<WorkInfoProps> = ({ items, onAdd, onDelete }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState<any>({
    employer: '', role: '', country: '', hoursPerWeek: '',
    startDate: '', endDate: '', isCurrent: false, description: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    setIsSaving(true);
    await onAdd(newEntry);
    setNewEntry({
      employer: '', role: '', country: '', hoursPerWeek: '',
      startDate: '', endDate: '', isCurrent: false, description: ''
    });
    setShowAddForm(false);
    setIsSaving(false);
  };

  return (
    <ProfileCard
      title="Work Experience"
      icon={<Briefcase className="w-5 h-5" />}
      isSaving={isSaving}
      onSave={async () => {}}
      isEmpty={items.length === 0}
      editForm={null}
    >
      <div className="space-y-6">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item._id} className="relative group bg-slate-50/50 p-5 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-white transition-all">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-black text-slate-800 text-base">{item.role}</h4>
                  <p className="font-bold text-indigo-600 text-sm flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> {item.employer}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(item.startDate).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })} - {item.isCurrent ? 'Present' : new Date(item.endDate).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {item.hoursPerWeek} hrs/week</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {item.country}</span>
                  </div>
                  {item.description && <p className="text-xs text-slate-500 mt-2 font-medium line-clamp-2">{item.description}</p>}
                </div>
                <button onClick={() => onDelete(item._id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>

        {!showAddForm ? (
          <button onClick={() => setShowAddForm(true)} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-black text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Work Experience
          </button>
        ) : (
          <div className="bg-slate-50 p-6 rounded-3xl border-2 border-indigo-100 space-y-4 animate-in slide-in-from-bottom-2">
            <h4 className="font-black text-slate-800 text-sm flex items-center gap-2 mb-2"><Briefcase className="w-4 h-4 text-indigo-500" /> New Experience</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <F label="Employer"><SI value={newEntry.employer} onChange={e => setNewEntry({...newEntry, employer: e.target.value})} /></F>
              <F label="Role / Job Title"><SI value={newEntry.role} onChange={e => setNewEntry({...newEntry, role: e.target.value})} /></F>
              <F label="Country"><SI value={newEntry.country} onChange={e => setNewEntry({...newEntry, country: e.target.value})} /></F>
              <F label="Hours per Week"><SI type="number" value={newEntry.hoursPerWeek} onChange={e => setNewEntry({...newEntry, hoursPerWeek: e.target.value})} /></F>
              <F label="Start Date"><SI type="month" value={newEntry.startDate} onChange={e => setNewEntry({...newEntry, startDate: e.target.value})} /></F>
              <F label="End Date"><SI type="month" value={newEntry.endDate} onChange={e => setNewEntry({...newEntry, endDate: e.target.value})} disabled={newEntry.isCurrent} /></F>
              <div className="flex items-end pb-1"><label className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" checked={newEntry.isCurrent} onChange={e => setNewEntry({...newEntry, isCurrent: e.target.checked})} className="w-4 h-4 rounded accent-indigo-600" /><span className="text-sm font-bold text-slate-600 group-hover:text-slate-800">Current Role?</span></label></div>
            </div>
            <F label="Responsibilities / Description"><TA value={newEntry.description} onChange={e => setNewEntry({...newEntry, description: e.target.value})} placeholder="Describe your key tasks..." /></F>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors" disabled={isSaving}>Cancel</button>
              <button onClick={handleAdd} className="px-6 py-2 text-xs font-black text-white bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all" disabled={isSaving}>{isSaving ? 'Saving...' : 'Add Role'}</button>
            </div>
          </div>
        )}
      </div>
    </ProfileCard>
  );
};
