import React from 'react';
import type { QueueItem } from '../../types';

interface NowPlayingBannerProps {
  currentTrack: QueueItem;
}

export const NowPlayingBanner: React.FC<NowPlayingBannerProps> = ({ currentTrack }) => {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 flex items-center space-x-1.5">
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
        <span>Now Playing</span>
      </div>

      <div className="glass-card p-3 sm:p-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/40 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-md">
            <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="flex items-end space-x-0.5 h-4">
                <span className="w-1 bg-indigo-400 rounded-full animate-bounce h-full" style={{ animationDelay: '0.1s' }} />
                <span className="w-1 bg-indigo-400 rounded-full animate-bounce h-2/3" style={{ animationDelay: '0.3s' }} />
                <span className="w-1 bg-indigo-400 rounded-full animate-bounce h-4/5" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>

          <div className="overflow-hidden">
            <h4 className="text-sm font-bold text-white truncate">{currentTrack.title}</h4>
            <p className="text-xs text-indigo-300 truncate">{currentTrack.author}</p>
            <span className="inline-block mt-1 text-[10px] text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full">
              Requested by {currentTrack.addedBy.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
