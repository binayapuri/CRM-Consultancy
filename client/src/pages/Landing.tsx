import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Building2, Calculator, Compass, Shield, FileCheck, Users, Globe, Mail, Send } from 'lucide-react';

const INTERESTS = ['Student Visa (500)', 'Graduate Visa (485)', 'Skilled Migration (189/190/491)', 'Partner Visa', 'Visitor Visa', 'Other'];

const visaTypes = [
  { code: '500', name: 'Student Visa', desc: 'Study at Australian institutions' },
  { code: '485', name: 'Graduate Visa', desc: 'Post-study work rights' },
  { code: '189', name: 'Skilled Independent', desc: 'Points-tested permanent residency' },
  { code: '190', name: 'Skilled Nominated', desc: 'State-nominated pathway' },
  { code: '491', name: 'Skilled Regional', desc: 'Regional Australia pathway' },
  { code: '482', name: 'Temporary Skill Shortage', desc: 'Employer-sponsored skilled work' },
  { code: '408', name: 'Temporary Activity', desc: 'Events, training and cultural exchange' },
  { code: '600', name: 'Visitor Visa', desc: 'Tourist, business visitor and family visits' },
  { code: '820/801', name: 'Partner (Onshore)', desc: 'Partner of an Australian citizen or PR' },
  { code: '309/100', name: 'Partner (Offshore)', desc: 'Partner pathway from outside Australia' },
];

