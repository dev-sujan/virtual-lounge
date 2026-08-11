import React, { useState } from 'react';
import { equalizerEngine } from '../../utils/audioEffects';
import type { EqualizerPreset } from '../../utils/audioEffects';
import { Sliders, Sparkles, Check } from 'lucide-react';

interface PresetOption {
  id: EqualizerPreset;
  name: string;
  desc: string;
  icon: string;
}

const PRESETS: PresetOption[] = [
  { id: 'flat', name: 'Flat (Default)', desc: 'Natural balanced audio', icon: '🎧' },
  { id: 'bassboost', name: 'Bass Boost', desc: 'Punchy low-frequency boost', icon: '🔊' },
  { id: 'lofi', name: 'Lo-Fi Tape', desc: 'Vintage warm analog radio', icon: '📻' },
  { id: 'vocal', name: 'Vocal Enhancer', desc: 'Crisp vocal focus', icon: '🎤' },
  { id: 'spatial', name: 'Spatial 3D', desc: 'Immersive wide soundstage', icon: '🌌' },
];

export const AudioEqualizer: React.FC = () => {
  const [activePreset, setActivePreset] = useState<EqualizerPreset>(equalizerEngine.getActivePreset());
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (preset: EqualizerPreset) => {
    equalizerEngine.setPreset(preset);
    setActivePreset(preset);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-xl transition flex items-center space-x-1.5 text-xs font-semibold border ${
          activePreset !== 'flat'
            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
            : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
        }`}
        title="Audio Equalizer & Sound Effects"
      >
        <Sliders className="w-3.5 h-3.5 text-purple-400" />
        <span className="hidden sm:inline">EQ {activePreset !== 'flat' ? `(${activePreset})` : ''}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-12 z-50 glass-card p-3.5 rounded-2xl border border-white/15 shadow-2xl w-64 animate-fadeIn space-y-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Audio Equalizer Presets</span>
            </span>
          </div>

          <div className="space-y-1">
            {PRESETS.map((p) => {
              const isSelected = activePreset === p.id;

              return (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p.id)}
                  className={`w-full p-2 rounded-xl text-left transition border flex items-center justify-between ${
                    isSelected
                      ? 'bg-purple-600/30 border-purple-400/50 text-white font-bold'
                      : 'hover:bg-white/5 border-transparent text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <span className="text-base shrink-0">{p.icon}</span>
                    <div className="overflow-hidden">
                      <div className="text-xs text-white truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{p.desc}</div>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-purple-400 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
