import Message from '../models/Message.js';
import CommunityPost from '../models/CommunityPost.js';
import CommunityComment from '../models/CommunityComment.js';
import { createNotification } from '../utils/notify.js';

export class CollaborationService {
  // --- Messages ---
  static async getMessages(user, query = {}) {
    const recipientId = query.recipientId ? String(query.recipientId) : '';
    const postId = query.postId ? String(query.postId) : '';

    if (recipientId) {
      const q = {
        channel: 'direct',
        $or: [
          { senderId: user._id, recipientId },
          { senderId: recipientId, recipientId: user._id },
        ],
      };
      if (postId) q.contextPostId = postId;
      const rows = await Message.find(q)
        .populate('senderId', 'profile email')
        .populate('recipientId', 'profile email')
        .sort({ createdAt: -1 })
        .limit(200);
      return rows.reverse();
    }

    const cid = user.profile?.consultancyId;
    if (cid) {
      const messages = await Message.find({ consultancyId: cid, channel: 'team' })
        .populate('senderId', 'profile email')
        .sort({ createdAt: -1 })
        .limit(50);
      return messages.reverse();
    }

    const directQ = {
      channel: 'direct',
      $or: [{ senderId: user._id }, { recipientId: user._id }],
    };
    const rows = await Message.find(directQ)
      .populate('senderId', 'profile email')
      .populate('recipientId', 'profile email')
      .populate('contextPostId', 'title')
      .sort({ createdAt: -1 })
      .limit(200);
    return rows.reverse();
  }

  static async getConversations(user) {
    const directQ = {
      channel: 'direct',
      $or: [{ senderId: user._id }, { recipientId: user._id }],
    };
    const messages = await Message.find(directQ)
      .populate('senderId', 'profile email')
      .populate('recipientId', 'profile email')
      .populate('contextPostId', 'title')
      .sort({ createdAt: -1 })
      .limit(500);
    const seen = new Map();
    const convos = [];
    for (const m of messages) {
      const other = m.senderId?._id?.toString() === user._id.toString() ? m.recipientId : m.senderId;
      const postId = m.contextPostId?._id?.toString() || '';
      const key = `${other?._id || ''}:${postId}`;
      if (!seen.has(key)) {
        seen.set(key, true);
        convos.push({
          otherUser: other,
          contextPostId: m.contextPostId?._id,
          contextPostTitle: m.contextPostId?.title,
          lastMessage: m.text,
          lastAt: m.createdAt,
        });
      }
    }
    return convos.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
  }

  static async sendMessage(user, payload) {
    const text = String(payload?.text || '').trim();
    if (!text) throw Object.assign(new Error('Message text is required'), { status: 400 });
    const recipientId = payload?.recipientId ? String(payload.recipientId) : '';
    const postId = payload?.postId ? String(payload.postId) : '';
    const cid = user.profile?.consultancyId || user._id;

    const data = {
      senderId: user._id,
      text,
      channel: recipientId ? 'direct' : 'team',
    };
    if (recipientId) {
      data.recipientId = recipientId;
      if (postId) data.contextPostId = postId;
      data.consultancyId = cid || null;
    } else {
      data.consultancyId = cid;
    }

    const msg = await Message.create({
      ...data,
    });
    if (recipientId) {
      await createNotification({
        userId: recipientId,
        type: 'DIRECT_MESSAGE',
        title: 'New message from BIGFEW community',
        message: text.slice(0, 140),
        relatedEntityType: 'CommunityPost',
        relatedEntityId: postId || undefined,
      });
    }
    return Message.findById(msg._id).populate('senderId', 'profile email').populate('recipientId', 'profile email');
  }

  // --- Community ---
  static async getPosts(queryData) {
    const { location, university, tag, category, search } = queryData;
    let query = { status: 'ACTIVE' };
    if (location) query.location = new RegExp(String(location), 'i');
    if (university) query.university = new RegExp(String(university), 'i');
    if (tag) query.tags = tag;
    if (category) query.category = category;
    if (search) {
      const rx = new RegExp(String(search), 'i');
      query.$or = [{ title: rx }, { content: rx }, { tags: rx }, { location: rx }, { university: rx }];
    }

    return CommunityPost.find(query)
      .populate('authorId', 'profile.firstName profile.lastName profile.avatar')
      .sort({ isPinned: -1, createdAt: -1 });
  }

  static async createPost(data, authorId) {
    const post = new CommunityPost({ ...data, authorId });
    return post.save();
  }

  static async getPostById(id) {
    const post = await CommunityPost.findById(id).populate('authorId', 'profile.firstName profile.lastName profile.avatar');
    if (!post) throw Object.assign(new Error('Post not found'), { status: 404 });
    
    post.views += 1;
    await post.save();

    const comments = await CommunityComment.find({ postId: post._id })
      .populate('authorId', 'profile.firstName profile.lastName profile.avatar')
      .sort({ createdAt: 1 });
      
    return { post, comments };
  }

  static async addComment(postId, authorId, content) {
    const post = await CommunityPost.findById(postId);
    if (!post) throw Object.assign(new Error('Post not found'), { status: 404 });
    const comment = new CommunityComment({
      postId,
      authorId,
      content
    });
    const saved = await comment.save();
    if (post.authorId && post.authorId.toString() !== authorId.toString()) {
      await createNotification({
        userId: post.authorId,
        type: 'COMMUNITY_COMMENT',
        title: 'New comment on your post',
        message: content.slice(0, 100),
        relatedEntityType: 'CommunityPost',
        relatedEntityId: postId,
      });
    }
    return saved;
  }

  static async sendMessageToPostAuthor(user, postId, text) {
    const post = await CommunityPost.findById(postId);
    if (!post) throw Object.assign(new Error('Post not found'), { status: 404 });
    const authorId = post.authorId;
    if (!authorId) throw Object.assign(new Error('Post author not found'), { status: 404 });
    if (authorId.toString() === (user._id || user.id).toString()) {
      throw Object.assign(new Error('Cannot message yourself'), { status: 400 });
    }
    const msg = await Message.create({
      senderId: user._id,
      recipientId: authorId,
      contextPostId: postId,
      text: String(text || '').trim(),
      channel: 'direct',
    });
    await createNotification({
      userId: authorId,
      type: 'DIRECT_MESSAGE',
      title: 'New message about your community post',
      message: String(text || '').trim().slice(0, 140),
      relatedEntityType: 'CommunityPost',
      relatedEntityId: postId,
    });
    return Message.findById(msg._id)
      .populate('senderId', 'profile email')
      .populate('recipientId', 'profile email');
  }

  static async upvotePost(postId, userId) {
    const post = await CommunityPost.findById(postId);
    if (!post) throw Object.assign(new Error('Post not found'), { status: 404 });

    if (post.upvotes.includes(userId)) {
      post.upvotes = post.upvotes.filter(id => id.toString() !== userId);
    } else {
      post.upvotes.push(userId);
    }
    return post.save();
  }
}
