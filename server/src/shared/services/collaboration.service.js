import Message from '../../shared/models/Message.js';
import CommunityPost from '../../shared/models/CommunityPost.js';
import CommunityComment from '../../shared/models/CommunityComment.js';

export class CollaborationService {
  // --- Messages ---
  static async getMessages(user) {
    const cid = user.profile?.consultancyId || user._id;
    const messages = await Message.find({ consultancyId: cid })
      .populate('senderId', 'profile email')
      .sort({ createdAt: -1 })
      .limit(50);
    return messages.reverse();
  }

  static async sendMessage(user, text) {
    const cid = user.profile?.consultancyId || user._id;
    const msg = await Message.create({
      consultancyId: cid,
      senderId: user._id,
      text,
    });
    return Message.findById(msg._id).populate('senderId', 'profile email');
  }

  // --- Community ---
  static async getPosts(queryData) {
    const { location, university, tag } = queryData;
    let query = { status: 'ACTIVE' };
    if (location) query.location = location;
    if (university) query.university = university;
    if (tag) query.tags = tag;

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
