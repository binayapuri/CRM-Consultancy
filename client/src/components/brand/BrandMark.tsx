import { BRAND_MARK_PATH } from '../../constants/brand';

const SIZE: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string> = {
  xs: 'h-5 w-5',
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
  xl: 'h-14 w-14',
};

type BrandMarkProps = {
  className?: string;
  size?: keyof typeof SIZE;
};

/** Raster brand sign (bird) — favicon asset, accents, cards */
export function BrandMark({ className = '', size = 'md' }: BrandMarkProps) {
  return (
    <img
      src={BRAND_MARK_PATH}
      alt=""
      aria-hidden
      className={`object-contain object-center ${SIZE[size]} ${className}`}
      loading="lazy"
      decoding="async"
    />
  );
}
