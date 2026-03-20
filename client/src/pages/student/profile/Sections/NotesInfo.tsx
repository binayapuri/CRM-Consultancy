import React, { useState, useEffect } from 'react';
import { StickyNote, Plus, Trash2, Pin, Sparkles, Pencil } from 'lucide-react';
import { useUiStore } from '../../../../store/ui';
import { ProfileCard } from '../ProfileCard';
import { SI, SS, F, TA, formGridClass, btnCancel, btnPrimary } from '../shared';

const CAT_OPTIONS = ['GENERAL', 'STUDY_PLAN', 'WORK_LOG', 'VISA_UPDATE', 'GOAL', 'AI_CONTEXT'];

const CAT_CLASSES: Record<string, string> = {
  GENERAL: 'bg-indigo-100 text-indigo-600',
  STUDY_PLAN: 'bg-purple-100 text-purple-600',
  WORK_LOG: 'bg-amber-100 text-amber-600',
  VISA_UPDATE: 'bg-red-100 text-red-600',
  GOAL: 'bg-orange-100 text-orange-600',
  AI_CONTEXT: 'bg-slate-100 text-slate-600',
};

interface NotesInfoProps {
  notes: any[];
  statement: string;
  onSaveStatement: (text: string) => Promise<void>;
  onAddNote: (note: any) => Promise<void>;
  onUpdateNote?: (id: string, data: any) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  onTogglePin: (id: string, isPinned: boolean) => Promise<void>;
}

const emptyNote = () => ({ title: '', text: '', category: 'GENERAL', isPinned: false });

export const NotesInfo: React.FC<NotesInfoProps> = ({
  notes,
  statement,
  onSaveStatement,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onTogglePin,
}) => {
  const [sForm, setSForm] = useState(statement);
  const [isSaving, setIsSaving] = useState(false);
  const [noteForm, setNoteForm] = useState(emptyNote);
  const [editingNote, setEditingNote] = useState<any>(null);

  const { openModal, closeModal, modal, setModalContentGetter, bumpModalContentKey } = useUiStore();

  const handleSaveStatement = async () => {
    setIsSaving(true);
    await onSaveStatement(sForm);
    setIsSaving(false);
  };

  const getNoteFormContent = () => (
    <div className="space-y-4">
      <div className={formGridClass}>
        <F label="Title">
          <SI
            value={noteForm.title}
            onChange={(e) => setNoteForm((f) => ({ ...f, title: e.target.value }))}
          />
        </F>
        <F label="Category">
          <SS
            value={noteForm.category}
            onChange={(e) => setNoteForm((f) => ({ ...f, category: e.target.value }))}
          >
            {CAT_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c.replace('_', ' ')}
              </option>
            ))}
          </SS>
        </F>
      </div>
      <F label="Content">
        <TA
          value={noteForm.text}
          onChange={(e) => setNoteForm((f) => ({ ...f, text: e.target.value }))}
          rows={4}
          placeholder="Your note content..."
        />
      </F>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={noteForm.isPinned}
          onChange={(e) => setNoteForm((f) => ({ ...f, isPinned: e.target.checked }))}
          className="w-4 h-4 rounded accent-amber-500"
        />
        <span className="text-sm font-bold text-slate-600">Pin this note</span>
      </label>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => {
            closeModal();
            setEditingNote(null);
            setNoteForm(emptyNote());
          }}
          className={btnCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={async () => {
            if (editingNote && onUpdateNote) {
              setIsSaving(true);
              await onUpdateNote(editingNote._id, noteForm);
              setIsSaving(false);
              closeModal();
              setEditingNote(null);
              setNoteForm(emptyNote());
            } else {
              setIsSaving(true);
              await onAddNote(noteForm);
              setIsSaving(false);
              closeModal();
              setNoteForm(emptyNote());
            }
          }}
          className={btnPrimary}
          disabled={isSaving}
        >
          {editingNote ? (isSaving ? 'Updating...' : 'Update Note') : isSaving ? 'Saving...' : 'Save Note'}
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    if (modal.open) {
      setModalContentGetter(getNoteFormContent);
      bumpModalContentKey();
    }
  }, [modal.open, noteForm, isSaving, editingNote, setModalContentGetter, bumpModalContentKey]);

  const openNewNoteModal = () => {
    setEditingNote(null);
    setNoteForm(emptyNote());
    openModal('New Note', null);
  };

  const openEditNoteModal = (note: any) => {
    setEditingNote(note);
    setNoteForm({
      title: note.title || '',
      text: note.text || '',
      category: note.category || 'GENERAL',
      isPinned: !!note.isPinned,
    });
    openModal('Edit Note', null);
  };

  return (
    <div className="space-y-6">
      <ProfileCard
        title="Personal AI Statement"
        icon={<Sparkles className="w-5 h-5" />}
        isSaving={isSaving}
        onSave={handleSaveStatement}
        onCancel={() => setSForm(statement)}
        isEmpty={!statement}
        editForm={
          <F label="Your Voice (AI Identity Context)">
            <TA
              value={sForm}
              onChange={(e) => setSForm(e.target.value)}
              rows={6}
              placeholder="Tell us who you are, what you've done, and where you want to go. This context helps AI Compass guide you better."
            />
          </F>
        }
      >
        <p className="text-sm font-medium text-slate-600 leading-relaxed italic border-l-4 border-indigo-100 pl-4 py-1">
          {statement || 'No statement provided. Use this to give AI Compass a deep understanding of your goals.'}
        </p>
      </ProfileCard>

      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-black text-slate-800 flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-indigo-600" /> My Journals & Notes
        </h3>
        <button onClick={openNewNoteModal} className={btnPrimary}>
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {notes.map((note) => (
          <div
            key={note._id}
            className="group bg-white p-5 rounded-lg border border-slate-200 hover:border-indigo-400 transition-all shadow-sm flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    CAT_CLASSES[note.category] ?? 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {note.category?.replace('_', ' ')}
                </span>
                {note.isPinned && (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    <Pin className="w-3 h-3" /> Pinned
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {onUpdateNote && (
                  <button
                    onClick={() => openEditNoteModal(note)}
                    className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    title="Edit note"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => onTogglePin(note._id, !note.isPinned)}
                  className={`p-1.5 rounded-lg ${
                    note.isPinned ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-400 hover:bg-amber-50/50'
                  }`}
                  title={note.isPinned ? 'Unpin' : 'Pin'}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteNote(note._id)}
                  className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <h4 className="font-black text-slate-800 text-sm mb-2">{note.title}</h4>
            <p className="text-xs text-slate-500 font-medium line-clamp-3 mb-4">{note.text}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-auto">
              {new Date(note.addedAt).toLocaleDateString('en-AU', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        ))}
        {notes.length === 0 && (
          <div className="sm:col-span-2 text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 font-medium italic">
            Your journal library is empty.
          </div>
        )}
      </div>
    </div>
  );
};
