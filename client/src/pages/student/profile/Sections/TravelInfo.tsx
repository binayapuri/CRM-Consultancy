import React, { useState } from 'react';
import { Plane, Plus, Trash2, Calendar, Globe, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ProfileCard } from '../ProfileCard';
import { SI, SS, F, TA, formCardClass, formGridClassWide, btnCancel, btnPrimary, btnAddDashed } from '../shared';

interface TravelInfoProps {
  items: any[];
  onAdd: (entry: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const TravelInfo: React.FC<TravelInfoProps> = ({ items, onAdd, onDelete }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState<any>({ country: '', city: '', purpose: 'TOURISM', visaType: '', dateFrom: '', dateTo: '', visaGranted: true, visaRefused: false, refusalReason: '', notes: '' });
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    setIsSaving(true);
    await onAdd(newEntry);
    setNewEntry({ country: '', city: '', purpose: 'TOURISM', visaType: '', dateFrom: '', dateTo: '', visaGranted: true, visaRefused: false, refusalReason: '', notes: '' });
    setShowAddForm(false);
    setIsSaving(false);
  };

  const PURPOSES = ['TOURISM', 'STUDY', 'WORK', 'FAMILY', 'TRANSIT', 'CONFERENCE', 'MEDICAL', 'OTHER'];

  return (
    <ProfileCard title="Travel History" icon={<Plane className="w-5 h-5" />} isSaving={isSaving} onSave={async () => {}} isEmpty={items.length === 0} editForm={null}>
      <div className="space-y-6">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item._id} className={`relative group p-5 rounded-lg border transition-all ${item.visaRefused ? 'bg-red-50/30 border-red-100 hover:bg-red-50' : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:border-indigo-100'}`}>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-slate-800 text-base">{item.country}</h4>
                    {item.visaRefused && <span className="flex items-center gap-1 text-[10px] font-black uppercase text-red-600 bg-red-100 px-2 py-0.5 rounded-full"><AlertTriangle className="w-3 h-3" /> Refused</span>}
                    {item.visaGranted && !item.visaRefused && <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full"><ShieldCheck className="w-3 h-3" /> Granted</span>}
                  </div>
                  <p className="font-bold text-indigo-600 text-sm">{item.city} · {item.purpose}</p>
                  <div className="flex items-center gap-x-4 pt-1 text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(item.dateFrom).toLocaleDateString()} - {new Date(item.dateTo).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {item.visaType}</span>
                  </div>
                  {item.refusalReason && <p className="text-xs text-red-500 mt-2 font-black p-2 bg-red-100/50 rounded-lg">Reason: {item.refusalReason}</p>}
                </div>
                <button onClick={() => onDelete(item._id)} className="p-2 text-slate-300 hover:text-red-500 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>

        {!showAddForm ? (
          <button onClick={() => setShowAddForm(true)} className={btnAddDashed}>
            <Plus className="w-4 h-4" /> Add International Travel Record
          </button>
        ) : (
          <div className={`${formCardClass} animate-in slide-in-from-bottom-2`}>
            <div className={formGridClassWide}>
              <F label="Country"><SI value={newEntry.country} onChange={e => setNewEntry({...newEntry, country: e.target.value})} /></F>
              <F label="City / Region"><SI value={newEntry.city} onChange={e => setNewEntry({...newEntry, city: e.target.value})} /></F>
              <F label="Visa Type Held"><SI value={newEntry.visaType} onChange={e => setNewEntry({...newEntry, visaType: e.target.value})} placeholder="e.g. Visitor (600)" /></F>
              <F label="Purpose"><SS value={newEntry.purpose} onChange={e => setNewEntry({...newEntry, purpose: e.target.value})}>{PURPOSES.map(p=><option key={p}>{p}</option>)}</SS></F>
              <F label="From"><SI type="date" value={newEntry.dateFrom} onChange={e => setNewEntry({...newEntry, dateFrom: e.target.value})} /></F>
              <F label="To"><SI type="date" value={newEntry.dateTo} onChange={e => setNewEntry({...newEntry, dateTo: e.target.value})} /></F>
            </div>
            <div className="flex items-center gap-6 py-2 border-y border-slate-200">
               <label className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" checked={newEntry.visaGranted} onChange={e => setNewEntry({...newEntry, visaGranted: e.target.checked})} className="w-4 h-4 rounded accent-emerald-500" /><span className="text-sm font-bold text-slate-600 group-hover:text-slate-800">Visa Granted?</span></label>
               <label className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" checked={newEntry.visaRefused} onChange={e => setNewEntry({...newEntry, visaRefused: e.target.checked})} className="w-4 h-4 rounded accent-red-500" /><span className="text-sm font-bold text-slate-600 group-hover:text-slate-800">Visa Refused?</span></label>
            </div>
            {newEntry.visaRefused && <F label="Reason for Refusal"><TA value={newEntry.refusalReason} onChange={e => setNewEntry({...newEntry, refusalReason: e.target.value})} /></F>}
            <F label="Additional Notes"><TA value={newEntry.notes} onChange={e => setNewEntry({...newEntry, notes: e.target.value})} /></F>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowAddForm(false)} className={btnCancel} disabled={isSaving}>Cancel</button>
              <button onClick={handleAdd} className={btnPrimary} disabled={isSaving}>{isSaving ? 'Saving...' : 'Add Record'}</button>
            </div>
          </div>
        )}
      </div>
    </ProfileCard>
  );
};
