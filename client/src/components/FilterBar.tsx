import { useState } from 'react';
import { Filter, X } from 'lucide-react';

type FilterField = {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date';
  options?: { value: string; label: string }[];
  placeholder?: string;
};

type FilterBarProps = {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  onClear: () => void;
  className?: string;
};

export default function FilterBar({ fields, values, onChange, onClear, className = '' }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);
  const hasActiveFilters = Object.values(values).some(v => v && String(v).trim());

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
          hasActiveFilters ? 'bg-ori-100 text-ori-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        <Filter className="w-4 h-4" />
        Filters {hasActiveFilters && `(${Object.values(values).filter(v => v).length})`}
      </button>
      {expanded && (
        <div className="mt-3 p-4 rounded-xl bg-white border border-slate-200 shadow-lg flex flex-wrap gap-4 items-end">
          {fields.map(f => (
            <div key={f.key} className="min-w-[140px]">
              <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
              {f.type === 'select' ? (
                <select
                  value={values[f.key] || ''}
                  onChange={e => onChange({ ...values, [f.key]: e.target.value })}
                  className="input text-sm py-1.5"
                >
                  <option value="">All</option>
                  {(f.options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === 'date' ? (
                <input
                  type="date"
                  value={values[f.key] || ''}
                  onChange={e => onChange({ ...values, [f.key]: e.target.value })}
                  className="input text-sm py-1.5"
                />
              ) : (
                <input
                  type="text"
                  value={values[f.key] || ''}
                  onChange={e => onChange({ ...values, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="input text-sm py-1.5"
                />
              )}
            </div>
          ))}
          <div className="flex gap-2 ml-auto">
            {hasActiveFilters && (
              <button type="button" onClick={onClear} className="btn-secondary text-sm flex items-center gap-1">
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
