export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  return (
    <div className={`${s} border-2 border-slate-200 border-t-ori-600 rounded-full animate-spin`} />
  );
}
