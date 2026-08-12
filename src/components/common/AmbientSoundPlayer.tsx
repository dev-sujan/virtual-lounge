import React, { useState } from 'react';
import { ambientAudioEngine } from '../../utils/ambientAudio';
import { CloudRain, Flame, Waves, Sliders } from 'lucide-react';



interface AmbientSound {
  id: string;
  name: string;
  icon: any;
}

const SOUNDS: AmbientSound[] = [
  { id: 'rain', name: 'Gentle Rain', icon: CloudRain },
  { id: 'fireplace', name: 'Warm Fireplace', icon: Flame },
  { id: 'waves', name: 'Ocean Tide', icon: Waves },
];

export const AmbientSoundPlayer: React.FC = () => {
  const [activeSounds, setActiveSounds] = useState<Record<string, boolean>>({});
  const [volumes, setVolumes] = useState<Record<string, number>>({
    rain: 0.3,
    fireplace: 0.3,
    waves: 0.3,
  });
  const [showControls, setShowControls] = useState(false);

  const handleToggle = (id: string) => {
    const isNowActive = ambientAudioEngine.toggleSound(id, volumes[id] || 0.3);
    setActiveSounds((prev) => ({ ...prev, [id]: isNowActive }));
  };

  const handleVolumeChange = (id: string, vol: number) => {
    setVolumes((prev) => ({ ...prev, [id]: vol }));
    ambientAudioEngine.setVolume(id, vol);
  };

  const hasAnyPlaying = Object.values(activeSounds).some(Boolean);

  return (
    <div className="relative">
      <button
        onClick={() => setShowControls(!showControls)}
        className={`text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition border ${
          hasAnyPlaying
            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
            : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
        }`}
        title="Ambient Lounge Background Sounds"
      >
        <Sliders className="w-3.5 h-3.5 text-indigo-400" />
        <span>Ambiance {hasAnyPlaying ? 'ON' : 'OFF'}</span>
      </button>

      {showControls && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs sm:hidden"
            onClick={() => setShowControls(false)}
          />
          <div className="max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-16 max-sm:w-auto max-sm:max-h-[80dvh] max-sm:overflow-y-auto sm:absolute sm:right-0 sm:top-10 z-50 glass-card p-4 rounded-2xl border border-white/15 shadow-2xl w-64 animate-fadeIn space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Ambient Soundscapes</span>
              </span>
              <button
                onClick={() => {
                  ambientAudioEngine.stopAll();
                  setActiveSounds({});
                }}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
              >
                Stop All
              </button>
            </div>

            <div className="space-y-3">
              {SOUNDS.map((snd) => {
                const Icon = snd.icon;
                const isPlaying = !!activeSounds[snd.id];
                const vol = volumes[snd.id] ?? 0.3;

                return (
                  <div key={snd.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleToggle(snd.id)}
                        className={`text-xs font-semibold flex items-center space-x-2 transition ${
                          isPlaying ? 'text-indigo-300' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg border transition ${
                            isPlaying
                              ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                              : 'bg-white/5 border-white/10 text-slate-400'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isPlaying ? 'animate-pulse' : ''}`} />
                        </div>
                        <span>{snd.name}</span>
                      </button>

                      <span className="text-[10px] font-mono text-slate-400">
                        {isPlaying ? `${Math.round(vol * 100)}%` : 'OFF'}
                      </span>
                    </div>

                    {isPlaying && (
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={vol}
                        onChange={(e) => handleVolumeChange(snd.id, parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded cursor-pointer"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
