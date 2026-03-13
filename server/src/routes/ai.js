import express from 'express';
import { authenticate } from '../middleware/auth.js';
import ChatHistory from '../models/ChatHistory.js';

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
    const { message, chatId } = req.body;
    const lower = (message || '').toLowerCase();
    
    let chat;
    if (chatId) {
      chat = await ChatHistory.findOne({ _id: chatId, userId: req.user.id });
    }
    if (!chat) {
      chat = new ChatHistory({ userId: req.user.id, title: message.substring(0, 30) + '...', messages: [] });
    }

    // Add user message
    chat.messages.push({ role: 'user', content: message });

    let aiResponseText = MIGRATION_FACTS.default;
    for (const [key, value] of Object.entries(MIGRATION_FACTS)) {
      if (key !== 'default' && lower.includes(key)) {
        aiResponseText = value;
        break;
      }
    }
    
    // Block advice-seeking patterns
    const advicePatterns = ['should i', 'can i', 'am i eligible', 'what are my chances', 'recommend', 'advise'];
    if (advicePatterns.some(p => lower.includes(p))) {
      aiResponseText = 'I cannot provide personal migration advice. Please book a consultation with a registered migration agent for your specific situation. You can use the Bookings tab to find an agent.';
    }

    // Add assistant response
    chat.messages.push({ role: 'assistant', content: aiResponseText });
    await chat.save();

    res.json({ response: aiResponseText, role: 'assistant', chatId: chat._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', authenticate, async (req, res) => {
  try {
    const history = await ChatHistory.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history/:id', authenticate, async (req, res) => {
  try {
    const chat = await ChatHistory.findOne({ _id: req.params.id, userId: req.user.id });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat);
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
