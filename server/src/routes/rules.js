import express from 'express';

const router = express.Router();

// PR Points rules - JSON-based, updateable OTA
const POINTS_RULES = {
  age_brackets: [
    { min: 18, max: 24, points: 25 },
    { min: 25, max: 32, points: 30 },
    { min: 33, max: 39, points: 25 },
    { min: 40, max: 44, points: 15 },
    { min: 45, max: 49, points: 0 },
  ],
  english: {
    'IELTS_8': 20, 'IELTS_7': 10, 'IELTS_6': 0,
    'PTE_79': 20, 'PTE_65': 10, 'PTE_50': 0,
  },
  work_experience_aus: [
    { min: 0, max: 2, points: 0 },
    { min: 3, max: 4, points: 5 },
    { min: 5, max: 7, points: 10 },
    { min: 8, max: 10, points: 15 },
  ],
  education: { bachelor: 15, masters: 15, phd: 20, australian_study: 5 },
  visa_limits: { '485': { max_age: 35 }, '189': { max_age: 45 }, '190': { max_age: 45 }, '491': { max_age: 45 } },
};

router.get('/points', (req, res) => {
  res.json(POINTS_RULES);
});

router.post('/calculate', (req, res) => {
  try {
    const { age, englishScore, educationLevel, workExperienceAus, australianStudy } = req.body;
    let total = 0;
    const ageBracket = POINTS_RULES.age_brackets.find(b => age >= b.min && age <= b.max);
    if (ageBracket) total += ageBracket.points;
    total += POINTS_RULES.english[englishScore] || 0;
    total += POINTS_RULES.education[educationLevel] || 0;
    const workBracket = POINTS_RULES.work_experience_aus.find(b => workExperienceAus >= b.min && workExperienceAus <= b.max);
    if (workBracket) total += workBracket.points;
    if (australianStudy) total += POINTS_RULES.education.australian_study || 0;
    res.json({
      total,
      breakdown: { age: ageBracket?.points, english: POINTS_RULES.english[englishScore], education: POINTS_RULES.education[educationLevel], work: workBracket?.points },
      disclaimer: 'This is a calculator. Minimum EOI threshold is 65. Not a guarantee of invitation.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
