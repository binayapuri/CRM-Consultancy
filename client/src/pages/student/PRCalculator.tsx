import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ExternalLink, Calculator, Save } from 'lucide-react';
import { authFetch } from '../../store/auth';
import { useUiStore } from '../../store/ui';

// ─── Official Australian Points Test (2025–2026) ──────────────────────────

const AGE_POINTS: { label: string; min: number; max: number; pts: number }[] = [
  { label: '18–24', min: 18, max: 24, pts: 25 },
  { label: '25–32', min: 25, max: 32, pts: 30 },
  { label: '33–39', min: 33, max: 39, pts: 25 },
  { label: '40–44', min: 40, max: 44, pts: 15 },
  { label: '45 or over (not eligible)', min: 45, max: 99, pts: 0 },
];

const ENGLISH_OPTIONS = [
  { value: 'superior', label: 'Superior English — IELTS 8 each (PTE 79 each)', pts: 20 },
  { value: 'proficient', label: 'Proficient English — IELTS 7 each (PTE 65 each)', pts: 10 },
  { value: 'competent', label: 'Competent English — IELTS 6 each (PTE 50 each)', pts: 0 },
];

const EDUCATION_OPTIONS = [
  { value: 'phd', label: 'Doctorate (PhD)', pts: 20 },
  { value: 'masters', label: "Master's degree or higher", pts: 15 },
  { value: 'bachelor', label: "Bachelor's degree", pts: 15 },
  { value: 'diploma', label: 'Diploma or trade qualification', pts: 10 },
  { value: 'none', label: 'No recognised award', pts: 0 },
];

const AUS_WORK_OPTIONS = [
  { value: '8', label: '8 or more years in Australia', pts: 20 },
  { value: '5', label: '5–7 years in Australia', pts: 15 },
  { value: '3', label: '3–4 years in Australia', pts: 10 },
  { value: '1', label: '1–2 years in Australia', pts: 5 },
  { value: '0', label: 'Less than 1 year', pts: 0 },
];

const OS_WORK_OPTIONS = [
  { value: '8', label: '8 or more years overseas', pts: 15 },
  { value: '5', label: '5–7 years overseas', pts: 10 },
  { value: '3', label: '3–4 years overseas', pts: 5 },
  { value: '0', label: 'Less than 3 years', pts: 0 },
];

const PARTNER_OPTIONS = [
  { value: 'partner_points', label: 'Partner has competent English + skilled assessment', pts: 10 },
  { value: 'single', label: 'Single / No accompanying partner', pts: 10 },
  { value: 'partner_none', label: 'Accompanying partner — does NOT meet above criteria', pts: 0 },
];

const VALID_ENGLISH = new Set(['superior', 'proficient', 'competent']);
const VALID_EDUCATION = new Set(['phd', 'masters', 'bachelor', 'diploma', 'none']);
const VALID_AUS_WORK = new Set(['8', '5', '3', '1', '0']);
const VALID_OS_WORK = new Set(['8', '5', '3', '0']);
const VALID_PARTNER = new Set(['partner_points', 'single', 'partner_none']);

