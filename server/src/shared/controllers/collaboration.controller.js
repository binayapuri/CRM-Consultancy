import { CollaborationService } from '../services/collaboration.service.js';
import { fetchLinkPreview } from '../services/link-preview.service.js';

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
    const data = await CollaborationService.getPosts(req.query, req.user || null);
    res.json(data);
  }

  static async createPost(req, res) {
    const authorId = req.user._id || req.user.id;
    const post = await CollaborationService.createPost(req.body, authorId);
    res.status(201).json(post);
  }

  static async getPostById(req, res) {
    const result = await CollaborationService.getPostById(req.params.id, req.user || null);
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

  static async savePost(req, res) {
    const userId = req.user._id || req.user.id;
    const result = await CollaborationService.savePost(req.params.id, userId);
    res.json(result);
  }

  static async unsavePost(req, res) {
    const userId = req.user._id || req.user.id;
    const result = await CollaborationService.unsavePost(req.params.id, userId);
    res.json(result);
  }

  static async toggleFollowUser(req, res) {
    const followerId = req.user._id || req.user.id;
    const result = await CollaborationService.toggleFollowUser(followerId, req.params.userId);
    res.json(result);
  }

  static async uploadPostImage(req, res) {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (req.file.mimetype && !req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'File must be an image' });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  }

  static async getFollowing(req, res) {
    const followerId = req.user._id || req.user.id;
    const followingIds = await CollaborationService.getFollowingIds(followerId);
    res.json({ followingIds: followingIds.map((id) => id.toString()) });
  }

  static async getPeersNearby(req, res) {
    const location = req.query?.location;
    const userId = req.user?._id || req.user?.id;
    const data = await CollaborationService.getPeersNearby(location, userId);
    res.json(data);
  }

  static async previewLink(req, res) {
    const userId = req.user._id || req.user.id;
    const result = await fetchLinkPreview({ url: req.body.url, userId });
    res.json(result);
  }
}
