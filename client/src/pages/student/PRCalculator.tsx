import { useState, useEffect } from 'react';
import { authFetch } from '../../store/auth';

export default function PRCalculator() {
  const [age, setAge] = useState(28);
  const [englishScore, setEnglishScore] = useState('IELTS_7');
  const [educationLevel, setEducationLevel] = useState('bachelor');
  const [workExperienceAus, setWorkExperienceAus] = useState(3);
  const [australianStudy, setAustralianStudy] = useState(true);
  const [result, setResult] = useState<{ total?: number; breakdown?: any; disclaimer?: string } | null>(null);

  useEffect(() => {
    (async () => {
      const res = await authFetch('/api/rules/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age, englishScore, educationLevel, workExperienceAus, australianStudy }),
      });
      const data = await res.json();
      setResult(data);
    })();
  }, [age, englishScore, educationLevel, workExperienceAus, australianStudy]);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900">PR Points Calculator</h1>
      <p className="text-slate-500 mt-1">Skilled migration points (2025/2026 rules)</p>
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
            <input type="number" value={age} onChange={e => setAge(Number(e.target.value))} min={18} max={50} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">English</label>
            <select value={englishScore} onChange={e => setEnglishScore(e.target.value)} className="input">
              <option value="IELTS_8">IELTS 8+ (20 pts)</option>
              <option value="IELTS_7">IELTS 7 (10 pts)</option>
              <option value="IELTS_6">IELTS 6 (0 pts)</option>
              <option value="PTE_79">PTE 79+ (20 pts)</option>
              <option value="PTE_65">PTE 65 (10 pts)</option>
              <option value="PTE_50">PTE 50 (0 pts)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Education</label>
            <select value={educationLevel} onChange={e => setEducationLevel(e.target.value)} className="input">
              <option value="bachelor">Bachelor (15 pts)</option>
              <option value="masters">Masters (15 pts)</option>
              <option value="phd">PhD (20 pts)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Aus Work Experience (years)</label>
            <input type="number" value={workExperienceAus} onChange={e => setWorkExperienceAus(Number(e.target.value))} min={0} max={10} className="input" />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={australianStudy} onChange={e => setAustralianStudy(e.target.checked)} />
              <span>Australian Study (5 pts)</span>
            </label>
          </div>
        </div>
        <div className="card">
          <h2 className="font-display font-semibold text-slate-900 mb-4">Result</h2>
          {result && (
            <>
              <p className="text-4xl font-bold text-ori-600">{result.total} points</p>
              <p className="text-slate-500 text-sm mt-4">Minimum EOI threshold: 65 points</p>
              {result.breakdown && (
                <div className="mt-4 space-y-2 text-sm">
                  {Object.entries(result.breakdown).map(([k, v]: [string, any]) => (
                    <div key={k} className="flex justify-between"><span className="text-slate-500 capitalize">{k}</span><span>{v} pts</span></div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400 mt-4">{result.disclaimer}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
