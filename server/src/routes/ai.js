import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Mock AI - factual info only, no advice (Section 276 compliance)
const MIGRATION_FACTS = {
  'student visa fee': 'The student visa (Subclass 500) application charge is AUD 710 as of 2025. Source: Migration Regulations 1994.',
  'english requirements': 'English requirements vary by course. For higher education: IELTS 6.0 or equivalent. For ELICOS: IELTS 4.5. Source: Migration Regulations 1994.',
  '485 age limit': 'The Temporary Graduate visa (Subclass 485) has an age limit of 35 years as of 2026. Source: Migration Strategy 2025-26.',
  'pr points': 'The points test is in Schedule 6D of the Migration Regulations 1994. Minimum EOI threshold is 65 points. This is not a guarantee of invitation.',
  'oshc': 'Overseas Student Health Cover (OSHC) is mandatory for student visa holders. Providers include Allianz, BUPA, Medibank, and others.',
  'gte': 'The Genuine Temporary Entrant (GTE) requirement has been replaced by the Genuine Student (GS) test. See immi.homeaffairs.gov.au for criteria.',
  'default': 'I provide factual information only. For specific advice about your situation, please consult a registered migration agent (MARN). I cannot assess eligibility or recommend visa strategies.',
};

router.post('/compass', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    const lower = (message || '').toLowerCase();
    let response = MIGRATION_FACTS.default;
    for (const [key, value] of Object.entries(MIGRATION_FACTS)) {
      if (key !== 'default' && lower.includes(key)) {
        response = value;
        break;
      }
    }
    // Block advice-seeking patterns
    const advicePatterns = ['should i', 'can i', 'am i eligible', 'what are my chances', 'recommend', 'advise'];
    if (advicePatterns.some(p => lower.includes(p))) {
      response = 'I cannot provide personal migration advice. Please book a consultation with a registered migration agent for your specific situation.';
    }
    res.json({ response, role: 'assistant' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/document-suggestions', authenticate, async (req, res) => {
  try {
    const { visaSubclass } = req.body;
    const suggestions = {
      '500': ['CoE', 'OSHC', 'Passport', 'English Test', 'GTE/GS Statement', 'Financial Evidence'],
      '485': ['Passport', 'AFP Police Check', 'English Test', 'Skills Assessment', 'Completion Letter'],
      '190': ['Passport', 'Skills Assessment', 'English Test', 'Points Evidence', 'State Nomination'],
      '189': ['Passport', 'Skills Assessment', 'English Test', 'Points Evidence', 'EOI'],
    };
    res.json({ documents: suggestions[visaSubclass] || suggestions['500'] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
