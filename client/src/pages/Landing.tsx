import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  GraduationCap,
  Building2,
  Calculator,
  Compass,
  Shield,
  Send,
  ArrowRight,
  Briefcase,
  BookOpen,
  FileText,
  Plane,
  Users,
  Newspaper,
  Sparkles,
  CheckCircle2,
  Target,
  ChevronDown,
  Percent,
  HelpCircle,
  HeartHandshake,
  Layers,
} from 'lucide-react';
import { resolveFileUrl } from '../lib/imageUrl';
import { AbroadUpLogo } from '../components/brand/AbroadUpLogo';
import { BrandMark } from '../components/brand/BrandMark';
import { PublicMarketingHeader } from '../components/public/PublicMarketingHeader';
import { PR_TRACKER_REGISTER } from '../components/public/marketingNavConfig';
import { HeroThreeScene } from '../components/landing/HeroThreeScene';
import { BRAND_NAME, BRAND_DOMAIN } from '../constants/brand';

const INTERESTS = [
  'Student Visa (500)',
  'Graduate Visa (485)',
  'Skilled Migration (189/190/491)',
  'Partner Visa',
  'Visitor Visa',
  'Other',
];

const visaTypes = [
  {
    code: '500',
    name: 'Student Visa',
    desc: 'From offer to enrolment — know what to lodge and when, with confidence at each step.',
    href: '/visas/student-500',
  },
  {
    code: '485',
    name: 'Graduate Visa',
    desc: 'Bridge study to work — see work rights and next steps from both study and career angles.',
    href: '/visas/temporary-graduate-485',
  },
  {
    code: '189',
    name: 'Skilled Independent',
    desc: 'Points-tested PR — track how your profile reads from skills, experience, and migration perspectives.',
    href: '/visas/skilled-independent-189',
  },
  {
    code: '190',
    name: 'Skilled Nominated',
    desc: 'State-nominated pathways — compare options so you determine what fits your situation.',
    href: '/visas/skilled-nominated-190',
  },
] as const;

const PROBLEM_SOLUTION = [
  {
    pain: 'Unsure if you can apply your visa yourself',
    painDetail:
      'It is normal to feel nervous — one blog says one thing, a friend says another, and you cannot see the whole picture.',
    fix: 'Confidence to apply — your way',
    fixDetail:
      'Clear steps, checklists, and visa context so you can lodge yourself where you are eligible, or walk into an agent meeting already informed.',
    icon: Plane,
  },
  {
    pain: 'Only seeing one angle on your future',
    painDetail:
      'Study, work, money, and migration all pull in different directions — spreadsheets do not show how they connect.',
    fix: 'Decide from multiple perspectives',
    fixDetail:
      'See your pathway through study, career, costs, and PR lenses in one place — so you choose what is right for you, not what sounds loudest online.',
    icon: Layers,
  },
  {
    pain: 'Too many tabs and DMs',
    painDetail: 'Jobs on one site, course fees on another, agents in WhatsApp — nothing talks to each other.',
    fix: 'One student hub',
    fixDetail: 'We route you to jobs, community, partner savings, and services from a single dashboard.',
    icon: Briefcase,
  },
] as const;

const STUDENT_CAPABILITIES = [
  { icon: Briefcase, title: 'Jobs & internships', desc: 'Search roles that fit students and grads — fewer dead ends.' },
  { icon: Users, title: 'Community', desc: 'Questions, tips, and peers who actually understand your stage.' },
  { icon: Percent, title: 'Fee savings & courses', desc: 'Partner programs with exclusive pricing and heavy discounts on selected tuition.' },
  { icon: HeartHandshake, title: 'Services & agents', desc: 'Find consultancies, book calls, and use trusted touchpoints.' },
  { icon: FileText, title: 'Documents & profile', desc: 'Keep what institutions and agents need in one vault.' },
  {
    icon: Plane,
    title: 'Apply your visa with confidence',
    desc: 'DIY-friendly guides and structure — lodge yourself where suitable, or brief an agent from a position of strength.',
  },
  {
    icon: Calculator,
    title: 'AI-powered PR tracker',
    desc: 'Plan your PR journey on your own timeline — points, pathways, and next steps in one place.',
  },
  { icon: Newspaper, title: 'News & policy signals', desc: 'What is changing for international students in Australia.' },
] as const;

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Sign up free',
    body: 'Create your student profile in minutes — no credit card. Unlock jobs, community, visa tools, services, and partner offers.',
  },
  {
    step: '02',
    title: 'See your pathway clearly',
    body: 'Explore visa guides, timelines, and tools — from different angles so you understand what matters before you lodge.',
  },
  {
    step: '03',
    title: 'Apply with confidence',
    body: 'Lodge your application yourself where you are ready, or use a consultant with full context — and save time on fees and jobs along the way.',
  },
] as const;

