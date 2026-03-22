import { Link } from 'react-router-dom';
import { Mail, Phone, ExternalLink } from 'lucide-react';
import {
  BRAND_NAME,
  COMPANY_EMAIL,
  COMPANY_NAME,
  COMPANY_PHONE_DISPLAY,
  COMPANY_PHONE_TEL,
  COMPANY_WEBSITE,
} from '../../constants/brand';

export function PublicMarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#010409] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-white font-black text-lg tracking-tight mb-2">{BRAND_NAME}</p>
          <p className="text-slate-400 text-sm leading-relaxed">
            Australian migration news, visa guides, and tools for students and skilled migrants. Information is general only—not legal advice.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">Explore</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/news" className="text-slate-300 hover:text-emerald-400 transition-colors">
                News & updates
              </Link>
            </li>
            <li>
              <Link to="/visas" className="text-slate-300 hover:text-emerald-400 transition-colors">
                Australian visa types
              </Link>
            </li>
            <li>
              <Link to="/jobs" className="text-slate-300 hover:text-emerald-400 transition-colors">
                Jobs for students
              </Link>
            </li>
            <li>
              <Link to="/#enquiry" className="text-slate-300 hover:text-emerald-400 transition-colors">
                Contact (home)
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">{COMPANY_NAME}</p>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden />
              <a href={`tel:${COMPANY_PHONE_TEL}`} className="hover:text-white transition-colors">
                {COMPANY_PHONE_DISPLAY}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden />
              <a href={`mailto:${COMPANY_EMAIL}`} className="hover:text-white transition-colors break-all">
                {COMPANY_EMAIL}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <ExternalLink className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden />
              <a
                href={COMPANY_WEBSITE}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                authkeep.com
              </a>
            </li>
          </ul>
        </div>
        <div className="lg:pl-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 to-slate-900/80 p-5">
          <p className="text-emerald-300 font-bold text-sm mb-1">Planning a visitor visa?</p>
          <p className="text-slate-400 text-xs leading-relaxed mb-3">
            Help family visit Australia—check eligibility and documents, then speak with a registered migration agent for advice tailored to you.
          </p>
          <Link
            to="/visas#visitor-cta"
            className="inline-flex text-xs font-bold text-emerald-300 hover:text-white underline underline-offset-2"
          >
            Visitor & tourist visas →
          </Link>
        </div>
      </div>
      <div className="border-t border-white/5 py-6 text-center text-xs text-slate-500 px-4">
        © {new Date().getFullYear()}{' '}
        <a href={COMPANY_WEBSITE} className="text-slate-400 hover:text-emerald-400 transition-colors">
          authkeep.com
        </a>
        {' · '}
        {COMPANY_NAME}. {BRAND_NAME} is operated by {COMPANY_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