export default function PRCalculator() {
  const [age, setAge] = useState(28);
  const [english, setEnglish] = useState('proficient');
  const [education, setEducation] = useState('bachelor');
  const [ausWork, setAusWork] = useState('1');
  const [osWork, setOsWork] = useState('3');
  const [partner, setPartner] = useState('single');
  const [ausStudy, setAusStudy] = useState(false);
  const [regionalStudy, setRegionalStudy] = useState(false);
  const [professionalYear, setProfessionalYear] = useState(false);
  const [naati, setNaati] = useState(false);
  const [stemDoctorate, setStemDoctorate] = useState(false);
  const [pointsLoading, setPointsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showToast = useUiStore((s) => s.showToast);

  // ── Load saved points on mount ─────────────────────────────────────────────
  useEffect(() => {
    authFetch('/api/student/points')
      .then((r) => r.json())
      .then((data) => {
        const pd = data?.pointsData;
        if (!pd) {
          setPointsLoading(false);
          return;
        }
        if (typeof pd.age === 'number' && pd.age >= 18 && pd.age <= 50) setAge(pd.age);
        if (pd.english && VALID_ENGLISH.has(pd.english)) setEnglish(pd.english);
        if (pd.education && VALID_EDUCATION.has(pd.education)) setEducation(pd.education);
        if (pd.ausWork != null && VALID_AUS_WORK.has(String(pd.ausWork))) setAusWork(String(pd.ausWork));
        if (pd.osWork != null && VALID_OS_WORK.has(String(pd.osWork))) setOsWork(String(pd.osWork));
        if (pd.partner && VALID_PARTNER.has(pd.partner)) setPartner(pd.partner);
        if (typeof pd.ausStudy === 'boolean') setAusStudy(pd.ausStudy);
        if (typeof pd.regionalStudy === 'boolean') setRegionalStudy(pd.regionalStudy);
        if (typeof pd.professionalYear === 'boolean') setProfessionalYear(pd.professionalYear);
        if (typeof pd.naati === 'boolean') setNaati(pd.naati);
        if (typeof pd.stemDoctorate === 'boolean') setStemDoctorate(pd.stemDoctorate);
        setPointsLoading(false);
      })
      .catch(() => setPointsLoading(false));
  }, []);

  const handleSavePoints = async () => {
    setSaveMessage(null);
    setSaving(true);
    const payload = {
      age,
      english,
      education,
      ausWork,
      osWork,
      partner,
      ausStudy,
      regionalStudy,
      professionalYear,
      naati,
      stemDoctorate,
      totalPoints: total,
    };
    // #region agent log
    fetch('http://127.0.0.1:7746/ingest/ebf2a8b6-d58b-4377-b39c-003055b4ec8c', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '6e5329' }, body: JSON.stringify({ sessionId: '6e5329', location: 'PRCalculator.tsx:handleSavePoints:before', message: 'PATCH save points request', data: { url: '/api/student/points', bodyKeys: Object.keys(payload), total }, timestamp: Date.now(), hypothesisId: 'H1' }) }).catch(() => {});
    // #endregion
    try {
      const res = await authFetch('/api/student/points', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // #region agent log
      const errBody = !res.ok ? await res.clone().json().catch(() => ({})) : null;
      fetch('http://127.0.0.1:7746/ingest/ebf2a8b6-d58b-4377-b39c-003055b4ec8c', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '6e5329' }, body: JSON.stringify({ sessionId: '6e5329', location: 'PRCalculator.tsx:handleSavePoints:after', message: 'PATCH response', data: { status: res.status, ok: res.ok, errBody }, timestamp: Date.now(), hypothesisId: 'H2' }) }).catch(() => {});
      // #endregion
      if (!res.ok) {
        throw new Error((errBody as { error?: string })?.error || 'Failed to save');
      }
      showToast('Points saved.', 'success');
      setSaveMessage({ type: 'success', text: 'Points saved.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save.';
      showToast(msg, 'error');
      setSaveMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  // ── Compute points ─────────────────────────────────────────────────────────
  const agePts = AGE_POINTS.find(a => age >= a.min && age <= a.max)?.pts ?? 0;
  const engPts = ENGLISH_OPTIONS.find(e => e.value === english)?.pts ?? 0;
  const eduPts = EDUCATION_OPTIONS.find(e => e.value === education)?.pts ?? 0;
  const ausPts = AUS_WORK_OPTIONS.find(w => w.value === ausWork)?.pts ?? 0;
  const osPts = OS_WORK_OPTIONS.find(w => w.value === osWork)?.pts ?? 0;
  const ptnPts = PARTNER_OPTIONS.find(p => p.value === partner)?.pts ?? 0;
  const studyPts = ausStudy ? 5 : 0;
  const regionalPts = regionalStudy ? 5 : 0;
  const pyPts = professionalYear ? 5 : 0;
  const naatiPts = naati ? 5 : 0;
  const stemPts = stemDoctorate ? 5 : 0;

  const total = agePts + engPts + eduPts + ausPts + osPts + ptnPts + studyPts + regionalPts + pyPts + naatiPts + stemPts;

  const getStatus = () => {
    if (total >= 90) return { label: 'Excellent', color: '#10B981', bg: '#ECFDF5', bar: '#10B981', msg: 'Very competitive for most occupations and visa types.' };
    if (total >= 80) return { label: 'Competitive', color: '#6366F1', bg: '#EEF2FF', bar: '#6366F1', msg: 'Above average. Likely to receive invitations for most popular occupations.' };
    if (total >= 65) return { label: 'Eligible', color: '#F59E0B', bg: '#FEF3C7', bar: '#F59E0B', msg: 'You meet the minimum threshold. Consider additional points to compete.' };
    return { label: 'Below Threshold', color: '#EF4444', bg: '#FEF2F2', bar: '#EF4444', msg: 'You need at least 65 points to submit an EOI. Work on boosting your score.' };
  };

  const status = getStatus();

  if (pointsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading saved points...</p>
      </div>
    );
  }

  const breakdown = [
    { label: 'Age', value: agePts, max: 30, detail: `Age ${age}` },
    { label: 'English Language', value: engPts, max: 20, detail: ENGLISH_OPTIONS.find(e=>e.value===english)?.label.split('—')[0].trim()??'' },
    { label: 'Education', value: eduPts, max: 20, detail: EDUCATION_OPTIONS.find(e=>e.value===education)?.label??'' },
    { label: 'Australian Work Exp.', value: ausPts, max: 20, detail: AUS_WORK_OPTIONS.find(w=>w.value===ausWork)?.label??'' },
    { label: 'Overseas Work Exp.', value: osPts, max: 15, detail: OS_WORK_OPTIONS.find(w=>w.value===osWork)?.label??'' },
    { label: 'Partner', value: ptnPts, max: 10, detail: PARTNER_OPTIONS.find(p=>p.value===partner)?.label??'' },
    { label: 'Australian Study (2yr)', value: studyPts, max: 5, detail: ausStudy ? 'Qualifying study +5' : 'Not claimed' },
    { label: 'Regional Study', value: regionalPts, max: 5, detail: regionalStudy ? 'Regional/low metro +5' : 'Not claimed' },
    { label: 'Professional Year', value: pyPts, max: 5, detail: professionalYear ? 'Claimed +5' : 'Not claimed' },
    { label: 'NAATI CCL', value: naatiPts, max: 5, detail: naati ? 'Certified +5' : 'Not claimed' },
    { label: 'STEM Doctorate', value: stemPts, max: 5, detail: stemDoctorate ? 'Claimed +5' : 'Not claimed' },
  ];

  const Sel = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string; pts: number }[] }) => (
    <div className="space-y-2">
      {options.map(o => (
        <label key={o.value} className="flex items-center justify-between gap-4 p-3 rounded-xl cursor-pointer transition-all" style={{ background: value === o.value ? '#EEF2FF' : '#F8FAFC', border: `1.5px solid ${value === o.value ? '#C7D2FE' : '#E2E8F0'}` }}>
          <div className="flex items-center gap-3">
            {value === o.value ? <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> : <Circle className="w-4 h-4 text-slate-300 shrink-0" />}
            <input type="radio" value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            <span className={`text-sm font-semibold ${value === o.value ? 'text-indigo-800' : 'text-slate-600'}`}>{o.label}</span>
          </div>
          <span className={`text-sm font-black shrink-0 ${o.pts > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>+{o.pts}</span>
        </label>
      ))}
    </div>
  );

  const BoolCard = ({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-start justify-between gap-4 p-4 rounded-lg cursor-pointer transition-all" style={{ background: checked ? '#EEF2FF' : '#F8FAFC', border: `1.5px solid ${checked ? '#C7D2FE' : '#E2E8F0'}` }}>
      <div className="flex items-start gap-3">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only" />
        {checked ? <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" /> : <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />}
        <div>
          <p className={`text-sm font-bold ${checked ? 'text-indigo-800' : 'text-slate-700'}`}>{label}</p>
          <p className="text-xs text-slate-400 font-medium mt-0.5">{desc}</p>
        </div>
      </div>
      <span className="text-sm font-black text-emerald-600 shrink-0">+5</span>
    </label>
  );

  return (
    <div className="w-full animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Calculator className="w-10 h-10 text-indigo-600 shrink-0" aria-hidden /> PR Points Calculator
        </h1>
        <p className="text-slate-500 font-medium mt-2">Based on the official Australian Skilled Migration Points Test. Updated for 2025–2026.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* ── Left: Inputs ── */}
        <div className="space-y-6">

          {/* Age */}
          <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #E8EDFB' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900">1. Age</h3>
              <span className="font-black text-emerald-600 text-lg">+{agePts} pts</span>
            </div>
            <div className="flex items-center gap-4">
              <input type="range" min={18} max={50} value={age} onChange={e => setAge(Number(e.target.value))} className="flex-1" style={{ accentColor: '#6366F1' }} />
              <div className="w-16 h-14 rounded-lg flex items-center justify-center font-black text-2xl text-white" style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)' }}>{age}</div>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-400 mt-2 px-0.5">
              <span>18</span><span>25</span><span>33</span><span>40</span><span>45+</span>
            </div>
          </div>

          {/* English */}
          <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #E8EDFB' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900">2. English Language</h3>
              <span className="font-black text-emerald-600 text-lg">+{engPts} pts</span>
            </div>
            <Sel value={english} onChange={setEnglish} options={ENGLISH_OPTIONS} />
          </div>

          {/* Education */}
          <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #E8EDFB' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900">3. Education</h3>
              <span className="font-black text-emerald-600 text-lg">+{eduPts} pts</span>
            </div>
            <Sel value={education} onChange={setEducation} options={EDUCATION_OPTIONS} />
          </div>

          {/* Australian work */}
          <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #E8EDFB' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900">4. Australian Work Experience</h3>
              <span className="font-black text-emerald-600 text-lg">+{ausPts} pts</span>
            </div>
            <p className="text-xs text-slate-400 font-medium mb-3">Skilled occupation work in Australia in the 10 years before invitation</p>
            <Sel value={ausWork} onChange={setAusWork} options={AUS_WORK_OPTIONS} />
          </div>

          {/* Overseas work */}
          <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #E8EDFB' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900">5. Overseas Work Experience</h3>
              <span className="font-black text-emerald-600 text-lg">+{osPts} pts</span>
            </div>
            <p className="text-xs text-slate-400 font-medium mb-3">Skilled occupation work outside Australia in the 10 years before invitation</p>
            <Sel value={osWork} onChange={setOsWork} options={OS_WORK_OPTIONS} />
          </div>

          {/* Partner */}
          <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #E8EDFB' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900">6. Partner Status</h3>
              <span className="font-black text-emerald-600 text-lg">+{ptnPts} pts</span>
            </div>
            <Sel value={partner} onChange={setPartner} options={PARTNER_OPTIONS} />
          </div>

          {/* Bonus factors */}
          <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #E8EDFB' }}>
            <h3 className="font-black text-slate-900 mb-5">7. Bonus Points (each worth +5)</h3>
            <div className="space-y-3">
              <BoolCard label="Australian Study Requirement" desc="Completed at least 1 academic year of study in Australia" checked={ausStudy} onChange={setAusStudy} />
              <BoolCard label="Regional/Low Metro Study" desc="Studied in a regional or low population growth metropolitan area" checked={regionalStudy} onChange={setRegionalStudy} />
              <BoolCard label="Professional Year Programme" desc="Completed an approved professional year in Australia" checked={professionalYear} onChange={setProfessionalYear} />
              <BoolCard label="NAATI CCL Accreditation" desc="Credentialled Community Language interpreter/translator qualification" checked={naati} onChange={setNaati} />
              <BoolCard label="STEM Doctorate" desc="Australian study requirement in a STEM field" checked={stemDoctorate} onChange={setStemDoctorate} />
            </div>
          </div>
        </div>

        {/* ── Right: Result ── */}
        <div className="space-y-6 lg:sticky lg:top-8 self-start">
          {/* Score display */}
          <div className="rounded-xl p-8 text-center" style={{ background: status.bg, border: `2px solid ${status.color}40` }}>
            <p className="text-sm font-black uppercase tracking-widest mb-3" style={{ color: status.color }}>Your Score</p>
            <div className="relative inline-block">
              <div className="text-8xl font-black leading-none" style={{ color: status.color }}>{total}</div>
              <div className="text-2xl font-bold text-slate-400 mt-1">/ 145 points</div>
            </div>
            <div className="h-3 rounded-full overflow-hidden bg-white/50 mt-6 mb-4">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((total / 145) * 100, 100)}%`, background: status.bar }} />
            </div>
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-black text-white" style={{ background: status.color }}>{status.label}</span>
            <p className="text-sm font-medium mt-3" style={{ color: status.color }}>{status.msg}</p>

            <div className="mt-6 p-4 rounded-lg bg-white/60 text-left">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">EOI Thresholds (May 2025)</p>
              {[
                { label: 'Min for EOI submission', pts: 65, color: 'text-blue-500' },
                { label: 'Typical invitation (IT occupations)', pts: '80–90+', color: 'text-amber-400' },
                { label: 'Highly competitive', pts: '90+', color: 'text-emerald-500' },
              ].map(t => (
                <div key={t.label} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                    <Circle className={`w-3 h-3 shrink-0 fill-current ${t.color}`} aria-hidden />
                    {t.label}
                  </span>
                  <span className="text-xs font-black text-slate-800">{t.pts} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Save my points */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSavePoints}
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-white transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)' }}
            >
              <Save className="w-4 h-4" aria-hidden />
              {saving ? 'Saving…' : 'Save my points'}
            </button>
            {saveMessage && (
              <p className={`text-sm font-semibold text-center ${saveMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                {saveMessage.text}
              </p>
            )}
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-xl p-6" style={{ border: '1px solid #E8EDFB' }}>
            <h3 className="font-black text-slate-900 mb-4">Points Breakdown</h3>
            <div className="space-y-3">
              {breakdown.map(row => (
                <div key={row.label}>
                  <div className="flex justify-between items-center text-xs mb-1 font-semibold">
                    <span className="text-slate-600">{row.label}</span>
                    <span className={row.value > 0 ? 'text-emerald-600 font-black' : 'text-slate-300'}>+{row.value}/{row.max}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(row.value / row.max) * 100}%`, background: row.value > 0 ? 'linear-gradient(90deg, #6366F1, #10B981)' : '#E2E8F0' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official link */}
          <a href="https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-tested" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-4 rounded-lg font-bold text-sm text-indigo-600 transition-colors hover:bg-indigo-50" style={{ border: '1.5px solid #C7D2FE' }}>
            <ExternalLink className="w-4 h-4" /> Verify on official IMMI website
          </a>
        </div>
      </div>
    </div>
  );
}
