import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { authFetch } from '../../store/auth';
import CommunityPostCard, { type FeedPost } from '../../components/student/CommunityPostCard';
import CommunityComposer from '../../components/student/CommunityComposer';

const LOCATIONS = ['', 'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Gold Coast'];
const CATEGORIES = [
  { value: '', label: 'All Topics' },
  { value: 'ROOM_RENT', label: 'Room Rent' },
  { value: 'JOB_HELP', label: 'Job Help' },
  { value: 'COMMUNITY_SUPPORT', label: 'Community Support' },
  { value: 'STUDY_HELP', label: 'Study Help' },
  { value: 'GENERAL', label: 'General' },
];

type SortKey = 'recent' | 'top' | 'following' | 'saved';

export default function Community() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [filters, setFilters] = useState({ search: '', location: '', category: '' });
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const { user } = useAuthStore();

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, search: searchInput })), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadFollowing = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch('/api/community/following');
      if (res.ok) {
        const data = await res.json();
        const ids = Array.isArray(data.followingIds) ? data.followingIds : [];
        setFollowingIds(new Set(ids.map(String)));
      }
    } catch {
      /* ignore */
    }
  }, [user]);

  useEffect(() => {
    loadFollowing();
  }, [loadFollowing]);

  const fetchPosts = useCallback(
    async (opts: { reset: boolean; pageOverride?: number }) => {
      const nextPage = opts.reset ? 1 : opts.pageOverride ?? 1;
      try {
        if (opts.reset) setLoading(true);
        else setLoadingMore(true);
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        if (filters.location) params.set('location', filters.location);
        if (filters.category) params.set('category', filters.category);
        params.set('sort', sort);
        params.set('page', String(nextPage));
        params.set('limit', '15');
        const qs = params.toString();
        const res = await authFetch(`/api/community/posts?${qs}`);
        if (!res.ok) {
          if (res.status === 401 && (sort === 'saved' || sort === 'following')) {
            setPosts([]);
            setHasMore(false);
            return;
          }
          return;
        }
        const data = await res.json();
        const list = Array.isArray(data.posts) ? data.posts : [];
        if (opts.reset) {
          setPosts(list);
          setPage(1);
        } else {
          setPosts((prev) => [...prev, ...list]);
          setPage(nextPage);
        }
        setHasMore(!!data.hasMore);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters.search, filters.location, filters.category, sort]
  );

  useEffect(() => {
    fetchPosts({ reset: true, pageOverride: 1 });
  }, [filters.search, filters.location, filters.category, sort, fetchPosts]);

  const loadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    fetchPosts({ reset: false, pageOverride: page + 1 });
  };

  const userId = (user?._id || user?.id || '').toString();

  const handleUpvote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await authFetch(`/api/community/posts/${id}/upvote`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        const upvotes = (updated.upvotes || []).map((x: { toString: () => string }) => x.toString());
        setPosts((prev) =>
          prev.map((p) => (p._id === id ? { ...p, upvotes } : p))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const post = posts.find((p) => p._id === id);
    const currently = post?.isSaved === true;
    try {
      const res = await authFetch(`/api/community/posts/${id}/save`, {
        method: currently ? 'DELETE' : 'POST',
      });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => (p._id === id ? { ...p, isSaved: !currently } : p))
        );
        if (sort === 'saved' && currently) {
          setPosts((prev) => prev.filter((p) => p._id !== id));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollowAuthor = async (authorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await authFetch(`/api/community/follow/${authorId}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const on = data.following === true;
        setFollowingIds((prev) => {
          const next = new Set(prev);
          if (on) next.add(authorId);
          else next.delete(authorId);
          return next;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sortTabs: { key: SortKey; label: string }[] = [
    { key: 'recent', label: 'Recent' },
    { key: 'top', label: 'Top' },
    { key: 'following', label: 'Following' },
    { key: 'saved', label: 'Saved' },
  ];

  return (
    <div className="w-full animate-fade-in-up">
      <div className="flex flex-col lg:flex-row gap-8 lg:max-w-6xl mx-auto">
        <div className="flex-1 min-w-0 max-w-2xl mx-auto w-full">
          <header className="mb-6">
            <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Community</h1>
            <p className="text-slate-500 mt-1">Share updates, ask questions, and connect with other students.</p>
          </header>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
            <CommunityComposer
              open={composerOpen}
              onOpenChange={setComposerOpen}
              onPosted={() => fetchPosts({ reset: true })}
              user={user}
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {sortTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSort(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  sort === tab.key
                    ? 'bg-ori-600 text-white shadow-md shadow-ori-600/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-6">
            <div className="flex-1 min-w-0 sm:min-w-[200px] relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search posts…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-ori-500/50 focus:border-ori-500 transition"
              />
            </div>
            <select
              value={filters.location}
              onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
              className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-ori-500/50 font-medium text-slate-700 shrink-0"
            >
              <option value="">All locations</option>
              {LOCATIONS.filter(Boolean).map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <select
              value={filters.category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
              className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-ori-500/50 font-medium text-slate-700 shrink-0"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value || 'all'} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 rounded-full border-4 border-ori-500 border-t-transparent animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                <p className="text-slate-600 font-medium">
                  {sort === 'following'
                    ? 'Follow people to see their posts here, or discover posts in Recent.'
                    : sort === 'saved'
                      ? 'No saved posts yet.'
                      : 'No posts yet. Start the conversation!'}
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <CommunityPostCard
                  key={post._id}
                  post={post}
                  userId={userId}
                  onNavigate={(id) => navigate(`/student/community/${id}`)}
                  onUpvote={handleUpvote}
                  onSave={handleSave}
                  onFollowAuthor={user ? handleFollowAuthor : undefined}
                  followingAuthor={post.authorId?._id ? followingIds.has(post.authorId._id.toString()) : false}
                />
              ))
            )}
            {!loading && hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        </div>

        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-24 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-ori-700 font-bold mb-2">
                <Sparkles className="w-5 h-5" /> Tips
              </div>
              <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                <li>Use #hashtags in your post to reach the right people.</li>
                <li>Paste a link to fetch a title and description preview.</li>
                <li>Follow peers to build your feed.</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>

      {!composerOpen && (
        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className="fixed bottom-6 right-6 lg:hidden z-40 flex items-center gap-2 px-5 py-3 rounded-full bg-ori-600 text-white font-bold shadow-lg shadow-ori-600/30 active:scale-95"
          aria-label="New post"
        >
          <Plus className="w-5 h-5" /> Post
        </button>
      )}
    </div>
  );
}
