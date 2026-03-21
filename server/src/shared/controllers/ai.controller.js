import { AIService } from '../services/ai.service.js';

export class AIController {
  static async compass(req, res) {
    const result = await AIService.compass(req.user.id, req.body.message, req.body.chatId);
    res.json(result);
  }

  static async getHistory(req, res) {
    const history = await AIService.getHistory(req.user.id);
    res.json(history);
  }

  static async getChatById(req, res) {
    const chat = await AIService.getChatById(req.params.id, req.user.id);
    res.json(chat);
  }

  static async getDocumentSuggestions(req, res) {
    const result = await AIService.getDocumentSuggestions(req.body.visaSubclass);
    res.json(result);
  }
}
