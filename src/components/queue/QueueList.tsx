import React from 'react';
import { useMusicStore } from '../../stores/useMusicStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { peerService } from '../../services/webrtc/peerService';
import { ThumbsUp, ThumbsDown, ArrowUp, ArrowDown, Trash2, Play, Flame, Music, Plus } from 'lucide-react';
import type { QueueItem } from '../../types';

interface QueueListProps {
  onOpenAddModal: () => void;
}

export const QueueList: React.FC<QueueListProps> = ({ onOpenAddModal }) => {
  const { currentTrack, queue, voteItem, moveItem, removeFromQueue, setCurrentTrack, clearQueue, setPlaybackState } =
    useMusicStore();
  const { currentUser } = useRoomStore();

  const handleVote = (itemId: string, type: 'up' | 'down') => {
    if (!currentUser) return;
    voteItem(itemId, currentUser.id, type);

    peerService.broadcast('QUEUE_CHANGE', {
      queue: useMusicStore.getState().queue,
    });
  };

  const handleMove = (itemId: string, direction: 'up' | 'down') => {
    moveItem(itemId, direction);

    peerService.broadcast('QUEUE_CHANGE', {
      queue: useMusicStore.getState().queue,
    });
  };

  const handleRemove = (item: QueueItem) => {
    removeFromQueue(item.id);

    peerService.broadcast('QUEUE_CHANGE', {
      queue: useMusicStore.getState().queue,
      action: 'removed',
      item,
      user: currentUser?.displayName,
    });
  };

  const handlePlayNow = (item: QueueItem) => {
    removeFromQueue(item.id);
    setCurrentTrack(item);
    setPlaybackState({ isPlaying: true, currentTime: 0, lastUpdated: Date.now() });

    peerService.broadcast('QUEUE_CHANGE', {
      queue: useMusicStore.getState().queue,
      currentTrack: item,
      action: 'played now',
      item,
      user: currentUser?.displayName,
    });
  };

  const handleClearAll = () => {
    if (!confirm('Clear all songs from the upcoming queue?')) return;
    clearQueue();
    peerService.broadcast('QUEUE_CHANGE', { queue: [] });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>Shared Music Queue</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-mono border border-indigo-500/30">
              {queue.length} upcoming
            </span>
          </h3>
          <p className="text-xs text-slate-400">Vote tracks up or down to reorder the lounge playlist</p>
        </div>

        <div className="flex items-center space-x-2">
          {queue.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-rose-400 hover:text-rose-300 p-2 rounded-xl hover:bg-rose-500/10 transition"
              title="Clear Queue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onOpenAddModal}
            className="glow-btn bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Track</span>
          </button>
        </div>
      </div>

      {currentTrack && (
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
                <span className="inline-block mt-1 text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                  Requested by {currentTrack.addedBy.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Up Next in Lounge
        </div>

        {queue.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl border border-white/5 text-center text-slate-400">
            <Music className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-300">No tracks in queue</p>
            <p className="text-xs text-slate-500 mt-1">
              Add music links to collaboratively create your shared lounge playlist.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {queue.map((item, idx) => {
              const hasUpvoted = currentUser && item.votes.includes(currentUser.id);
              const hasDownvoted = currentUser && item.downvotes.includes(currentUser.id);

              return (
                <div
                  key={item.id}
                  className="glass-card p-3 rounded-2xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span className="text-xs font-mono text-slate-500 w-5 text-center font-bold">
                      #{idx + 1}
                    </span>

                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 shadow"
                    />

                    <div className="overflow-hidden">
                      <h4 className="text-xs sm:text-sm font-semibold text-white truncate">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{item.author}</p>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span
                          className="text-[10px] px-1.5 py-0.2 rounded font-medium text-slate-300"
                          style={{ backgroundColor: `${item.addedBy.avatarColor}25` }}
                        >
                          by {item.addedBy.name}
                        </span>
                        {item.priority > 5 && (
                          <span className="text-[10px] text-amber-400 flex items-center space-x-0.5 font-bold">
                            <Flame className="w-3 h-3 fill-current" />
                            <span>Popular</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
                    <div className="hidden sm:flex flex-col space-y-0.5 opacity-60 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleMove(item.id, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMove(item.id, 'down')}
                        disabled={idx === queue.length - 1}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center bg-slate-900/60 rounded-xl p-1 border border-white/10 space-x-1">
                      <button
                        onClick={() => handleVote(item.id, 'up')}
                        className={`p-1.5 rounded-lg transition ${
                          hasUpvoted
                            ? 'bg-indigo-500 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Upvote track"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>

                      <span
                        className={`text-xs font-bold font-mono px-1 min-w-[20px] text-center ${
                          item.priority > 0
                            ? 'text-emerald-400'
                            : item.priority < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.priority > 0 ? `+${item.priority}` : item.priority}
                      </span>

                      <button
                        onClick={() => handleVote(item.id, 'down')}
                        className={`p-1.5 rounded-lg transition ${
                          hasDownvoted
                            ? 'bg-rose-500 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Downvote track"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handlePlayNow(item)}
                      className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 rounded-xl transition"
                      title="Play Immediately"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>

                    <button
                      onClick={() => handleRemove(item)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                      title="Remove from Queue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
