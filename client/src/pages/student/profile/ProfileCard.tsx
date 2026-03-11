import React, { useState } from 'react';
import { Edit2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';

interface ProfileCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  editForm: React.ReactNode;
  onSave: () => Promise<void>;
  isSaving?: boolean;
  isEmpty?: boolean;
  onCancel?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  title,
  icon,
  children,
  editForm,
  onSave,
  isSaving = false,
  isEmpty = false,
  onCancel
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSave = async () => {
    await onSave();
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 mb-6">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-50 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-indigo-600">
            {icon}
          </div>
          <h3 className="font-black text-slate-800 tracking-tight">{title}</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 rounded-xl transition-colors group"
                title="Edit Section"
              >
                <Edit2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-slate-100 text-slate-400 rounded-xl transition-colors"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                disabled={isSaving}
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                disabled={isSaving}
              >
                <Save className="w-3.5 h-3.5" /> 
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-6">
          {isEditing ? (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              {editForm}
            </div>
          ) : (
            <div className={`animate-in fade-in duration-300 ${isEmpty ? 'py-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200' : ''}`}>
              {isEmpty ? (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-slate-400 text-sm font-medium">No information added yet</p>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    + Add Details
                  </button>
                </div>
              ) : children}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
