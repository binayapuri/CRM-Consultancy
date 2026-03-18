import { CollaborationService } from '../services/collaboration.service.js';

export class CollaborationController {
  static async getMessages(req, res) {
    const messages = await CollaborationService.getMessages(req.user);
    res.json(messages);
  }

  static async sendMessage(req, res) {
    const msg = await CollaborationService.sendMessage(req.user, req.body.text);
    res.status(201).json(msg);
  }

  static async getPosts(req, res) {
    const posts = await CollaborationService.getPosts(req.query);
    res.json(posts);
  }

  static async createPost(req, res) {
    const post = await CollaborationService.createPost(req.body, req.user.id);
    res.status(201).json(post);
  }

  static async getPostById(req, res) {
    const result = await CollaborationService.getPostById(req.params.id);
    res.json(result);
  }

  static async addComment(req, res) {
    const comment = await CollaborationService.addComment(req.params.id, req.user.id, req.body.content);
    res.status(201).json(comment);
  }

  static async upvotePost(req, res) {
    const post = await CollaborationService.upvotePost(req.params.id, req.user.id);
    res.json(post);
  }
}
