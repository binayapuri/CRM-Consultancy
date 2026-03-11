import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore, authFetch } from '../../store/auth';
import { ArrowRight, Star } from 'lucide-react';

// ── Journey stages ──────────────────────────────────────────────────────────
const JOURNEY_STAGES = [
  { id: 'planning',  label: 'Planning',       emoji: '🗺️',  desc: 'Researching options, choosing a pathway' },
  { id: 'prepare',   label: 'Preparing',      emoji: '📋',  desc: 'IELTS, finances, documents gathering' },
  { id: 'studying',  label: 'Studying',       emoji: '🎓',  desc: 'Currently studying in Australia on visa 500' },
  { id: 'graduate',  label: 'Graduate',       emoji: '🧑‍🎓', desc: 'Graduated, on or planning for 485 visa' },
  { id: 'skilled',   label: 'Skilled Worker', emoji: '💼',  desc: 'Working, building points toward PR' },
  { id: 'pr',        label: 'PR Granted',     emoji: '🇦🇺',  desc: 'Permanent Resident in Australia' },
];

// ── Smart action items per stage ─────────────────────────────────────────────
const STAGE_ACTIONS: Record<string, { text: string; link: string; icon: string }[]> = {
  planning:  [
    { text: 'Check your PR points estimate', link: 'calculator', icon: '🧮' },
    { text: 'Read the complete Visa Guide', link: 'visa-guide', icon: '📖' },
    { text: 'Build your migration profile', link: 'profile', icon: '👤' },
    { text: 'Ask the AI Compass your questions', link: 'compass', icon: '🤖' },
  ],
  prepare: [
    { text: 'Track your IELTS/PTE score in profile', link: 'profile', icon: '📝' },
    { text: 'Use the Document Vault checklist', link: 'documents', icon: '📁' },
    { text: 'Understand Genuine Temporary Entrant (GTE)', link: 'visa-guide', icon: '📖' },
    { text: 'Calculate how many PR points you need', link: 'calculator', icon: '🧮' },
  ],
  studying: [
    { text: 'Know your visa 500 work conditions (48hrs)', link: 'visa-guide', icon: '⚠️' },
    { text: 'Find part-time student-visa friendly jobs', link: 'jobs', icon: '💼' },
    { text: 'Plan your 485 Graduate Visa pathway', link: 'visa-guide', icon: '🎯' },
    { text: 'Store your CoE and OSHC certificate', link: 'documents', icon: '📁' },
  ],
  graduate: [
    { text: 'Apply for your 485 Graduate Visa', link: 'visa-guide', icon: '🎓' },
    { text: 'Get your skills assessed (Engineers Aus, VETASSESS)', link: 'profile', icon: '✅' },
    { text: 'Find full-time jobs in your ANZSCO occupation', link: 'jobs', icon: '💼' },
    { text: 'Lodge your EOI in SkillSelect', link: 'journey', icon: '🗺️' },
  ],
  skilled: [
    { text: 'Track your EOI invitation points', link: 'calculator', icon: '📊' },
    { text: 'Consider state nomination (190/491)', link: 'visa-guide', icon: '🏙️' },
    { text: 'Connect with a MARN agent for lodgement', link: 'consultancies', icon: '🔗' },
    { text: 'Prepare your police clearances and health check', link: 'documents', icon: '📁' },
  ],
  pr: [
    { text: 'Congratulations! Your PR is complete 🎉', link: 'journey', icon: '🇦🇺' },
    { text: 'Check your PR visa conditions', link: 'visa-guide', icon: '📖' },
    { text: 'Explore citizenship pathway (4 year wait)', link: 'visa-guide', icon: '🌏' },
    { text: 'Leave a review for your consultancy', link: 'consultancies', icon: '⭐' },
  ],
};

