import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Calendar, Eye, Shield, Tag } from 'lucide-react';
import { resolveFileUrl } from '../../lib/imageUrl';

export default function PublicNewsDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/news/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Article not found');
        return res.json();
      })
      .then(data => {
        setArticle(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex justify-center items-center">
        <Helmet>
          <title>Loading... | Big Few</title>
        </Helmet>
        <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <Helmet>
          <title>Article Not Found | Big Few</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <h2 className="text-2xl font-bold text-white mb-4">Article Not Found</h2>
        <p className="text-slate-400 mb-8">The news article you're looking for doesn't exist or has been removed.</p>
        <Link to="/news" className="px-6 py-3 rounded-full bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors">
          Back to News
        </Link>
      </div>
    );
  }

  const plainTextExcerpt = (article.summary || article.content?.replace(/<[^>]+>/g, '').substring(0, 160) || 'News from Big Few') + '...';

  return (
    <div className="min-h-screen bg-[#020617] selection:bg-emerald-500/30 flex flex-col">
      <Helmet>
        <title>{`${article.title} - Big Few News`}</title>
        <meta name="description" content={plainTextExcerpt} />
        <meta property="og:title" content={`${article.title} - Big Few`} />
        <meta property="og:description" content={plainTextExcerpt} />
        {article.coverImage && <meta property="og:image" content={article.coverImage} />}
        {article.categoryId?.name && <meta name="keywords" content={article.categoryId.name} />}
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
            <Link to="/news" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> All News
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 lg:py-16">
        <div className="mb-8 animate-fade-in-up">
           <Link to="/news" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
           </Link>
           
           <div className="flex flex-wrap items-center gap-4 mb-5 text-sm font-bold text-slate-400">
              <span className="px-3 py-1 rounded-full bg-white/10 text-emerald-400 border border-white/10 uppercase tracking-widest text-[10px]">
                 {article.categoryId?.name || article.category || 'Update'}
              </span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(article.publishedAt).toLocaleDateString()}</span>
              <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {article.views} reads</span>
           </div>
           
           <h1 className="text-4xl md:text-5xl font-display font-black text-white leading-[1.1] mb-6 tracking-tight">
             {article.title}
           </h1>
           
           {(article.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {article.tags.map((tag: string) => (
                  <span key={tag} className="flex items-center gap-1.5 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                     <Tag className="w-3 h-3 text-slate-500" /> {tag}
                  </span>
                ))}
              </div>
           )}
        </div>
        
        {article.coverImage && (
           <div className="w-full aspect-video rounded-3xl overflow-hidden border border-white/10 mb-12 shadow-2xl bg-white/5 animate-fade-in-up flex items-center justify-center">
             <img src={resolveFileUrl(article.coverImage)} alt={article.title} className="w-full h-full object-cover" />
           </div>
        )}
        
        <div className="prose prose-invert prose-emerald max-w-none animate-fade-in-up prose-headings:font-display prose-headings:font-bold prose-p:text-slate-300 prose-p:leading-loose prose-a:text-emerald-400 prose-img:rounded-2xl" dangerouslySetInnerHTML={{ __html: article.content || '' }} />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 relative z-10 bg-black/50 mt-12">
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
