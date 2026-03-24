import mongoose from 'mongoose';
import Message from '../models/Message.js';
import CommunityPost from '../models/CommunityPost.js';
import CommunityComment from '../models/CommunityComment.js';
import CommunityPostSave from '../models/CommunityPostSave.js';
import CommunityFollow from '../models/CommunityFollow.js';
import User from '../models/User.js';
import Client from '../models/Client.js';
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
  static _buildPostMatch(queryData) {
    const { location, university, tag, category, search } = queryData;
    const query = { status: 'ACTIVE' };
    if (location) query.location = new RegExp(String(location), 'i');
    if (university) query.university = new RegExp(String(university), 'i');
    if (tag) query.tags = tag;
    if (category) query.category = category;
    if (search) {
      const rx = new RegExp(String(search), 'i');
      query.$or = [{ title: rx }, { content: rx }, { tags: rx }, { location: rx }, { university: rx }];
    }
    return query;
  }

  static async _attachSavedFlags(user, posts) {
    if (!user || !posts.length) {
      return posts.map((p) => {
        const o = typeof p.toObject === 'function' ? p.toObject() : { ...p };
        return { ...o, isSaved: false };
      });
    }
    const ids = posts.map((p) => p._id);
    const saved = await CommunityPostSave.find({ userId: user._id, postId: { $in: ids } })
      .select('postId')
      .lean();
    const savedSet = new Set(saved.map((s) => s.postId.toString()));
    return posts.map((p) => {
      const o = typeof p.toObject === 'function' ? p.toObject() : { ...p };
      return { ...o, isSaved: savedSet.has(p._id.toString()) };
    });
  }

  /**
   * @param {object} queryData — filters + page, limit, sort (recent|top|following|saved)
   * @param {object|null} user — optional user for saved/following and isSaved flags
   */
  static async getPosts(queryData, user) {
    const match = CollaborationService._buildPostMatch(queryData);
    const page = Math.max(1, parseInt(String(queryData.page || '1'), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(queryData.limit || '20'), 10) || 20));
    const skip = (page - 1) * limit;
    const sort = String(queryData.sort || 'recent').toLowerCase();

    if (sort === 'saved') {
      if (!user) throw Object.assign(new Error('Sign in to view saved posts'), { status: 401 });
      const saves = await CommunityPostSave.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit + 1)
        .populate({
          path: 'postId',
          match,
          populate: { path: 'authorId', select: 'profile.firstName profile.lastName profile.avatar' },
        })
        .lean();
      let rows = saves.map((s) => s.postId).filter(Boolean);
      const hasMore = rows.length > limit;
      rows = rows.slice(0, limit);
      const total = await CommunityPostSave.countDocuments({ userId: user._id });
      const withFlags = await CollaborationService._attachSavedFlags(user, rows);
      return { posts: withFlags, page, limit, hasMore, total };
    }

    if (sort === 'following') {
      if (!user) throw Object.assign(new Error('Sign in to view posts from people you follow'), { status: 401 });
      const followingIds = await CommunityFollow.find({ followerId: user._id }).distinct('followingId');
      if (!followingIds.length) {
        return { posts: [], page, limit, hasMore: false, total: 0 };
      }
      match.authorId = { $in: followingIds };
    }

    if (sort === 'top') {
      const pipeline = [
        { $match: match },
        {
          $addFields: {
            score: {
              $add: [
                { $size: { $ifNull: ['$upvotes', []] } },
                { $multiply: [{ $ifNull: ['$commentCount', 0] }, 2] },
              ],
            },
          },
        },
        { $sort: { isPinned: -1, score: -1, createdAt: -1, _id: -1 } },
        { $skip: skip },
        { $limit: limit + 1 },
      ];
      const agg = await CommunityPost.aggregate(pipeline);
      const hasMore = agg.length > limit;
      const slice = agg.slice(0, limit);
      const ids = slice.map((d) => d._id);
      if (!ids.length) {
        const total = await CommunityPost.countDocuments(match);
        return { posts: [], page, limit, hasMore: false, total };
      }
      const found = await CommunityPost.find({ _id: { $in: ids } })
        .populate('authorId', 'profile.firstName profile.lastName profile.avatar')
        .lean();
      const order = new Map(ids.map((id, i) => [id.toString(), i]));
      found.sort((a, b) => order.get(a._id.toString()) - order.get(b._id.toString()));
      const total = await CommunityPost.countDocuments(match);
      const withFlags = await CollaborationService._attachSavedFlags(user, found);
      return { posts: withFlags, page, limit, hasMore, total };
    }

    const [rows, total] = await Promise.all([
      CommunityPost.find(match)
        .populate('authorId', 'profile.firstName profile.lastName profile.avatar')
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit + 1),
      CommunityPost.countDocuments(match),
    ]);
    const hasMore = rows.length > limit;
    const pageRows = rows.slice(0, limit).map((r) => (typeof r.toObject === 'function' ? r.toObject() : r));
    const withFlags = await CollaborationService._attachSavedFlags(user, pageRows);
    return { posts: withFlags, page, limit, hasMore, total };
  }

  static async createPost(data, authorId) {
    const post = new CommunityPost({ ...data, authorId });
    return post.save();
  }

  static async getPostById(id, user) {
    const post = await CommunityPost.findById(id).populate('authorId', 'profile.firstName profile.lastName profile.avatar');
    if (!post) throw Object.assign(new Error('Post not found'), { status: 404 });

    post.views += 1;
    await post.save();

    const comments = await CommunityComment.find({ postId: post._id })
      .populate('authorId', 'profile.firstName profile.lastName profile.avatar')
      .sort({ createdAt: 1 });

    let isSaved = false;
    let isFollowingAuthor = false;
    if (user) {
      const authorOid = post.authorId?._id || post.authorId;
      const [savedDoc, followDoc] = await Promise.all([
        CommunityPostSave.findOne({ userId: user._id, postId: post._id }).select('_id').lean(),
        authorOid && authorOid.toString() !== user._id.toString()
          ? CommunityFollow.findOne({ followerId: user._id, followingId: authorOid }).select('_id').lean()
          : null,
      ]);
      isSaved = !!savedDoc;
      isFollowingAuthor = !!followDoc;
    }

    const postObj = post.toObject();
    return { post: { ...postObj, isSaved }, comments, isFollowingAuthor };
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
    await CommunityPost.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });
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
    return await CommunityComment.findById(saved._id).populate(
      'authorId',
      'profile.firstName profile.lastName profile.avatar'
    );
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

  static async savePost(postId, userId) {
    const post = await CommunityPost.findById(postId);
    if (!post || post.status !== 'ACTIVE') throw Object.assign(new Error('Post not found'), { status: 404 });
    await CommunityPostSave.updateOne({ userId, postId }, { $setOnInsert: { userId, postId } }, { upsert: true });
    return { saved: true };
  }

  static async unsavePost(postId, userId) {
    await CommunityPostSave.deleteOne({ userId, postId });
    return { saved: false };
  }

  static async toggleFollowUser(followerId, targetUserId) {
    if (followerId.toString() === targetUserId.toString()) {
      throw Object.assign(new Error('Cannot follow yourself'), { status: 400 });
    }
    const existing = await CommunityFollow.findOne({ followerId, followingId: targetUserId });
    if (existing) {
      await CommunityFollow.deleteOne({ _id: existing._id });
      return { following: false };
    }
    await CommunityFollow.create({ followerId, followingId: targetUserId });
    return { following: true };
  }

  static async getFollowingIds(followerId) {
    return CommunityFollow.find({ followerId }).distinct('followingId');
  }

  /**
   * Students with a city/suburb/state on profile that matches the search (e.g. "Melbourne").
   * Privacy: only users who saved address data appear; not a guarantee of current location.
   */
  static async getPeersNearby(location, currentUserId) {
    const loc = String(location || '').trim();
    if (loc.length < 2) return { peers: [] };
    const safe = loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(safe, 'i');
    const exclude = currentUserId ? new mongoose.Types.ObjectId(String(currentUserId)) : null;

    const userQuery = {
      role: 'STUDENT',
      ...(exclude ? { _id: { $ne: exclude } } : {}),
      $or: [
        { 'profile.address.city': rx },
        { 'profile.address.state': rx },
      ],
    };

    const users = await User.find(userQuery)
      .select('profile.firstName profile.lastName profile.avatar profile.address')
      .limit(30)
      .lean();

    const fromUsers = users.map((u) => ({
      userId: u._id,
      firstName: u.profile?.firstName || '',
      lastName: u.profile?.lastName || '',
      avatar: u.profile?.avatar || '',
      city: u.profile?.address?.city || u.profile?.address?.state || '',
    }));

    const clientQuery = {
      userId: { $exists: true, ...(exclude ? { $ne: exclude } : {}) },
      $or: [
        { 'profile.address.city': rx },
        { 'profile.address.suburb': rx },
        { 'profile.address.state': rx },
      ],
    };

    const clients = await Client.find(clientQuery)
      .populate('userId', 'profile.firstName profile.lastName profile.avatar profile.address')
      .select('profile.firstName profile.lastName profile.address userId')
      .limit(30)
      .lean();

    const fromClients = [];
    for (const c of clients) {
      const uid = c.userId?._id || c.userId;
      if (!uid) continue;
      if (exclude && uid.toString() === exclude.toString()) continue;
      fromClients.push({
        userId: uid,
        firstName: c.userId?.profile?.firstName || c.profile?.firstName || '',
        lastName: c.userId?.profile?.lastName || c.profile?.lastName || '',
        avatar: c.userId?.profile?.avatar || '',
        city: c.profile?.address?.city || c.profile?.address?.suburb || '',
      });
    }

    const map = new Map();
    [...fromUsers, ...fromClients].forEach((p) => {
      const id = String(p.userId);
      if (!map.has(id)) map.set(id, p);
    });
    return { peers: [...map.values()].slice(0, 24) };
  }

  /** One-time style sync: align commentCount with actual comments (safe to run on startup). */
  static async syncCommentCountsFromComments() {
    const agg = await CommunityComment.aggregate([
      { $group: { _id: '$postId', n: { $sum: 1 } } },
    ]);
    if (!agg.length) return;
    const ops = agg.map(({ _id, n }) => ({
      updateOne: {
        filter: { _id },
        update: { $set: { commentCount: n } },
      },
    }));
    await CommunityPost.bulkWrite(ops);
  }
}
