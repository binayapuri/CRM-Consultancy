import express from 'express';
import { authenticate } from '../middleware/auth.js';
import CommunityPost from '../models/CommunityPost.js';
import CommunityComment from '../models/CommunityComment.js';

const router = express.Router();

// Get all posts
router.get('/posts', async (req, res) => {
  try {
    const { location, university, tag } = req.query;
    let query = { status: 'ACTIVE' };
    if (location) query.location = location;
    if (university) query.university = university;
    if (tag) query.tags = tag;

    const posts = await CommunityPost.find(query)
      .populate('authorId', 'profile.firstName profile.lastName profile.avatar')
      .sort({ isPinned: -1, createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create post
router.post('/posts', authenticate, async (req, res) => {
  try {
    const post = new CommunityPost({ ...req.body, authorId: req.user.id });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get single post with comments
router.get('/posts/:id', async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id).populate('authorId', 'profile.firstName profile.lastName profile.avatar');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    post.views += 1;
    await post.save();

    const comments = await CommunityComment.find({ postId: post._id })
      .populate('authorId', 'profile.firstName profile.lastName profile.avatar')
      .sort({ createdAt: 1 });
      
    res.json({ post, comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment
router.post('/posts/:id/comments', authenticate, async (req, res) => {
  try {
    const comment = new CommunityComment({
      postId: req.params.id,
      authorId: req.user.id,
      content: req.body.content
    });
    await comment.save();
    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Upvote post
router.post('/posts/:id/upvote', authenticate, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    const userId = req.user.id;
    if (post.upvotes.includes(userId)) {
      post.upvotes = post.upvotes.filter(id => id.toString() !== userId);
    } else {
      post.upvotes.push(userId);
    }
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
