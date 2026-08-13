import React from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Play,
  Clock,
} from 'lucide-react';
import { formatTime } from '../../utils/youtubeUtils';
import type { QueueItem, User } from '../../types';

interface QueueItemCardProps {
  item: QueueItem;
  index: number;
  currentUser: User | null;
  estimatedStartTime: string;
  onVote: (itemId: string, type: 'up' | 'down') => void;
  onMove: (itemId: string, direction: 'up' | 'down') => void;
  onRemove: (item: QueueItem) => void;
  onPlayNow: (item: QueueItem) => void;
}

export const QueueItemCard: React.FC<QueueItemCardProps> = ({
  item,
  index,
  currentUser,
  estimatedStartTime,
  onVote,
  onMove,
  onRemove,
  onPlayNow,
}) => {
  const hasUpvoted = currentUser && item.votes.includes(currentUser.id);
  const hasDownvoted = currentUser && item.downvotes.includes(currentUser.id);

  return (
    <div className="glass-card p-3 sm:p-4 rounded-2xl border border-white/10 hover:border-white/20 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md hover:shadow-xl">
      <div className="flex items-center space-x-3 overflow-hidden">
        <span className="text-xs font-mono text-slate-500 w-5 text-center shrink-0">
          #{index + 1}
        </span>

        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={() => onPlayNow(item)}
              className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center hover:scale-110 transition-transform"
              title="Play Now"
            >
              <Play className="w-4 h-4 fill-current translate-x-0.5" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <h4 className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
            {item.title}
          </h4>
          <p className="text-xs text-slate-400 truncate">{item.author}</p>

          <div className="flex items-center space-x-3 mt-1 text-[11px] text-slate-500 font-mono">
            <span>{formatTime(item.duration)}</span>
            <span className="flex items-center space-x-1 text-slate-400">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>Plays in ~{estimatedStartTime}</span>
            </span>
            <span className="truncate text-slate-400">by {item.addedBy.name}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end space-x-2 border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0 shrink-0">
        {/* Re-order Arrows */}
        <div className="flex items-center space-x-0.5 bg-white/5 rounded-xl p-0.5 border border-white/10">
          <button
            onClick={() => onMove(item.id, 'up')}
            disabled={index === 0}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition"
            title="Move Up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMove(item.id, 'down')}
            className="p-1 text-slate-400 hover:text-white transition"
            title="Move Down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Voting controls */}
        <div className="flex items-center space-x-1 bg-white/5 rounded-xl p-1 border border-white/10">
          <button
            onClick={() => onVote(item.id, 'up')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
              hasUpvoted
                ? 'bg-indigo-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Upvote"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{item.votes.length}</span>
          </button>

          <button
            onClick={() => onVote(item.id, 'down')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
              hasDownvoted
                ? 'bg-rose-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Downvote"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>{item.downvotes.length}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <button
          onClick={() => onPlayNow(item)}
          className="p-2 text-slate-300 hover:text-indigo-400 hover:bg-white/10 rounded-xl transition"
          title="Play Immediately"
        >
          <Play className="w-4 h-4 fill-current" />
        </button>

        <button
          onClick={() => onRemove(item)}
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
          title="Remove Track"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
