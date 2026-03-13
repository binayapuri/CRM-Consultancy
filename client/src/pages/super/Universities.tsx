import { useState, useEffect } from 'react';
import { authFetch } from '../../store/auth';
import { Building2, Plus, Edit2, ShieldCheck, MapPin } from 'lucide-react';

export default function Universities() {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', city: '', state: '', partnerStatus: 'UNVERIFIED' });

  const fetchUnis = async () => {
    try {
      const res = await authFetch('/api/universities/admin');
      if (res.ok) setUniversities(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnis();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/universities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: formData.name, 
          location: { city: formData.city, state: formData.state },
          partnerStatus: formData.partnerStatus 
        })
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ name: '', city: '', state: '', partnerStatus: 'UNVERIFIED' });
        fetchUnis();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Universities Master DB</h1>
          <p className="text-slate-500 mt-1">Manage partner universities and institutions globally.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-sm border border-indigo-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> root access
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition-colors shadow-sm shadow-sky-600/20"
          >
            <Plus className="w-5 h-5" /> Add University
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm mb-8 animate-fade-in-up">
          <h2 className="text-xl font-bold text-slate-900 mb-6">➕ Add New Institution</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">University Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/50" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Partner Status</label>
              <select value={formData.partnerStatus} onChange={e => setFormData({...formData, partnerStatus: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/50">
                <option value="UNVERIFIED">Unverified</option>
                <option value="STANDARD">Standard Partner</option>
                <option value="PREMIUM">Premium Partner</option>
                <option value="VERIFIED">Verified Institution</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">City</label>
              <input required type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/50" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">State/Region</label>
              <input required type="text" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/50" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-slate-200 font-bold rounded-xl text-slate-600 hover:bg-slate-50 transition">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition shadow-md shadow-sky-600/20">Save Institution</button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {universities.map((uni: any) => (
          <div key={uni._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-2 h-full ${uni.partnerStatus === 'PREMIUM' ? 'bg-amber-500' : uni.partnerStatus === 'STANDARD' ? 'bg-sky-500' : 'bg-slate-300'}`}></div>
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-sky-600 mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1 leading-tight">{uni.name}</h3>
            <div className="flex flex-col gap-2 mt-3">
              <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {uni.location?.city}, {uni.location?.state}</p>
              <p className="text-xs font-bold px-2 py-1 rounded w-max bg-slate-100 text-slate-600">{uni.partnerStatus.replace('_', ' ')}</p>
            </div>
            <button className="hidden group-hover:flex absolute bottom-4 right-4 w-10 h-10 border border-slate-200 bg-white rounded-full items-center justify-center text-sky-600 hover:bg-sky-50 shadow-sm transition">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
