import { useId } from 'react';
import { BRAND_TAGLINE } from '../../constants/brand';

type LogoProps = {
  className?: string;
  /** Icon + wordmark side by side */
  variant?: 'full' | 'mark' | 'wordmark';
  /** dark = light text (sidebars); light = dark text (cards/print) */
  theme?: 'dark' | 'light';
};

/**
 * Abroad Up — gradient mark with upward journey + wordmark options.
 */
export function AbroadUpLogo({ className = '', variant = 'full', theme = 'dark' }: LogoProps) {
  const uid = useId().replace(/:/g, '');
  const gradId = `abroadup-grad-${uid}`;
  const filterId = `abroadup-glow-${uid}`;

  const textMain = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textAccent = theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600';
  const taglineClass =
    theme === 'dark'
      ? 'text-[10px] font-semibold uppercase tracking-widest text-indigo-200/90'
      : 'text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500';

  const Mark = (
    <svg
      className={`shrink-0 ${variant === 'mark' ? 'h-10 w-10' : 'h-9 w-9'}`}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="4" y1="36" x2="36" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" />
          <stop offset="0.45" stopColor="#6366F1" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${gradId})`} />
      <path
        d="M10 22c3.5-6 8-9 10-9s6.5 3 10 9"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.92"
      />
      <path
        d="M14 24l6-11 6 11"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter={`url(#${filterId})`}
      />
      <circle cx="20" cy="11" r="2.4" fill="white" />
    </svg>
  );

  if (variant === 'mark') {
    return <span className={`inline-flex ${className}`}>{Mark}</span>;
  }

  if (variant === 'wordmark') {
    return (
      <span className={`inline-flex flex-col leading-tight ${className}`}>
        <span className={`font-display font-black tracking-tight text-xl sm:text-2xl ${textMain}`}>
          Abroad<span className={textAccent}> Up</span>
        </span>
        <span className={`${taglineClass} mt-0.5`}>{BRAND_TAGLINE}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-3 min-w-0 ${className}`}>
      {Mark}
      <span className="flex flex-col min-w-0 leading-tight">
        <span className={`font-display font-black text-lg tracking-tight ${textMain}`}>
          Abroad<span className={textAccent}> Up</span>
        </span>
        <span className={`${taglineClass} truncate`}>{BRAND_TAGLINE}</span>
      </span>
    </span>
  );
}

export default AbroadUpLogo;
