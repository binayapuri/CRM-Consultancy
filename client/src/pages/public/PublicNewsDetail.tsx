import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Calendar, Eye, Newspaper } from 'lucide-react';
import { resolveFileUrl } from '../../lib/imageUrl';
import { PublicMarketingHeader } from '../../components/public/PublicMarketingHeader';
import { PublicMarketingFooter } from '../../components/public/PublicMarketingFooter';
import { BRAND_DOMAIN, BRAND_NAME } from '../../constants/brand';

function absoluteOgImage(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const r = resolveFileUrl(url);
  if (r.startsWith('http')) return r;
  if (typeof window !== 'undefined') return `${window.location.origin}${r.startsWith('/') ? '' : '/'}${r}`;
  return `https://${BRAND_DOMAIN}${r.startsWith('/') ? '' : '/'}${r}`;
}

export default function PublicNewsDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/news/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Article not found');
        return res.json();
      })
      .then((data) => {
        setArticle(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (!article?._id) return;
    fetch('/api/news?limit=8')
      .then((r) => r.json())
      .then((list: any[]) => {
        const arr = Array.isArray(list) ? list : [];
        setRelated(arr.filter((a) => a._id !== article._id && a.slug).slice(0, 3));
      })
      .catch(() => setRelated([]));
  }, [article]);

  const plainTextExcerpt = useMemo(() => {
    if (!article) return '';
    const raw = article.summary || article.content?.replace(/<[^>]+>/g, '') || '';
    return (raw.substring(0, 180) + (raw.length > 180 ? '…' : '')).trim();
  }, [article]);

  const canonical = article ? `https://${BRAND_DOMAIN}/news/${article.slug}` : '';
  const ogImage = article ? absoluteOgImage(article.coverImage) : undefined;

  const articleJsonLd = useMemo(() => {
    if (!article) return '';
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt || article.publishedAt,
      description: plainTextExcerpt,
      image: ogImage ? [ogImage] : undefined,
      author: { '@type': 'Organization', name: BRAND_NAME },
      publisher: {
        '@type': 'Organization',
        name: BRAND_NAME,
        url: `https://${BRAND_DOMAIN}`,
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    });
  }, [article, plainTextExcerpt, ogImage, canonical]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex justify-center items-center">
        <Helmet>
          <title>Loading… | {BRAND_NAME} News</title>
        </Helmet>
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <Helmet>
          <title>Article not found | {BRAND_NAME}</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <h2 className="text-2xl font-bold text-white mb-4">Article not found</h2>
        <p className="text-slate-400 mb-8 max-w-md">This story may have moved or been unpublished.</p>
        <Link
          to="/news"
          className="px-6 py-3 rounded-full bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors"
        >
          All news
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] selection:bg-emerald-500/30 flex flex-col text-slate-200">
      <Helmet>
        <title>{`${article.title} | ${BRAND_NAME} News`}</title>
        <meta name="description" content={plainTextExcerpt} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={plainTextExcerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={plainTextExcerpt} />
        {article.categoryId?.name && <meta name="keywords" content={article.categoryId.name} />}
        <script type="application/ld+json">{articleJsonLd}</script>
      </Helmet>

      <PublicMarketingHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-14">
        <div className="grid lg:grid-cols-[1fr_320px] gap-12 lg:gap-16">
          <article className="min-w-0">
            <Link
              to="/news"
              className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300 mb-8"
            >
              <ArrowLeft className="w-4 h-4" /> All news
            </Link>

            <div className="flex flex-wrap items-center gap-3 mb-6 text-xs font-bold uppercase tracking-widest text-slate-400">
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30">
                {article.categoryId?.name || article.category || 'Update'}
              </span>
              <span className="flex items-center gap-1.5 normal-case font-semibold tracking-normal">
                <Calendar className="w-4 h-4" />
                {new Date(article.publishedAt).toLocaleDateString('en-AU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1.5 normal-case font-semibold tracking-normal">
                <Eye className="w-4 h-4" />
                {article.views} reads
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-display font-black text-white leading-[1.12] mb-8 tracking-tight">
              {article.title}
            </h1>

            {article.coverImage && (
              <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/10 mb-10 shadow-2xl shadow-black/40">
                <img
                  src={resolveFileUrl(article.coverImage)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div
              className="public-article-body text-[17px] sm:text-lg leading-[1.75] space-y-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
              dangerouslySetInnerHTML={{ __html: article.content || '' }}
            />

            <p className="mt-12 pt-8 border-t border-white/10 text-sm text-slate-500 leading-relaxed">
              <strong className="text-slate-400">Disclaimer:</strong> General information only—not migration or legal advice.
              Verify requirements with the Department of Home Affairs and a registered migration agent.
            </p>
          </article>

          <aside className="lg:pt-14 space-y-8">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">More stories</h2>
              {related.length === 0 ? (
                <p className="text-slate-500 text-sm">Browse the news hub for more updates.</p>
              ) : (
                <ul className="space-y-4">
                  {related.map((r) => (
                    <li key={r._id}>
                      <Link
                        to={`/news/${r.slug}`}
                        className="group block font-bold text-white leading-snug hover:text-emerald-300 transition-colors"
                      >
                        <span className="line-clamp-3">{r.title}</span>
                        <span className="block text-xs text-slate-500 font-semibold mt-1 group-hover:text-slate-400">
                          {new Date(r.publishedAt).toLocaleDateString()}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                to="/news"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300"
              >
                View all <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>

            <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/40 to-slate-900 p-6">
              <Newspaper className="w-8 h-8 text-emerald-400 mb-3" />
              <h3 className="font-bold text-white mb-2">Visa overview</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Compare common Australian visa subclasses—visitor, student, skilled, family—in plain language.
              </p>
              <Link to="/visas" className="text-emerald-300 font-bold text-sm hover:underline">
                Explore visa types →
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <PublicMarketingFooter />
    </div>
  );
}
