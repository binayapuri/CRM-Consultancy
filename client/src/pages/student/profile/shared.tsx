import React from 'react';

export const inp = "w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-400";

export const SI = (p: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} className={`${inp} ${p.className || ''}`} />
);

export const SS = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={`${inp} ${p.className || ''}`} />
);

export const TA = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className={`${inp} ${p.className || ''}`} />
);

export const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
      {label}
    </label>
    {children}
  </div>
);

export const DataRow = ({ label, value, icon }: { label: string; value: string | React.ReactNode; icon?: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-slate-50 last:border-0 group">
    <div className="w-full sm:w-1/3 flex items-center gap-2 mb-1 sm:mb-0">
      {icon && <span className="text-slate-400 group-hover:text-indigo-500 transition-colors">{icon}</span>}
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
    </div>
    <div className="w-full sm:w-2/3">
      <span className="text-sm font-black text-slate-700">{value || <span className="text-slate-300 font-normal italic">Not specified</span>}</span>
    </div>
  </div>
);