const FAQ_ITEMS = [
  {
    q: 'What is the AI-powered PR tracker?',
    a: `After you sign up, open the PR tools in your student area to plan your pathway in one place — points, timelines, and next steps as your situation changes. It is a planning aid, not immigration advice; always verify requirements with official sources or a registered migration agent.`,
  },
  {
    q: 'Can I apply for an Australian visa myself?',
    a: `Yes — many international students lodge their own applications through the official immigration system when they meet the requirements. ${BRAND_NAME} helps you stay organised, understand steps, and see your situation from different angles (timeline, costs, study vs work vs PR). Complex or high-risk cases may still benefit from a registered migration agent. We do not provide legal advice.`,
  },
  {
    q: 'How do I find jobs and internships?',
    a: `Start on our public jobs board — then create a free student account to save searches and use the full student hub. We surface roles that fit international students and graduates so you waste less time on listings that do not apply.`,
  },
  {
    q: 'Where is the student community?',
    a: `After you register, open Community in your student dashboard — ask questions, read what others learned, and join conversations built for people on your timeline (not a generic help desk).`,
  },
  {
    q: 'How can I save on tuition and course fees?',
    a: `Inside Training & courses, compare partner programs and access exclusive partner pricing — including heavy discounts on selected tuition when you enrol through Abroad Up partners. Offers depend on the provider, course, and intake; always read the partner terms before you commit.`,
  },
  {
    q: 'What services do I get as a student?',
    a: `Everything in one place: jobs, community, training offers, consultancies & bookings, visa guides and tools, documents, insurance touchpoints, and more — designed so you are not jumping between random apps and DMs.`,
  },
  {
    q: 'Does this replace a migration lawyer?',
    a: `No. ${BRAND_NAME} is built to make you more confident and informed — especially if you apply yourself — but it is not legal advice. For binding advice or a complex case, use a registered migration agent or qualified professional. Many students use both: self-lodge with clarity, or brief an agent with a complete picture.`,
  },
  {
    q: 'Is the student account free?',
    a: `Yes. Create your free profile to unlock the hub; paid services (like partner courses) are always clearly labelled by the provider.`,
  },
  {
    q: 'Is my data and privacy protected?',
    a: `We use secure hosting and sensible defaults. You decide what to upload, and community or consultancy features are designed so you opt in when you connect with others.`,
  },
] as const;

const TRUST_PILLARS = [
  {
    icon: Plane,
    label: 'Apply your visa yourself — confidently',
    sub: 'Structured guides and checklists so you know what to lodge, when, and why — DIY or with a pro.',
  },
  {
    icon: Layers,
    label: 'See every angle before you decide',
    sub: 'Study, career, money, and migration — same story, different perspectives, so nothing important stays hidden.',
  },
  {
    icon: Percent,
    label: 'Heavy savings on selected tuition',
    sub: 'Partner courses & training with exclusive discounts when you book through our partners.',
  },
] as const;

/** Front-page student services — drives sign-ups and public discovery (jobs, visas). */
const STUDENT_SERVICES = [
  {
    badge: 'Careers',
    title: 'Find jobs & internships',
    desc: 'Search graduate-friendly and student-friendly roles. Filter by location and industry — stop scrolling random job boards.',
    href: '/jobs',
    cta: 'Browse jobs now',
    icon: Briefcase,
    accent: 'border-emerald-500/30 bg-emerald-500/10',
  },
  {
    badge: 'Community',
    title: 'Student community',
    desc: 'Ask anything, share wins, and learn from peers on the same visa and study journey.',
    href: '/register?next=/student/community',
    cta: 'Join free',
    icon: Users,
    accent: 'border-sky-500/30 bg-sky-500/10',
  },
  {
    badge: 'Save on fees',
    title: 'Training & course discounts',
    desc: 'Compare partner programs and unlock exclusive pricing — including heavy discounts on selected tuition through Abroad Up partners.',
    href: '/register?next=/student/training-courses',
    cta: 'See partner offers',
    icon: GraduationCap,
    accent: 'border-amber-500/40 bg-amber-500/10',
  },
  {
    badge: 'Services',
    title: 'Find agents & book help',
    desc: 'Discover consultancies, read profiles, and book consultations — direct access to services when you need a human expert.',
    href: '/register?next=/student/consultancies',
    cta: 'Explore services',
    icon: HeartHandshake,
    accent: 'border-brand-gold/40 bg-brand-gold/10',
  },
  {
    badge: 'Visa confidence',
    title: 'Apply yourself — with full clarity',
    desc: 'Visa guides and roadmaps so you can lodge your own application where you are eligible, and see rules from multiple perspectives before you hit submit.',
    href: '/visas',
    cta: 'Explore visa guides',
    icon: Plane,
    accent: 'border-indigo-500/30 bg-indigo-500/10',
  },
  {
    badge: 'Your questions',
    title: 'Answers that save time',
    desc: 'Fees, jobs, community, pathways — we spell out what you get and how to start in minutes.',
    href: '#faq',
    cta: 'Read student FAQ',
    icon: HelpCircle,
    accent: 'border-violet-500/30 bg-violet-500/10',
  },
] as const;

const sectionScroll =
  'scroll-mt-[calc(3.75rem+env(safe-area-inset-top,0px))] md:scroll-mt-[calc(4.25rem+env(safe-area-inset-top,0px))]';

const HERO_ROTATING_WORDS = [
  'confidence to lodge your visa',
  'clarity from every angle',
  'apply yourself — stay sure',
  'jobs, community & savings',
] as const;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const fn = () => setReduced(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return reduced;
}

