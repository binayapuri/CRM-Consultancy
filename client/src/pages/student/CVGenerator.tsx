import { useState, useEffect, useRef } from 'react';
import { authFetch } from '../../store/auth';
import { useNavigate } from 'react-router-dom';
import { Printer, CheckCircle2 } from 'lucide-react';



const TEMPLATES = [
  { id: 'modern', label: 'Modern', accent: '#6366F1' },
  { id: 'professional', label: 'Professional', accent: '#0EA5E9' },
  { id: 'academic', label: 'Academic', accent: '#10B981' },
];

export default function CVGenerator() {
  const [cvData, setCvData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState('modern');
  const [sections, setSections] = useState({
    workRights: true,
    english: true,
    skills: true,
    address: false,
    nationality: true,
  });
  const printRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    authFetch('/api/student/cv')
      .then(r => r.json())
      .then(d => { setCvData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const accent = TEMPLATES.find(t => t.id === template)?.accent || '#6366F1';

  const handlePrint = () => {
    if (!printRef.current) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html><html><head>
      <title>${cvData?.name || 'CV'} - Resume</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Segoe UI',Arial,sans-serif;font-size:10pt;color:#1e293b;line-height:1.4;}
        .cv-wrap{max-width:800px;margin:0 auto;padding:32px;}
        h1{font-size:22pt;font-weight:900;margin-bottom:4px;}
        h2{font-size:11pt;font-weight:700;color:${accent};border-bottom:1.5px solid ${accent};padding-bottom:4px;margin:18px 0 10px;}
        h3{font-size:10.5pt;font-weight:700;margin-bottom:2px;}
        .meta{font-size:9pt;color:#64748b;margin-bottom:12px;}
        .badge{display:inline-block;background:${accent}20;color:${accent};border-radius:4px;padding:2px 8px;font-size:8pt;font-weight:700;margin-top:4px;}
        .entry{margin-bottom:12px;}
        .entry-header{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;}
        .date{font-size:8.5pt;color:#94a3b8;white-space:nowrap;}
        p{font-size:9.5pt;color:#475569;margin-top:2px;}
        ul{padding-left:16px;margin-top:4px;}
        li{font-size:9.5pt;color:#475569;margin-bottom:2px;}
        .score-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:6px;}
        .score-item{background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:4px;text-align:center;}
        .score-label{font-size:7.5pt;color:#94a3b8;font-weight:600;}
        .score-val{font-size:10pt;font-weight:900;color:#1e293b;}
        @media print{body{font-size:9.5pt;}}
      </style></head><body>
      <div class="cv-wrap">${printRef.current.innerHTML}</div>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  };

  if (loading) return (
    <div className="text-center py-20">
      <div className="text-4xl mb-4 animate-pulse">📄</div>
      <p className="text-slate-500 font-medium">Building your CV from profile data...</p>
    </div>
  );

  if (!cvData?.name) return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <div className="text-6xl mb-6">📋</div>
      <h2 className="text-2xl font-black text-slate-900 mb-3">Complete Your Profile First</h2>
      <p className="text-slate-500 font-medium mb-6">Your CV is automatically generated from your profile data. Add your education, work history, and immigration details in your profile.</p>
      <button onClick={() => navigate('/student/profile')} className="px-6 py-3 rounded-2xl font-black text-white" style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)' }}>
        Complete My Profile →
      </button>
    </div>
  );

  const CVContent = () => (
    <div style={{ fontFamily: 'Segoe UI, Arial, sans-serif', color: '#1e293b', lineHeight: 1.5 }}>
      {/* Header */}
      <div style={{ borderBottom: `3px solid ${accent}`, paddingBottom: 16, marginBottom: 16 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>{cvData.name}</h1>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {cvData.email && <span>✉ {cvData.email}</span>}
          {cvData.phone && <span>📞 {cvData.phone}</span>}
          {sections.address && cvData.location && <span>📍 {cvData.location}</span>}
          {sections.nationality && cvData.nationality && <span>🌏 {cvData.nationality}</span>}
        </div>
        {sections.workRights && cvData.workRights && (
          <div style={{ marginTop: 6, display: 'inline-block', background: `${accent}15`, color: accent, borderRadius: 4, padding: '2px 10px', fontSize: 10, fontWeight: 700 }}>
            🆔 Work Rights: {cvData.workRights}
          </div>
        )}
        {cvData.anzscoCode && (
          <div style={{ marginTop: 4, display: 'inline-block', background: '#f0fdf4', color: '#16a34a', borderRadius: 4, padding: '2px 10px', fontSize: 10, fontWeight: 700, marginLeft: 8 }}>
            ANZSCO: {cvData.anzscoCode}
          </div>
        )}
      </div>

      {/* English */}
      {sections.english && cvData.english && (
        <>
          <h2 style={{ fontSize: 12, fontWeight: 700, color: accent, borderBottom: `1.5px solid ${accent}30`, paddingBottom: 4, marginBottom: 10 }}>ENGLISH LANGUAGE PROFICIENCY</h2>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>{cvData.english.testType} — Overall: {cvData.english.overall}</span>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>{cvData.english.testDate}{cvData.english.expiryDate ? ` · Expires ${cvData.english.expiryDate}` : ''}</span>
            </div>
            {(cvData.english.listening || cvData.english.reading || cvData.english.writing || cvData.english.speaking) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 8 }}>
                {[['Listening', cvData.english.listening], ['Reading', cvData.english.reading], ['Writing', cvData.english.writing], ['Speaking', cvData.english.speaking]].map(([l, v]) => (
                  v ? <div key={l} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: 6, textAlign: 'center' }}>
                    <div style={{ fontSize: 8, color: '#94a3b8', fontWeight: 600 }}>{l}</div>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>{v}</div>
                  </div> : null
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Skills assessment */}
      {sections.skills && cvData.skillsAssessment && (
        <>
          <h2 style={{ fontSize: 12, fontWeight: 700, color: accent, borderBottom: `1.5px solid ${accent}30`, paddingBottom: 4, marginBottom: 10 }}>SKILLS ASSESSMENT</h2>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontWeight: 700 }}>{cvData.skillsAssessment.body}</span>
            {cvData.skillsAssessment.outcome && <span style={{ marginLeft: 8, background: '#f0fdf4', color: '#16a34a', borderRadius: 4, padding: '1px 8px', fontSize: 9, fontWeight: 700 }}>{cvData.skillsAssessment.outcome}</span>}
            {cvData.skillsAssessment.referenceNumber && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Reference: {cvData.skillsAssessment.referenceNumber}</div>}
          </div>
        </>
      )}

      {/* Education */}
      {cvData.education?.length > 0 && (
        <>
          <h2 style={{ fontSize: 12, fontWeight: 700, color: accent, borderBottom: `1.5px solid ${accent}30`, paddingBottom: 4, marginBottom: 10 }}>EDUCATION</h2>
          {cvData.education.map((edu: any, i: number) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{edu.qualification}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ''}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{edu.institution}{edu.country ? `, ${edu.country}` : ''}{edu.cricos ? ` (CRICOS: ${edu.cricos})` : ''}</div>
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{edu.startDate} — {edu.endDate}</div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Experience */}
      {cvData.experience?.length > 0 && (
        <>
          <h2 style={{ fontSize: 12, fontWeight: 700, color: accent, borderBottom: `1.5px solid ${accent}30`, paddingBottom: 4, marginBottom: 10 }}>WORK EXPERIENCE</h2>
          {cvData.experience.map((exp: any, i: number) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{exp.role}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{exp.employer}{exp.country ? `, ${exp.country}` : ''}{exp.hoursPerWeek ? ` · ${exp.hoursPerWeek}hrs/week` : ''}</div>
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{exp.startDate} — {exp.endDate}</div>
              </div>
              {exp.description && <p style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{exp.description}</p>}
            </div>
          ))}
        </>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up">
      <div className="mb-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">📄 CV Generator</h1>
        <p className="text-slate-500 font-medium mt-2">Auto-generated from your profile. Customise and download as PDF.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sidebar controls */}
        <div className="space-y-4">
          {/* Template */}
          <div className="bg-white rounded-3xl p-5" style={{ border: '1px solid #E8EDFB' }}>
            <h3 className="font-black text-slate-800 mb-3">Template</h3>
            <div className="space-y-2">
              {TEMPLATES.map(t => (
                <label key={t.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer" style={{ background: template === t.id ? `${t.accent}15` : '#F8FAFC', border: `1.5px solid ${template === t.id ? t.accent + '40' : '#E2E8F0'}` }}>
                  <input type="radio" name="template" value={t.id} checked={template === t.id} onChange={() => setTemplate(t.id)} className="sr-only" />
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: t.accent }}>
                    {template === t.id && <div className="w-2 h-2 rounded-full" style={{ background: t.accent }} />}
                  </div>
                  <span className="font-bold text-sm text-slate-700">{t.label}</span>
                  <div className="w-5 h-5 rounded-full ml-auto" style={{ background: t.accent }} />
                </label>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="bg-white rounded-3xl p-5" style={{ border: '1px solid #E8EDFB' }}>
            <h3 className="font-black text-slate-800 mb-3">Show Sections</h3>
            <div className="space-y-2">
              {[
                { key: 'workRights', label: 'Visa / Work Rights' },
                { key: 'english', label: 'English Test Scores' },
                { key: 'skills', label: 'Skills Assessment' },
                { key: 'nationality', label: 'Nationality' },
                { key: 'address', label: 'Home Address' },
              ].map(s => (
                <label key={s.key} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={(sections as any)[s.key]} onChange={() => setSections(p => ({ ...p, [s.key]: !(p as any)[s.key] }))} className="sr-only" />
                  {(sections as any)[s.key] ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <div className="w-4 h-4 rounded border-2 border-slate-300" />}
                  <span className="text-sm font-semibold text-slate-700">{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <button onClick={handlePrint} className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #6366F1, #10B981)', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
            <Printer className="w-5 h-5" /> Print / Save as PDF
          </button>
          <p className="text-xs text-slate-400 text-center font-medium">Opens a print dialog. Select "Save as PDF" in your browser to download.</p>

          <button onClick={() => navigate('/student/profile')} className="w-full py-3 rounded-2xl font-bold text-sm text-indigo-600 flex items-center justify-center gap-2" style={{ background: '#EEF2FF', border: '1.5px solid #C7D2FE' }}>
            ✏️ Edit Profile Data
          </button>
        </div>

        {/* CV Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-8 shadow-xl" style={{ border: '1px solid #E8EDFB', minHeight: 500 }}>
            <div ref={printRef}>
              <CVContent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
