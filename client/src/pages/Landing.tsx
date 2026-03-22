import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { GraduationCap, Building2, Calculator, Compass, Shield, Users, Send, ArrowRight, Briefcase, BookOpen } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { resolveFileUrl } from '../lib/imageUrl';
import { getDashboardPathForRole } from '../lib/authHelpers';
import { AbroadUpLogo } from '../components/brand/AbroadUpLogo';
import { BRAND_NAME } from '../constants/brand';

const INTERESTS = ['Student Visa (500)', 'Graduate Visa (485)', 'Skilled Migration (189/190/491)', 'Partner Visa', 'Visitor Visa', 'Other'];

const visaTypes = [
  { code: '500', name: 'Student Visa', desc: 'Secure your future with world-class Australian education.' },
  { code: '485', name: 'Graduate Visa', desc: 'Kickstart your global career with post-study work rights.' },
  { code: '189', name: 'Skilled Independent', desc: 'The golden ticket: Points-tested permanent residency.' },
  { code: '190', name: 'Skilled Nominated', desc: 'Accelerate your PR via State-nominated pathways.' },
];

export default function Landing() {
  const { user, token } = useAuthStore();
  const [enquiry, setEnquiry] = useState({ firstName: '', lastName: '', email: '', phone: '', interest: '', message: '' });
  const [enquiryStatus, setEnquiryStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [heroWordIndex, setHeroWordIndex] = useState(0);
  const displayName = user?.profile?.firstName || user?.profile?.lastName
    ? [user?.profile?.firstName, user?.profile?.lastName].filter(Boolean).join(' ')
    : user?.email ?? '';
  const initials = `${user?.profile?.firstName?.[0] ?? ''}${user?.profile?.lastName?.[0] ?? ''}`.toUpperCase()
    || (user?.email ?? '').slice(0, 2).toUpperCase()
    || '?';

  const heroWords = ['Student visas', 'PR pathways', 'Skilled migration', 'Life after graduation'];

  useEffect(() => {
    const id = setInterval(() => {
      setHeroWordIndex((i) => (i + 1) % heroWords.length);
    }, 2600);
    return () => clearInterval(id);
  }, []);

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
    <div className="min-h-screen bg-[#0f1f35] selection:bg-brand-gold/30">
      <Helmet>
        <title>{BRAND_NAME} | Australian Migration CRM & Student Hub</title>
        <meta name="description" content="Experience the future of Australian migration. Manage student visas, PR pathways, and consultancy operations seamlessly." />
        <meta name="keywords" content="Australia, Visa, Student Visa, PR Pathways, Migration CRM, 189 Visa, 190 Visa, 485 Visa" />
        <meta property="og:title" content={`${BRAND_NAME} | Australian Migration CRM`} />
        <meta property="og:description" content="Manage student visas, PR pathways, and consultancy operations seamlessly." />
      </Helmet>
      
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-brand-navy/35 rounded-full mix-blend-screen filter blur-[100px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[35rem] h-[35rem] bg-brand-gold/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[45rem] h-[45rem] bg-brand-navy-light/25 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000" />
      </div>

      {/* Nav */}
      <nav className="fixed w-full top-0 z-50 bg-brand-cream/95 backdrop-blur-xl border-b border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-2 max-w-7xl mx-auto">
          <Link to="/" className="group flex items-center min-w-0 shrink leading-none hover:opacity-95 transition-opacity rounded-lg -my-0.5">
            <AbroadUpLogo variant="wordmark" theme="light" scale="header" className="group-hover:drop-shadow-[0_4px_14px_rgba(27,54,93,0.12)]" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-sm font-semibold text-brand-navy/80 hover:text-brand-navy transition-colors">Our Vision</a>
            <a href="#pathways" className="text-sm font-semibold text-brand-navy/80 hover:text-brand-navy transition-colors">Pathways</a>
            <Link to="/jobs" className="text-sm font-semibold text-brand-navy/80 hover:text-brand-navy transition-colors">Jobs</Link>
            <Link to="/visas" className="text-sm font-semibold text-brand-navy/80 hover:text-brand-navy transition-colors">Visas</Link>
            <a href="#news" className="text-sm font-semibold text-brand-navy/80 hover:text-brand-navy transition-colors">News</a>
            <a href="#enquiry" className="text-sm font-semibold text-brand-navy/80 hover:text-brand-navy transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            {token && user ? (
              <Link
                to={getDashboardPathForRole(user.role)}
                className="flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-slate-200/90 hover:border-brand-gold/50 shadow-sm transition-all"
              >
                {user.profile?.avatar ? (
                  <img src={resolveFileUrl(user.profile.avatar)} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 bg-gradient-to-br from-brand-navy to-brand-gold-dark">
                    {initials}
                  </div>
                )}
                <span className="text-sm font-semibold text-brand-navy truncate max-w-[140px]">{displayName}</span>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-brand-navy hover:text-brand-gold-dark transition-colors">Sign In</Link>
                <Link to="/register" className="relative group px-6 py-2.5 rounded-full bg-brand-navy text-white font-bold overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand-navy/25 hover:bg-brand-navy-deep">
                  <span className="relative z-10 flex items-center gap-2">Start Journey <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-24 pb-20 sm:pt-28 lg:pt-36 lg:pb-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="relative z-10 space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 backdrop-blur-md shadow-[0_0_30px_rgba(193,163,118,0.2)]">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold-light opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-gold"></span>
              </span>
              <span className="text-xs font-bold text-brand-gold uppercase tracking-widest">Dream Big, Hustle Few</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-display font-black text-white leading-[1.1] tracking-tight">
              Master Your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold via-brand-gold-light to-brand-navy-light inline-block min-w-[300px]">
                {heroWords[heroWordIndex]}
              </span>
            </h1>
            
            <p className="text-lg lg:text-xl text-slate-400 max-w-lg leading-relaxed font-light">
              Experience the future of Australian migration. 
              Students self-manage their documents and PR pathways using AI, while consultancies power their business with our state-of-the-art CRM.
            </p>
            
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-4">
              <Link to="/register" className="group relative flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-navy to-brand-gold text-white font-bold text-lg overflow-hidden transition-transform hover:scale-105 shadow-[0_0_40px_rgba(27,54,93,0.45)]">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                <GraduationCap className="w-6 h-6 relative z-10" />
                <span className="relative z-10">I'm a Student</span>
              </Link>
              <Link to="/login" className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md text-white font-bold text-lg hover:bg-white/10 hover:border-white/20 transition-all">
                <Building2 className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
                <span>Consultancy Login</span>
              </Link>
              <Link to="/register-university" className="group flex items-center justify-center gap-3 px-6 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md text-white font-bold hover:bg-white/10 hover:border-white/20 transition-all">
                <BookOpen className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
                <span>University Partner</span>
              </Link>
              <Link to="/register-employer" className="group flex items-center justify-center gap-3 px-6 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md text-white font-bold hover:bg-white/10 hover:border-white/20 transition-all">
                <Briefcase className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
                <span>Employer / Recruiter</span>
              </Link>
            </div>
          </div>

          <div className="relative z-10 hidden lg:block animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden shadow-2xl shadow-brand-gold/20 border border-white/10 bg-white/5 backdrop-blur-3xl animate-float">
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80" 
                alt="Students in Australia"
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80"
              />
              {/* Glassmorphism UI mockups floating inside */}
              <div className="absolute top-10 left-10 right-10 p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-gold to-sky-400 p-[2px]">
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Application Status</p>
                      <p className="text-xs text-brand-gold-light">Subclass 189 - Invited</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-brand-gold/20 text-brand-gold text-xs font-bold border border-brand-gold/30">
                    Active
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-gradient-to-r from-brand-gold to-brand-navy-light rounded-full relative">
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:1rem_1rem] animate-[move_1s_linear_infinite]" />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>Lodged</span>
                    <span>Grant Expected</span>
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-10 right-10 px-6 py-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">AI Compass Active</p>
                  <p className="text-xs text-slate-400">Analysing your PR points...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Bento Grid Features */}
      <section className="py-32 relative z-10 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-display font-black text-white mb-6">A New Era of Migration</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto font-light">Forget endless emails and scattered documents. We've brought the entire international student and migration journey into one masterpiece of an platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Box 1 */}
            <div className="md:col-span-2 rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800 border border-white/5 p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-[80px] group-hover:bg-brand-gold/20 transition-colors duration-700" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                  <GraduationCap className="w-7 h-7 text-brand-gold-light" />
                </div>
                <h3 className="text-3xl font-display font-bold text-white mb-4">The Student Hub</h3>
                <p className="text-slate-400 text-lg max-w-md">Track your 500 visa, calculate your 189/190 PR points dynamically, access a community of peers, and interact with the AI Migration Compass.</p>
              </div>
            </div>
            
            {/* Box 2 */}
            <div className="rounded-[2rem] bg-gradient-to-br from-indigo-950 to-slate-900 border border-white/5 p-10 relative overflow-hidden group">
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-[60px] group-hover:bg-indigo-500/30 transition-colors" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                    <Compass className="w-7 h-7 text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white mb-3">AI Context</h3>
                  <p className="text-slate-400">Context-aware AI assistant that guides you on exact documents needed.</p>
                </div>
              </div>
            </div>

            {/* Box 3 */}
            <div className="rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 p-10 relative overflow-hidden group">
               <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                  <Building2 className="w-7 h-7 text-sky-400" />
                </div>
                <h3 className="text-2xl font-display font-bold text-white mb-3">Agency CRM</h3>
                <p className="text-slate-400">Kanban boards, client portals, invoicing, and team attendance.</p>
              </div>
            </div>

            {/* Box 4 */}
            <div className="md:col-span-2 rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 p-10 relative overflow-hidden group">
               <div className="absolute inset-y-0 right-0 w-1/2 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay group-hover:opacity-30 transition-opacity duration-700 aspect-square" />
               <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
               <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                  <Calculator className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="text-3xl font-display font-bold text-white mb-4">Request Access & Bookings</h3>
                <p className="text-slate-400 text-lg max-w-md">Agents can request access to independent student profiles. Students can book 30-minute consultations and read reviews.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pathways */}
      <section id="pathways" className="py-32 relative z-10 px-6 lg:px-12 bg-black/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-display font-black text-white mb-16 text-center">Supported Pathways</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visaTypes.map(({ code, name, desc }) => (
              <div key={code} className="group p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-gold/30 transition-all duration-300 backdrop-blur-sm cursor-pointer hover:-translate-y-2">
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 mb-6 group-hover:from-brand-gold group-hover:to-brand-navy/30 transition-all duration-300">
                  {code}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{name}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry Form */}
      <section id="enquiry" className="py-32 relative z-10 px-6 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <div className="p-10 lg:p-16 rounded-[2.5rem] bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-gold/10 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-4">Get in Touch</h2>
              <p className="text-slate-400 mb-10 text-lg">Send us a message and a verified agent will reach out to you.</p>
              
              <form onSubmit={handleEnquiry} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">First Name</label>
                    <input value={enquiry.firstName} onChange={(e: any) => setEnquiry((x: any) => ({ ...x, firstName: e.target.value }))} required className="w-full px-5 py-4 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Last Name</label>
                    <input value={enquiry.lastName} onChange={(e: any) => setEnquiry((x: any) => ({ ...x, lastName: e.target.value }))} required className="w-full px-5 py-4 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all" placeholder="Doe" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Email Address</label>
                  <input type="email" value={enquiry.email} onChange={(e: any) => setEnquiry((x: any) => ({ ...x, email: e.target.value }))} required className="w-full px-5 py-4 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all" placeholder="your@email.com" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Interest</label>
                  <select value={enquiry.interest} onChange={(e: any) => setEnquiry((x: any) => ({ ...x, interest: e.target.value }))} className="w-full px-5 py-4 rounded-2xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all appearance-none">
                    <option value="" className="bg-slate-900 text-slate-400">Select your focus pathway...</option>
                    {INTERESTS.map(i => <option key={i} value={i} className="bg-slate-900">{i}</option>)}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Message</label>
                  <textarea value={enquiry.message} onChange={(e: any) => setEnquiry((x: any) => ({ ...x, message: e.target.value }))} rows={4} className="w-full px-5 py-4 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all resize-none" placeholder="Tell us a bit about your situation..." />
                </div>
                
                <button type="submit" disabled={enquiryStatus === 'sending'} className="w-full py-5 rounded-2xl bg-white text-black font-bold text-lg hover:bg-brand-gold-light hover:text-white transition-colors flex items-center justify-center gap-2 group disabled:opacity-50 mt-4">
                  {enquiryStatus === 'sending' ? 'Sending...' : enquiryStatus === 'success' ? 'Message Received!' : <>Send Message <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>}
                </button>
                {enquiryStatus === 'error' && <p className="text-red-400 text-sm text-center">Something went wrong. Please try again.</p>}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Jobs */}
      <section id="jobs" className="py-20 relative z-10 px-6 lg:px-12 bg-white/5 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl font-display font-black text-white">Latest Jobs</h2>
            <Link to="/jobs" className="text-brand-gold-light font-bold hover:text-brand-gold transition-colors flex items-center gap-2">
              View All Jobs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <JobsSection />
        </div>
      </section>

      {/* Latest News */}
      <section id="news" className="py-20 relative z-10 px-6 lg:px-12 bg-white/5 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl font-display font-black text-white">Latest News</h2>
            <Link to="/news" className="text-brand-gold-light font-bold hover:text-brand-gold transition-colors flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <NewsSection />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 relative z-10 bg-black/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 shadow-md shadow-black/15 ring-1 ring-white/20">
            <AbroadUpLogo variant="wordmark" theme="light" scale="md" />
          </div>
          <p className="text-slate-500 text-sm font-medium text-center sm:text-left">
            © {new Date().getFullYear()} {BRAND_NAME}. Australian migration & education platform.
          </p>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400 text-sm font-medium">
            <Shield className="w-4 h-4 text-brand-gold-light" /> Secure Australian Data Hosting
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
      .then(r => r.json())
      .then(data => {
        setJobs(Array.isArray(data) ? data.slice(0, 6) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-slate-400 py-10">Loading jobs...</div>;
  if (!jobs.length) return <div className="text-center text-slate-400 py-10">No jobs posted yet. Check back soon.</div>;

  const formatType = (t: string) => (t || '').replace('_', ' ');
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {jobs.map(job => (
        <Link key={job._id} to="/jobs" className="group block rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:bg-white/10 hover:border-brand-gold/30 transition-all">
          <div className="p-6">
            <span className="text-[10px] font-bold text-brand-gold-light uppercase tracking-widest mb-3 block">{formatType(job.type)}</span>
            <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-brand-gold transition-colors">{job.title}</h3>
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
      .then(r => r.json())
      .then(data => {
        setNews(Array.isArray(data) ? data.slice(0, 3) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-slate-400 py-10">Loading news...</div>;
  if (!news.length) return <div className="text-center text-slate-400 py-10">No specific news updates at the moment.</div>;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {news.map(article => (
        <Link key={article._id} to={`/news/${article.slug}`} className="group block rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:bg-white/10 hover:border-brand-gold/30 transition-all">
          {article.coverImage && (
            <div className="h-48 overflow-hidden relative">
              <img src={resolveFileUrl(article.coverImage)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
          )}
          <div className="p-6">
            <div className="text-[10px] font-bold text-brand-gold-light uppercase tracking-widest mb-3">
              {article.categoryId?.name || article.category || 'Update'}
            </div>
            <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-brand-gold transition-colors">{article.title}</h3>
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

