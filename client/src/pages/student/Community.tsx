import { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, MapPin, GraduationCap, Plus, Search, Eye } from 'lucide-react';
import { authFetch, useAuthStore } from '../../store/auth';

interface Post {
  _id: string;
  title: string;
  content: string;
  views: number;
  upvotes: string[];
  tags: string[];
  location?: string;
  university?: string;
  createdAt: string;
  authorId: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
    }
  }
}

export default function Community() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', tags: '', location: '', university: '', category: 'GENERAL', contactPreference: 'IN_APP_MESSAGE' });
  const [search, setSearch] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const { user } = useAuthStore();

  const fetchPosts = async () => {
    try {
      const qs = new URLSearchParams();
      if (search) qs.set('search', search);
      if (filterLocation) qs.set('location', filterLocation);
      if (filterCategory) qs.set('category', filterCategory);
      const res = await fetch(`/api/community/posts${qs.toString() ? `?${qs.toString()}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [search, filterLocation, filterCategory]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPost,
          tags: newPost.tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });
      if (res.ok) {
        setShowCreate(false);
        setNewPost({ title: '', content: '', tags: '', location: '', university: '', category: 'GENERAL', contactPreference: 'IN_APP_MESSAGE' });
        fetchPosts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpvote = async (id: string) => {
    try {
      const res = await authFetch(`/api/community/posts/${id}/upvote`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchPosts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Student Community</h1>
          <p className="text-slate-500 mt-1">Connect, ask questions, and share experiences with peers.</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-6 py-3 bg-ori-600 text-white rounded-xl font-bold hover:bg-ori-700 transition shadow-lg shadow-ori-600/20 active:scale-95"
        >
          <Plus className="w-5 h-5" /> New Discussion
        </button>
      </div>

      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search discussions..." className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-ori-500/50 focus:border-ori-500 transition" />
        </div>
        <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-ori-500/50 font-medium text-slate-700">
          <option value="">All Locations</option>
          <option>Sydney</option>
          <option>Melbourne</option>
          <option>Brisbane</option>
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-ori-500/50 font-medium text-slate-700">
          <option value="">All Categories</option>
          <option value="ROOM_RENT">Room Rent</option>
          <option value="JOB_HELP">Job Help</option>
          <option value="COMMUNITY_SUPPORT">Community Support</option>
          <option value="STUDY_HELP">Study Help</option>
          <option value="GENERAL">General</option>
        </select>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-ori-500 border-t-transparent animate-spin" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No discussions yet. Start one!</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post._id} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition group cursor-pointer">
              <div className="flex gap-4 items-start">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleUpvote(post._id); }}
                  className={`flex flex-col items-center p-2 rounded-lg transition-colors ${post.upvotes.includes(user?.id || '') ? 'text-ori-600 bg-ori-50' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                >
                  <ThumbsUp className={`w-5 h-5 ${post.upvotes.includes(user?.id || '') ? 'fill-current' : ''}`} />
                  <span className="text-sm font-bold mt-1">{post.upvotes.length}</span>
                </button>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-ori-600 transition-colors mb-2">{post.title}</h3>
                  <p className="text-slate-600 line-clamp-2 mb-4 text-sm leading-relaxed">{post.content}</p>
                  
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] uppercase">{post.authorId?.profile?.firstName?.charAt(0) || 'A'}</div> {post.authorId?.profile?.firstName} {post.authorId?.profile?.lastName}</span>
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {post.views}</span>
                    
                    {(post.location || post.university || post.tags.length > 0) && <div className="h-4 w-px bg-slate-300 mx-2 hidden sm:block" />}
                    
                    {post.location && <span className="flex items-center gap-1 text-sky-600 bg-sky-50 px-2 py-1 rounded-md"><MapPin className="w-3.5 h-3.5" /> {post.location}</span>}
                    {post.university && <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md"><GraduationCap className="w-3.5 h-3.5" /> {post.university}</span>}
                    {post.tags.map(tag => (
                      <span key={tag} className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">New Discussion</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                <input required value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="input" placeholder="What's on your mind?" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Content</label>
                <textarea required rows={5} value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} className="input resize-none" placeholder="Provide details..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
                  <input value={newPost.location} onChange={e => setNewPost({...newPost, location: e.target.value})} className="input" placeholder="e.g. Sydney" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">University</label>
                  <input value={newPost.university} onChange={e => setNewPost({...newPost, university: e.target.value})} className="input" placeholder="e.g. UNSW" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                  <select value={newPost.category} onChange={e => setNewPost({ ...newPost, category: e.target.value })} className="input">
                    <option value="GENERAL">General</option>
                    <option value="ROOM_RENT">Room Rent</option>
                    <option value="JOB_HELP">Job Help</option>
                    <option value="COMMUNITY_SUPPORT">Community Support</option>
                    <option value="STUDY_HELP">Study Help</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Preference</label>
                  <select value={newPost.contactPreference} onChange={e => setNewPost({ ...newPost, contactPreference: e.target.value })} className="input">
                    <option value="IN_APP_MESSAGE">In-app message</option>
                    <option value="EMAIL">Email</option>
                    <option value="PHONE">Phone</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tags (comma separated)</label>
                <input value={newPost.tags} onChange={e => setNewPost({...newPost, tags: e.target.value})} className="input" placeholder="visa, accommodation, jobs" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Post Discussion</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
