import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Calendar, Eye, ArrowRight, Tag } from 'lucide-react';
import { StudentSectionTabs } from '../../components/StudentSectionTabs';
import { resolveFileUrl } from '../../lib/imageUrl';

interface Article {
  _id: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  coverImage?: string;
  categoryId?: { _id: string; name: string; slug: string } | null;
  category?: string;
  tags?: string[];
  publishedAt: string;
  views: number;
}

type CategoryOption = { _id?: string; name: string; slug: string };

export default function News() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  useEffect(() => {
    fetch('/api/news/categories')
      .then(res => res.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = categoryFilter ? `/api/news?category=${encodeURIComponent(categoryFilter)}` : '/api/news';
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setArticles(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setArticles([]);
        setLoading(false);
      });
  }, [categoryFilter]);

  const categoryLabel = (article: Article) =>
    (article.categoryId as { name?: string } | null)?.name || article.category || 'News';

  const tabs = [{ id: '', label: 'All' }, ...categories.map(c => ({ id: c.slug, label: c.name }))];

  return (
    <div className="w-full animate-fade-in-up">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Visa News & Updates</h1>
        <p className="text-slate-500 mt-1">Stay informed with the latest immigration changes and guides from verified sources.</p>
      </div>

      {tabs.length > 1 && (
        <StudentSectionTabs
          tabs={tabs}
          activeId={categoryFilter}
          onChange={setCategoryFilter}
        />
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" /></div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <div className="w-14 h-14 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-3 border border-slate-100">
                <Newspaper className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">No news published yet</h3>
              <p className="text-slate-500 text-sm font-medium">We'll update this space soon.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article) => (
                <Link
                  key={article._id}
                  to={`/student/news/${article.slug}`}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col sm:flex-row"
                >
                  {article.coverImage ? (
                    <div className="sm:w-32 shrink-0 h-24 sm:h-[100px] overflow-hidden relative">
                      <img src={resolveFileUrl(article.coverImage)} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-md text-white text-[10px] font-bold uppercase tracking-wider">
                        {categoryLabel(article)}
                      </div>
                    </div>
                  ) : (
                    <div className="sm:w-32 shrink-0 h-24 sm:h-[100px] bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border-r border-slate-100 relative overflow-hidden">
                      <Newspaper className="w-8 h-8 text-slate-300 group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/80 backdrop-blur-sm rounded-md text-slate-700 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                        {categoryLabel(article)}
                      </div>
                    </div>
                  )}
                  <div className="p-4 sm:flex-1 flex flex-col justify-center min-w-0">
                    <h2 className="text-base font-display font-bold text-slate-900 leading-snug mb-1.5 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {article.title}
                    </h2>
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 mb-2">
                      {article.summary || article.content}
                    </p>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(article.publishedAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {article.views} reads</span>
                      </div>
                      {(article.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {(article.tags || []).slice(0, 2).map(tag => (
                            <span key={tag} className="flex items-center gap-0.5 text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                              <Tag className="w-2.5 h-2.5" /> {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                        Read <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
            <h3 className="text-lg font-display font-bold mb-2 relative z-10">Subscribe to Alerts</h3>
            <p className="text-slate-400 text-sm mb-4 relative z-10">Get instant updates on skilled migration changes and visa allocations.</p>
            <form className="relative z-10 space-y-3">
              <input type="email" placeholder="Your email address" className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition text-sm" />
              <button type="button" className="w-full py-2.5 rounded-lg bg-white text-slate-900 font-bold text-sm hover:bg-indigo-100 transition-colors">Notify Me</button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">Trending Topics</h3>
            </div>
            <div className="p-2">
              {['189 Visa Invites', 'State Sponsorship 190', '485 Extension Removed', 'Student Visa English Requirements'].map((topic, i) => (
                <div key={i} className="px-3 py-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                  <span className="text-sm font-medium text-slate-700">{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
