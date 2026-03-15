import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Calendar, Eye, Tag, Newspaper } from 'lucide-react';

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

export default function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError('Invalid article');
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/news/${encodeURIComponent(slug)}`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) throw new Error('Article not found');
          throw new Error('Failed to load article');
        }
        return res.json();
      })
      .then(data => {
        setArticle(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Something went wrong');
        setArticle(null);
        setLoading(false);
      });
  }, [slug]);

  const categoryLabel = article
    ? (article.categoryId as { name?: string } | null)?.name || article.category || 'News'
    : '';

  if (loading) {
    return (
      <div className="w-full animate-fade-in-up">
        <div className="flex items-center gap-2 text-slate-500 mb-6">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-sm font-medium">Loading article…</span>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="w-full animate-fade-in-up">
        <Link
          to="/student/news"
          className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Back to News
        </Link>
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Article not found</h2>
          <p className="text-slate-500 font-medium">{error || 'This article may have been removed or the link is invalid.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in-up max-w-4xl mx-auto">
      <nav className="mb-6" aria-label="Breadcrumb">
        <Link
          to="/student/news"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> News & Updates
        </Link>
      </nav>

      <article className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {article.coverImage && (
          <div className="aspect-[21/9] sm:aspect-[3/1] w-full overflow-hidden bg-slate-100">
            <img
              src={article.coverImage}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <header className="px-6 sm:px-10 pt-6 pb-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              {categoryLabel}
            </span>
            {(article.tags || []).map(t => (
              <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                <Tag className="w-3 h-3" /> {t}
              </span>
            ))}
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight leading-tight">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              {new Date(article.publishedAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-slate-400" />
              {article.views} {article.views === 1 ? 'read' : 'reads'}
            </span>
          </div>
        </header>

        <div
          className="px-6 sm:px-10 pb-10 text-slate-700 leading-relaxed
            [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-3
            [&_h3]:font-display [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:text-lg [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:mb-4 [&_p]:text-slate-700
            [&_a]:text-indigo-600 [&_a]:font-medium [&_a:hover]:underline
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1
            [&_strong]:font-semibold [&_strong]:text-slate-900"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>

      <div className="mt-6">
        <Link
          to="/student/news"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to all news
        </Link>
      </div>
    </div>
  );
}
