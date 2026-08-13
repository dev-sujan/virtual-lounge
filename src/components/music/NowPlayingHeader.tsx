import React from 'react';
import type { QueueItem } from '../../types';

interface NowPlayingHeaderProps {
  currentTrack: QueueItem;
  reactionEmojis: string[];
  onSendEmojiReaction: (emoji: string) => void;
}

export const NowPlayingHeader: React.FC<NowPlayingHeaderProps> = ({
  currentTrack,
  reactionEmojis,
  onSendEmojiReaction,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
      <div className="overflow-hidden">
        <h2 className="text-base sm:text-lg font-bold text-white truncate">{currentTrack.title}</h2>
        <p className="text-xs text-indigo-300 font-medium truncate">{currentTrack.author}</p>
      </div>

      {/* Floating Reaction Bar */}
      <div className="flex items-center space-x-1 bg-slate-950/60 px-2 py-1 rounded-2xl border border-white/10 shrink-0 self-start sm:self-auto">
        {reactionEmojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSendEmojiReaction(emoji)}
            className="p-1 hover:scale-125 transform transition text-sm"
            title={`Send ${emoji} reaction`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
