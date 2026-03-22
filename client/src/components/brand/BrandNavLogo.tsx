import { AbroadUpLogo } from './AbroadUpLogo';

type BrandNavLogoProps = {
  className?: string;
  /** Passed to the inner wordmark (e.g. hover shadow) */
  logoClassName?: string;
};

/**
 * Larger wordmark in fixed-height nav bars: scales visually without growing
 * layout height (transform does not affect flex row metrics).
 */
export function BrandNavLogo({ className = '', logoClassName = '' }: BrandNavLogoProps) {
  return (
    <span
      className={`inline-block origin-left scale-[1.14] sm:scale-[1.22] md:scale-[1.2] will-change-transform ${className}`}
    >
      <AbroadUpLogo variant="wordmark" theme="light" scale="header" className={logoClassName} />
    </span>
  );
}
