import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ThumbsUp,
  MapPin,
  GraduationCap,
  MessageSquare,
  Send,
  Bookmark,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { authFetch } from '../../store/auth';
import { resolveFileUrl } from '../../lib/imageUrl';

function linkHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function MessageAuthorButton({ postId }: { postId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await authFetch(`/api/community/posts/${postId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (res.ok) {
        setText('');
        setShowForm(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-ori-600 text-white rounded-xl font-bold hover:bg-ori-700 transition"
      >
        <MessageSquare className="w-5 h-5" /> Message author
      </button>
    );
  }

  return (
    <form onSubmit={handleSend} className="flex flex-col sm:flex-row gap-3">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-ori-500/50"
        required
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="px-4 py-2.5 bg-ori-600 text-white rounded-xl font-bold hover:bg-ori-700 disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  );
}

interface Comment {
  _id: string;
  content: string;
  authorId: { _id: string; profile: { firstName: string; lastName: string; avatar?: string } };
  createdAt: string;
}

interface Post {
  _id: string;
  title: string;
  content: string;
  views: number;
  upvotes: string[];
  tags: string[];
  category?: string;
  location?: string;
  university?: string;
  createdAt: string;
  commentCount?: number;
  images?: { url: string }[];
  linkUrl?: string;
  linkPreview?: { title?: string; description?: string; image?: string };
  isSaved?: boolean;
  authorId: {
    _id: string;
    profile: { firstName: string; lastName: string; avatar?: string };
  };
}

export default function CommunityPostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);

  const userId = (user?._id || user?.id || '').toString();

  useEffect(() => {
    if (!id) return;
    authFetch(`/api/community/posts/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.post) {
          setPost(data.post);
          setComments(data.comments || []);
          if (typeof data.isFollowingAuthor === 'boolean') setIsFollowingAuthor(data.isFollowingAuthor);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpvote = async () => {
    if (!id) return;
    try {
      const res = await authFetch(`/api/community/posts/${id}/upvote`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.upvotes))
          setPost((prev) =>
            prev
              ? {
                  ...prev,
                  upvotes: data.upvotes.map((x: { toString: () => string }) => x.toString()),
                }
              : null
          );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!id || !post) return;
    const currently = post.isSaved === true;
    try {
      const res = await authFetch(`/api/community/posts/${id}/save`, {
        method: currently ? 'DELETE' : 'POST',
      });
      if (res.ok) setPost((prev) => (prev ? { ...prev, isSaved: !currently } : null));
    } catch (e) {
      console.error(e);
    }
  };

  const handleFollow = async () => {
    const authorOid = post?.authorId?._id;
    if (!authorOid) return;
    try {
      const res = await authFetch(`/api/community/follow/${authorOid}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIsFollowingAuthor(data.following === true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/community/posts/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [...prev, newComment]);
        setCommentText('');
        setPost((prev) =>
          prev ? { ...prev, commentCount: (prev.commentCount ?? 0) + 1 } : null
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-ori-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 font-medium mb-4">Post not found</p>
        <button onClick={() => navigate('/student/community')} className="text-ori-600 font-bold hover:underline">
          Back to Community
        </button>
      </div>
    );
  }

  const authorAvatar = resolveFileUrl(post.authorId?.profile?.avatar);
  const authorName = `${post.authorId?.profile?.firstName || ''} ${post.authorId?.profile?.lastName || ''}`.trim();
  const isSelf = post.authorId?._id?.toString() === userId;
  const imgs = (post.images || []).map((i) => resolveFileUrl(i.url)).filter(Boolean);

  return (
    <div className="w-full animate-fade-in-up max-w-3xl mx-auto">
      <button
        type="button"
        onClick={() => navigate('/student/community')}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-6"
      >
        <ArrowLeft className="w-5 h-5" /> Back to feed
      </button>

      <article className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <button
              type="button"
              onClick={handleUpvote}
              className={`flex flex-col items-center p-3 rounded-xl transition-colors min-h-[44px] shrink-0 ${
                post.upvotes.includes(userId)
                  ? 'text-ori-600 bg-ori-50'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <ThumbsUp className={`w-6 h-6 ${post.upvotes.includes(userId) ? 'fill-current' : ''}`} />
              <span className="text-sm font-bold mt-1">{post.upvotes.length}</span>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start gap-3 mb-4">
                {authorAvatar ? (
                  <img src={authorAvatar} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-100" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-bold uppercase">
                    {(post.authorId?.profile?.firstName || 'A').charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{authorName}</span>
                    {!isSelf && user && (
                      <button
                        type="button"
                        onClick={handleFollow}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          isFollowingAuthor
                            ? 'border-slate-200 text-slate-600'
                            : 'border-ori-200 text-ori-700 bg-ori-50'
                        }`}
                      >
                        {isFollowingAuthor ? (
                          <>
                            <UserMinus className="w-3.5 h-3.5" /> Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" /> Follow
                          </>
                        )}
                      </button>
                    )}
                    {user && (
                      <button
                        type="button"
                        onClick={handleSave}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ml-auto sm:ml-0 ${
                          post.isSaved ? 'border-amber-200 text-amber-800 bg-amber-50' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${post.isSaved ? 'fill-current' : ''}`} />
                        {post.isSaved ? 'Saved' : 'Save'}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {new Date(post.createdAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}{' '}
                    · {post.views} views
                    {post.commentCount != null && <> · {post.commentCount} comments</>}
                  </p>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight mb-4">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-slate-500 mb-6">
                {post.location && (
                  <span className="flex items-center gap-1 text-sky-600">
                    <MapPin className="w-4 h-4" /> {post.location}
                  </span>
                )}
                {post.university && (
                  <span className="flex items-center gap-1 text-indigo-600">
                    <GraduationCap className="w-4 h-4" /> {post.university}
                  </span>
                )}
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </div>

              {imgs.length > 0 && (
                <div
                  className={`mt-6 grid gap-2 rounded-lg overflow-hidden ${
                    imgs.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                  }`}
                >
                  {imgs.map((src, i) => (
                    <img key={i} src={src} alt="" className="w-full max-h-96 object-cover rounded-lg" />
                  ))}
                </div>
              )}

              {post.linkUrl && (
                <a
                  href={post.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex rounded-xl border border-slate-200 overflow-hidden hover:bg-slate-50/80 transition"
                >
                  {post.linkPreview?.image && (
                    <img
                      src={resolveFileUrl(post.linkPreview.image) || post.linkPreview.image}
                      alt=""
                      className="w-28 h-28 object-cover shrink-0"
                    />
                  )}
                  <div className="p-4 min-w-0">
                    <p className="text-xs text-slate-500">{linkHostname(post.linkUrl)}</p>
                    <p className="font-semibold text-slate-900">{post.linkPreview?.title || post.linkUrl}</p>
                    {post.linkPreview?.description && (
                      <p className="text-sm text-slate-600 mt-1">{post.linkPreview.description}</p>
                    )}
                  </div>
                </a>
              )}

              {(post.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {(post.tags || []).map((tag) => (
                    <span key={tag} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-sm font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 p-6 sm:p-8 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Comments ({comments.length})
          </h2>

          {user && post.authorId?._id?.toString() !== userId && (
            <div className="mb-6">
              <MessageAuthorButton postId={post._id} />
            </div>
          )}

          {user && (
            <form onSubmit={handleAddComment} className="mb-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-ori-500/50 focus:border-ori-500"
                  disabled={submitting}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || submitting}
                  className="px-6 py-3 bg-ori-600 text-white rounded-xl font-bold hover:bg-ori-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-5 h-5" /> {submitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-slate-500 text-sm">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((c) => {
                const cAvatar = resolveFileUrl(c.authorId?.profile?.avatar);
                return (
                  <div key={c._id} className="bg-white rounded-lg p-4 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      {cAvatar ? (
                        <img src={cAvatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold uppercase">
                          {c.authorId?.profile?.firstName?.charAt(0) || 'A'}
                        </div>
                      )}
                      <span className="font-medium text-slate-900 text-sm">
                        {c.authorId?.profile?.firstName} {c.authorId?.profile?.lastName}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {new Date(c.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm pl-9 sm:pl-0">{c.content}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
