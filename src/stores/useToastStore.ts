import { create } from 'zustand';
import { sendNativeNotification, setAppBadgeCount } from '../utils/pushUtils';

export type ToastCategory = 'info' | 'success' | 'warning' | 'media' | 'music' | 'game';

export interface ToastItem {
  id: string;
  category: ToastCategory;
  title: string;
  message?: string;
  icon?: string;
  timestamp: number;
  read?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastState {
  toasts: ToastItem[]; // Active floating toasts
  history: ToastItem[]; // Notification history log
  unreadCount: number;
  soundEnabled: boolean;

  addToast: (toast: Omit<ToastItem, 'id' | 'timestamp' | 'read'>) => void;
  removeToast: (id: string) => void;
  markAllRead: () => void;
  clearHistory: () => void;
  toggleSoundEnabled: () => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  history: [],
  unreadCount: 0,
  soundEnabled: true,

  addToast: (newToast) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    const toast: ToastItem = {
      ...newToast,
      id,
      timestamp: Date.now(),
      read: false,
    };

    const newUnreadCount = get().unreadCount + 1;
    sendNativeNotification(toast.title, { body: toast.message });
    setAppBadgeCount(newUnreadCount);

    set((state) => ({
      toasts: [toast, ...state.toasts].slice(0, 5), // Max 5 active floating toasts
      history: [toast, ...state.history].slice(0, 50), // History log up to 50
      unreadCount: newUnreadCount,
    }));

    // Auto-dismiss floating toast after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  markAllRead: () => {
    setAppBadgeCount(0);
    set({ unreadCount: 0, history: get().history.map((h) => ({ ...h, read: true })) });
  },

  clearHistory: () => {
    setAppBadgeCount(0);
    set({ history: [], unreadCount: 0 });
  },

  toggleSoundEnabled: () => set({ soundEnabled: !get().soundEnabled }),
}));
