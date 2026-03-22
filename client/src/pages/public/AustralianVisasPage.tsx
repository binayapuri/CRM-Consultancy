import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Plane,
  GraduationCap,
  Heart,
  Briefcase,
  Users,
  Globe2,
  ShieldCheck,
  Phone,
} from 'lucide-react';
import { PublicMarketingHeader } from '../../components/public/PublicMarketingHeader';
import { PublicMarketingFooter } from '../../components/public/PublicMarketingFooter';
import { BRAND_DOMAIN, BRAND_NAME, COMPANY_EMAIL, COMPANY_PHONE_DISPLAY } from '../../constants/brand';

const visaGroups = [
  {
    title: 'Visitor & short stay',
    icon: Plane,
    id: 'visitor',
    items: [
      {
        name: 'Visitor (subclass 600)',
        blurb:
          'Tourism, family visits, or short business activities. Genuine temporary entrant is key; stay limits apply per stream.',
      },
      {
        name: 'Electronic Travel Authority (601) & eVisitor (651)',
        blurb: 'Eligible passport holders—streamlined online applications for short tourism or business visits.',
      },
      {
        name: 'Working Holiday (417 / 462)',
        blurb: 'Young adults from eligible countries—holiday with limited work rights; age and caps apply.',
      },
    ],
  },
  {
    title: 'Study in Australia',
    icon: GraduationCap,
    id: 'study',
    items: [
      {
        name: 'Student (subclass 500)',
        blurb: 'Full-time study at a registered provider; work caps, course progress, and health insurance (OSHC) required.',
      },
      {
        name: 'Student Guardian (590)',
        blurb: 'For parents or guardians accompanying a student under 18 in limited circumstances.',
      },
      {
        name: 'Training (407)',
        blurb: 'Structured workplace-based training to enhance skills in your occupation.',
      },
    ],
  },
  {
    title: 'Skilled & work',
    icon: Briefcase,
    id: 'skilled',
    items: [
      {
        name: 'Temporary Skill Shortage (482)',
        blurb: 'Employer-sponsored skilled roles; pathways may link to permanent residence where eligible.',
      },
      {
        name: 'Skilled Independent (189) & Nominated (190) & Regional (491)',
        blurb: 'Points-tested PR pathways—skills lists, state/territory nomination, and English thresholds evolve with policy.',
      },
      {
        name: 'Temporary Graduate (485)',
        blurb: 'Post-study work for eligible graduates—duration depends on qualification and study location.',
      },
    ],
  },
  {
    title: 'Family & partner',
    icon: Heart,
    id: 'family',
    items: [
      {
        name: 'Partner (820/801 onshore, 309/100 offshore)',
        blurb: 'For spouses and de facto partners of Australian citizens, PRs, or eligible NZ citizens—evidence of genuine relationship.',
      },
      {
        name: 'Child & dependent',
        blurb: 'Various subclasses for dependent children or adoption scenarios—eligibility depends on sponsor status.',
      },
      {
        name: 'Parent',
        blurb: 'Contributory and non-contributory queues—long wait times; balance-of-family test may apply.',
      },
    ],
  },
  {
    title: 'Other common categories',
    icon: Globe2,
    id: 'other',
    items: [
      {
        name: 'Working Holiday & seasonal programs',
        blurb: 'Country-specific agreements—check age limits and work restrictions.',
      },
      {
        name: 'Bridging visas',
        blurb: 'Maintain lawful status while a substantive application is processed—conditions vary.',
      },
      {
        name: 'Resident Return (155/157)',
        blurb: 'For permanent residents travelling overseas—ensure your travel facility is valid.',
      },
    ],
  },
];

export default function AustralianVisasPage() {
  const canonical = `https://${BRAND_DOMAIN}/visas`;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col selection:bg-emerald-500/30">
      <Helmet>
        <title>Australian visa types explained | {BRAND_NAME}</title>
        <meta
          name="description"
          content="Overview of Australian visitor, student, skilled, partner, and family visas. General information only—not legal advice. Operated by AuthKeep."
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`Australian visa types | ${BRAND_NAME}`} />
        <meta
          property="og:description"
          content="Plain-English overview of popular Australian visas. Always confirm current rules with Home Affairs and a registered migration agent."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="keywords"
          content="Australia visa, subclass 600 visitor visa, student visa 500, skilled migration, partner visa, 482 TSS, 485 graduate, AuthKeep"
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Australian visa types',
            url: canonical,
            description: 'Educational overview of Australian visa subclasses.',
            publisher: { '@type': 'Organization', name: 'AuthKeep', url: 'https://authkeep.com' },
          })}
        </script>
      </Helmet>

      <PublicMarketingHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-[#020617] to-indigo-950/30 pointer-events-none" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-20">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">Australia migration</p>
            <h1 className="text-4xl sm:text-5xl font-display font-black text-white tracking-tight leading-[1.1] mb-6">
              Australian visa types — overview
            </h1>
            <p className="text-lg text-slate-300 max-w-3xl leading-relaxed mb-6">
              Australia’s visa system is detailed and rules change often. This hub summarises common categories for planning
              only—always check the{' '}
              <a
                href="https://immi.homeaffairs.gov.au/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
              >
                Department of Home Affairs
              </a>{' '}
              and speak with a <strong className="text-white">registered migration agent</strong> for advice on your situation.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={`tel:+61433432085`}
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
          </div>
        </section>

        {visaGroups.map((group) => (
          <section
            key={group.id}
            id={group.id}
            className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-14 border-b border-white/5 scroll-mt-24"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center ring-1 ring-emerald-500/30">
                <group.icon className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-display font-black text-white">{group.title}</h2>
            </div>
            <div className="grid gap-4 sm:gap-6">
              {group.items.map((v) => (
                <article
                  key={v.name}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 hover:border-emerald-500/25 transition-colors"
                >
                  <h3 className="text-lg font-bold text-white mb-2">{v.name}</h3>
                  <p className="text-slate-300 leading-relaxed text-sm sm:text-base">{v.blurb}</p>
                </article>
              ))}
            </div>
          </section>
        ))}

        <section id="visitor-cta" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-16 scroll-mt-24">
          <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/50 to-slate-900/80 p-8 sm:p-10">
            <div className="flex items-start gap-4">
              <Users className="w-10 h-10 text-emerald-400 shrink-0" />
              <div>
                <h2 className="text-2xl font-display font-black text-white mb-3">Call your parents? Visitor visas</h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Many families use the <strong className="text-white">Visitor (600)</strong> stream for parents or relatives
                  to attend graduations, meet new grandchildren, or travel together. You’ll need to show genuine temporary
                  stay, funds, and sometimes health insurance. Processing times vary by country and caseload.
                </p>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Planning a reunion? Gather passport, invitation letters, and evidence of ties to home country. A registered
                  migration agent can help present a complete application—{COMPANY_EMAIL} · {COMPANY_PHONE_DISPLAY}.
                </p>
                <Link
                  to="/news"
                  className="inline-flex font-bold text-emerald-300 hover:text-white underline underline-offset-2"
                >
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
                fees, and processing change—verify with Home Affairs and consult a registered migration agent or lawyer for
                your case.
              </p>
            </div>
          </div>
        </section>
      </main>

      <PublicMarketingFooter />
    </div>
  );
}