function Reveal({
  children,
  className = '',
  delayMs = 0,
  reducedMotion,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  reducedMotion: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (reducedMotion) {
      setShow(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setShow(true);
      },
      { threshold: 0.06, rootMargin: '0px 0px -12% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);
  return (
    <div
      ref={ref}
      data-reveal
      style={show && !reducedMotion ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={`transition-all duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function Landing() {
  const [enquiry, setEnquiry] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    interest: '',
    message: '',
  });
  const [enquiryStatus, setEnquiryStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [heroWordIndex, setHeroWordIndex] = useState(0);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      setHeroWordIndex((i) => (i + 1) % HERO_ROTATING_WORDS.length);
    }, 2800);
    return () => clearInterval(id);
  }, [reducedMotion]);

  const handleEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnquiryStatus('sending');
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enquiry),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEnquiryStatus('success');
      setEnquiry({ firstName: '', lastName: '', email: '', phone: '', interest: '', message: '' });
    } catch {
      setEnquiryStatus('error');
    }
  };

  return (
    <div className="landing-page min-h-landing-screen w-full max-w-[100vw] overflow-x-hidden bg-[#0f1f35] selection:bg-brand-gold/30 pb-[env(safe-area-inset-bottom,0px)]">
      <Helmet>
        <link rel="icon" type="image/png" href="/logo4.png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/logo4.png" />
        <title>{BRAND_NAME} | Plan your PR journey — AI-powered PR tracker, visas, jobs & student hub</title>
        <meta
          name="description"
          content={`Plan your PR journey today and move at your own pace with an AI-powered PR tracker, plus visa confidence, jobs, community, partner savings, and services — ${BRAND_DOMAIN}.`}
        />
        <meta
          name="keywords"
          content="Australia student visa, international students, PR pathways, study in Australia, migration platform, 500 visa, 485 visa, skilled migration"
        />
        <meta
          property="og:title"
          content={`${BRAND_NAME} | Plan your PR journey — AI-powered PR tracker`}
        />
        <meta
          property="og:description"
          content="Plan your PR journey today with an AI-powered PR tracker, plus visa confidence, jobs, community, and partner savings — free to start."
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: FAQ_ITEMS.map((item) => ({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: { '@type': 'Answer', text: item.a },
              })),
            }),
          }}
        />
      </Helmet>

      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-[-8%] left-[-15%] w-[min(100vw,28rem)] h-[min(100vw,28rem)] md:w-[40rem] md:h-[40rem] bg-brand-navy/35 rounded-full mix-blend-screen blur-[80px] md:blur-[100px] animate-blob opacity-70 md:opacity-100" />
        <div className="absolute top-[15%] right-[-12%] w-[min(95vw,26rem)] h-[min(95vw,26rem)] md:w-[35rem] md:h-[35rem] bg-brand-gold/20 rounded-full mix-blend-screen blur-[80px] md:blur-[100px] animate-blob animation-delay-2000 opacity-70 md:opacity-100" />
        <div className="absolute bottom-[-15%] left-[10%] w-[min(110vw,32rem)] h-[min(110vw,32rem)] md:w-[45rem] md:h-[45rem] bg-brand-navy-light/25 rounded-full mix-blend-screen blur-[80px] md:blur-[100px] animate-blob animation-delay-4000 opacity-60 md:opacity-100" />
      </div>

      <PublicMarketingHeader variant="landing" />

      <header
        data-landing-section
        className="relative w-full min-w-0 pt-6 sm:pt-8 lg:pt-8 pb-12 sm:pb-16 lg:pb-24 xl:pb-28 px-4 sm:px-6 lg:px-10 xl:px-12"
      >
        <div className="max-w-7xl mx-auto w-full min-w-0 grid grid-cols-1 lg:grid-cols-2 gap-y-6 sm:gap-y-8 lg:gap-y-0 lg:gap-x-[0.5cm] xl:gap-x-[0.55cm] items-start">
          <div className="relative z-10 order-2 lg:order-1 space-y-6 sm:space-y-8 min-w-0 animate-fade-in-up">
            <Link
              to={PR_TRACKER_REGISTER}
              className="inline-flex flex-wrap items-start sm:items-center gap-2 sm:gap-3 w-full max-w-xl px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl border border-emerald-500/35 bg-emerald-950/40 backdrop-blur-md text-emerald-100/95 hover:border-emerald-400/50 hover:bg-emerald-950/55 transition-colors shadow-[0_0_28px_rgba(16,185,129,0.12)]"
            >
              <Sparkles className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5 sm:mt-0" aria-hidden />
              <span className="text-left text-sm sm:text-base font-semibold leading-snug">
                <span className="text-white">Plan your PR journey today</span>
                <span className="text-emerald-200/90 font-normal"> — go on your own with our </span>
                <span className="text-emerald-300 font-bold">AI-powered PR tracker</span>
                <ArrowRight className="inline w-4 h-4 ml-1 align-text-bottom opacity-90" aria-hidden />
              </span>
            </Link>

            <div className="inline-flex flex-wrap items-center gap-2 sm:gap-3 max-w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-full border border-brand-gold/30 bg-brand-gold/10 backdrop-blur-md shadow-[0_0_30px_rgba(193,163,118,0.2)]">
              <div className="rounded-full bg-white/10 p-1 ring-1 ring-brand-gold/35 shrink-0">
                <BrandMark size="sm" className="opacity-95" />
              </div>
              <span className="relative flex h-3 w-3 shrink-0">
                {!reducedMotion && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold-light opacity-75" />
                )}
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-gold" />
              </span>
              <span className="text-[10px] xs:text-xs sm:text-sm font-bold text-brand-gold uppercase tracking-wider sm:tracking-widest leading-snug text-left">
                Apply with confidence · decide with perspective
              </span>
            </div>

            <h1 className="text-[clamp(1.65rem,5.5vw+0.35rem,3.75rem)] lg:text-[clamp(2.25rem,4vw+1rem,4.5rem)] font-display font-black text-white leading-[1.1] sm:leading-[1.08] tracking-tight break-words">
              Everything you need —{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold via-brand-gold-light to-brand-navy-light inline-block min-h-[1.15em] min-w-0 break-words [overflow-wrap:anywhere] transition-all duration-500">
                {HERO_ROTATING_WORDS[heroWordIndex]}
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-xl leading-relaxed font-light [text-wrap:balance]">
              <strong className="text-white font-semibold">Apply your visa yourself</strong> when you are ready — with
              structure that <strong className="text-white font-semibold">makes you confident</strong>.{' '}
              <strong className="text-white font-semibold">Plan PR on your terms</strong> with our tracker, then see your
              future from <strong className="text-white font-semibold">different perspectives</strong> — study, work, money,
              pathways — so nothing important stays vague. Layer in{' '}
              <strong className="text-white font-semibold">jobs</strong>,{' '}
              <strong className="text-white font-semibold">community</strong>,{' '}
              <strong className="text-white font-semibold">services</strong>, and{' '}
              <strong className="text-white font-semibold">partner tuition savings</strong> — one hub, not ten tabs.
            </p>

            <div className="flex flex-wrap gap-2 sm:gap-2.5 pt-1">
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-full bg-white/10 border border-white/15 text-xs sm:text-sm font-bold text-white hover:bg-white/15 active:scale-[0.98] transition-all touch-manipulation"
              >
                Explore services <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden />
              </a>
              <Link
                to="/jobs"
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-full bg-white/10 border border-white/15 text-xs sm:text-sm font-bold text-white hover:bg-white/15 active:scale-[0.98] transition-all touch-manipulation"
              >
                Find jobs
              </Link>
              <a
                href="#faq"
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-full bg-white/10 border border-white/15 text-xs sm:text-sm font-bold text-white hover:bg-white/15 active:scale-[0.98] transition-all touch-manipulation"
              >
                Your questions
              </a>
              <Link
                to={PR_TRACKER_REGISTER}
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-xs sm:text-sm font-bold text-emerald-100 hover:bg-emerald-500/25 active:scale-[0.98] transition-all touch-manipulation"
              >
                PR tracker
              </Link>
            </div>

            <ul className="space-y-2.5 text-slate-400 text-sm sm:text-base max-w-lg">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-gold-light shrink-0 mt-0.5" aria-hidden />
                <span>
                  <strong className="text-slate-200 font-semibold">DIY visa confidence</strong> — clear steps so you can
                  lodge yourself where eligible, or use an agent without guessing.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-gold-light shrink-0 mt-0.5" aria-hidden />
                <span>
                  <strong className="text-slate-200 font-semibold">Multi-angle clarity</strong> — same pathway, seen from
                  study, career, and migration angles so you can determine what fits you.
                </span>
              </li>
            </ul>

            <div className="flex flex-col xs:flex-row flex-wrap gap-3 sm:gap-4 pt-2 w-full max-w-lg">
              <Link
                to="/register"
                className="group relative flex flex-1 min-w-0 items-center justify-center gap-3 min-h-[52px] px-6 sm:px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-navy to-brand-gold text-white font-bold text-base sm:text-lg overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.99] shadow-[0_0_40px_rgba(27,54,93,0.45)] touch-manipulation w-full xs:flex-1"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                <GraduationCap className="w-6 h-6 relative z-10 shrink-0" aria-hidden />
                <span className="relative z-10 text-center">Get started free</span>
              </Link>
              <Link
                to="/login"
                className="group flex flex-1 min-w-0 items-center justify-center gap-3 min-h-[52px] px-6 sm:px-8 py-3.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md text-white font-bold text-base sm:text-lg hover:bg-white/10 hover:border-white/20 transition-all touch-manipulation w-full xs:flex-1"
              >
                <span>Sign in</span>
              </Link>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Consultancy or partner?{' '}
              <Link to="/login" className="text-brand-gold-light font-bold hover:underline">
                Business login
              </Link>{' '}
              ·{' '}
              <Link to="/register-consultancy" className="text-slate-400 hover:text-brand-gold-light">
                Register agency
              </Link>
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                to="/register-university"
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm font-bold hover:bg-white/10 transition-all"
              >
                <BookOpen className="w-4 h-4 text-slate-300" aria-hidden />
                University partner
              </Link>
              <Link
                to="/register-employer"
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm font-bold hover:bg-white/10 transition-all"
              >
                <Briefcase className="w-4 h-4 text-slate-300" aria-hidden />
                Employer / recruiter
              </Link>
            </div>
          </div>

          <div
            className="relative z-10 order-1 lg:order-2 w-full min-w-0 max-w-full mx-auto lg:mx-0 animate-fade-in-up max-lg:max-w-lg"
            style={{ animationDelay: reducedMotion ? undefined : '0.15s' }}
          >
            <div
              className={`relative w-full max-w-full aspect-[4/3] sm:aspect-[5/4] lg:aspect-square lg:max-h-none max-h-[min(58vh,26rem)] sm:max-h-none rounded-2xl xl:rounded-[2rem] overflow-hidden shadow-2xl shadow-brand-gold/20 border border-white/10 bg-gradient-to-br from-brand-navy/40 via-[#0f1f35] to-black/50 backdrop-blur-3xl ${reducedMotion ? '' : 'animate-float'}`}
            >
              <HeroThreeScene reducedMotion={reducedMotion} />
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
                alt="Students collaborating"
                className="absolute inset-0 z-[2] w-full h-full object-cover opacity-[0.78] sm:opacity-80"
              />
              <div className="absolute z-[3] top-4 left-4 right-4 sm:top-8 sm:left-8 sm:right-8 p-5 sm:p-7 md:p-8 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-7">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-brand-gold to-sky-400 p-[2px] shrink-0">
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center p-1.5">
                        <BrandMark size="lg" className="w-full h-full max-w-none max-h-none" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-base sm:text-lg font-bold text-white">Your visa · your move</p>
                      <p className="text-sm text-brand-gold-light">Confident · multi-angle view</p>
                    </div>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-full bg-brand-gold/20 text-brand-gold text-xs sm:text-sm font-bold border border-brand-gold/30 shrink-0">
                    On track
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-[78%] bg-gradient-to-r from-brand-gold to-brand-navy-light rounded-full relative">
                      {!reducedMotion && (
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:1rem_1rem] animate-[move_1s_linear_infinite]" />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400 font-medium">
                    <span>Lodge with clarity</span>
                    <span>See every angle</span>
                  </div>
                </div>
              </div>

              <div className="absolute z-[3] bottom-4 right-4 left-4 sm:left-auto sm:bottom-10 sm:right-10 px-4 py-3 sm:px-6 sm:py-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/15 flex items-center justify-center border border-indigo-500/25 p-1.5">
                  <Sparkles className="w-6 h-6 text-brand-gold-light" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Confident at every step</p>
                  <p className="text-xs text-slate-400">Study · work · PR — one lens at a time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div data-landing-section className="relative z-10 border-y border-white/5 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto w-full min-w-0 px-4 sm:px-6 lg:px-10 xl:px-12 py-8 sm:py-10">
          <Reveal reducedMotion={reducedMotion} className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-6 divide-y md:divide-y-0 md:divide-x divide-white/10">
              {TRUST_PILLARS.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex gap-4 md:px-6 first:md:pl-0 last:md:pr-0 pt-6 md:pt-0 first:pt-0">
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-brand-gold/15 border border-brand-gold/25 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brand-gold-light" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm sm:text-base leading-snug">{label}</p>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1 leading-relaxed">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      <section
        id="services"
        className={`py-12 sm:py-16 lg:py-24 xl:py-28 relative z-10 px-4 sm:px-6 lg:px-10 xl:px-12 border-t border-white/5 bg-gradient-to-b from-black/40 to-transparent ${sectionScroll}`}
      >
        <div className="max-w-7xl mx-auto w-full min-w-0">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 lg:mb-16 px-1">
            <p className="text-brand-gold-light font-bold text-xs sm:text-sm uppercase tracking-widest mb-3">Student services</p>
            <h2 className="text-[clamp(1.5rem,4.5vw+0.35rem,3rem)] sm:text-4xl lg:text-5xl font-display font-black text-white mb-4 sm:mb-5 [text-wrap:balance]">
              Services that make you confident
            </h2>
            <p className="text-lg text-slate-400 font-light leading-relaxed">
              Visa clarity (including <strong className="text-slate-200 font-semibold">apply yourself</strong>), jobs,
              community, partner fee savings, and agents —{' '}
              <strong className="text-slate-200 font-semibold">pick a path below</strong> and go straight there. Most tools
              unlock with your <strong className="text-slate-200 font-semibold">free student account</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {STUDENT_SERVICES.map(({ badge, title, desc, href, cta, icon: Icon, accent }, i) => {
              const cardClass =
                'group flex flex-col h-full min-h-0 rounded-[1.25rem] sm:rounded-[1.5rem] border bg-white/[0.04] p-5 sm:p-6 lg:p-7 transition-all duration-300 hover:bg-white/[0.07] active:scale-[0.99] sm:hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 touch-manipulation ' +
                accent;

              const inner = (
                <>
                  <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-gold-light leading-tight text-left">
                      {badge}
                    </span>
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-brand-gold/40 transition-colors">
                      <Icon className="w-5 h-5 text-brand-gold-light" aria-hidden />
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-display font-bold text-white mb-2 group-hover:text-brand-gold-light transition-colors [text-wrap:balance]">
                    {title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-5 sm:mb-6">{desc}</p>
                  <span className="inline-flex items-center gap-2 text-sm font-black text-white mt-auto">
                    {cta}
                    <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" aria-hidden />
                  </span>
                </>
              );

              const card =
                href.startsWith('#') ? (
                  <a href={href} className={cardClass}>
                    {inner}
                  </a>
                ) : (
                  <Link to={href} className={cardClass}>
                    {inner}
                  </Link>
                );

              return (
                <Reveal key={title} delayMs={i * 50} reducedMotion={reducedMotion} className="h-full min-h-0">
                  {card}
                </Reveal>
              );
            })}
          </div>

          <p className="text-center text-xs text-slate-500 mt-8 max-w-2xl mx-auto leading-relaxed">
            *Tuition and course discounts are offered by partner providers on selected intakes and programs; savings vary.
            Always confirm fees and terms with the provider before you enrol.
          </p>
        </div>
      </section>

      <section
        id="why"
        className={`py-12 sm:py-16 lg:py-24 xl:py-28 relative z-10 px-4 sm:px-6 lg:px-10 xl:px-12 border-t border-white/5 bg-black/25 ${sectionScroll}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14 lg:mb-20">
            <p className="text-brand-gold-light font-bold text-sm uppercase tracking-widest mb-3">Why it feels easier</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white mb-5">
              Made for how students actually live
            </h2>
            <p className="text-lg text-slate-400 font-light leading-relaxed">
              You want to <strong className="text-slate-200">apply your visa with confidence</strong>, see your plan from{' '}
              <strong className="text-slate-200">more than one angle</strong>, and still get{' '}
              <strong className="text-slate-200">jobs</strong>, <strong className="text-slate-200">community</strong>,{' '}
              <strong className="text-slate-200">services</strong>, and <strong className="text-slate-200">savings</strong>{' '}
              on fees — {BRAND_NAME} puts that in one place so you can determine what fits you.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {PROBLEM_SOLUTION.map(({ pain, painDetail, fix, fixDetail, icon: Icon }) => (
              <div
                key={pain}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] backdrop-blur-sm p-8 lg:p-10 hover:border-brand-gold/25 hover:bg-white/[0.06] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-brand-gold-light" aria-hidden />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">The challenge</p>
                <h3 className="text-xl font-display font-bold text-white mb-2">{pain}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">{painDetail}</p>
                <div className="h-px w-full bg-gradient-to-r from-brand-gold/40 to-transparent mb-6" />
                <p className="text-xs font-bold uppercase tracking-wider text-brand-gold-light mb-2">How we help</p>
                <h4 className="text-lg font-bold text-white mb-2">{fix}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{fixDetail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="everything" className={`py-12 sm:py-16 lg:py-24 xl:py-28 relative z-10 px-4 sm:px-6 lg:px-10 xl:px-12 ${sectionScroll}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 lg:mb-16">
            <div className="inline-flex items-center justify-center gap-3 mb-5">
              <span className="h-px w-12 sm:w-16 bg-gradient-to-r from-transparent to-brand-gold/60" aria-hidden />
              <Target className="w-6 h-6 text-brand-gold" aria-hidden />
              <span className="h-px w-12 sm:w-16 bg-gradient-to-l from-transparent to-brand-gold/60" aria-hidden />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white mb-4">
              Everything you need — with confidence from every angle
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto font-light">
              Pre-departure, on campus, or planning PR — one account connects visa clarity (including DIY), work, study
              offers, people, and tools so you can determine your next move without starting from zero each time.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {STUDENT_CAPABILITIES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent p-6 hover:border-brand-gold/30 transition-colors"
              >
                <Icon className="w-8 h-8 text-brand-gold-light mb-4" aria-hidden />
                <h3 className="text-lg font-display font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-brand-navy font-bold text-lg hover:bg-brand-gold-light transition-colors shadow-lg"
            >
              Start free — see it for yourself
              <ArrowRight className="w-5 h-5" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-24 xl:py-28 relative z-10 px-4 sm:px-6 lg:px-10 xl:px-12" aria-labelledby="platform-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 id="platform-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white mb-4">
              The hub students actually want to open
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto font-light">
              Jobs, savings, community, and services — engineered for international students first. Partners connect behind
              the scenes so your experience stays simple.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(260px,auto)] lg:auto-rows-[300px]">
            <div className="md:col-span-2 rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800 border border-white/5 p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-[80px] group-hover:bg-brand-gold/20 transition-colors duration-700" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                  <GraduationCap className="w-7 h-7 text-brand-gold-light" aria-hidden />
                </div>
                <h3 className="text-3xl font-display font-bold text-white mb-4">The student hub</h3>
                <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
                  Dashboards, tasks, document storage, visa context, PR estimators, peer community, and employer-facing
                  tools — orchestrated so you see the big picture and the next action in the same glance.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] bg-gradient-to-br from-indigo-950 to-slate-900 border border-white/5 p-10 relative overflow-hidden group">
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-[60px] group-hover:bg-indigo-500/30 transition-colors" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                    <Compass className="w-7 h-7 text-indigo-400" aria-hidden />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white mb-3">Smart guidance</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Context-aware help for what to prepare next — aligned to your visa class and goals, not generic blog
                    advice.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 p-10 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                  <Building2 className="w-7 h-7 text-sky-400" aria-hidden />
                </div>
                <h3 className="text-2xl font-display font-bold text-white mb-3">Agency-ready CRM</h3>
                <p className="text-slate-400 leading-relaxed">
                  For consultancies: pipelines, client workspaces, invoicing, and teams — integrated with the same ecosystem
                  students use.
                </p>
              </div>
            </div>

            <div className="md:col-span-2 rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 p-10 relative overflow-hidden group">
              <div className="absolute inset-y-0 right-0 w-1/2 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay group-hover:opacity-30 transition-opacity duration-700 aspect-square" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/85 to-transparent" />
              <div className="relative z-10 max-w-lg">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                  <Calculator className="w-7 h-7 text-amber-400" aria-hidden />
                </div>
                <h3 className="text-3xl font-display font-bold text-white mb-4">Bookings & trusted access</h3>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Request access to student profiles where appropriate, book consultations, and keep reviews and
                  communication in one auditable flow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className={`py-12 sm:py-16 lg:py-20 xl:py-28 relative z-10 px-4 sm:px-6 lg:px-10 xl:px-12 bg-black/35 border-y border-white/5 ${sectionScroll}`}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display font-black text-white text-center mb-12 lg:mb-16">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            {HOW_IT_WORKS.map(({ step, title, body }) => (
              <div key={step} className="relative text-center md:text-left">
                <span className="inline-block text-5xl font-black text-white/10 font-display mb-4">{step}</span>
                <h3 className="text-xl font-display font-bold text-white mb-3">{title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm lg:text-base">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pathways" className={`py-12 sm:py-16 lg:py-24 xl:py-28 relative z-10 px-4 sm:px-6 lg:px-10 xl:px-12 ${sectionScroll}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-black text-white mb-3">Pathways we support</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              From first student visa to skilled migration — your hub grows with you. Read the overview, then decide: apply
              yourself with structure, or pair with a registered professional when you need tailored advice.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visaTypes.map(({ code, name, desc, href }) => (
              <Link
                key={code}
                to={href}
                className="group block p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-gold/30 transition-all duration-300 backdrop-blur-sm cursor-pointer hover:-translate-y-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
              >
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 mb-6 group-hover:from-brand-gold group-hover:to-brand-navy/30 transition-all duration-300">
                  {code}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{name}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-gold-light opacity-0 group-hover:opacity-100 transition-opacity">
                  View checklist <ArrowRight className="w-4 h-4" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              to="/visas"
              className="inline-flex items-center gap-2 text-brand-gold-light font-bold hover:text-brand-gold transition-colors"
            >
              Browse visa overview <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section id="faq" className={`py-12 sm:py-16 lg:py-24 xl:py-28 relative z-10 px-4 sm:px-6 lg:px-10 xl:px-12 bg-black/25 border-y border-white/5 ${sectionScroll}`}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 lg:mb-14">
            <p className="text-brand-gold-light font-bold text-sm uppercase tracking-widest mb-3">Your questions</p>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-white mb-4">Straight answers for students</h2>
            <p className="text-slate-400 text-lg font-light">
              DIY visa confidence, multiple perspectives on your pathway, jobs, community, and savings — straight answers.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 sm:px-8">
            {FAQ_ITEMS.map((item, i) => {
              const expanded = faqOpen === i;
              return (
                <div key={item.q} className="border-b border-white/10 last:border-0">
                  <button
                    type="button"
                    className="w-full flex items-center sm:items-start justify-between gap-4 min-h-[52px] py-3 sm:py-5 md:py-6 text-left group touch-manipulation"
                    onClick={() => setFaqOpen(expanded ? null : i)}
                    aria-expanded={expanded}
                  >
                    <span className="font-display font-bold text-white text-sm sm:text-base md:text-lg pr-2 group-hover:text-brand-gold-light transition-colors [text-wrap:balance]">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 shrink-0 sm:mt-0.5 text-brand-gold transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                      aria-hidden
                    />
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-5 sm:pb-6 text-slate-400 text-sm sm:text-base leading-relaxed">{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="enquiry" className={`py-12 sm:py-16 lg:py-24 xl:py-28 relative z-10 px-4 sm:px-6 lg:px-10 xl:px-12 ${sectionScroll}`}>
        <div className="max-w-3xl mx-auto">
          <div className="p-10 lg:p-16 rounded-[2.5rem] bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-6 right-8 opacity-[0.07] pointer-events-none select-none" aria-hidden>
              <BrandMark size="xl" className="h-24 w-24 sm:h-28 sm:w-28" />
            </div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-gold/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-4">Partners & business enquiries</h2>
              <p className="text-slate-400 mb-6 text-lg">
                For universities, employers, agencies, or media — tell us what you need.{' '}
                <strong className="text-slate-300">Students:</strong> you do not need this form —{' '}
                <Link to="/register" className="text-brand-gold-light font-bold hover:underline">
                  create your free account
                </Link>{' '}
                and go straight to jobs, community, and services.
              </p>

              <form onSubmit={handleEnquiry} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">First name</label>
                    <input
                      value={enquiry.firstName}
                      onChange={(e) => setEnquiry((x) => ({ ...x, firstName: e.target.value }))}
                      required
                      className="w-full px-5 py-4 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all"
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Last name</label>
                    <input
                      value={enquiry.lastName}
                      onChange={(e) => setEnquiry((x) => ({ ...x, lastName: e.target.value }))}
                      required
                      className="w-full px-5 py-4 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Email</label>
                  <input
                    type="email"
                    value={enquiry.email}
                    onChange={(e) => setEnquiry((x) => ({ ...x, email: e.target.value }))}
                    required
                    className="w-full px-5 py-4 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all"
                    placeholder="your@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Interest</label>
                  <select
                    value={enquiry.interest}
                    onChange={(e) => setEnquiry((x) => ({ ...x, interest: e.target.value }))}
                    className="w-full px-5 py-4 rounded-2xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all appearance-none"
                  >
                    <option value="" className="bg-slate-900 text-slate-400">
                      Select a focus area…
                    </option>
                    {INTERESTS.map((i) => (
                      <option key={i} value={i} className="bg-slate-900">
                        {i}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Message</label>
                  <textarea
                    value={enquiry.message}
                    onChange={(e) => setEnquiry((x) => ({ ...x, message: e.target.value }))}
                    rows={4}
                    className="w-full px-5 py-4 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all resize-none"
                    placeholder="Tell us briefly what you are looking for…"
                  />
                </div>

                <button
                  type="submit"
                  disabled={enquiryStatus === 'sending'}
                  className="w-full py-5 rounded-2xl bg-white text-black font-bold text-lg hover:bg-brand-gold-light hover:text-white transition-colors flex items-center justify-center gap-2 group disabled:opacity-50 mt-4"
                >
                  {enquiryStatus === 'sending' ? (
                    'Sending…'
                  ) : enquiryStatus === 'success' ? (
                    'Message received'
                  ) : (
                    <>
                      Send message <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
                {enquiryStatus === 'error' && (
                  <p className="text-red-400 text-sm text-center">Something went wrong. Please try again.</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      <section id="jobs" className={`py-12 sm:py-16 lg:py-20 xl:py-24 relative z-10 px-4 sm:px-6 lg:px-10 xl:px-12 bg-white/5 border-t border-white/5 ${sectionScroll}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-display font-black text-white">Latest jobs</h2>
              <p className="text-slate-400 mt-2 text-sm sm:text-base">Roles that may fit your next chapter in Australia.</p>
            </div>
            <Link
              to="/jobs"
              className="text-brand-gold-light font-bold hover:text-brand-gold transition-colors flex items-center gap-2 shrink-0"
            >
              View all jobs <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
          <JobsSection />
        </div>
      </section>

      <section id="news" className={`py-12 sm:py-16 lg:py-20 xl:py-24 relative z-10 px-4 sm:px-6 lg:px-10 xl:px-12 bg-white/5 border-t border-white/5 ${sectionScroll}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-display font-black text-white">News & insights</h2>
              <p className="text-slate-400 mt-2 text-sm sm:text-base">Policy and industry updates relevant to students.</p>
            </div>
            <Link
              to="/news"
              className="text-brand-gold-light font-bold hover:text-brand-gold transition-colors flex items-center gap-2 shrink-0"
            >
              View all <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
          <NewsSection />
        </div>
      </section>

      <section className="relative z-10 py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-10 xl:px-12 border-t border-white/10 bg-gradient-to-b from-brand-navy/50 via-[#0f1f35] to-[#0a1526] pb-[max(3rem,env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto text-center">
          <Sparkles className="w-10 h-10 text-brand-gold mx-auto mb-5 opacity-90" aria-hidden />
          <h2 className="text-3xl sm:text-4xl font-display font-black text-white mb-4">
            Start free — apply with confidence
          </h2>
          <p className="text-slate-400 text-lg font-light mb-10 leading-relaxed">
            One account: visa structure and multi-angle tools, plus jobs, community, partner services, and course fee offers
            where available. No credit card to sign up.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl bg-white text-brand-navy font-bold text-lg hover:bg-brand-gold-light transition-colors shadow-xl shadow-black/20 w-full sm:w-auto"
            >
              Create free account
              <ArrowRight className="w-5 h-5" aria-hidden />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-10 py-4 rounded-2xl border border-white/20 text-white font-bold hover:bg-white/10 transition-colors w-full sm:w-auto"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-10 sm:py-12 lg:py-14 relative z-10 bg-black/50 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <div className="max-w-7xl mx-auto w-full min-w-0 px-4 sm:px-6 lg:px-10 xl:px-12 flex flex-col lg:flex-row justify-between items-stretch sm:items-center gap-8 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-3 rounded-xl bg-white/95 px-3 py-2.5 shadow-md shadow-black/15 ring-1 ring-white/20">
              <div className="rounded-lg bg-brand-gold/10 p-1.5 ring-1 ring-brand-gold/25 shrink-0">
                <BrandMark size="sm" />
              </div>
              <AbroadUpLogo variant="wordmark" theme="light" scale="md" />
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold text-slate-400">
              <Link to="/register" className="hover:text-brand-gold-light transition-colors">
                Register
              </Link>
              <span className="text-slate-600" aria-hidden>
                ·
              </span>
              <Link to="/login" className="hover:text-brand-gold-light transition-colors">
                Sign in
              </Link>
              <span className="text-slate-600" aria-hidden>
                ·
              </span>
              <a href={`https://${BRAND_DOMAIN}`} className="hover:text-brand-gold-light transition-colors">
                {BRAND_DOMAIN}
              </a>
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium text-center max-w-md">
            © {new Date().getFullYear()} {BRAND_NAME}. Australian education & migration technology — built for students,
            consultancies, and partners.
          </p>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400 text-sm font-medium">
            <Shield className="w-4 h-4 text-brand-gold-light shrink-0" aria-hidden />
            Secure hosting & privacy-conscious design
          </div>
        </div>
      </footer>
    </div>
  );
}

function JobsSection() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jobs/public?limit=6')
      .then((r) => r.json())
      .then((data) => {
        setJobs(Array.isArray(data) ? data.slice(0, 6) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-slate-400 py-10">Loading jobs…</div>;
  if (!jobs.length) return <div className="text-center text-slate-400 py-10">No jobs posted yet. Check back soon.</div>;

  const formatType = (t: string) => (t || '').replace('_', ' ');
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 w-full min-w-0">
      {jobs.map((job) => (
        <Link
          key={job._id}
          to="/jobs"
          className="group block rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:bg-white/10 hover:border-brand-gold/30 transition-all min-h-0 touch-manipulation active:scale-[0.99]"
        >
          <div className="p-5 sm:p-6">
            <span className="text-[10px] font-bold text-brand-gold-light uppercase tracking-widest mb-3 block">
              {formatType(job.type)}
            </span>
            <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-brand-gold transition-colors">
              {job.title}
            </h3>
            <p className="text-slate-400 text-sm mb-2">{job.company}</p>
            <p className="text-slate-500 text-sm line-clamp-2 mb-4">{job.location}</p>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
              <span className="text-xs text-slate-500">{job.salaryRange || 'Competitive'}</span>
              <span className="text-xs font-bold text-brand-gold-light">View →</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function NewsSection() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/news')
      .then((r) => r.json())
      .then((data) => {
        setNews(Array.isArray(data) ? data.slice(0, 3) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-slate-400 py-10">Loading news…</div>;
  if (!news.length) return <div className="text-center text-slate-400 py-10">No articles yet. Check back soon.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 w-full min-w-0">
      {news.map((article) => (
        <Link
          key={article._id}
          to={`/news/${article.slug}`}
          className="group block rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:bg-white/10 hover:border-brand-gold/30 transition-all touch-manipulation active:scale-[0.99]"
        >
          {article.coverImage && (
            <div className="h-40 sm:h-48 overflow-hidden relative">
              <img
                src={resolveFileUrl(article.coverImage)}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
          <div className="p-6">
            <div className="text-[10px] font-bold text-brand-gold-light uppercase tracking-widest mb-3">
              {article.categoryId?.name || article.category || 'Update'}
            </div>
            <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-brand-gold transition-colors">
              {article.title}
            </h3>
            <p className="text-slate-400 text-sm line-clamp-3 mb-4">{article.summary || article.content}</p>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
              <span className="text-xs text-slate-500">{new Date(article.publishedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
