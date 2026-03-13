import { useEffect, useRef } from 'react';
import { useUiStore } from '../../store/ui';

const DEFAULT_CONFIRM_LABEL = 'Confirm';
const DEFAULT_CANCEL_LABEL = 'Cancel';

export default function ConfirmDialog() {
  const { confirm, closeConfirm } = useUiStore();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!confirm.open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeConfirm();
    };
    window.addEventListener('keydown', onKeyDown);
    confirmRef.current?.focus();
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirm.open, closeConfirm]);

  if (!confirm.open) return null;

  const handleConfirm = async () => {
    await confirm.onConfirm();
    closeConfirm();
  };

  const handleCancel = () => closeConfirm();

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && closeConfirm()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      <div
        className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-lg font-bold text-slate-900 mb-2">
          {confirm.title}
        </h2>
        <p id="confirm-message" className="text-slate-600 text-sm font-medium mb-6">
          {confirm.message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2.5 rounded-lg font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            {confirm.cancelLabel ?? DEFAULT_CANCEL_LABEL}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2.5 rounded-lg font-bold text-sm text-white transition-colors ${
              confirm.danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {confirm.confirmLabel ?? DEFAULT_CONFIRM_LABEL}
          </button>
        </div>
      </div>
    </div>
  );
}