// ── Quick tools ───────────────────────────────────────────────────────────────
const quickTools = [
  { to: 'visa-guide',    label: 'Visa Guide',    desc: '500, 485, 189, 190, 491, PR',  gradient: 'from-indigo-500 to-purple-600',   emoji: '📖' },
  { to: 'calculator',    label: 'PR Points',     desc: '2025–2026 official calculator',  gradient: 'from-emerald-500 to-teal-600',   emoji: '🧮' },
  { to: 'documents',     label: 'Doc Vault',     desc: 'Checklist + file manager',       gradient: 'from-blue-500 to-cyan-600',      emoji: '📁' },
  { to: 'jobs',          label: 'Job Board',     desc: 'Student & 485 visa friendly',    gradient: 'from-amber-500 to-orange-600',   emoji: '💼' },
  { to: 'compass',       label: 'AI Compass',    desc: 'Ask anything about your visa',   gradient: 'from-rose-500 to-pink-600',      emoji: '🤖' },
  { to: 'consultancies', label: 'Find Agent',    desc: 'Verified MARN consultancies',    gradient: 'from-violet-500 to-indigo-600',  emoji: '🔗' },
];

// ── PR Points quick estimate ──────────────────────────────────────────────────
function estimatePoints(profile: any): number {
  let pts = 0;
  const age = profile?.dob ? Math.floor((Date.now() - new Date(profile.dob).getTime()) / 31557600000) : 0;
  if (age >= 18 && age <= 24) pts += 25;
  else if (age <= 32) pts += 30;
  else if (age <= 39) pts += 25;
  else if (age <= 44) pts += 15;
  const edu = profile?.highestEducation;
  if (edu === 'phd') pts += 20;
  else if (edu === 'masters' || edu === 'bachelor') pts += 15;
  const eng = profile?.englishScore;
  if (eng === 'superior') pts += 20;
  else if (eng === 'proficient') pts += 10;
  return pts;
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [stage, setStage] = useState<string>(() => localStorage.getItem('student_journey_stage') || 'planning');

  useEffect(() => {
    authFetch('/api/auth/me')
      .then(r => r.json())
      .then(u => { setProfile(u?.profile || null); })
      .catch(() => {});
  }, []);

  const setAndSaveStage = (s: string) => {
    setStage(s);
    localStorage.setItem('student_journey_stage', s);
  };

  const firstname = profile?.firstName || user?.profile?.firstName || 'there';
  const prPoints = estimatePoints(profile || user?.profile);
  const currentStageObj = JOURNEY_STAGES.find(s => s.id === stage)!;
  const currentActions = STAGE_ACTIONS[stage] || [];

  const stageIndex = JOURNEY_STAGES.findIndex(s => s.id === stage);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* ────────── Hero Banner ────────── */}
      <div
        className="relative overflow-hidden rounded-[2rem] p-8 md:p-12"
        style={{ background: 'linear-gradient(135deg, #0F0E2E 0%, #1a1560 50%, #0d2847 100%)' }}
      >
        {/* Glow orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle, #6366F1, transparent)', filter: 'blur(64px)' }} />
        <div className="absolute bottom-0 left-24 w-60 h-60 rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #10B981, transparent)', filter: 'blur(80px)' }} />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: '#10B981' }}>Welcome Back</p>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-3">
              Hey, {firstname}! 👋
            </h1>
            <p className="text-lg font-medium" style={{ color: '#94A3B8' }}>
              Your personal Australian migration companion.
            </p>

            {/* Journey progress bar */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{currentStageObj.emoji}</span>
                <span className="text-white font-bold text-lg">{currentStageObj.label}</span>
                <span className="text-sm px-2 py-0.5 rounded-full font-semibold text-indigo-200" style={{ background: 'rgba(99,102,241,0.3)' }}>
                  Stage {stageIndex + 1} of {JOURNEY_STAGES.length}
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${((stageIndex + 1) / JOURNEY_STAGES.length) * 100}%`, background: 'linear-gradient(90deg, #6366F1, #10B981)' }}
                />
              </div>
            </div>
          </div>

          {/* PR Points badge */}
          <div className="shrink-0 text-center p-6 rounded-3xl" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#10B981' }}>My PR Points</p>
            <p className="text-6xl font-black text-white leading-none">{prPoints}</p>
            <p className="text-xs mt-2" style={{ color: '#94A3B8' }}>Estimate · Complete profile for accuracy</p>
            <Link to="calculator" className="mt-3 inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition hover:opacity-80" style={{ background: 'rgba(99,102,241,0.4)', color: '#C7D2FE' }}>
              Full Calculator <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* ────────── Left col: Stage picker + Actions ────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Stage Picker */}
          <div className="bg-white rounded-3xl p-6 shadow-sm" style={{ border: '1px solid #E8EDFB' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-900">Where are you right now?</h2>
              <span className="text-xs text-slate-400 font-medium">Select your current stage</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {JOURNEY_STAGES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setAndSaveStage(s.id)}
                  className="text-left p-3 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-[0.99]"
                  style={
                    stage === s.id
                      ? { borderColor: '#6366F1', background: 'linear-gradient(135deg, #EEF2FF, #F0FDF4)', color: '#3730A3' }
                      : { borderColor: '#E2E8F0', background: '#F8FAFC', color: '#64748B' }
                  }
                >
                  <div className="text-xl mb-1">{s.emoji}</div>
                  <div className="text-xs font-bold leading-tight">{s.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Smart action items for stage */}
          <div className="bg-white rounded-3xl p-6 shadow-sm" style={{ border: '1px solid #E8EDFB' }}>
            <h2 className="text-lg font-black text-slate-900 mb-1">What to do now</h2>
            <p className="text-sm text-slate-400 mb-5 font-medium">Smart checklist for: <strong className="text-indigo-600">{currentStageObj.label}</strong></p>
            <div className="space-y-3">
              {currentActions.map((item, i) => (
                <Link
                  key={i}
                  to={item.link}
                  className="flex items-center gap-4 p-4 rounded-2xl group transition-all hover:scale-[1.01]"
                  style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: '#EEF2FF' }}>
                    {item.icon}
                  </div>
                  <p className="flex-1 text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">{item.text}</p>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ────────── Right col: Quick tools + Tips ────────── */}
        <div className="space-y-6">
          {/* Quick tools */}
          <div className="bg-white rounded-3xl p-5 shadow-sm" style={{ border: '1px solid #E8EDFB' }}>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">Quick Tools</h2>
            <div className="space-y-2">
              {quickTools.map(({ to, label, desc, emoji, gradient }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 p-3 rounded-2xl group transition-all hover:scale-[1.01]"
                  style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base bg-gradient-to-br ${gradient} shadow-sm shrink-0 group-hover:scale-110 transition-transform`}>
                    <span>{emoji}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-none">{label}</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Tip of the day */}
          <div className="rounded-3xl p-5" style={{ background: 'linear-gradient(135deg, #EEF2FF, #F0FDF4)', border: '1px solid #C7D2FE' }}>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-indigo-500" />
              <p className="text-xs font-black uppercase tracking-wider text-indigo-700">Agent advice</p>
            </div>
            <p className="text-sm font-semibold text-indigo-900 leading-relaxed">
              Your profile data stays <strong>100% private</strong>. If you choose to connect with a verified MARN agent, you control exactly what they can see.
            </p>
            <Link to="consultancies" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
              Browse agents <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ────────── Tool Cards Grid ────────── */}
      <div>
        <h2 className="text-xl font-black text-slate-900 mb-4">Everything you need</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickTools.map(({ to, label, desc, emoji, gradient }) => (
            <Link
              key={to}
              to={to}
              className="bg-white p-6 rounded-3xl group transition-all hover:shadow-lg hover:-translate-y-1"
              style={{ border: '1px solid #E8EDFB' }}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br ${gradient} shadow-md mb-4 group-hover:scale-110 transition-transform`}>
                {emoji}
              </div>
              <h3 className="font-black text-slate-900 text-lg mb-1 group-hover:text-indigo-600 transition-colors">{label}</h3>
              <p className="text-sm text-slate-500 font-medium">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
