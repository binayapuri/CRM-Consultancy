import React, { useState } from 'react';
import { StickyNote, Plus, Trash2, Pin, Sparkles } from 'lucide-react';
import { ProfileCard } from '../ProfileCard';
import { SI, SS, F, TA } from '../shared';

interface NotesInfoProps {
  notes: any[];
  statement: string;
  onSaveStatement: (text: string) => Promise<void>;
  onAddNote: (note: any) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  onTogglePin: (id: string, isPinned: boolean) => Promise<void>;
}

export const NotesInfo: React.FC<NotesInfoProps> = ({ notes, statement, onSaveStatement, onAddNote, onDeleteNote, onTogglePin }) => {
  const [sForm, setSForm] = useState(statement);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNote, setNewNote] = useState<any>({ title: '', text: '', category: 'GENERAL', isPinned: false });

  const handleSaveStatement = async () => {
    setIsSaving(true);
    await onSaveStatement(sForm);
    setIsSaving(false);
  };

  const handleAddNote = async () => {
    setIsSaving(true);
    await onAddNote(newNote);
    setNewNote({ title: '', text: '', category: 'GENERAL', isPinned: false });
    setShowAddForm(false);
    setIsSaving(false);
  };

  const CAT_COLORS: Record<string, string> = { GENERAL: 'indigo', STUDY_PLAN: 'purple', WORK_LOG: 'amber', VISA_UPDATE: 'red', GOAL: 'orange', AI_CONTEXT: 'slate' };

  return (
    <div className="space-y-6">
      <ProfileCard title="Personal AI Statement" icon={<Sparkles className="w-5 h-5" />} isSaving={isSaving} onSave={handleSaveStatement} onCancel={() => setSForm(statement)} isEmpty={!statement}
        editForm={<F label="Your Voice (AI Identity Context)"><TA value={sForm} onChange={e => setSForm(e.target.value)} rows={6} placeholder="Tell us who you are, what you've done, and where you want to go. This context helps AI Compass guide you better." /></F>}
      >
        <p className="text-sm font-medium text-slate-600 leading-relaxed italic border-l-4 border-indigo-100 pl-4 py-1">{statement || 'No statement provided. Use this to give AI Compass a deep understanding of your goals.'}</p>
      </ProfileCard>

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-slate-800 flex items-center gap-2"><StickyNote className="w-5 h-5 text-indigo-600" /> My Journals & Notes</h3>
        <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 px-4 py-2 text-xs font-black text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all"><Plus className="w-4 h-4" /> New Note</button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-3xl border-2 border-indigo-100 mb-6 animate-in zoom-in-95">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <F label="Title"><SI value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})} /></F>
            <F label="Category"><SS value={newNote.category} onChange={e => setNewNote({...newNote, category: e.target.value})}>{Object.keys(CAT_COLORS).map(c=><option key={c}>{c}</option>)}</SS></F>
          </div>
          <F label="Content"><TA value={newNote.text} onChange={e => setNewNote({...newNote, text: e.target.value})} rows={4} /></F>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
             <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500 rounded-xl">Cancel</button>
             <button onClick={handleAddNote} className="px-6 py-2 text-xs font-black text-white bg-indigo-600 rounded-xl">Save Note</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {notes.map((note) => (
          <div key={note._id} className={`group bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 transition-all shadow-sm flex flex-col justify-between`}>
             <div className="flex justify-between items-start mb-2">
               <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-${CAT_COLORS[note.category] || 'slate'}-100 text-${CAT_COLORS[note.category] || 'slate'}-600`}>{note.category?.replace('_', ' ')}</span>
               <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => onTogglePin(note._id, !note.isPinned)} className={`p-1.5 rounded-lg ${note.isPinned ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-400'}`}><Pin className="w-3.5 h-3.5" /></button>
                 <button onClick={() => onDeleteNote(note._id)} className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
               </div>
             </div>
             <h4 className="font-black text-slate-800 text-sm mb-2">{note.title}</h4>
             <p className="text-xs text-slate-500 font-medium line-clamp-3 mb-4">{note.text}</p>
             <p className="text-[10px] font-bold text-slate-400 mt-auto">{new Date(note.addedAt).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
        ))}
        {notes.length === 0 && !showAddForm && <div className="sm:col-span-2 text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-medium italic">Your journal library is empty.</div>}
      </div>
    </div>
  );
};
