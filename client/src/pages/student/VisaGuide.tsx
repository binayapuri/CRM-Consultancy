import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Clock, DollarSign, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

// ── Static IMMI-sourced visa data ──────────────────────────────────────────
const VISAS = [
  {
    code: '500',
    name: 'Student Visa',
    tag: 'Study',
    tagColor: '#3B82F6',
    emoji: '🎓',
    gradient: 'from-blue-500 to-indigo-600',
    overview: 'Allows international students to study a full-time registered course in Australia (CRICOS-registered). This is the primary visa for offshore students wanting to study.',
    fee: 'AUD $710',
    processing: '3–10 weeks (varies significantly)',
    duration: 'For the duration of course + 1 month',
    workRights: 'Up to 48 hours per fortnight during semester. Unlimited during official breaks.',
    englishRequirement: 'IELTS 5.5+ overall (each band 5.0+) or equivalent PTE/TOEFL. Required by most providers.',
    requirements: [
      'Confirmation of Enrolment (CoE) from a CRICOS-registered provider',
      'Genuine Student (GS) assessment — demonstrate you\'re a genuine student',
      'Sufficient financial evidence (tuition fees + living costs ≈ AUD $21,041/year)',
      'Overseas Student Health Cover (OSHC) for the full duration',
      'Health clearance (chest X-ray if from high TB risk country)',
      'Character: clear police clearances for 12+ months in any country',
      'Health insurance for family members if accompanying you',
    ],
    prPathway: 'The 500 visa itself is not a PR pathway, but often a stepping stone → Graduate Visa 485 → Skilled Migration.',
    conditions: [
      '⚠️ Work limit: 48 hours per fortnight during study sessions',
      '⚠️ Must maintain enrolment in a registered course',
      '⚠️ Must maintain satisfactory course progress',
      '✅ You can enrol in a different course (apply for new CoE)',
      '✅ Family members can accompany you',
    ],
    tips: [
      'Apply while offshore for simpler processing in most cases',
      'Your GS statement is critical — be specific about your study goals and intent to return home',
      'OSHC must be arranged BEFORE your visa is granted',
      'Keep all financial documents current — bank statements < 3 months old',
    ],
  },
  {
    code: '485',
    name: 'Temporary Graduate Visa',
    tag: 'Post-Study',
    tagColor: '#10B981',
    emoji: '🧑‍🎓',
    gradient: 'from-emerald-500 to-teal-600',
    overview: 'Allows recent graduates of Australian institutions to live and work in Australia temporarily after completing their studies. This is the most important stepping stone toward skilled migration and PR.',
    fee: 'AUD $1,895',
    processing: '3–6 months',
    duration: 'Graduate Work stream: 2 years | Post-Study Work stream: 2–4 years (depending on study level)',
    workRights: 'Full, unlimited work rights in any occupation.',
    englishRequirement: 'IELTS 6.0 overall (each band 5.0+) or equivalent.',
    requirements: [
      'Must have studied for at least 2 years in Australia (16 months for Bachelor\'s, 2 years for Post-Study)',
      'Must apply within 6 months of completing your course',
      'IELTS 6.0 (or equivalent PTE/TOEFL/CAE) for each band',
      'Health clearance',
      'Character clearance (police checks)',
    ],
    prPathway: 'Key pathway to skilled migration. Use the 485 to get Australian work experience (adds up to 15 PR points) and get a skills assessment done while working.',
    conditions: [
      '✅ Full, unlimited work rights in any job',
      '✅ Can travel in/out of Australia freely',
      '⚠️ Cannot extend the 485 — you must apply for another visa',
      '✅ Family members can be included',
    ],
    tips: [
      'Apply as soon as you receive your final results — do not wait for graduation ceremony',
      'Use this time to get your skills assessment from the relevant body (ACS, EA, VETASSESS)',
      'Aim to build 1–3 years of Australian work experience in your nominated occupation',
      'Lodge your EOI in SkillSelect during this period',
    ],
  },
  {
    code: '189',
    name: 'Skilled Independent Visa',
    tag: 'PR',
    tagColor: '#F59E0B',
    emoji: '🇦🇺',
    gradient: 'from-amber-500 to-orange-600',
    overview: 'Permanent residency visa for skilled workers whose occupation is on the Medium and Long-Term Strategic Skills List (MLTSSL). No state sponsorship required. Fully points-based through SkillSelect.',
    fee: 'AUD $4,640 (primary applicant)',
    processing: '6–12 months after invitation',
    duration: 'Permanent Residency (5-year PR visa, renewable)',
    workRights: 'Unlimited — any employer, any occupation.',
    englishRequirement: 'Competent English: IELTS 6.0 each band, or PTE 50 each component.',
    requirements: [
      'Occupation on the MLTSSL (Medium and Long-Term Strategic Skills List)',
      'Positive skills assessment from the relevant assessing body',
      'Lodge an EOI through SkillSelect with points ≥ 65',
      'Receive an invitation to apply (ITA)',
      'Age under 45 at time of invitation',
      'Competent English (IELTS 6 each, PTE 50 each)',
    ],
    prPathway: 'This IS permanent residency. You must receive an invitation from SkillSelect.',
    conditions: [
      '✅ Permanent Residency from day one',
      '✅ Unlimited work rights in Australia',
      '✅ Access to Medicare (healthcare)',
      '✅ Sponsor family members for permanent residency',
      '✅ Eligible for citizenship after 4 years (1 year as PR)',
    ],
    tips: [
      'Current cut-off points for popular IT occupations can be 80–90+ — check recent invitation rounds',
      'Maximise points: get a Professional Year (+5 pts), NAATI CCL (+5 pts), get married (+10 pts if partner passes English)',
      'The MLTSSL is updated annually — verify your occupation is listed before investing',
    ],
  },
  {
    code: '190',
    name: 'Skilled Nominated Visa',
    tag: 'PR',
    tagColor: '#F59E0B',
    emoji: '🏙️',
    gradient: 'from-violet-500 to-purple-600',
    overview: 'Permanent residency visa for skilled workers nominated by an Australian state or territory. Requires a specific state nomination — adds 5 points to your score.',
    fee: 'AUD $4,640 (primary applicant)',
    processing: '6–18 months after state nomination',
    duration: 'Permanent Residency',
    workRights: 'Unlimited.',
    englishRequirement: 'Competent English (IELTS 6.0 each band).',
    requirements: [
      'State or territory nomination (5 additional points)',
      'Occupation on the state\'s Skilled Occupation List (each state has its own list)',
      'Skills assessment',
      'Points ≥ 60 (65 minimum + 5 from nomination = 65)',
      'Usually requires a genuine intent to live/work in the nominating state for at least 2 years',
    ],
    prPathway: 'Permanent Residency. You must first be nominated by a state.',
    conditions: [
      '✅ Permanent Residency',
      '⚠️ Must live and work in the nominating state (usually 2 years)',
      '✅ Can later move states after 2-year obligation',
    ],
    tips: [
      'States like Victoria, NSW, and Queensland are popular but competitive',
      'ACT and Tasmania can have lower thresholds — worth checking',
      'Each state has specific nomination requirements — directly check their immigration portals',
    ],
  },
  {
    code: '491',
    name: 'Skilled Work Regional Visa',
    tag: 'Temporary → PR',
    tagColor: '#8B5CF6',
    emoji: '🌿',
    gradient: 'from-green-500 to-emerald-600',
    overview: 'Temporary visa (5 years) for skilled workers going to live and work in regional Australia. Adds 15 points. After 3 years of living and working in a designated regional area, you can apply for PR (subclass 191).',
    fee: 'AUD $4,640',
    processing: '6–14 months',
    duration: '5 years (temporary)',
    workRights: 'Unlimited in regional areas.',
    englishRequirement: 'Competent English.',
    requirements: [
      'State/territory or family nomination for regional area',
      'Points ≥ 50 (60+ recommended)',
      'Skills assessment',
      'Occupation on regional occupation list',
      'Commit to living and working in a designated regional area',
    ],
    prPathway: 'After 3 years of meeting conditions → apply for subclass 191 (Permanent Residence — Regional)',
    conditions: [
      '⚠️ Must live and work in a designated regional area',
      '✅ Adds 15 points to your score — lower bar to entry',
      '✅ Pathway to 191 PR after 3 years',
    ],
    tips: [
      'Great option if your points are 65–79 and 189/190 thresholds are above your score',
      'Regional areas include much of rural NSW, VIC, QLD, SA, WA, NT, TAS',
      'Perth and Gold Coast are NOT classified as regional for this visa',
    ],
  },
  {
    code: '482',
    name: 'Temporary Skill Shortage Visa',
    tag: 'Employer Sponsored',
    tagColor: '#0EA5E9',
    emoji: '🏢',
    gradient: 'from-sky-500 to-blue-600',
    overview: 'Sponsored by an approved Australian employer for occupations on the shortage list. Allows you to work in Australia for 2–4 years. Can lead to PR through the 186 (ENS) visa.',
    fee: 'AUD $3,115 (short stream) / $2,770 (medium stream)',
    processing: '2–6 months',
    duration: 'Short-term stream: 2 years | Medium-term stream: 4 years',
    workRights: 'Limited to your sponsoring employer and nominated occupation.',
    englishRequirement: 'Competent English for most occupations.',
    requirements: [
      'Employer must be an approved sponsor (check their sponsorship status)',
      'Occupation on TSS occupation list',
      'At least 2 years relevant work experience',
      'Labour Market Testing (employer must prove no Australians available)',
      'Skills assessment (some occupations)',
    ],
    prPathway: 'After 3 years in medium-term stream → 186 ENS visa (PR) via Transition stream.',
    conditions: [
      '⚠️ You are tied to your sponsoring employer (must request change)',
      '✅ Family can accompany',
      '⚠️ If employer ceases sponsorship, you have 60 days to find new sponsor or leave',
    ],
    tips: [
      'Always verify the employer is approved BEFORE signing anything',
      'Negotiate wisely — Market Salary Rate rules protect workers from being underpaid',
      'Platform jobs on Seek and LinkedIn often specify "PR/Citizenship only" — look for ones that say "sponsorship available"',
    ],
  },
];

