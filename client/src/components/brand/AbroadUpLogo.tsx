import { useId } from 'react';
import {
  BRAND_LOGO_INCLUDES_TAGLINE,
  BRAND_LOGO_PATH,
  BRAND_NAME,
  BRAND_TAGLINE,
} from '../../constants/brand';

/** Larger = more prominent (reference: wide PNG ~716×348 — keep height generous for clarity). */
/** `header` = top nav bar: larger wordmark, minimal vertical dead space */
export type LogoScale = 'md' | 'header' | 'lg' | 'xl' | 'hero';

type LogoProps = {
  className?: string;
  /** Icon + wordmark side by side */
  variant?: 'full' | 'mark' | 'wordmark';
  /** dark = light text (sidebars); light = dark text (cream/white headers) */
  theme?: 'dark' | 'light';
  /** Set false to use built-in SVG mark instead of raster */
  useRasterLogo?: boolean;
  /** When true, shows tagline under raster (only if logo file does NOT already include it). */
  showTagline?: boolean;
  scale?: LogoScale;
};

/** Header bars → use `md`. Sidebars → `lg`. Auth / footer emphasis → `xl`. Rare full-width promos → `hero`. */
const RASTER_MARK: Record<LogoScale, string> = {
  md: 'h-9 w-9 min-h-[2.25rem] min-w-[2.25rem]',
  header: 'h-11 w-11 min-h-[2.75rem] min-w-[2.75rem]',
  lg: 'h-11 w-11 min-h-[2.75rem] min-w-[2.75rem]',
  xl: 'h-12 w-12 min-h-[3rem] min-w-[3rem]',
  hero: 'h-14 w-14 min-h-[3.5rem] min-w-[3.5rem]',
};

const RASTER_WORD: Record<LogoScale, string> = {
  md: 'h-9 sm:h-10 w-auto max-w-[min(100%,240px)]',
  /** Top nav: prominent but still one clean row on mobile + desktop */
  header:
    'h-[3rem] sm:h-[3.5rem] md:h-[3.75rem] w-auto max-w-[min(100%,320px)]',
  lg: 'h-11 sm:h-12 md:h-14 w-auto max-w-[min(100%,300px)]',
  xl: 'h-12 sm:h-14 w-auto max-w-[min(100%,360px)]',
  hero: 'h-20 sm:h-24 md:h-28 w-auto max-w-[min(100%,520px)]',
};

const RASTER_FULL: Record<LogoScale, string> = {
  md: 'h-10 sm:h-11 w-auto max-w-full',
  header: 'h-[3.25rem] sm:h-14 w-auto max-w-full',
  lg: 'h-12 sm:h-[3.25rem] w-auto max-w-full',
  xl: 'h-14 sm:h-16 w-auto max-w-full',
  hero: 'h-20 sm:h-24 w-auto max-w-full',
};

/**
 * Abroad Up — uses `public/logo3.png` by default; SVG fallback if `useRasterLogo={false}`.
 */
export function AbroadUpLogo({
  className = '',
  variant = 'full',
  theme = 'dark',
  useRasterLogo = true,
  showTagline,
  scale = 'md',
}: LogoProps) {
  const uid = useId().replace(/:/g, '');
  const gradId = `abroadup-grad-${uid}`;
  const filterId = `abroadup-glow-${uid}`;

  const includeTagline =
    showTagline !== undefined
      ? showTagline
      : !(useRasterLogo && BRAND_LOGO_INCLUDES_TAGLINE);

  const textMain = theme === 'dark' ? 'text-white' : 'text-brand-navy';
  const textAccent = theme === 'dark' ? 'text-brand-gold' : 'text-brand-gold';
  const taglineClass =
    theme === 'dark'
      ? 'text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-gold/90'
      : 'text-[11px] font-bold uppercase tracking-[0.18em] text-brand-charcoal/80';

  const RasterMark = (
    <img
      src={BRAND_LOGO_PATH}
      alt={BRAND_NAME}
      className={`block shrink-0 object-contain object-center rounded-xl ${RASTER_MARK[scale]}`}
      loading="eager"
      decoding="async"
    />
  );

  const SvgMark = (
    <svg
      className={`shrink-0 ${variant === 'mark' ? RASTER_MARK[scale] : 'h-9 w-9'}`}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="4" y1="36" x2="36" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1B365D" />
          <stop offset="0.5" stopColor="#234a78" />
          <stop offset="1" stopColor="#C1A376" />
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

  const Mark = useRasterLogo ? RasterMark : SvgMark;

  if (variant === 'mark') {
    return <span className={`inline-flex ${className}`}>{Mark}</span>;
  }

  if (variant === 'wordmark' && useRasterLogo) {
    return (
      <span
        className={`inline-flex flex-col min-w-0 leading-none ${includeTagline ? 'gap-0.5' : 'gap-0'} ${className}`}
      >
        <img
          src={BRAND_LOGO_PATH}
          alt={BRAND_NAME}
          className={`block object-contain object-left ${RASTER_WORD[scale]}`}
          loading="eager"
          decoding="async"
        />
        {includeTagline && <span className={`${taglineClass} pl-0.5 leading-tight`}>{BRAND_TAGLINE}</span>}
      </span>
    );
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

  if (useRasterLogo) {
    return (
      <span
        className={`inline-flex flex-col min-w-0 leading-none ${includeTagline ? 'gap-0.5' : 'gap-0'} ${className}`}
      >
        <img
          src={BRAND_LOGO_PATH}
          alt={BRAND_NAME}
          className={`block object-contain object-left ${RASTER_FULL[scale]}`}
          loading="eager"
          decoding="async"
        />
        {includeTagline && <span className={`${taglineClass} truncate leading-tight`}>{BRAND_TAGLINE}</span>}
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
