import { MessageSquare, ThumbsUp, MapPin, GraduationCap, Eye, Bookmark, UserPlus, UserMinus } from 'lucide-react';
import { resolveFileUrl } from '../../lib/imageUrl';
import FeedImageMosaic from './FeedImageMosaic';

const CATEGORY_LABELS: Record<string, string> = {
  ROOM_RENT: 'Room Rent',
  JOB_HELP: 'Job Help',
  COMMUNITY_SUPPORT: 'Community Support',
  STUDY_HELP: 'Study Help',
  GENERAL: 'General',
};

function linkHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export interface CommunityPostAuthor {
  _id: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

export interface FeedPost {
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
  authorId: CommunityPostAuthor;
}

interface Props {
  post: FeedPost;
  userId: string;
  onNavigate: (id: string) => void;
  onUpvote: (id: string, e: React.MouseEvent) => void;
  onSave: (id: string, e: React.MouseEvent) => void;
  onFollowAuthor?: (authorId: string, e: React.MouseEvent) => void;
  followingAuthor?: boolean;
}

export default function CommunityPostCard({
  post,
  userId,
  onNavigate,
  onUpvote,
  onSave,
  onFollowAuthor,
  followingAuthor,
}: Props) {
  const author = post.authorId;
  const authorName = `${author?.profile?.firstName || ''} ${author?.profile?.lastName || ''}`.trim() || 'Member';
  const avatarUrl = resolveFileUrl(author?.profile?.avatar);
  const authorOid = author?._id?.toString() || '';
  const isSelf = userId && authorOid === userId;
  const thumbUp = post.upvotes?.includes(userId);
  const saved = post.isSaved === true;
  const imageUrls = (post.images || []).slice(0, 8).map((i) => i.url).filter(Boolean) as string[];

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onNavigate(post._id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNavigate(post._id);
        }
      }}
      className="bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition overflow-hidden text-left"
    >
      <div className="p-4 sm:p-5">
        <div className="flex gap-3">
          <div className="shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-11 h-11 rounded-full object-cover border border-slate-100"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-700 text-sm font-bold uppercase">
                {(author?.profile?.firstName || 'M').charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div>
                <p className="font-semibold text-slate-900 text-sm">{authorName}</p>
                <p className="text-xs text-slate-500">
                  {new Date(post.createdAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              {!isSelf && onFollowAuthor && authorOid && (
                <button
                  type="button"
                  onClick={(e) => onFollowAuthor(authorOid, e)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition shrink-0 ${
                    followingAuthor
                      ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      : 'border-ori-200 text-ori-700 bg-ori-50 hover:bg-ori-100'
                  }`}
                >
                  {followingAuthor ? (
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
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-2 leading-snug">{post.title}</h3>
            <p className="text-slate-600 text-sm mt-1 line-clamp-3 whitespace-pre-wrap">{post.content}</p>

            {imageUrls.length > 0 && (
              <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                <FeedImageMosaic urls={imageUrls} />
              </div>
            )}

            {post.linkUrl && (
              <a
                href={post.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-3 flex rounded-lg border border-slate-200 overflow-hidden hover:bg-slate-50/80 transition text-left max-w-lg"
              >
                {post.linkPreview?.image ? (
                  <img
                    src={resolveFileUrl(post.linkPreview.image) || post.linkPreview.image}
                    alt=""
                    className="w-24 h-24 object-cover shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 shrink-0 bg-slate-100 border-r border-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                    Link
                  </div>
                )}
                <div className="p-3 min-w-0">
                  <p className="text-xs text-slate-500 line-clamp-1">{linkHostname(post.linkUrl)}</p>
                  <p className="font-semibold text-slate-900 text-sm line-clamp-2">
                    {post.linkPreview?.title || post.linkUrl}
                  </p>
                  {post.linkPreview?.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{post.linkPreview.description}</p>
                  )}
                </div>
              </a>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              {post.category && post.category !== 'GENERAL' && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                  {CATEGORY_LABELS[post.category] || post.category}
                </span>
              )}
              {post.location && (
                <span className="inline-flex items-center gap-1 text-xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                  <MapPin className="w-3 h-3" /> {post.location}
                </span>
              )}
              {post.university && (
                <span className="inline-flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                  <GraduationCap className="w-3 h-3" /> {post.university}
                </span>
              )}
              {(post.tags || []).map((tag) => (
                <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 sm:gap-3 mt-4 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={(e) => onUpvote(post._id, e)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition min-h-[40px] ${
              thumbUp ? 'text-ori-600 bg-ori-50' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${thumbUp ? 'fill-current' : ''}`} />
            <span>{post.upvotes?.length ?? 0}</span>
          </button>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageSquare className="w-4 h-4" />
            {post.commentCount ?? 0}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Eye className="w-3.5 h-3.5" /> {post.views}
          </span>
          <button
            type="button"
            onClick={(e) => onSave(post._id, e)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition ml-auto ${
              saved ? 'text-amber-700 bg-amber-50' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </article>
  );
}
