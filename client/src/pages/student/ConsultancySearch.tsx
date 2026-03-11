import { useState, useEffect } from 'react';
import { authFetch } from '../../store/auth';
import { Search, Star, MapPin, CheckCircle2, Shield, Lock, ChevronRight } from 'lucide-react';

const DATA_CATEGORIES = [
  { id: 'profile', label: 'Basic Profile', desc: 'Name, nationality, contact details', icon: '👤', recommended: true },
  { id: 'immigration', label: 'Immigration / Visa Status', desc: 'Current visa, ANZSCO code, onshore/offshore', icon: '🛂', recommended: true },
  { id: 'english', label: 'English Test Results', desc: 'IELTS/PTE scores and TRF number', icon: '📝', recommended: true },
  { id: 'education', label: 'Education History', desc: 'Degrees and qualifications', icon: '🎓', recommended: false },
  { id: 'experience', label: 'Work History', desc: 'Employment and roles', icon: '💼', recommended: false },
  { id: 'skills', label: 'Skills Assessment & EOI', desc: 'Assessment body, reference, EOI details', icon: '📊', recommended: false },
  { id: 'health', label: 'Health & Character', desc: 'Police clearances and health check status', icon: '🏥', recommended: false },
];

export default function ConsultancySearch() {
  const [consultancies, setConsultancies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [step, setStep] = useState<'browse' | 'consent'>('browse');
  const [sharedCategories, setSharedCategories] = useState<Set<string>>(new Set(['profile', 'immigration', 'english']));
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    authFetch('/api/consultancies/public')
      .then(r => r.json())
      .then(d => { setConsultancies(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = consultancies.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.city?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleCategory = (id: string) => {
    setSharedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleConnect = () => {
    // In a real app, send a connection request with sharedCategories
    setRequested(true);
  };

  if (step === 'consent' && selected) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        <button onClick={() => { setStep('browse'); setSelected(null); setRequested(false); }} className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 mb-6 transition-colors">
          ← Back to Browse
        </button>

        <div className="bg-white rounded-3xl overflow-hidden" style={{ border: '2px solid #C7D2FE' }}>
          {/* Consultancy banner */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white" style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)' }}>
                {selected.name?.[0] || 'C'}
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">{selected.name}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {selected.marn && <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">MARN {selected.marn}</span>}
                  {selected.city && <span className="flex items-center gap-1 text-xs font-bold text-slate-500"><MapPin className="w-3 h-3" />{selected.city}</span>}
                </div>
              </div>
            </div>
          </div>

          {!requested ? (
            <div className="p-6 space-y-6">
              {/* Privacy notice */}
              <div className="p-4 rounded-2xl" style={{ background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-indigo-900 text-sm">You control your data</p>
                    <p className="text-xs text-indigo-700 font-medium mt-0.5">
                      Only the information you tick below will be shared with this consultancy. You can revoke access at any time from your profile settings.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-black text-slate-900 mb-4">Choose what to share</h3>
                <div className="space-y-3">
                  {DATA_CATEGORIES.map(cat => (
                    <label key={cat.id} className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all" style={{ background: sharedCategories.has(cat.id) ? '#F0FDF4' : '#F8FAFC', border: `1.5px solid ${sharedCategories.has(cat.id) ? '#86EFAC' : '#E2E8F0'}` }}>
                      <input type="checkbox" checked={sharedCategories.has(cat.id)} onChange={() => toggleCategory(cat.id)} className="sr-only" />
                      {sharedCategories.has(cat.id) ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />}
                      <div className="text-xl shrink-0">{cat.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-800">{cat.label}</p>
                          {cat.recommended && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">Recommended</span>}
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{cat.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button onClick={handleConnect} className="w-full py-4 rounded-2xl font-black text-white text-base transition-all hover:opacity-90 active:scale-98" style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
                Send Consultation Request
              </button>
              <p className="text-xs text-center text-slate-400 font-medium">By connecting, you agree that only the selected data above will be shared. The consultancy will contact you to confirm an appointment.</p>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">✉️</div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Request Sent!</h3>
              <p className="text-slate-500 font-medium">Your consultation request has been sent to <strong>{selected.name}</strong>. They will review your shared information and contact you within 1–2 business days.</p>
              <div className="mt-6 p-4 rounded-2xl text-sm font-medium" style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#3730A3' }}>
                You shared: {[...sharedCategories].map(id => DATA_CATEGORIES.find(c => c.id === id)?.label).join(', ')}
              </div>
              <button onClick={() => { setStep('browse'); setSelected(null); setRequested(false); }} className="mt-6 px-8 py-3 rounded-xl font-bold text-sm text-indigo-600 hover:bg-indigo-50 transition-colors">
                ← Back to Browse
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">🔍 Find a Migration Agent</h1>
        <p className="text-slate-500 font-medium mt-2">Browse verified registered migration agents (MARN). You choose what data to share — if at all.</p>
      </div>

      {/* Privacy badge */}
      <div className="flex items-start gap-3 p-5 rounded-3xl mb-6" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
        <Shield className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-black text-emerald-900">Your data is private by default</p>
          <p className="text-sm text-emerald-700 font-medium mt-0.5">Consultancies cannot see your profile until you explicitly choose to connect and select what to share. You have full control.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, location, or specialty..."
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-indigo-500/40"
          style={{ background: 'white', border: '2px solid #E8EDFB' }}
        />
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 font-medium">Loading consultancies...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-slate-500 font-semibold">No consultancies found</p>
          <p className="text-sm text-slate-400 mt-1">Try a different search term or browse all agents</p>
          {search && <button onClick={() => setSearch('')} className="mt-3 text-indigo-600 text-sm font-bold hover:underline">Clear search</button>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((c: any) => (
            <div key={c._id} className="bg-white rounded-3xl p-6 transition-all hover:shadow-lg hover:-translate-y-0.5" style={{ border: '1px solid #E8EDFB' }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shrink-0" style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)' }}>
                  {c.name?.[0] || 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900 text-lg leading-tight">{c.name}</h3>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    {c.marn && <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">MARN {c.marn}</span>}
                    {c.verificationStatus === 'VERIFIED' && <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Verified</span>}
                  </div>
                </div>
              </div>

              {c.city && (
                <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium mb-3">
                  <MapPin className="w-4 h-4" /> {c.city}{c.state ? `, ${c.state}` : ''}
                </div>
              )}

              {c.description && (
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-4 line-clamp-2">{c.description}</p>
              )}

              {c.specializations?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {c.specializations.slice(0, 3).map((s: string) => (
                    <span key={s} className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: '#EEF2FF', color: '#4338CA' }}>{s}</span>
                  ))}
                </div>
              )}

              {c.averageRating > 0 && (
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.round(c.averageRating) ? 'text-amber-400' : 'text-slate-200'}`} fill={i < Math.round(c.averageRating) ? 'currentColor' : 'none'} />
                  ))}
                  <span className="text-xs font-bold text-slate-500 ml-1">{c.averageRating.toFixed(1)} ({c.reviewCount || 0} reviews)</span>
                </div>
              )}

              <button onClick={() => { setSelected(c); setStep('consent'); setRequested(false); }} className="w-full py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2" style={{ background: '#EEF2FF', color: '#4338CA', border: '1.5px solid #C7D2FE' }}>
                Connect with Agent <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
