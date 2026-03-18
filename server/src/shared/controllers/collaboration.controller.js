import { CollaborationService } from '../services/collaboration.service.js';

export class CollaborationController {
  static async getMessages(req, res) {
    const messages = await CollaborationService.getMessages(req.user, req.query);
    res.json(messages);
  }

  static async getConversations(req, res) {
    const convos = await CollaborationService.getConversations(req.user);
    res.json(convos);
  }

  static async sendMessage(req, res) {
    const msg = await CollaborationService.sendMessage(req.user, req.body);
    res.status(201).json(msg);
  }

  static async getPosts(req, res) {
    const posts = await CollaborationService.getPosts(req.query);
    res.json(posts);
  }

  static async createPost(req, res) {
    const authorId = req.user._id || req.user.id;
    const post = await CollaborationService.createPost(req.body, authorId);
    res.status(201).json(post);
  }

  static async getPostById(req, res) {
    const result = await CollaborationService.getPostById(req.params.id);
    res.json(result);
  }

  static async addComment(req, res) {
    const authorId = req.user._id || req.user.id;
    const comment = await CollaborationService.addComment(req.params.id, authorId, req.body.content);
    res.status(201).json(comment);
  }

  static async upvotePost(req, res) {
    const userId = req.user._id || req.user.id;
    const post = await CollaborationService.upvotePost(req.params.id, userId);
    res.json(post);
  }

  static async sendMessageToPostAuthor(req, res) {
    const text = req.body?.text?.trim();
    if (!text) return res.status(400).json({ error: 'Message text is required' });
    const msg = await CollaborationService.sendMessageToPostAuthor(req.user, req.params.id, text);
    res.status(201).json(msg);
  }
}
