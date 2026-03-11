import React, { useState } from 'react';
import { MapPin, Plus, Trash2, Home, Globe, Calendar } from 'lucide-react';
import { ProfileCard } from '../ProfileCard';
import { SI, SS, F, DataRow } from '../shared';

interface AddressInfoProps {
  current: any;
  previous: any[];
  onSaveCurrent: (data: any) => Promise<void>;
  onAddPrevious: (data: any) => Promise<void>;
  onDeletePrevious: (id: string) => Promise<void>;
}

export const AddressInfo: React.FC<AddressInfoProps> = ({ current, previous, onSaveCurrent, onAddPrevious, onDeletePrevious }) => {
  const [cForm, setCForm] = useState({ ...current });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState<any>({ street: '', suburb: '', city: '', state: '', postcode: '', country: '', from: '', to: '', type: 'HOME' });
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveCurrent = async () => {
    setIsSaving(true);
    await onSaveCurrent(cForm);
    setIsSaving(false);
  };

  const handleAddPrevious = async () => {
    setIsSaving(true);
    await onAddPrevious(newEntry);
    setNewEntry({ street: '', suburb: '', city: '', state: '', postcode: '', country: '', from: '', to: '', type: 'HOME' });
    setShowAddForm(false);
    setIsSaving(false);
  };

  const ADDR_TYPES = ['HOME', 'RENTAL', 'HOSTEL', 'FAMILY', 'OTHER'];

  return (
    <div className="space-y-6">
      <ProfileCard
        title="Current Residential Address"
        icon={<Home className="w-5 h-5" />}
        isSaving={isSaving}
        onSave={handleSaveCurrent}
        onCancel={() => setCForm({ ...current })}
        isEmpty={!current.street}
        editForm={
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <F label="Street Address"><SI value={cForm.street || ''} onChange={e => setCForm({...cForm, street: e.target.value})} /></F>
            <F label="Suburb"><SI value={cForm.suburb || ''} onChange={e => setCForm({...cForm, suburb: e.target.value})} /></F>
            <F label="City"><SI value={cForm.city || ''} onChange={e => setCForm({...cForm, city: e.target.value})} /></F>
            <F label="State"><SI value={cForm.state || ''} onChange={e => setCForm({...cForm, state: e.target.value})} /></F>
            <F label="Postcode"><SI value={cForm.postcode || ''} onChange={e => setCForm({...cForm, postcode: e.target.value})} /></F>
            <F label="Country"><SI value={cForm.country || ''} onChange={e => setCForm({...cForm, country: e.target.value})} /></F>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
          <DataRow label="Address" value={`${current.street || ''}, ${current.suburb || ''}`} icon={<Home className="w-4 h-4" />} />
          <DataRow label="City / State" value={`${current.city || ''} ${current.state || ''} ${current.postcode || ''}`} />
          <DataRow label="Country" value={current.country} icon={<Globe className="w-4 h-4" />} />
        </div>
      </ProfileCard>

      <ProfileCard
        title="Previous Addresses (Last 5 Years)"
        icon={<MapPin className="w-5 h-5" />}
        isSaving={isSaving}
        onSave={async () => {}}
        isEmpty={previous.length === 0}
        editForm={null}
      >
        <div className="space-y-6">
          <div className="space-y-4">
            {previous.map((item) => (
              <div key={item._id} className="relative group bg-slate-50/50 p-5 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="font-black text-slate-800 text-sm leading-tight">
                      {[item.street, item.suburb, item.city, item.state, item.postcode, item.country].filter(Boolean).join(', ')}
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                       <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">{item.type}</span>
                       <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(item.from).toLocaleDateString()} - {item.to ? new Date(item.to).toLocaleDateString() : 'Present'}</span>
                    </div>
                  </div>
                  <button onClick={() => onDeletePrevious(item._id)} className="p-2 text-slate-300 hover:text-red-500 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>

          {!showAddForm ? (
            <button onClick={() => setShowAddForm(true)} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-black text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Previous Address History
            </button>
          ) : (
            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-indigo-100 space-y-4 animate-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Type"><SS value={newEntry.type} onChange={e => setNewEntry({...newEntry, type: e.target.value})}>{ADDR_TYPES.map(t=><option key={t}>{t}</option>)}</SS></F>
                <F label="Street"><SI value={newEntry.street} onChange={e => setNewEntry({...newEntry, street: e.target.value})} /></F>
                <F label="Suburb"><SI value={newEntry.suburb} onChange={e => setNewEntry({...newEntry, suburb: e.target.value})} /></F>
                <F label="City"><SI value={newEntry.city} onChange={e => setNewEntry({...newEntry, city: e.target.value})} /></F>
                <F label="State"><SI value={newEntry.state} onChange={e => setNewEntry({...newEntry, state: e.target.value})} /></F>
                <F label="Postcode"><SI value={newEntry.postcode} onChange={e => setNewEntry({...newEntry, postcode: e.target.value})} /></F>
                <F label="Country"><SI value={newEntry.country} onChange={e => setNewEntry({...newEntry, country: e.target.value})} /></F>
                <div className="grid grid-cols-2 gap-3">
                  <F label="From"><SI type="date" value={newEntry.from} onChange={e => setNewEntry({...newEntry, from: e.target.value})} /></F>
                  <F label="To"><SI type="date" value={newEntry.to} onChange={e => setNewEntry({...newEntry, to: e.target.value})} /></F>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors" disabled={isSaving}>Cancel</button>
                <button onClick={handleAddPrevious} className="px-6 py-2 text-xs font-black text-white bg-indigo-600 rounded-xl shadow-lg hover:bg-indigo-700 transition-all" disabled={isSaving}>{isSaving ? 'Saving...' : 'Add History'}</button>
              </div>
            </div>
          )}
        </div>
      </ProfileCard>
    </div>
  );
};
