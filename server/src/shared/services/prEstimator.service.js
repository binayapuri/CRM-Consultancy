/**
 * Simplified SkillSelect-style point estimate for student dashboard.
 * Not legal advice — aligns with common published criteria; Super Admin can tune weights via PlatformSettings.prEstimator.
 */

const DEFAULTS = {
  disclaimer:
    'This is an indicative estimate only. The Department of Home Affairs uses the full points test in force at invitation; visa criteria change. A registered migration agent should assess your case.',
  age: [
    { min: 18, max: 24, points: 25 },
    { min: 25, max: 32, points: 30 },
    { min: 33, max: 39, points: 25 },
    { min: 40, max: 44, points: 15 },
  ],
  english: { superior: 20, proficient: 10, competent: 0 },
  education: { doctorate: 20, masters: 15, bachelor: 15, diploma: 10, other: 0 },
  ausStudy: 5,
  regionalStudy: 5,
  professionalYear: 5,
  naati: 5,
  partner: 10,
  ausWork: [
    { minYears: 1, maxYears: 2, points: 5 },
    { minYears: 3, maxYears: 4, points: 10 },
    { minYears: 5, maxYears: 7, points: 15 },
    { minYears: 8, maxYears: 99, points: 20 },
  ],
  overseasWork: [
    { minYears: 3, maxYears: 4, points: 5 },
    { minYears: 5, maxYears: 7, points: 10 },
    { minYears: 8, maxYears: 99, points: 15 },
  ],
};

function mergeConfig(platform) {
  const pe = platform?.prEstimator && typeof platform.prEstimator === 'object' ? platform.prEstimator : {};
  return {
    ...DEFAULTS,
    ...pe,
    age: Array.isArray(pe.age) && pe.age.length ? pe.age : DEFAULTS.age,
    ausWork: Array.isArray(pe.ausWork) && pe.ausWork.length ? pe.ausWork : DEFAULTS.ausWork,
    overseasWork: Array.isArray(pe.overseasWork) && pe.overseasWork.length ? pe.overseasWork : DEFAULTS.overseasWork,
    education: { ...DEFAULTS.education, ...(pe.education || {}) },
    english: { ...DEFAULTS.english, ...(pe.english || {}) },
  };
}

function ageFromDob(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 31557600000);
}

function agePoints(age, cfg) {
  if (age == null || age < 18 || age > 44) return { points: 0, label: age == null ? 'Add date of birth' : age < 18 || age > 45 ? 'Outside typical skilled age band' : '—' };
  for (const band of cfg.age) {
    if (age >= band.min && age <= band.max) return { points: band.points, label: `${band.min}–${band.max} years` };
  }
  return { points: 0, label: '—' };
}

/** Map IELTS/PTE-style scores to competent | proficient | superior (simplified). */
function englishBandFromTest(et) {
  if (!et?.testType || et.testType === 'NONE') return null;
  const nums = [et.listening, et.reading, et.writing, et.speaking, et.score]
    .map((x) => parseFloat(String(x).replace(/[^0-9.]/g, '')))
    .filter((n) => !Number.isNaN(n));
  if (!nums.length) return null;
  const minBand = Math.min(...nums);

  if (String(et.testType).startsWith('IELTS') || et.testType === 'OET') {
    if (minBand >= 8) return 'superior';
    if (minBand >= 7) return 'proficient';
    if (minBand >= 6) return 'competent';
    return 'below';
  }
  if (et.testType === 'PTE') {
    if (minBand >= 79) return 'superior';
    if (minBand >= 65) return 'proficient';
    if (minBand >= 50) return 'competent';
    return 'below';
  }
  if (et.testType === 'TOEFL') {
    if (minBand >= 28) return 'superior';
    if (minBand >= 24) return 'proficient';
    if (minBand >= 18) return 'competent';
    return 'below';
  }
  const overall = parseFloat(String(et.score || '').replace(/[^0-9.]/g, ''));
  if (!Number.isNaN(overall) && overall >= 8) return 'superior';
  if (!Number.isNaN(overall) && overall >= 7) return 'proficient';
  if (!Number.isNaN(overall) && overall >= 6) return 'competent';
  return 'competent';
}

function englishPoints(band, cfg) {
  if (!band || band === 'below') return { points: 0, label: 'Add valid test scores' };
  const p = cfg.english[band];
  if (p == null) return { points: 0, label: band };
  return { points: p, label: `${band} English` };
}

function inferEducationLevel(education = []) {
  if (!education.length) return null;
  const q = education.map((e) => `${e.qualification || ''} ${e.fieldOfStudy || ''}`.toLowerCase()).join(' ');
  if (/phd|doctor/.test(q)) return 'doctorate';
  if (/master|mphil/.test(q)) return 'masters';
  if (/bachelor|b\.?tech|b\.?eng/.test(q)) return 'bachelor';
  if (/diploma|advanced diploma|associate/.test(q)) return 'diploma';
  return 'other';
}

function educationPoints(level, cfg) {
  if (!level) return { points: 0, label: 'Add qualifications' };
  const p = cfg.education[level] ?? cfg.education.other ?? 0;
  const labels = { doctorate: 'Doctorate', masters: 'Masters', bachelor: 'Bachelor', diploma: 'Diploma', other: 'Other recognised qualification' };
  return { points: p, label: labels[level] || level };
}

function yearsBetween(start, end, isCurrent) {
  if (!start) return 0;
  const s = new Date(start);
  const e = end ? new Date(end) : isCurrent ? new Date() : null;
  if (!e || Number.isNaN(s.getTime())) return 0;
  const ms = e - s;
  return Math.max(0, ms / 31557600000);
}

