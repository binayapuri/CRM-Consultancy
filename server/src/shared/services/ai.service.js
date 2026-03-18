import ChatHistory from '../../shared/models/ChatHistory.js';

const MIGRATION_FACTS = {
  'student visa fee': 'The student visa (Subclass 500) application charge is AUD 710 as of 2025. Source: Migration Regulations 1994.',
  'english requirements': 'English requirements vary by course. For higher education: IELTS 6.0 or equivalent. For ELICOS: IELTS 4.5. Source: Migration Regulations 1994.',
  '485 age limit': 'The Temporary Graduate visa (Subclass 485) has an age limit of 35 years as of 2026. Source: Migration Strategy 2025-26.',
  'pr points': 'The points test is in Schedule 6D of the Migration Regulations 1994. Minimum EOI threshold is 65 points. This is not a guarantee of invitation.',
  'oshc': 'Overseas Student Health Cover (OSHC) is mandatory for student visa holders. Providers include Allianz, BUPA, Medibank, and others.',
  'gte': 'The Genuine Temporary Entrant (GTE) requirement has been replaced by the Genuine Student (GS) test. See immi.homeaffairs.gov.au for criteria.',
  'default': 'I provide factual information only. For specific advice about your situation, please consult a registered migration agent (MARN). I cannot assess eligibility or recommend visa strategies.',
};

const SUGGESTIONS = {
  '500': ['CoE', 'OSHC', 'Passport', 'English Test', 'GTE/GS Statement', 'Financial Evidence'],
  '485': ['Passport', 'AFP Police Check', 'English Test', 'Skills Assessment', 'Completion Letter'],
  '190': ['Passport', 'Skills Assessment', 'English Test', 'Points Evidence', 'State Nomination'],
  '189': ['Passport', 'Skills Assessment', 'English Test', 'Points Evidence', 'EOI'],
};

export class AIService {
  static async compass(userId, message, chatId) {
    const lower = (message || '').toLowerCase();
    
    let chat;
    if (chatId) {
      chat = await ChatHistory.findOne({ _id: chatId, userId });
    }
    if (!chat) {
      chat = new ChatHistory({ userId, title: message.substring(0, 30) + '...', messages: [] });
    }

    chat.messages.push({ role: 'user', content: message });

    let aiResponseText = MIGRATION_FACTS.default;
    for (const [key, value] of Object.entries(MIGRATION_FACTS)) {
      if (key !== 'default' && lower.includes(key)) {
        aiResponseText = value;
        break;
      }
    }
    
    const advicePatterns = ['should i', 'can i', 'am i eligible', 'what are my chances', 'recommend', 'advise'];
    if (advicePatterns.some(p => lower.includes(p))) {
      aiResponseText = 'I cannot provide personal migration advice. Please book a consultation with a registered migration agent for your specific situation. You can use the Bookings tab to find an agent.';
    }

    chat.messages.push({ role: 'assistant', content: aiResponseText });
    await chat.save();

    return { response: aiResponseText, role: 'assistant', chatId: chat._id };
  }

  static async getHistory(userId) {
    return ChatHistory.find({ userId }).sort({ updatedAt: -1 });
  }

  static async getChatById(id, userId) {
    const chat = await ChatHistory.findOne({ _id: id, userId });
    if (!chat) throw Object.assign(new Error('Chat not found'), { status: 404 });
    return chat;
  }

  static async getDocumentSuggestions(visaSubclass) {
    return { documents: SUGGESTIONS[visaSubclass] || SUGGESTIONS['500'] };
  }
}
