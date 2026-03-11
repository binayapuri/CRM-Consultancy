import { useState, useEffect } from 'react';
import { authFetch } from '../../store/auth';
import { Search, ToggleLeft, ToggleRight, TrendingUp, Users, Building2, Award } from 'lucide-react';

export default function AdminStudentManager() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      authFetch('/api/admin/students').then((r: Response) => r.json()),
      authFetch('/api/admin/stats').then((r: Response) => r.json()),
    ]).then(([s, st]) => {
      setStudents(Array.isArray(s) ? s : []);
      setStats(st);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const filtered = students.filter(s => {
    if (!search) return true;
    const name = `${s.profile?.firstName || ''} ${s.profile?.lastName || ''}`.toLowerCase();
    return name.includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase());
  });

  const toggleActive = async (id: string, current: boolean) => {
    await authFetch(`/api/admin/students/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    });
    fetchData();
    if (selected?._id === id) setSelected((p: any) => ({ ...p, isActive: !current }));
  };

  const StatsCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white rounded-3xl p-5" style={{ border: '1px solid #E8EDFB' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
          <p className="text-3xl font-black mt-1" style={{ color }}>{loading ? '...' : value ?? '—'}</p>
        </div>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in-up space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">👨‍🎓 Student Manager</h1>
        <p className="text-slate-500 font-medium mt-1">Full visibility of all students registered on the platform.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={Users} label="Total Students" value={stats?.totalStudents} color="#6366F1" />
        <StatsCard icon={Building2} label="Consultancies" value={stats?.totalConsultancies} color="#10B981" />
        <StatsCard icon={Award} label="Applications" value={stats?.totalApplications} color="#F59E0B" />
        <StatsCard icon={TrendingUp} label="Active This Week" value={stats?.activeThisWeek} color="#8B5CF6" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Student list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full pl-10 pr-4 py-3 text-sm font-medium rounded-2xl bg-white outline-none focus:ring-2 focus:ring-indigo-500/40" style={{ border: '1.5px solid #E8EDFB' }} />
          </div>
          <p className="text-xs text-slate-400 font-bold">{filtered.length} students</p>
          <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto pr-1">
            {loading ? <p className="text-slate-400 text-sm font-medium text-center py-8">Loading...</p>
              : filtered.length === 0 ? <p className="text-slate-400 text-sm font-medium text-center py-8">No students found</p>
              : filtered.map(s => (
                <button
                  key={s._id}
                  onClick={() => { setSelected(s); }}
                  className="w-full text-left p-4 rounded-2xl transition-all"
                  style={{ background: selected?._id === s._id ? '#EEF2FF' : 'white', border: `1.5px solid ${selected?._id === s._id ? '#C7D2FE' : '#E8EDFB'}` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shrink-0" style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)' }}>
                      {(s.profile?.firstName?.[0] || s.email?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{s.profile?.firstName} {s.profile?.lastName}</p>
                      <p className="text-xs text-slate-400 truncate">{s.email}</p>
                    </div>
                    <div className="shrink-0">
                      {s.isActive
                        ? <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
                        : <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Inactive</span>}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Right: Student detail */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="bg-white rounded-3xl p-12 text-center" style={{ border: '1px solid #E8EDFB' }}>
              <p className="text-5xl mb-4">👆</p>
              <p className="font-bold text-slate-400">Select a student to view their details</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl overflow-hidden" style={{ border: '1px solid #E8EDFB' }}>
              {/* Header */}
              <div className="p-6 flex items-start justify-between" style={{ background: 'linear-gradient(135deg, #F8F9FF, #ECFDF5)', borderBottom: '1px solid #E8EDFB' }}>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white" style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)' }}>
                    {(selected.profile?.firstName?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{selected.profile?.firstName} {selected.profile?.lastName}</h2>
                    <p className="text-sm text-slate-500">{selected.email}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Registered {new Date(selected.createdAt).toLocaleDateString('en-AU')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(selected._id, selected.isActive)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-colors" style={{ background: selected.isActive ? '#FEF2F2' : '#F0FDF4', color: selected.isActive ? '#EF4444' : '#10B981', border: `1px solid ${selected.isActive ? '#FECDD3' : '#BBF7D0'}` }}>
                    {selected.isActive ? <><ToggleRight className="w-4 h-4" /> Deactivate</> : <><ToggleLeft className="w-4 h-4" /> Activate</>}
                  </button>
                </div>
              </div>

              {/* Profile data */}
              <div className="p-6 space-y-5 max-h-96 overflow-y-auto">
                {/* Personal */}
                {selected.client?.profile && (
                  <Section title="👤 Personal Information">
                    <Row label="Nationality" value={selected.client.profile.nationality} />
                    <Row label="DOB" value={selected.client.profile.dob ? new Date(selected.client.profile.dob).toLocaleDateString('en-AU') : ''} />
                    <Row label="Gender" value={selected.client.profile.gender} />
                    <Row label="Marital Status" value={selected.client.profile.maritalStatus} />
                    <Row label="Passport" value={selected.client.profile.passportNumber} />
                    <Row label="Onshore" value={selected.client.profile.onshore ? 'Yes (in Australia)' : 'Offshore'} />
                  </Section>
                )}
                {/* Immigration */}
                {selected.client?.profile && (
                  <Section title="🛂 Immigration">
                    <Row label="Current Visa" value={selected.client.profile.currentVisa} />
                    <Row label="Visa Expiry" value={selected.client.profile.visaExpiry ? new Date(selected.client.profile.visaExpiry).toLocaleDateString('en-AU') : ''} />
                    <Row label="Target Visa" value={selected.client.profile.targetVisa} />
                    <Row label="ANZSCO" value={selected.client.profile.anzscoCode} />
                  </Section>
                )}
                {/* English */}
                {selected.client?.englishTest?.testType && (
                  <Section title="📝 English Test">
                    <Row label="Test" value={selected.client.englishTest.testType} />
                    <Row label="Overall" value={selected.client.englishTest.score} />
                    <Row label="Listening" value={selected.client.englishTest.listening} />
                    <Row label="Reading" value={selected.client.englishTest.reading} />
                    <Row label="Writing" value={selected.client.englishTest.writing} />
                    <Row label="Speaking" value={selected.client.englishTest.speaking} />
                    <Row label="Expires" value={selected.client.englishTest.expiryDate ? new Date(selected.client.englishTest.expiryDate).toLocaleDateString('en-AU') : ''} />
                  </Section>
                )}
                {/* Education */}
                {selected.client?.education?.length > 0 && (
                  <Section title="🎓 Education">
                    {selected.client.education.map((e: any) => (
                      <div key={e._id} className="p-3 rounded-xl bg-slate-50 text-sm">
                        <p className="font-bold text-slate-700">{e.qualification}</p>
                        <p className="text-slate-500">{e.institution}, {e.country}</p>
                      </div>
                    ))}
                  </Section>
                )}
                {/* Experience */}
                {selected.client?.experience?.length > 0 && (
                  <Section title="💼 Work History">
                    {selected.client.experience.map((e: any) => (
                      <div key={e._id} className="p-3 rounded-xl bg-slate-50 text-sm">
                        <p className="font-bold text-slate-700">{e.role} @ {e.employer}</p>
                        <p className="text-slate-500">{e.country} · {e.isCurrent ? 'Current' : 'Past'}</p>
                      </div>
                    ))}
                  </Section>
                )}
                {/* Skills */}
                {selected.client?.skillsData?.assessingBody && (
                  <Section title="📊 Skills Assessment">
                    <Row label="Body" value={selected.client.skillsData.assessingBody} />
                    <Row label="Outcome" value={selected.client.skillsData.outcome} />
                    <Row label="EOI Status" value={selected.client.skillsData.eoiSubmitted} />
                    <Row label="State Nomination" value={selected.client.skillsData.stateNomination} />
                  </Section>
                )}
              </div>

              {/* Admin note */}
              <div className="px-6 py-4 border-t text-xs text-slate-400 font-medium" style={{ borderColor: '#E8EDFB' }}>
                ID: {selected._id} · Last login: {selected.updatedAt ? new Date(selected.updatedAt).toLocaleDateString('en-AU') : 'N/A'} · SUPER ADMIN VIEW
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">{title}</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="py-1 border-b border-slate-50">
      <span className="text-xs font-bold text-slate-400">{label}: </span>
      <span className="text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}
