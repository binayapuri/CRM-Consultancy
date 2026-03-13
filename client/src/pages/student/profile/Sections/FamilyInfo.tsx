import React, { useState } from 'react';
import { Heart, Plus, Trash2, Calendar, User, FileCheck, CheckCircle2, Circle } from 'lucide-react';
import { ProfileCard } from '../ProfileCard';
import { SI, SS, F, TA, formCardClass, formGridClassWide, btnCancel, btnPrimary, btnAddDashed } from '../shared';

interface FamilyInfoProps {
  items: any[];
  onAdd: (entry: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const FamilyInfo: React.FC<FamilyInfoProps> = ({ items, onAdd, onDelete }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState<any>({ relationship: 'SPOUSE', firstName: '', lastName: '', dob: '', nationality: '', passportNumber: '', passportExpiry: '', includedInApplication: false, visaStatus: '', notes: '' });
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    setIsSaving(true);
    await onAdd(newEntry);
    setNewEntry({ relationship: 'SPOUSE', firstName: '', lastName: '', dob: '', nationality: '', passportNumber: '', passportExpiry: '', includedInApplication: false, visaStatus: '', notes: '' });
    setShowAddForm(false);
    setIsSaving(false);
  };

  const RELATIONS = ['SPOUSE', 'PARTNER', 'CHILD', 'PARENT', 'SIBLING', 'OTHER'];

  return (
    <ProfileCard title="Accompanying Family Members" icon={<Heart className="w-5 h-5" />} isSaving={isSaving} onSave={async () => {}} isEmpty={items.length === 0} editForm={null}>
      <div className="space-y-6">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item._id} className="relative group bg-slate-50/50 p-5 rounded-lg border border-slate-100 hover:border-indigo-100 transition-all">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-slate-800 text-base">{item.firstName} {item.lastName}</h4>
                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{item.relationship}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Born {new Date(item.dob).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {item.nationality}</span>
                    <span className="flex items-center gap-1"><FileCheck className="w-3.5 h-3.5" /> {item.passportNumber || 'No Passport'}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                     <span className={`flex items-center gap-1.5 text-xs font-black ${item.includedInApplication ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'} px-3 py-1 rounded-xl`}>
                       {item.includedInApplication ? <><CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden /> Included in Application</> : <><Circle className="w-3.5 h-3.5 shrink-0" aria-hidden /> Not Included</>}
                     </span>
                     {item.visaStatus && <span className="text-xs font-bold text-slate-500 italic">Visa: {item.visaStatus}</span>}
                  </div>
                </div>
                <button onClick={() => onDelete(item._id)} className="p-2 text-slate-300 hover:text-red-500 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>

        {!showAddForm ? (
          <button onClick={() => setShowAddForm(true)} className={btnAddDashed}>
            <Plus className="w-4 h-4" /> Add Family Member Details
          </button>
        ) : (
          <div className={`${formCardClass} animate-in slide-in-from-bottom-2`}>
            <div className={formGridClassWide}>
              <F label="Relationship"><SS value={newEntry.relationship} onChange={e => setNewEntry({...newEntry, relationship: e.target.value})}>{RELATIONS.map(r=><option key={r}>{r}</option>)}</SS></F>
              <F label="First Name"><SI value={newEntry.firstName} onChange={e => setNewEntry({...newEntry, firstName: e.target.value})} /></F>
              <F label="Last Name"><SI value={newEntry.lastName} onChange={e => setNewEntry({...newEntry, lastName: e.target.value})} /></F>
              <F label="Date of Birth"><SI type="date" value={newEntry.dob} onChange={e => setNewEntry({...newEntry, dob: e.target.value})} /></F>
              <F label="Nationality"><SI value={newEntry.nationality} onChange={e => setNewEntry({...newEntry, nationality: e.target.value})} /></F>
              <F label="Passport Number"><SI value={newEntry.passportNumber} onChange={e => setNewEntry({...newEntry, passportNumber: e.target.value})} /></F>
              <F label="Passport Expiry"><SI type="date" value={newEntry.passportExpiry} onChange={e => setNewEntry({...newEntry, passportExpiry: e.target.value})} /></F>
              <F label="Current Visa Status"><SI value={newEntry.visaStatus} onChange={e => setNewEntry({...newEntry, visaStatus: e.target.value})} /></F>
            </div>
            <div className="py-2 border-y border-slate-200">
               <label className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" checked={newEntry.includedInApplication} onChange={e => setNewEntry({...newEntry, includedInApplication: e.target.checked})} className="w-4 h-4 rounded accent-emerald-500" /><span className="text-sm font-bold text-slate-600 group-hover:text-slate-800">Included in the visa application?</span></label>
            </div>
            <F label="Additional Notes"><TA value={newEntry.notes} onChange={e => setNewEntry({...newEntry, notes: e.target.value})} /></F>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowAddForm(false)} className={btnCancel} disabled={isSaving}>Cancel</button>
              <button onClick={handleAdd} className={btnPrimary} disabled={isSaving}>{isSaving ? 'Saving...' : 'Add Member'}</button>
            </div>
          </div>
        )}
      </div>
    </ProfileCard>
  );
};
