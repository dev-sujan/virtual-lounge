import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../../stores/useThemeStore';
import type { LoungeTheme } from '../../stores/useThemeStore';
import { Palette, Check } from 'lucide-react';

interface ThemeOption {
  id: LoungeTheme;
  name: string;
  gradient: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { id: 'indigo', name: 'Midnight Indigo', gradient: 'from-indigo-600 to-purple-600' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', gradient: 'from-pink-500 to-cyan-400' },
  { id: 'synthwave', name: 'Sunset Synthwave', gradient: 'from-amber-500 to-rose-600' },
  { id: 'lofi', name: 'Coffee Lofi', gradient: 'from-amber-700 to-orange-900' },
  { id: 'emerald', name: 'Deep Emerald', gradient: 'from-emerald-500 to-teal-700' },
];

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition flex items-center space-x-1"
        title="Switch Lounge Theme"
      >
        <Palette className="w-4 h-4 text-purple-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 z-50 glass-card p-3 rounded-2xl border border-white/15 shadow-2xl w-56 animate-fadeIn space-y-2">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 mb-1 flex items-center justify-between">
            <span>Lounge Theme</span>
            <Palette className="w-3.5 h-3.5 text-purple-400" />
          </div>

          <div className="space-y-1">
            {THEME_OPTIONS.map((opt) => {
              const isSelected = theme === opt.id;

              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-2 rounded-xl text-xs font-semibold flex items-center justify-between transition border ${
                    isSelected
                      ? 'bg-white/15 border-white/30 text-white shadow'
                      : 'hover:bg-white/5 border-transparent text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${opt.gradient} shadow-sm shrink-0`} />
                    <span>{opt.name}</span>
                  </div>

                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
