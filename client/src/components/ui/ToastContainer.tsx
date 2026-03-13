import { useUiStore } from '../../store/ui';
import type { ToastType } from '../../store/ui';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

function ToastIcon({ type }: { type: ToastType }) {
  if (type === 'success') return <CheckCircle2 className="w-4 h-4" />;
  if (type === 'error') return <AlertTriangle className="w-4 h-4" />;
  return <Info className="w-4 h-4" />;
}

function toastStyles(type: ToastType) {
  const base = 'flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl';
  if (type === 'success') return `${base} bg-slate-900 text-white`;
  if (type === 'error') return `${base} bg-red-600 text-white`;
  return `${base} bg-indigo-600 text-white`;
}

function iconBg(type: ToastType) {
  if (type === 'success') return 'bg-emerald-500';
  if (type === 'error') return 'bg-red-700';
  return 'bg-indigo-500';
}

export default function ToastContainer() {
  const { toasts, removeToast } = useUiStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 max-w-sm w-full" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${toastStyles(t.type)} toast-animate-in`}
          role="alert"
        >
          <div className={`p-1.5 ${iconBg(t.type)} rounded-full text-white shrink-0`}>
            <ToastIcon type={t.type} />
          </div>
          <span className="font-black text-sm flex-1">{t.message}</span>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            className="shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
