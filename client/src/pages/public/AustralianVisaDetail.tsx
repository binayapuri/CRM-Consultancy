import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  ClipboardList,
  FileText,
  ListChecks,
  AlertCircle,
  Lightbulb,
  Link2,
} from 'lucide-react';
import { PublicMarketingHeader } from '../../components/public/PublicMarketingHeader';
import { PublicMarketingFooter } from '../../components/public/PublicMarketingFooter';
import { BRAND_DOMAIN, BRAND_NAME } from '../../constants/brand';
import { getVisaBySlug } from '../../data/australianVisas';

export default function AustralianVisaDetail() {
  const { slug } = useParams();
  const visa = getVisaBySlug(slug);
  const canonical = `https://${BRAND_DOMAIN}/visas/${slug ?? ''}`;

  if (!visa) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col">
        <PublicMarketingHeader />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Visa not found</h1>
          <p className="text-slate-400 mb-8">That page may have moved — browse all subclasses from the visa hub.</p>
          <Link to="/visas" className="text-emerald-400 font-bold hover:underline">
            ← Australian visas overview
          </Link>
        </main>
        <PublicMarketingFooter />
      </div>
    );
  }

  const related = (visa.relatedSlugs ?? [])
    .map((s) => getVisaBySlug(s))
    .filter(Boolean) as NonNullable<ReturnType<typeof getVisaBySlug>>[];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col selection:bg-emerald-500/30">
      <Helmet>
        <title>
          {visa.title} | Australian visas | {BRAND_NAME}
        </title>
        <meta name="description" content={`${visa.summary} General information only — not legal advice.`} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`${visa.title} | ${BRAND_NAME}`} />
        <meta property="og:description" content={visa.summary} />
        <meta property="og:url" content={canonical} />
      </Helmet>

      <PublicMarketingHeader />

      <main className="flex-1 w-full">
        <div className="border-b border-white/10 bg-gradient-to-b from-emerald-950/30 to-transparent">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
            <Link
              to="/visas"
              className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300 mb-6"
            >
              <ArrowLeft className="w-4 h-4" /> All visas
            </Link>
            <p className="text-emerald-400/90 text-xs font-bold uppercase tracking-[0.2em] mb-2">{visa.category}</p>
            <h1 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight leading-tight mb-3">
              {visa.title}
            </h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {visa.subclasses.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/15"
                >
                  Subclass {s}
                </span>
              ))}
            </div>
            <p className="text-lg text-slate-300 leading-relaxed">{visa.summary}</p>
            <a
              href={visa.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-200 ring-1 ring-emerald-500/40 hover:bg-emerald-500/25"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              Open on Department of Home Affairs
            </a>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-12 space-y-10">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ListChecks className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-display font-bold text-white">Who it is for</h2>
            </div>
            <p className="text-slate-300 leading-relaxed">{visa.whoItsFor}</p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-display font-bold text-white">Key requirements (overview)</h2>
            </div>
            <ul className="space-y-2">
              {visa.keyRequirements.map((req) => (
                <li key={req} className="flex gap-3 text-slate-300 leading-relaxed">
                  <span className="text-emerald-500 font-bold shrink-0">·</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-display font-bold text-white">Preparation checklist</h2>
            </div>
            <ol className="space-y-3 list-decimal list-inside text-slate-300">
              {visa.checklist.map((c, i) => (
                <li key={i} className="leading-relaxed pl-1">
                  <span className="font-semibold text-white">{c.step}</span>
                  {c.note ? <span className="block text-slate-400 text-sm mt-1 pl-6">{c.note}</span> : null}
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-white mb-4">Documents often used</h2>
            <ul className="grid sm:grid-cols-2 gap-2">
              {visa.commonDocuments.map((d) => (
                <li
                  key={d}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300"
                >
                  {d}
                </li>
              ))}
            </ul>
            {visa.commonDocuments.length === 0 ? (
              <p className="text-slate-500 text-sm">Varies widely — use Home Affairs checklists in ImmiAccount.</p>
            ) : null}
          </section>

          {visa.conditionsNotes.length > 0 ? (
            <section className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <h2 className="text-lg font-bold text-amber-100">Conditions & important notes</h2>
              </div>
              <ul className="space-y-2 text-slate-300 text-sm leading-relaxed">
                {visa.conditionsNotes.map((n) => (
                  <li key={n} className="flex gap-2">
                    <span className="text-amber-500 shrink-0">!</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {visa.processingTips && visa.processingTips.length > 0 ? (
            <section className="rounded-2xl border border-sky-500/20 bg-sky-950/20 p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-sky-400" />
                <h2 className="text-lg font-bold text-sky-100">Practical tips</h2>
              </div>
              <ul className="space-y-2 text-slate-300 text-sm">
                {visa.processingTips.map((t) => (
                  <li key={t}>• {t}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {related.length > 0 ? (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Link2 className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-display font-bold text-white">Related visas</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    to={`/visas/${r.slug}`}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-colors"
                  >
                    {r.title}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-slate-400 text-sm leading-relaxed">
              <strong className="text-slate-200">Disclaimer:</strong> {BRAND_NAME} publishes general information only. Visa
              law, fees, and processing change. Nothing here is legal or migration advice. Always confirm requirements on{' '}
              <a href="https://immi.homeaffairs.gov.au/" className="text-emerald-400 underline underline-offset-2" target="_blank" rel="noreferrer">
                immi.homeaffairs.gov.au
              </a>{' '}
              and consult a <strong className="text-slate-300">registered migration agent</strong> or lawyer for your
              situation.
            </p>
          </section>
        </div>
      </main>

      <PublicMarketingFooter />
    </div>
  );
}
