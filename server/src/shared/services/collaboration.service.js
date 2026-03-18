import Message from '../../shared/models/Message.js';
import CommunityPost from '../../shared/models/CommunityPost.js';
import CommunityComment from '../../shared/models/CommunityComment.js';
import Notification from '../../shared/models/Notification.js';

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

    const cid = user.profile?.consultancyId || user._id;
    const messages = await Message.find({ consultancyId: cid, channel: 'team' })
      .populate('senderId', 'profile email')
      .sort({ createdAt: -1 })
      .limit(50);
    return messages.reverse();
  }

  static async sendMessage(user, payload) {
    const text = String(payload?.text || '').trim();
    if (!text) throw Object.assign(new Error('Message text is required'), { status: 400 });
    const recipientId = payload?.recipientId ? String(payload.recipientId) : '';
    const postId = payload?.postId ? String(payload.postId) : '';
    const cid = user.profile?.consultancyId || user._id;

    const data = {
      consultancyId: cid,
      senderId: user._id,
      text,
      channel: 'team',
    };
    if (recipientId) {
      data.recipientId = recipientId;
      data.channel = 'direct';
      if (postId) data.contextPostId = postId;
    }

    const msg = await Message.create({
      ...data,
    });
    if (recipientId) {
      await Notification.create({
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
    const comment = new CommunityComment({
      postId,
      authorId,
      content
    });
    return comment.save();
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
