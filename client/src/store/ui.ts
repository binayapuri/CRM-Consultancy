import { create } from 'zustand';
import type { ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
};

export type ModalContent = ReactNode | (() => ReactNode);

export type ModalState = {
  open: boolean;
  title?: string;
  content: ModalContent | null;
  contentKey?: number;
};

export type ConfirmState = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  danger?: boolean;
};

const DEFAULT_TOAST_DURATION = 3000;

/** When set, Modal uses this to render content (fresh closure from opener). Cleared on closeModal. */
export type ModalContentGetter = (() => ReactNode) | null;

type UiState = {
  toasts: Toast[];
  modal: ModalState;
  modalContentGetter: ModalContentGetter;
  confirm: ConfirmState;
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  openModal: (title?: string, content?: ModalContent | null) => void;
  closeModal: () => void;
  setModalContentGetter: (getter: ModalContentGetter) => void;
  bumpModalContentKey: () => void;
  openConfirm: (options: Omit<ConfirmState, 'open'>) => void;
  closeConfirm: () => void;
};

export const useUiStore = create<UiState>((set, get) => ({
  toasts: [],
  modal: { open: false, title: undefined, content: null },
  modalContentGetter: null,
  confirm: {
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  },

  showToast: (message: string, type: ToastType = 'success', duration = DEFAULT_TOAST_DURATION) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const toast: Toast = { id, message, type, duration };
    set((s) => ({ toasts: [...s.toasts, toast] }));
    if (duration > 0) {
      setTimeout(() => get().removeToast(id), duration);
    }
  },

  removeToast: (id: string) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  openModal: (title?: string, content?: ModalContent | null) => {
    set({ modal: { open: true, title, content: content ?? null, contentKey: Date.now() } });
  },

  closeModal: () => {
    set({ modal: { open: false, title: undefined, content: null }, modalContentGetter: null });
  },

  setModalContentGetter: (getter) => {
    set({ modalContentGetter: getter });
  },

  bumpModalContentKey: () => {
    set({ modal: { ...get().modal, contentKey: Date.now() } });
  },

  openConfirm: (options) => {
    set({
      confirm: {
        open: true,
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel,
        cancelLabel: options.cancelLabel,
        onConfirm: options.onConfirm,
        danger: options.danger,
      },
    });
  },

  closeConfirm: () => {
    set({
      confirm: {
        open: false,
        title: '',
        message: '',
        onConfirm: () => {},
      },
    });
  },
}));
