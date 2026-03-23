import { X } from 'lucide-react';
import { resolveFileUrl } from '../../lib/imageUrl';

type Props = {
  urls: string[];
  /** When set, show remove buttons (composer). Omit for feed cards. */
  onRemove?: (url: string) => void;
  /** Uniform 150×150px thumbnails (e.g. composer preview). */
  compact?: boolean;
};

const COMPACT = 'h-[150px] w-[150px] shrink-0';

/**
 * Facebook-style image layout for 1–8 images (read-only or editable).
 */
export default function FeedImageMosaic({ urls, onRemove, compact }: Props) {
  const n = urls.length;
  if (n === 0) return null;

  const cell = (url: string, className: string) => {
    const src = resolveFileUrl(url) || url;
    return (
      <div key={url} className={`relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100 ${className}`}>
        <img
          src={src}
          alt=""
          className={`w-full h-full object-cover ${compact ? 'min-h-0' : 'min-h-[80px]'}`}
        />
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(url);
            }}
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 p-1.5 bg-slate-50/50">
        {urls.map((u) => cell(u, COMPACT))}
      </div>
    );
  }

  if (n === 1) {
    return <div className="rounded-xl overflow-hidden border border-slate-200">{cell(urls[0], 'max-h-72')}</div>;
  }
  if (n === 2) {
    return <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">{urls.map((u) => cell(u, 'aspect-[4/3]'))}</div>;
  }
  if (n === 3) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
        {cell(urls[0], 'col-span-2 max-h-56')}
        {cell(urls[1], 'aspect-[4/3]')}
        {cell(urls[2], 'aspect-[4/3]')}
      </div>
    );
  }
  if (n === 4) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
        {urls.map((u) => cell(u, 'aspect-square'))}
      </div>
    );
  }
  return (
    <div className="space-y-1 rounded-xl overflow-hidden">
      {cell(urls[0], 'w-full max-h-56')}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
        {urls.slice(1).map((u) => cell(u, 'aspect-square min-h-[88px]'))}
      </div>
    </div>
  );
}
