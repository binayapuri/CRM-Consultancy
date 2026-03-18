import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Newspaper, Calendar, Eye, Tag, Shield } from 'lucide-react';

export default function PublicNews() {
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');

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

  const categoryLabel = (article: any) =>
    (article.categoryId as { name?: string } | null)?.name || article.category || 'News';

  const tabs = [{ id: '', label: 'All' }, ...categories.map(c => ({ id: c.slug, label: c.name }))];

  return (
    <div className="min-h-screen bg-[#020617] selection:bg-emerald-500/30 flex flex-col">
       <Helmet>
        <title>Australian Migration News & Updates | Big Few</title>
        <meta name="description" content="Stay informed with the latest Australian immigration changes, PR pathway updates, and skilled migration news from Big Few." />
        <meta property="og:title" content="Australian Migration News & Updates | Big Few" />
        <meta property="og:description" content="Stay informed with the latest Australian immigration changes and skilled migration news." />
      </Helmet>
      {/* Nav */}
      <nav className="w-full top-0 border-b border-white/5 bg-[#020617]">
        <div className="flex items-center justify-between px-6 lg:px-12 py-5 max-w-7xl mx-auto">
          <Link to="/" className="group flex flex-col leading-tight">
            <span className="text-2xl font-display font-black tracking-tighter text-white group-hover:drop-shadow-[0_0_15px_rgba(52,211,153,0.5)] transition-all">
              <span className="text-white">BIG</span>
              <span className="text-emerald-400">FEW</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
              Evolution of Migration
            </span>
          </Link>
          <div className="flex items-center gap-8">
            <Link to="/#news" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Back to Home</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-12 py-12 relative z-10">
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight mb-4">Visa News & Updates</h1>
          <p className="text-slate-400 text-lg">Stay informed with the latest immigration changes and guides from verified sources.</p>
        </div>

        {/* Filters */}
        {tabs.length > 1 && (
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  categoryFilter === tab.id
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
              <Newspaper className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No news published yet</h3>
            <p className="text-slate-400">We'll update this space soon.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link
                key={article._id}
                to={`/news/${article.slug}`}
                className="group flex flex-col bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300"
              >
                {article.coverImage ? (
                  <div className="h-48 shrink-0 overflow-hidden relative border-b border-white/10">
                    <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-[10px] font-bold uppercase tracking-wider border border-white/10">
                      {categoryLabel(article)}
                    </div>
                  </div>
                ) : (
                  <div className="h-48 shrink-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border-b border-white/10 relative overflow-hidden group-hover:from-slate-700 transition-colors">
                    <Newspaper className="w-12 h-12 text-slate-600 group-hover:scale-110 group-hover:text-emerald-500/50 transition-all duration-500" />
                    <div className="absolute top-3 left-3 px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-slate-200 text-[10px] font-bold uppercase tracking-wider border border-white/10">
                      {categoryLabel(article)}
                    </div>
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-display font-bold text-white leading-tight mb-3 group-hover:text-emerald-400 transition-colors line-clamp-2">
                       {article.title}
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 mb-4">
                      {article.summary || article.content}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(article.publishedAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {article.views} reads</span>
                    </div>
                    {((article.tags || []).length > 0) && (
                       <div className="flex flex-wrap gap-1.5 mt-1">
                          {(article.tags || []).slice(0, 3).map((tag: string) => (
                             <span key={tag} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-white/5 border border-white/5 px-2 py-1 rounded-md uppercase tracking-wide">
                                <Tag className="w-2.5 h-2.5" /> {tag}
                             </span>
                          ))}
                       </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/10 py-12 relative z-10 bg-black/50 mt-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-display font-black tracking-tighter text-white">
              <span className="text-white">BIG</span>
              <span className="text-emerald-400">FEW</span>
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">© 2026 Dream Big, Hustle Few. Australian Migration CRM.</p>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400 text-sm font-medium">
            <Shield className="w-4 h-4 text-emerald-400" /> Secure Australian Data Hosting
          </div>
        </div>
      </footer>
    </div>
  );
}