// ── PR Timeline interactive calculator ──────────────────────────────────────
const PATHWAY_TIMELINE: Record<string, { label: string; timeline: string; key: string }[]> = {
  offshore_study: [
    { key: 'ielts',    label: '📝 Prepare & Sit IELTS/PTE',           timeline: '3–6 months' },
    { key: 'coe',      label: '📋 Get CoE from Australian university', timeline: '2–6 weeks' },
    { key: 'visa500',  label: '🛂 Apply for Student Visa (500)',        timeline: '4–10 weeks' },
    { key: 'study',    label: '🎓 Study in Australia (e.g. 2 yr M.Sc)', timeline: '2 years' },
    { key: 'skills',   label: '📊 Get Skills Assessment',              timeline: '3–6 months' },
    { key: 'visa485',  label: '📝 Apply for Graduate Visa (485)',       timeline: '3–6 months' },
    { key: 'work',     label: '💼 Work in your ANZSCO occupation',     timeline: '1–3 years' },
    { key: 'eoi',      label: '🗂️  Lodge EOI in SkillSelect',          timeline: '1 day (wait for invite)' },
    { key: 'invite',   label: '📨 Receive Invitation to Apply',        timeline: 'Varies — often months' },
    { key: 'pr',       label: '🇦🇺 Lodge Skilled Visa (189/190/491)',   timeline: '6–18 months' },
    { key: 'granted',  label: '✅ PR Granted!',                         timeline: 'Done!' },
  ],
};

