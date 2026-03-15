import { useEffect, useRef } from 'react';
import { useUiStore } from '../../store/ui';
import { X } from 'lucide-react';

export default function Modal() {
  const { modal, modalContentGetter, closeModal } = useUiStore();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modal.open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modal.open, closeModal]);

  if (!modal.open) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && closeModal()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={modal.title ? 'modal-title' : undefined}
    >
      <div
        ref={panelRef}
        className={`bg-white rounded-xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-fade-in-up flex flex-col ${modal.size === 'large' ? 'max-w-4xl' : 'max-w-2xl'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          {modal.title && (
            <h2 id="modal-title" className="text-lg font-bold text-slate-900">
              {modal.title}
            </h2>
          )}
          {!modal.title && <span />}
          <button
            type="button"
            onClick={closeModal}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {modalContentGetter?.() ?? (typeof modal.content === 'function' ? modal.content() : modal.content)}
        </div>
      </div>
    </div>
  );
}
