import { useEffect, useState } from 'react';
import { Search, Building2 } from 'lucide-react';

export default function ConsultancySearch() {
  const [consultancies, setConsultancies] = useState<any[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    fetch(`/api/consultancies/search${q ? `?q=${q}` : ''}`).then(r => r.json()).then(setConsultancies);
  }, [q]);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900">Find Consultancy</h1>
      <p className="text-slate-500 mt-1">Verified migration agents</p>
      <div className="mt-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input placeholder="Search by name or specialization..." value={q} onChange={e => setQ(e.target.value)} className="input pl-10" />
      </div>
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        {consultancies.map((c: any) => (
          <div key={c._id} className="card flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-ori-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-ori-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{c.name}</p>
              <p className="text-sm text-slate-500">{c.specializations?.join(', ')}</p>
              {c.languages?.length && <p className="text-xs text-slate-400 mt-1">Languages: {c.languages.join(', ')}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
