import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Plane, GraduationCap, Heart, Briefcase, Users, Globe2, ShieldCheck, Phone, Search, ArrowRight } from 'lucide-react';
import { PublicMarketingHeader } from '../../components/public/PublicMarketingHeader';
import { PublicMarketingFooter } from '../../components/public/PublicMarketingFooter';
import {
  BRAND_DOMAIN,
  BRAND_NAME,
  COMPANY_EMAIL,
  COMPANY_PHONE_DISPLAY,
  COMPANY_PHONE_TEL,
} from '../../constants/brand';
import {
  AUSTRALIAN_VISAS,
  getVisaCategories,
  searchVisas,
  type AustralianVisaCategory,
} from '../../data/australianVisas';

const CATEGORY_ICON: Partial<Record<AustralianVisaCategory, typeof Plane>> = {
  'Visitor & transit': Plane,
  'Working Holiday': Globe2,
  'Study & training': GraduationCap,
  'Graduate & post-study': GraduationCap,
  'Temporary work & activity': Briefcase,
  'Employer sponsored': Briefcase,
  'Skilled migration': Briefcase,
  'Regional pathways': Globe2,
  'Business & innovation': Briefcase,
  'Family & partner': Heart,
  'Parent & child': Users,
  'Bridging & status': ShieldCheck,
  'Residency & return': Globe2,
  'Humanitarian & protection': Heart,
  Other: Globe2,
};

export default function AustralianVisasPage() {
  const canonical = `https://${BRAND_DOMAIN}/visas`;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<AustralianVisaCategory | 'All'>('All');

  const categories = useMemo(() => ['All' as const, ...getVisaCategories()], []);

  const filtered = useMemo(() => {
    let list = searchVisas(query);
    if (category !== 'All') list = list.filter((v) => v.category === category);
    return list;
  }, [query, category]);

  const grouped = useMemo(() => {
    const map = new Map<AustralianVisaCategory, typeof AUSTRALIAN_VISAS>();
    for (const v of filtered) {
      const arr = map.get(v.category) ?? [];
      arr.push(v);
      map.set(v.category, arr);
    }
    return map;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col selection:bg-emerald-500/30">
      <Helmet>
        <title>Australian visa subclasses & requirements | {BRAND_NAME}</title>
        <meta
          name="description"
          content="Browse Australian visa subclasses with checklists and requirement overviews. General information only — confirm on Home Affairs. Not legal advice."
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`Australian visas | ${BRAND_NAME}`} />
        <meta
          property="og:description"
          content="Visitor, student, skilled, family, regional, and other subclasses — open any visa for a detailed checklist."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="keywords"
          content="Australia visa, subclass 500, 600 visitor, 482, 485, 189, partner visa, skilled migration, Home Affairs"
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Australian visa subclasses',
            url: canonical,
            description: 'Educational overview of Australian visa subclasses with links to Home Affairs.',
            publisher: { '@type': 'Organization', name: BRAND_NAME, url: `https://${BRAND_DOMAIN}` },
          })}
        </script>
      </Helmet>

      <PublicMarketingHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-[#020617] to-indigo-950/30 pointer-events-none" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">Department of Home Affairs — general reference</p>
            <h1 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight leading-[1.1] mb-4">
              Australian visas — subclasses & detail
            </h1>
            <p className="text-lg text-slate-300 max-w-3xl leading-relaxed mb-6">
              Explore common visa subclasses aligned with{' '}
              <a
                href="https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
              >
                Home Affairs visa listing
              </a>
              . Click any card for checklists, typical documents, and conditions summaries — then always verify current law
              on the official site or with a <strong className="text-white">registered migration agent</strong>.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              <a
                href={`tel:${COMPANY_PHONE_TEL}`}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold text-white ring-1 ring-white/15 hover:bg-white/15"
              >
                <Phone className="w-4 h-4 text-emerald-400" /> {COMPANY_PHONE_DISPLAY}
              </a>
              <a
                href={`mailto:${COMPANY_EMAIL}?subject=Visa%20enquiry`}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-5 py-2.5 text-sm font-bold text-emerald-200 ring-1 ring-emerald-500/40 hover:bg-emerald-500/25"
              >
                Email {COMPANY_EMAIL}
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center max-w-2xl">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <input
                  type="search"
                  placeholder="Search by subclass, title, or keyword…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full min-h-[48px] pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 text-base"
                />
              </div>
              <label className="sr-only" htmlFor="visa-category">
                Category
              </label>
              <select
                id="visa-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as AustralianVisaCategory | 'All')}
                className="min-h-[48px] px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 w-full sm:w-56 text-base"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-slate-900">
                    {c === 'All' ? 'All categories' : c}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Showing <strong className="text-slate-400">{filtered.length}</strong> of {AUSTRALIAN_VISAS.length} guides
            </p>
          </div>
        </section>

        {Array.from(grouped.entries()).map(([cat, visas]) => {
          const Icon = CATEGORY_ICON[cat] ?? Globe2;
          return (
            <section
              key={cat}
              id={cat.replace(/\s+/g, '-').toLowerCase()}
              className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-12 border-b border-white/5 scroll-mt-28"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center ring-1 ring-emerald-500/30">
                  <Icon className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-black text-white">{cat}</h2>
              </div>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                {visas.map((v) => (
                  <Link
                    key={v.slug}
                    to={`/visas/${v.slug}`}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 hover:border-emerald-500/35 hover:bg-white/[0.05] transition-all text-left flex flex-col min-h-[8rem]"
                  >
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {v.subclasses.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] font-black uppercase tracking-wider text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded-md"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-emerald-200 transition-colors leading-snug">
                      {v.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed flex-1 line-clamp-3">{v.summary}</p>
                    <span className="inline-flex items-center gap-1 mt-3 text-sm font-bold text-emerald-400 group-hover:text-emerald-300">
                      Full detail & checklist <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {filtered.length === 0 ? (
          <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400">
            No visas match your search. <button type="button" className="text-emerald-400 font-bold underline" onClick={() => { setQuery(''); setCategory('All'); }}>Clear filters</button>
          </div>
        ) : null}

        <section id="visitor-cta" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-16 scroll-mt-24">
          <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/50 to-slate-900/80 p-8 sm:p-10">
            <div className="flex items-start gap-4">
              <Users className="w-10 h-10 text-emerald-400 shrink-0" />
              <div>
                <h2 className="text-2xl font-display font-black text-white mb-3">Planning a visit?</h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Open the <Link to="/visas/visitor-600" className="text-emerald-400 font-bold hover:underline">Visitor (600)</Link> guide for streams, checklists, and documents — then confirm on Home Affairs.
                </p>
                <Link to="/news" className="inline-flex font-bold text-emerald-300 hover:text-white underline underline-offset-2">
                  Read latest immigration news →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-16">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 flex gap-4">
            <ShieldCheck className="w-8 h-8 text-slate-400 shrink-0" />
            <div>
              <h3 className="font-bold text-white mb-2">Disclaimer</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {BRAND_NAME} provides general information only. Nothing here is legal or migration advice. Visa criteria,
                fees, and processing change — verify with{' '}
                <a href="https://immi.homeaffairs.gov.au/" className="text-emerald-400 underline" target="_blank" rel="noreferrer">
                  Home Affairs
                </a>{' '}
                and consult a registered migration agent or lawyer for your case.
              </p>
            </div>
          </div>
        </section>
      </main>

      <PublicMarketingFooter />
    </div>
  );
}