export default function Landing() {
  const [enquiry, setEnquiry] = useState({ firstName: '', lastName: '', email: '', phone: '', interest: '', message: '' });
  const [enquiryStatus, setEnquiryStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [heroWordIndex, setHeroWordIndex] = useState(0);

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
    <div className="min-h-screen bg-slate-950">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="flex items-center justify-between px-6 lg:px-12 py-4 max-w-7xl mx-auto">
          <Link to="/" className="flex flex-col leading-tight">
            <span className="text-2xl font-display font-bold tracking-tight text-white">
              <span className="text-white">BIG</span>
              <span className="text-emerald-400">FEW</span>
            </span>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.18em] mt-0.5">
              Australian Migration &amp; Education CRM
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <a href="#enquiry" className="text-slate-300 hover:text-white transition font-medium">Contact</a>
            <Link to="/login" className="text-slate-300 hover:text-white transition font-medium">Login</Link>
            <Link to="/register" className="px-5 py-2.5 rounded-xl bg-ori-500 text-white font-medium hover:bg-ori-400 transition">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header
        className="relative overflow-hidden"
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgba(2,6,23,0.88), rgba(15,23,42,0.8)), url(https://images.unsplash.com/photo-1526779259212-939e64788e3c?auto=format&fit=crop&w=1600&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-24 lg:pt-24 lg:pb-32 relative">
          <div className="max-w-3xl">
            <div className="overflow-hidden rounded-full border border-emerald-400/90 bg-slate-900/80 px-8 py-3 inline-flex items-center mb-10 max-w-3xl shadow-lg shadow-emerald-500/25">
              <span className="w-3 h-3 rounded-full bg-emerald-400 mr-4 shadow shadow-emerald-400/70" />
              <div className="bigfew-marquee whitespace-nowrap text-sm sm:text-base font-semibold">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-sky-300 to-emerald-200">
                  Dream Big, Hustle Few
                </span>
              </div>
            </div>
            <p className="text-ori-400 font-medium mb-4">Australian Education & Migration</p>
            <h1 className="text-4xl lg:text-6xl font-display font-bold text-white leading-tight">
              Your bridge to{' '}
              <span className="text-emerald-300">
                {heroWords[heroWordIndex]}
              </span>{' '}
              in Australia &amp; New Zealand.
            </h1>
            <p className="text-xl text-slate-300 mt-6">
              BIGFEW is your central workspace for Australian and New Zealand migration work.
              Students organise their own profile and documents; consultancies run a compliant, modern CRM on top.
            </p>
            <div className="flex flex-wrap gap-4 mt-10">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/25"
              >
                <GraduationCap className="w-5 h-5" />
                I'm a Student
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-amber-400/70 text-amber-300 font-medium hover:bg-amber-400/10 hover:text-white transition"
              >
                I’m a Consultancy / Agent
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Visa Pathways with imagery */}
      <section className="py-20 border-t border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <h2 className="text-2xl font-display font-bold text-white mb-2">Visa Pathways</h2>
          <p className="text-slate-400 mb-12">
            We support a wide range of Australian visa applications including study, work, visitor and partner pathways.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {visaTypes.map(({ code, name, desc }) => (
              <div
                key={code}
                className="group p-5 rounded-xl bg-slate-900/70 border border-slate-800/90 hover:border-emerald-400/70 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 transition-transform duration-200"
              >
                <div className="h-24 mb-3 overflow-hidden rounded-lg">
                  <img
                    src={
                      code === '500'
                        ? 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80'
                        : 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={name}
                    loading="lazy"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <span className="text-emerald-300 font-mono text-sm">{code}</span>
                <h3 className="font-semibold text-white mt-1.5">{name}</h3>
                <p className="text-slate-400 text-sm mt-1">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-xs mt-6 max-w-3xl">
            BIGFEW is designed to support the most common Australian visa subclasses used by students, graduates and skilled
            migrants. For other visas (for example 870, 188, 132 and more), you can still collect your documents and use the AI
            Migration Compass to research requirements, then lodge directly with immigration or through a registered migration
            agent.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <h2 className="text-2xl font-display font-bold text-white mb-12 text-center">One BIGFEW platform, two portals</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: GraduationCap, title: 'Student Portal', desc: 'Profile, applications, documents, tasks. PR calculator, visa roadmap, AI compass.', color: 'text-ori-400' },
              { icon: Building2, title: 'Consultancy CRM', desc: 'Clients, Kanban, leads, daily tasks. Trust ledger, colleges, OSHC.', color: 'text-ori-400' },
              { icon: Calculator, title: 'PR Calculator', desc: 'Dynamic points calculator aligned with 2026 skilled migration rules.', color: 'text-amber-400' },
              { icon: Compass, title: 'AI Compass', desc: 'Factual migration information. Section 276 compliant. Data in Australia.', color: 'text-emerald-400' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <Icon className={`w-12 h-12 ${color} mb-4`} />
                <h3 className="font-display font-semibold text-white">{title}</h3>
                <p className="text-slate-400 text-sm mt-2">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 border-t border-slate-800 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <h2 className="text-2xl font-display font-bold text-white mb-2">How It Works</h2>
          <p className="text-slate-400 mb-12">From enquiry to visa grant — streamlined for consultancies and students</p>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Users, step: '1', title: 'Register', desc: 'Students sign up. Consultancies manage leads.' },
              { icon: FileCheck, step: '2', title: 'Enrol', desc: 'Lead converts to client. Application created.' },
              { icon: Globe, step: '3', title: 'Documents', desc: 'Upload checklist items. Agent reviews.' },
              { icon: Shield, step: '4', title: 'Lodge', desc: 'Agent lodges with Home Affairs. Track status.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="relative">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-ori-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-7 h-7 text-ori-400" />
                  </div>
                  <div>
                    <span className="text-ori-400 text-sm font-medium">Step {step}</span>
                    <h3 className="font-semibold text-white">{title}</h3>
                    <p className="text-slate-400 text-sm mt-0.5">{desc}</p>
                  </div>
                </div>
                {step !== '4' && <div className="hidden md:block absolute top-7 left-full w-full h-0.5 bg-slate-700 -ml-4" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry Form */}
      <section id="enquiry" className="py-20 border-t border-slate-800">
        <div className="max-w-2xl mx-auto px-6 lg:px-12">
          <h2 className="text-2xl font-display font-bold text-white mb-2 flex items-center gap-2"><Mail className="w-8 h-8 text-ori-400" /> Get in Touch</h2>
          <p className="text-slate-400 mb-8">Have questions? Submit an enquiry and a migration agent will contact you.</p>
          <form onSubmit={handleEnquiry} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <input value={enquiry.firstName} onChange={(e: any) => setEnquiry((x: any) => ({ ...x, firstName: e.target.value }))} required placeholder="First Name" className="input bg-slate-800 border-slate-700 text-white placeholder-slate-500" />
              <input value={enquiry.lastName} onChange={(e: any) => setEnquiry((x: any) => ({ ...x, lastName: e.target.value }))} required placeholder="Last Name" className="input bg-slate-800 border-slate-700 text-white placeholder-slate-500" />
            </div>
            <input type="email" value={enquiry.email} onChange={(e: any) => setEnquiry((x: any) => ({ ...x, email: e.target.value }))} required placeholder="Email" className="input bg-slate-800 border-slate-700 text-white placeholder-slate-500 w-full" />
            <input value={enquiry.phone} onChange={(e: any) => setEnquiry((x: any) => ({ ...x, phone: e.target.value }))} placeholder="Phone (optional)" className="input bg-slate-800 border-slate-700 text-white placeholder-slate-500 w-full" />
            <select value={enquiry.interest} onChange={(e: any) => setEnquiry((x: any) => ({ ...x, interest: e.target.value }))} className="input bg-slate-800 border-slate-700 text-white w-full">
              <option value="">Select interest</option>
              {INTERESTS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <textarea value={enquiry.message} onChange={(e: any) => setEnquiry((x: any) => ({ ...x, message: e.target.value }))} placeholder="Your message (optional)" rows={3} className="input bg-slate-800 border-slate-700 text-white placeholder-slate-500 w-full" />
            <button type="submit" disabled={enquiryStatus === 'sending'} className="btn-primary w-full flex items-center justify-center gap-2">
              {enquiryStatus === 'sending' ? 'Sending...' : enquiryStatus === 'success' ? 'Thank you!' : <>Send Enquiry <Send className="w-4 h-4" /></>}
            </button>
            {enquiryStatus === 'success' && <p className="text-green-400 text-sm text-center">We will contact you soon.</p>}
            {enquiryStatus === 'error' && <p className="text-red-400 text-sm text-center">Something went wrong. Please try again.</p>}
          </form>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl font-display font-bold text-white mb-4">Ready to Start Your Journey?</h2>
          <p className="text-slate-400 mb-8">
            Join BIGFEW — the platform where students self-manage their migration profile and consultancies run their workflow.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="px-8 py-4 rounded-xl bg-ori-500 text-white font-medium hover:bg-ori-400 transition">
              Create Account
            </Link>
            <Link to="/login" className="px-8 py-4 rounded-xl border border-slate-600 text-slate-300 font-medium hover:bg-slate-800">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-slate-500 text-sm">© 2026 BIGFEW. Australian Migration & Education Platform.</span>
          <div className="flex items-center gap-6 text-slate-500 text-sm">
            <span>Data hosted in Australia</span>
            <Shield className="w-4 h-4 text-ori-500" />
          </div>
        </div>
      </footer>
    </div>
  );
}
