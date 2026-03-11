import { useState } from 'react';
import { CheckCircle2, Circle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

// ── All stages with rich checklist content ─────────────────────────────────
const JOURNEY_STAGES = [
  {
    id: 'planning',
    emoji: '🗺️',
    label: 'Planning & Research',
    color: '#6366F1',
    bg: '#EEF2FF',
    border: '#C7D2FE',
    timeline: '1–3 months',
    description: 'You\'re in the research phase. Understanding which visa path is right for you is the most important step — getting this wrong wastes years.',
    todo: [
      { id: 'p1', label: 'Decide your visa goal (Study → 185/190/491, direct 482, partner, etc.)', important: true },
      { id: 'p2', label: 'Research your target ANZSCO occupation code on the MLTSSL or STSOL', important: true },
      { id: 'p3', label: 'Calculate your potential PR points using the PR Calculator', important: true },
      { id: 'p4', label: 'Check current SkillSelect invitation rounds for your occupation', important: false },
      { id: 'p5', label: 'Research IELTS/PTE requirements and book a preparation course', important: false },
      { id: 'p6', label: 'Estimate total costs: tuition, living, OSHC, visa fees', important: false },
      { id: 'p7', label: 'If studying, shortlist CRICOS-registered institutions', important: false },
    ],
    tip: 'Choosing the right occupation code is critical. Some codes have very high SkillSelect thresholds — you might get faster results with a related code.'
  },
  {
    id: 'prepare',
    emoji: '📋',
    label: 'Preparing to Apply',
    color: '#0EA5E9',
    bg: '#F0F9FF',
    border: '#BAE6FD',
    timeline: '3–12 months',
    description: 'Getting your documents, English test, and finances in order. This is where most students underestimate time and effort.',
    todo: [
      { id: 'pr1', label: 'Sit and pass IELTS Academic / PTE Academic (target 7.0+ for skilled migration)', important: true },
      { id: 'pr2', label: 'Gather financial documents: bank statements (minimum AUD $21,041/year)', important: true },
      { id: 'pr3', label: 'Obtain Confirmation of Enrolment (CoE) from your chosen Australian institution', important: true },
      { id: 'pr4', label: 'Arrange Overseas Student Health Cover (OSHC)', important: true },
      { id: 'pr5', label: 'Prepare your Genuine Student (GS) statement — this is critical for 500 visa', important: true },
      { id: 'pr6', label: 'Get police clearances from your home country (for countries lived in 12+ months)', important: false },
      { id: 'pr7', label: 'Upload all documents to Document Vault and track checklist', important: false },
      { id: 'pr8', label: 'If applying DIY: create an ImmiAccount on Home Affairs website', important: false },
    ],
    tip: 'Your GS statement for the Student Visa must demonstrate: why you want to study in Australia, how it relates to your career, and why you\'ll return home (offshore students). A weak GS statement is the #1 reason student visa refusals.'
  },
  {
    id: 'studying',
    emoji: '🎓',
    label: 'Studying in Australia',
    color: '#F59E0B',
    bg: '#FEF3C7',
    border: '#FDE68A',
    timeline: '1–4 years',
    description: 'You\'re in Australia on your Student Visa (subclass 500). Your priority: pass your course, respect visa conditions, and start planning your next visa.',
    todo: [
      { id: 'st1', label: '⚠️ CRITICAL: Stay within the 48-hours/fortnight work limit during semester', important: true },
      { id: 'st2', label: 'Maintain satisfactory academic progress in all units', important: true },
      { id: 'st3', label: 'Keep your address updated in ImmiAccount within 14 days of moving', important: true },
      { id: 'st4', label: 'Start researching your skills assessing body early (ACS, EA, VETASSESS)', important: true },
      { id: 'st5', label: 'Get a Tax File Number (TFN) from the ATO', important: false },
      { id: 'st6', label: 'Open an Australian bank account', important: false },
      { id: 'st7', label: 'Find casual part-time work in your field to build Australian experience', important: false },
      { id: 'st8', label: 'Begin your skills assessment application in your final year of study', important: true },
    ],
    tip: 'The 485 visa must be applied for within 6 months of your course completion. Many students miss this window — set a reminder.'
  },
  {
    id: 'graduate',
    emoji: '🧑‍🎓',
    label: 'Graduate Visa (485)',
    color: '#10B981',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    timeline: '2–4 years',
    description: 'You\'ve graduated and are on the 485 Graduate Visa. Full work rights. This is your prime window to build Australian work experience and secure PR.',
    todo: [
      { id: 'g1', label: 'Apply for Graduate Visa 485 (within 6 months of results)', important: true },
      { id: 'g2', label: 'Complete your skills assessment application and obtain a positive outcome', important: true },
      { id: 'g3', label: 'Secure full-time employment in your nominated ANZSCO occupation', important: true },
      { id: 'g4', label: 'Lodge Expression of Interest (EOI) via SkillSelect', important: true },
      { id: 'g5', label: 'Consider Professional Year Programme (+5 PR points) if eligible', important: false },
      { id: 'g6', label: 'If married/de facto: check if partner can claim 10 points', important: false },
      { id: 'g7', label: 'Consider state nomination (190/491) if your points are borderline', important: false },
      { id: 'g8', label: 'Meet with a registered migration agent (MARN) for personalised strategy', important: false },
    ],
    tip: 'Australian work experience in your occupation is worth up to +20 PR points. Work in the right ANZSCO code during your 485 period — document every payslip.'
  },
  {
    id: 'skilled',
    emoji: '💼',
    label: 'Skilled Migration',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    timeline: '6–18 months',
    description: 'You\'ve received an invitation to apply for a skilled visa (189/190/491). Now the real paperwork begins.',
    todo: [
      { id: 'sk1', label: 'Respond to Invitation to Apply (ITA) within 60 days', important: true },
      { id: 'sk2', label: 'Book health examination (HAP ID from IMMI) with a panel physician', important: true },
      { id: 'sk3', label: 'Obtain Australian Federal Police (AFP) National Police Check', important: true },
      { id: 'sk4', label: 'Obtain home country police clearance (within 12 months)', important: true },
      { id: 'sk5', label: 'Gather all employment references (signed letters with ABN)', important: true },
      { id: 'sk6', label: 'Provide certified academic transcripts for all qualifications', important: true },
      { id: 'sk7', label: 'Lodge complete visa application in ImmiAccount', important: true },
      { id: 'sk8', label: 'Consider engaging a MARN agent for the lodgement', important: false },
    ],
    tip: 'Do not underestimate the health check process. In some countries, getting panel physician appointments can take weeks. Book immediately after receiving your ITA.'
  },
  {
    id: 'pr',
    emoji: '🇦🇺',
    label: 'Permanent Resident',
    color: '#F43F5E',
    bg: '#FFF1F2',
    border: '#FECDD3',
    timeline: 'Ongoing',
    description: 'Congratulations! You\'re a Permanent Resident of Australia. Here\'s what to do next.',
    todo: [
      { id: 'pr1f', label: 'Receive your PR e-visa record in ImmiAccount', important: true },
      { id: 'pr2f', label: 'Enrol in Medicare (Australia\'s public health system)', important: true },
      { id: 'pr3f', label: 'Enrol your children in school', important: false },
      { id: 'pr4f', label: 'Note that you must live/work in the nominating state for 2 years (if 190/491)', important: false },
      { id: 'pr5f', label: 'Check your 5-year PR travel facility and renewal dates', important: false },
      { id: 'pr6f', label: 'Confirm your eligibility to apply for citizenship (after 4 years, 1 year as PR)', important: false },
    ],
    tip: 'Your PR visa grants you the right to live and work permanently in Australia. After 4 years of permanent residence (with at least 1 year as a PR), you can apply for Australian citizenship.'
  },
];

export default function Journey() {
  const [currentStage, setCurrentStage] = useState<string>(() => localStorage.getItem('student_journey_stage') || 'planning');
  const [completedItems, setCompletedItems] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('journey_items') || '[]')); } catch { return new Set(); }
  });
  const [expandedStage, setExpandedStage] = useState<string | null>(currentStage);

  const toggleItem = (id: string) => {
    setCompletedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('journey_items', JSON.stringify([...next]));
      return next;
    });
  };

  const setStage = (id: string) => {
    setCurrentStage(id);
    localStorage.setItem('student_journey_stage', id);
    setExpandedStage(id);
  };

  const stageIndex = JOURNEY_STAGES.findIndex(s => s.id === currentStage);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">🗺️ My Journey to PR</h1>
        <p className="text-slate-500 font-medium mt-2">Self-managed roadmap. Track your progress at each stage of your Australian migration journey.</p>
      </div>

      {/* Overall progress */}
      <div className="rounded-3xl p-6 md:p-8" style={{ background: 'linear-gradient(135deg, #0F0E2E, #1a1560)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-1">Current Stage</p>
            <p className="text-3xl font-black text-white">{JOURNEY_STAGES.find(s => s.id === currentStage)?.emoji} {JOURNEY_STAGES.find(s => s.id === currentStage)?.label}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-black text-white">{stageIndex + 1}<span className="text-slate-400 text-xl"> / {JOURNEY_STAGES.length}</span></p>
            <p className="text-xs text-slate-400 font-medium mt-1">Stages Complete</p>
          </div>
        </div>
        {/* Progress track */}
        <div className="mt-6 flex items-center gap-2">
          {JOURNEY_STAGES.map((s, i) => (
            <button key={s.id} onClick={() => setStage(s.id)} className="flex-1 h-2.5 rounded-full transition-all duration-300" style={{ background: i <= stageIndex ? 'linear-gradient(90deg, #6366F1, #10B981)' : 'rgba(255,255,255,0.1)' }} title={s.label} />
          ))}
        </div>
      </div>

      {/* Stage cards */}
      <div className="space-y-4">
        {JOURNEY_STAGES.map((stage, idx) => {
          const isActive = currentStage === stage.id;
          const isPast = idx < stageIndex;
          const stageCompleted = stage.todo.filter(t => completedItems.has(t.id)).length;
          const isExpanded = expandedStage === stage.id;

          return (
            <div key={stage.id} className="rounded-3xl overflow-hidden transition-all duration-300" style={{ border: `2px solid ${isActive ? stage.color + '60' : isPast ? '#E2E8F0' : '#E8EDFB'}`, opacity: !isActive && !isPast && idx > stageIndex + 1 ? 0.6 : 1 }}>
              {/* Stage header */}
              <div
                className="p-5 cursor-pointer flex items-center gap-4"
                style={{ background: isActive ? stage.bg : 'white' }}
                onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
              >
                {/* Status icon */}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: isActive ? stage.color + '20' : isPast ? '#F0FDF4' : '#F8FAFC', border: `2px solid ${isActive ? stage.color + '40' : isPast ? '#BBF7D0' : '#E2E8F0'}` }}>
                  {isPast ? '✅' : stage.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isActive && <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ background: stage.color }}>Current Stage</span>}
                    {isPast && <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Completed</span>}
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {stage.timeline}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">{stage.label}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${stage.todo.length > 0 ? (stageCompleted / stage.todo.length) * 100 : 0}%`, background: stage.color }} />
                    </div>
                    <span className="text-xs font-bold text-slate-400">{stageCompleted}/{stage.todo.length}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {!isActive && (
                    <button onClick={(e) => { e.stopPropagation(); setStage(stage.id); }} className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all" style={{ background: stage.bg, color: stage.color, border: `1px solid ${stage.border}` }}>
                      Set as Current
                    </button>
                  )}
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
              </div>

              {/* Stage detail */}
              {isExpanded && (
                <div className="px-5 pb-6 pt-4 border-t space-y-5" style={{ borderColor: stage.border, background: 'white' }}>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">{stage.description}</p>

                  <div className="space-y-2">
                    {stage.todo.map(item => (
                      <label key={item.id} className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all hover:bg-slate-50">
                        <input type="checkbox" checked={completedItems.has(item.id)} onChange={() => toggleItem(item.id)} className="sr-only" />
                        <div className="shrink-0">
                          {completedItems.has(item.id) ? (
                            <CheckCircle2 className="w-5 h-5" style={{ color: stage.color }} />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                        <span className={`text-sm font-semibold ${completedItems.has(item.id) ? 'text-slate-400 line-through' : item.important ? 'text-slate-800' : 'text-slate-600'}`}>
                          {item.important && !completedItems.has(item.id) && <span className="text-amber-500 mr-1">★</span>}
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl text-sm font-medium" style={{ background: stage.bg, border: `1px solid ${stage.border}`, color: stage.color }}>
                    💡 <strong>Agent Tip:</strong> {stage.tip}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
