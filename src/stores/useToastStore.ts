import { create } from 'zustand';

export type ToastCategory = 'info' | 'success' | 'warning' | 'media' | 'music' | 'game';

export interface ToastItem {
  id: string;
  category: ToastCategory;
  title: string;
  message?: string;
  icon?: string;
  timestamp: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (newToast) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    const toast: ToastItem = {
      ...newToast,
      id,
      timestamp: Date.now(),
    };

    set((state) => ({
      toasts: [toast, ...state.toasts].slice(0, 5), // Keep max 5 active toasts
    }));

    // Auto-dismiss after 3.5 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3500);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => set({ toasts: [] }),
}));
