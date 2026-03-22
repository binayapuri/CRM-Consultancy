import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Newspaper, Calendar, Eye, Tag, Sparkles, ArrowRight } from 'lucide-react';
import { resolveFileUrl } from '../../lib/imageUrl';
import { PublicMarketingHeader } from '../../components/public/PublicMarketingHeader';
import { PublicMarketingFooter } from '../../components/public/PublicMarketingFooter';
import { BRAND_DOMAIN, BRAND_NAME } from '../../constants/brand';

export default function PublicNews() {
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetch('/api/news/categories')
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = categoryFilter ? `/api/news?category=${encodeURIComponent(categoryFilter)}` : '/api/news';
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
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

  const tabs = [{ id: '', label: 'All' }, ...categories.map((c) => ({ id: c.slug, label: c.name }))];

  const canonical = `https://${BRAND_DOMAIN}/news`;
  const featured = articles[0];
  const rest = articles.slice(1);

  const jsonLd = useMemo(
    () =>
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'NewsMediaOrganization',
        name: BRAND_NAME,
        url: canonical,
        description: 'Australian migration news, visa updates, and skilled migration coverage.',
      }),
    [canonical]
  );

  return (
    <div className="min-h-screen bg-[#020617] selection:bg-emerald-500/30 flex flex-col text-slate-200">
      <Helmet>
        <title>Australian migration news & visa updates | {BRAND_NAME}</title>
        <meta
          name="description"
          content="Independent-style coverage of Australian immigration news, visa policy changes, and skilled migration updates. General information only."
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`Australian migration news | ${BRAND_NAME}`} />
        <meta
          property="og:description"
          content="Stay across visa rules, policy shifts, and pathways—with clear, readable articles."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="keywords"
          content="Australia immigration news, visa updates, skilled migration, student visa, PR news, Abroad Up"
        />
        <script type="application/ld+json">{jsonLd}</script>
      </Helmet>

      <PublicMarketingHeader />

      <main className="flex-1 w-full">
        <section className="relative border-b border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-[#020617] to-indigo-950/20 pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-12 pb-10 sm:pt-16 sm:pb-14">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">
              <Sparkles className="w-4 h-4" /> Newsroom
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-white tracking-tight max-w-4xl leading-[1.05]">
              Visa news that’s easy to read
            </h1>
            <p className="mt-5 text-lg text-slate-300 max-w-2xl leading-relaxed">
              Policy moves fast. We surface what matters for students, graduates, and skilled migrants—always verify with Home
              Affairs and a registered migration agent.
            </p>
          </div>
        </section>

        {tabs.length > 1 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all ${
                    categoryFilter === tab.id
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pb-16">
          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-24 rounded-3xl border border-white/10 bg-white/[0.03]">
              <Newspaper className="w-14 h-14 text-slate-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">No articles yet</h2>
              <p className="text-slate-400 mb-6">Check back soon for migration news.</p>
              <Link to="/visas" className="text-emerald-400 font-bold hover:underline">
                Browse Australian visa overview →
              </Link>
            </div>
          ) : (
            <>
              {featured && (
                <Link
                  to={`/news/${featured.slug}`}
                  className="group grid lg:grid-cols-2 gap-0 mb-12 rounded-3xl overflow-hidden border border-white/10 bg-white/[0.04] hover:border-emerald-500/30 transition-all"
                >
                  <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[320px] bg-slate-900">
                    {featured.coverImage ? (
                      <img
                        src={resolveFileUrl(featured.coverImage)}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
                        <Newspaper className="w-16 h-16 text-slate-600" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-black/70 text-white text-[10px] font-bold uppercase tracking-wider border border-white/10">
                      {categoryLabel(featured)}
                    </div>
                  </div>
                  <div className="p-8 lg:p-10 flex flex-col justify-center">
                    <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">Featured</span>
                    <h2 className="text-2xl sm:text-3xl font-display font-black text-white leading-tight mb-4 group-hover:text-emerald-300 transition-colors">
                      {featured.title}
                    </h2>
                    <p className="text-slate-300 leading-relaxed line-clamp-4 mb-6">
                      {(featured.summary || featured.content || '').replace(/<[^>]+>/g, '').slice(0, 280)}
                      …
                    </p>
                    <span className="inline-flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      Read full story <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="flex items-center gap-4 mt-6 text-xs text-slate-500 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(featured.publishedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        {featured.views} reads
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {rest.map((article) => (
                  <Link
                    key={article._id}
                    to={`/news/${article.slug}`}
                    className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-emerald-500/35 hover:bg-white/[0.06] transition-all"
                  >
                    {article.coverImage ? (
                      <div className="aspect-[16/10] overflow-hidden bg-slate-900">
                        <img
                          src={resolveFileUrl(article.coverImage)}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/10] bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                        <Newspaper className="w-10 h-10 text-slate-600" />
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 mb-2">
                        {categoryLabel(article)}
                      </span>
                      <h3 className="text-lg font-display font-bold text-white leading-snug mb-3 group-hover:text-emerald-300 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed line-clamp-3 flex-1">
                        {(article.summary || article.content || '').replace(/<[^>]+>/g, '')}
                      </p>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10 text-xs text-slate-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {article.views}
                        </span>
                      </div>
                      {(article.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {(article.tags || []).slice(0, 3).map((tag: string) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-black/30 border border-white/10 px-2 py-1 rounded-md"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <PublicMarketingFooter />
    </div>
  );
}
