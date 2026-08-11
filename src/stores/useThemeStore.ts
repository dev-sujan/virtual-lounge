import { create } from 'zustand';

export type LoungeTheme = 'indigo' | 'cyberpunk' | 'synthwave' | 'lofi' | 'emerald';

interface ThemeState {
  theme: LoungeTheme;
  setTheme: (theme: LoungeTheme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem('synclounge_theme') as LoungeTheme) || 'indigo',
  setTheme: (theme) => {
    localStorage.setItem('synclounge_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
}));