function sumWorkYears(experience = [], countryMatch) {
  let total = 0;
  for (const ex of experience) {
    const c = String(ex.country || '').toLowerCase();
    const isAu = c.includes('australia') || c === 'au';
    if (countryMatch === 'au' && !isAu) continue;
    if (countryMatch === 'os' && isAu) continue;
    total += yearsBetween(ex.startDate, ex.endDate, ex.isCurrent);
  }
  return Math.round(total * 10) / 10;
}

function workPoints(years, bands) {
  if (years <= 0) return { points: 0, label: '0 years' };
  for (let i = bands.length - 1; i >= 0; i--) {
    const b = bands[i];
    if (years >= b.minYears) return { points: b.points, label: `${years}+ years (tier)` };
  }
  return { points: 0, label: `${years} years` };
}

function suggestionsFor({ age, englishBand, eduLevel, ausYears, osYears, client, user }) {
  const out = [];
  const p = client?.profile || {};
  if (!user?.profile?.dob && !p.dob) out.push({ priority: 'high', text: 'Add your date of birth — age points are a large part of the test.' });
  if (!client?.englishTest?.testType || englishBand === 'below' || !englishBand) {
    out.push({ priority: 'high', text: 'Add English test results (IELTS Academic, PTE Academic, etc.) — aim for proficient or superior for skilled migration.' });
  }
  if (!eduLevel || eduLevel === 'other') {
    out.push({ priority: 'medium', text: 'Add your highest completed qualification in Education — points depend on level and recognition.' });
  }
  if (ausYears < 1 && (p.currentVisa === '485' || p.currentVisa === '500')) {
    out.push({ priority: 'medium', text: 'Australian skilled employment can add up to 20 points — document full-time work in your nominated occupation.' });
  }
  if (!p.anzscoCode) out.push({ priority: 'medium', text: 'Add your nominated ANZSCO occupation code when known — it drives skills assessment and state nomination options.' });
  if (!p.targetVisa) out.push({ priority: 'low', text: 'Set your target visa (e.g. 189, 190, 491, 485) in Immigration so reminders match your pathway.' });
  if ((client?.education || []).length === 0) {
    out.push({ priority: 'medium', text: 'Add study history — we use it to estimate Australian study and qualification points.' });
  }
  return out.slice(0, 6);
}

/**
 * @param {object} user - User doc
 * @param {object} client - Client doc
 * @param {object} platformDoc - PlatformSettings lean doc or null
 */
export function computePrEstimate(user, client, platformDoc = null) {
  const cfg = mergeConfig(platformDoc);
  const up = user?.profile || {};
  const cp = client?.profile || {};
  const dob = cp.dob || up.dob;
  const age = ageFromDob(dob);

  const ageR = agePoints(age, cfg);
  const band = englishBandFromTest(client?.englishTest || {});
  const engR = englishPoints(band, cfg);

  const inferredEdu = inferEducationLevel(client?.education || []);
  const eduLevel = inferredEdu || 'other';
  const eduR = educationPoints(eduLevel, cfg);

  const ausYears = sumWorkYears(client?.experience || [], 'au');
  const osYears = sumWorkYears(client?.experience || [], 'os');
  const ausWR = workPoints(ausYears, cfg.ausWork);
  const osWR = workPoints(osYears, cfg.overseasWork);

  const pd = client?.pointsData || {};
  let bonus = 0;
  const bonusLines = [];
  if (pd.ausStudy || client?.education?.some((e) => String(e.country || '').toLowerCase().includes('australia'))) {
    bonus += cfg.ausStudy;
    bonusLines.push({ key: 'Australian study requirement', points: cfg.ausStudy });
  }
  if (pd.regionalStudy) {
    bonus += cfg.regionalStudy;
    bonusLines.push({ key: 'Regional study', points: cfg.regionalStudy });
  }
  if (pd.professionalYear) {
    bonus += cfg.professionalYear;
    bonusLines.push({ key: 'Professional Year', points: cfg.professionalYear });
  }
  if (pd.naati) {
    bonus += cfg.naati;
    bonusLines.push({ key: 'NAATI / Credentialed community language', points: cfg.naati });
  }
  if (pd.partner === 'yes' || Number(pd.partnerPoints) > 0) {
    bonus += cfg.partner;
    bonusLines.push({ key: 'Partner skills', points: cfg.partner });
  }

  const breakdown = [
    { key: 'age', label: 'Age', detail: ageR.label, points: ageR.points },
    { key: 'english', label: 'English language', detail: engR.label, points: engR.points },
    { key: 'education', label: 'Qualification', detail: eduR.label, points: eduR.points },
    { key: 'ausWork', label: 'Australian skilled employment', detail: ausWR.label, points: ausWR.points },
    { key: 'overseasWork', label: 'Overseas skilled employment', detail: osWR.label, points: osWR.points },
    ...bonusLines.map((b) => ({ key: b.key, label: b.key, detail: 'From saved calculator flags', points: b.points })),
  ];

  const total = breakdown.reduce((s, b) => s + (Number(b.points) || 0), 0);

  const suggestions = suggestionsFor({
    age,
    englishBand: band,
    eduLevel,
    ausYears,
    osYears,
    client,
    user,
  });

  return {
    total,
    maxDisplay: 130,
    disclaimer: cfg.disclaimer || DEFAULTS.disclaimer,
    breakdown,
    meta: {
      age,
      englishBand: band || null,
      educationLevel: eduLevel,
      ausEmploymentYears: ausYears,
      overseasEmploymentYears: osYears,
    },
    suggestions,
  };
}
