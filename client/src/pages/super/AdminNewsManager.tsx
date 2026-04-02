import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authFetch } from '../../store/auth';
import { safeJson } from '../../store/auth';
import { useUiStore } from '../../store/ui';
import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';

type ArticleRow = {
  _id: string;
  title: string;
  slug?: string;
  summary?: string;
  content: string;
  coverImage?: string;
  categoryId?: { _id: string; name: string; slug: string } | null;
  category?: string;
  tags?: string[];
  isPublished: boolean;
  publishedAt?: string;
  views: number;
  updatedAt: string;
};

type NewsCategory = { _id: string; name: string; slug: string; order?: number };

export default function AdminNewsManager() {
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const { showToast, openConfirm } = useUiStore();

  const fetchArticles = () =>
    authFetch('/api/news/admin')
      .then(r => safeJson<ArticleRow[]>(r))
      .then(data => setArticles(Array.isArray(data) ? data : []))
      .catch(() => setArticles([]));

  const fetchCategories = () =>
    authFetch('/api/admin/news/categories')
      .then(r => safeJson<NewsCategory[]>(r))
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchArticles(), fetchCategories()]).finally(() => setLoading(false));
  }, []);

  const handleDelete = (a: ArticleRow) => {
    openConfirm({
      title: 'Delete article',
      message: `Delete "${a.title}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/news/${a._id}`, { method: 'DELETE' });
          const data = res.ok ? null : await safeJson(res);
          if (res.ok) {
            showToast('Article deleted', 'success');
            fetchArticles();
          } else {
            showToast((data as any)?.error || 'Delete failed', 'error');
          }
        } catch (err: any) {
          showToast(err?.message || 'Request failed', 'error');
        }
      },
    });
  };

  const handlePublishToggle = async (a: ArticleRow) => {
    try {
      const res = await authFetch(`/api/news/${a._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !a.isPublished }),
      });
      const data = res.ok ? null : await safeJson(res);
      if (res.ok) {
        showToast(a.isPublished ? 'Unpublished' : 'Published', 'success');
        fetchArticles();
      } else {
        showToast((data as any)?.error || 'Update failed', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Request failed', 'error');
    }
  };

  const categoryName = (a: ArticleRow) =>
    (a.categoryId as any)?.name || a.category || '—';

  const filtered = categoryFilter
    ? articles.filter(a => {
        const catId = typeof a.categoryId === 'object' && a.categoryId !== null ? (a.categoryId as any)._id : a.categoryId;
        return String(catId) === categoryFilter;
      })
    : articles;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">News</h1>
          <p className="text-slate-500 mt-1">Manage platform news and articles. Add categories in Settings.</p>
        </div>
        <Link to="/admin/news/add" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add news
        </Link>
      </div>

      {categories.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Filter by category:</label>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="input w-48"
          >
            <option value="">All</option>
            {categories.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="card mt-6 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No articles yet. Add news or adjust the filter.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Title</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Category</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Published</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Views</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a._id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{a.title}</td>
                  <td className="px-4 py-3 text-slate-600">{categoryName(a)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${a.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {a.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-sm">
                    {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{a.views ?? 0}</td>
                  <td className="px-4 py-3 flex gap-1">
                    <button type="button" onClick={() => handlePublishToggle(a)} className="p-2 text-slate-500 hover:bg-slate-100 rounded" title={a.isPublished ? 'Unpublish (hide from public)' : 'Publish'}>
                      {a.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {a.slug && (
                      <a
                        href={`/news/${a.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-sky-600 hover:bg-sky-50 rounded inline-flex"
                        title="View on public site"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <Link to={`/admin/news/${a._id}/edit`} className="p-2 text-ori-600 hover:bg-ori-50 rounded" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button type="button" onClick={() => handleDelete(a)} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
