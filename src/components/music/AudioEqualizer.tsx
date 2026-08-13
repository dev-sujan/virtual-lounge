import React, { useState } from 'react';
import { equalizerEngine } from '../../utils/audioEffects';
import type { EqualizerPreset } from '../../utils/audioEffects';
import { useRoomStore } from '../../stores/useRoomStore';
import { peerService } from '../../services/webrtc/peerService';
import { playAirhornSound, playScratchSound, playVictorySound } from '../../utils/soundUtils';
import { Sliders, Sparkles, Check, Radio } from 'lucide-react';

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
  const { currentUser } = useRoomStore();

  const handleSelect = (preset: EqualizerPreset) => {
    equalizerEngine.setPreset(preset);
    setActivePreset(preset);
  };

  const triggerDJFx = (fxType: 'airhorn' | 'scratch' | 'victory') => {
    if (fxType === 'airhorn') playAirhornSound();
    else if (fxType === 'scratch') playScratchSound();
    else if (fxType === 'victory') playVictorySound();

    peerService.broadcast('DJ_SOUND_FX', {
      fxType,
      userName: currentUser?.displayName || 'DJ',
    });
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
        title="Audio Equalizer & Live DJ FX Board"
      >
        <Sliders className="w-3.5 h-3.5 text-purple-400" />
        <span className="hidden sm:inline">EQ {activePreset !== 'flat' ? `(${activePreset})` : ''}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs sm:hidden cursor-pointer"
            onClick={() => setIsOpen(false)}
          />
          <div className="max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:bottom-20 max-sm:w-auto max-sm:max-h-[75dvh] max-sm:overflow-y-auto sm:absolute sm:right-0 sm:bottom-12 z-50 glass-card p-3.5 rounded-2xl border border-white/15 shadow-2xl w-72 animate-fadeIn space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Audio EQ & Live DJ Deck</span>
              </span>
            </div>

            {/* EQ Presets */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Equalizer Presets
              </span>
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
                    {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Live DJ Sound Effects Deck */}
            <div className="border-t border-white/10 pt-2.5">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center space-x-1 mb-2">
                <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>Broadcast Live DJ Sound FX</span>
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => triggerDJFx('airhorn')}
                  className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 hover:text-white text-center transition flex flex-col items-center justify-center space-y-1"
                >
                  <span className="text-lg">🎺</span>
                  <span className="text-[10px] font-bold">Airhorn</span>
                </button>
                <button
                  onClick={() => triggerDJFx('scratch')}
                  className="p-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 hover:text-white text-center transition flex flex-col items-center justify-center space-y-1"
                >
                  <span className="text-lg">🎧</span>
                  <span className="text-[10px] font-bold">Scratch</span>
                </button>
                <button
                  onClick={() => triggerDJFx('victory')}
                  className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 hover:text-white text-center transition flex flex-col items-center justify-center space-y-1"
                >
                  <span className="text-lg">🏆</span>
                  <span className="text-[10px] font-bold">Fanfare</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