export default function VisaGuide() {
  const [expandedVisa, setExpandedVisa] = useState<string | null>('500');
  const [activeSection, setActiveSection] = useState<'visas' | 'pathway' | 'conditions'>('visas');

  const toggle = (code: string) => setExpandedVisa(prev => prev === code ? null : code);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">🗺️ Australian Visa Guide</h1>
        <p className="text-slate-500 font-medium mt-2 text-lg">Everything an international student needs to know. Based on current IMMI Home Affairs information.</p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 p-1 rounded-2xl w-fit" style={{ background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
        {([['visas','🛂 Visa Types'],['pathway','🗺️ PR Pathway'],['conditions','⚠️ Visa Conditions']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setActiveSection(id)} className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all" style={activeSection === id ? { background: 'white', color: '#4338CA', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' } : { color: '#6366F1' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Visa Types Section */}
      {activeSection === 'visas' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 font-medium">Click any visa to expand full details, requirements, and expert tips.</p>
          {VISAS.map(visa => (
            <div key={visa.code} className="rounded-3xl overflow-hidden" style={{ border: expandedVisa === visa.code ? '2px solid #C7D2FE' : '2px solid #E2E8F0', background: 'white', boxShadow: expandedVisa === visa.code ? '0 4px 24px rgba(99,102,241,0.1)' : 'none' }}>
              {/* Card header */}
              <button className="w-full text-left p-6 flex items-center gap-5" onClick={() => toggle(visa.code)}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br ${visa.gradient} shadow-lg shrink-0`}>
                  {visa.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ background: visa.tagColor }}>{visa.tag}</span>
                    <span className="font-mono text-sm font-bold text-slate-400">Subclass {visa.code}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">{visa.name}</h3>
                  <p className="text-sm text-slate-500 font-medium mt-0.5 line-clamp-1">{visa.overview.split('.')[0]}.</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-1 text-slate-600 text-sm font-semibold"><DollarSign className="w-4 h-4 text-emerald-500" /> {visa.fee}</div>
                    <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5"><Clock className="w-3.5 h-3.5" /> {visa.processing}</div>
                  </div>
                  {expandedVisa === visa.code ? <ChevronUp className="w-5 h-5 text-indigo-500" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
              </button>

              {/* Expanded detail */}
              {expandedVisa === visa.code && (
                <div className="px-6 pb-8 space-y-6 border-t border-slate-100 pt-6">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                      <p className="text-xs font-black uppercase tracking-wider text-emerald-700 mb-1">Duration</p>
                      <p className="text-sm font-bold text-emerald-900">{visa.duration}</p>
                    </div>
                    <div className="p-4 rounded-2xl" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                      <p className="text-xs font-black uppercase tracking-wider text-blue-700 mb-1">Work Rights</p>
                      <p className="text-sm font-bold text-blue-900">{visa.workRights}</p>
                    </div>
                    <div className="p-4 rounded-2xl" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
                      <p className="text-xs font-black uppercase tracking-wider text-amber-700 mb-1">English Required</p>
                      <p className="text-sm font-bold text-amber-900">{visa.englishRequirement}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-800 mb-3 uppercase tracking-wider">Key Requirements</p>
                    <ul className="space-y-2">
                      {visa.requirements.map((r, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-800 mb-3 uppercase tracking-wider">Visa Conditions</p>
                    <ul className="space-y-1">
                      {visa.conditions.map((c, i) => (
                        <li key={i} className="text-sm text-slate-600 font-medium flex gap-2">{c}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-5 rounded-2xl" style={{ background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
                    <p className="text-sm font-black text-indigo-800 mb-2 uppercase tracking-wider">🛤 PR Pathway</p>
                    <p className="text-sm text-indigo-700 font-medium">{visa.prPathway}</p>
                  </div>

                  <div className="p-5 rounded-2xl" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <p className="text-sm font-black text-slate-700 mb-3 uppercase tracking-wider">💡 Expert Tips</p>
                    <ul className="space-y-2">
                      {visa.tips.map((t, i) => (
                        <li key={i} className="text-sm text-slate-600 font-medium flex gap-2">
                          <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> {t}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a href="https://immi.homeaffairs.gov.au" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                    Official IMMI page for Subclass {visa.code} <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PR Pathway Section */}
      {activeSection === 'pathway' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl" style={{ background: 'linear-gradient(135deg, #0F0E2E, #1a1560)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 className="text-2xl font-black text-white mb-1">🗺️ Offshore Student → Australian PR</h2>
            <p className="text-slate-300 font-medium">The most common pathway for international students from countries like Nepal, India & Philippines</p>
          </div>
          <div className="relative pl-8 border-l-4 border-indigo-100 space-y-0">
            {PATHWAY_TIMELINE.offshore_study.map((step, i) => (
              <div key={step.key} className="relative pb-6">
                <div className="absolute -left-[1.85rem] top-1.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)' }}>{i + 1}</div>
                <div className="ml-4 p-4 rounded-2xl bg-white" style={{ border: '1px solid #E8EDFB' }}>
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-slate-800">{step.label}</p>
                    <span className="text-xs font-bold text-slate-400 ml-4 shrink-0 flex items-center gap-1"><Clock className="w-3 h-3" /> {step.timeline}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-5 rounded-3xl" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-amber-900">Realistic Timeline</p>
                <p className="text-sm text-amber-800 font-medium mt-1">Most students who follow this pathway take <strong>5–9 years</strong> from starting IELTS prep to receiving PR. Proper planning significantly shortens this timeline.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conditions Section */}
      {activeSection === 'conditions' && (
        <div className="space-y-5">
          {[
            { title: '🎓 Student Visa 500 — Work Conditions', content: 'You can work up to 48 hours per fortnight during your study session (semester). There is no limit during official university breaks (mid-year, end of year). If you breach this condition, your visa may be cancelled.' },
            { title: '📋 Genuine Student (GS) Requirement', content: 'You must demonstrate you are a genuine student. IMMI assesses: your ties to home country, financial capacity, your study background, and whether your study plans make sense. A strong GS statement is essential for offshore students.' },
            { title: '📈 Satisfactory Course Progress', content: 'Student visa holders must maintain satisfactory academic progress. If you fail too many units or are excluded, your provider must report you to IMMI, which may trigger a visa cancellation process.' },
            { title: '💼 485 Work Rights — No Limits', content: 'The Graduate Visa (485) grants unlimited work rights. You can work in any job, any number of hours, for any employer. Use this time wisely to build Australian work experience in your nominated occupation.' },
            { title: '🗺️ 491 Regional Obligation', content: 'If you are granted the 491, you must genuinely live and work in a designated regional area. Misrepresenting where you live is fraud and can result in visa cancellation and permanent bar from Australian visas.' },
            { title: '🏷️ Reporting Obligation', content: 'Your visa may have 8107 (work) or 8208 (OSHC) conditions attached. You must not breach these. If your circumstances change (change of address, course, provider), update IMMI via your ImmiAccount.' },
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl" style={{ border: '1px solid #E8EDFB' }}>
              <h3 className="font-black text-slate-900 text-lg mb-2">{item.title}</h3>
              <p className="text-slate-600 font-medium leading-relaxed">{item.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
