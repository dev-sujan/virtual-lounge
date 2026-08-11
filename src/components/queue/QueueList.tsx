import React, { useState } from 'react';
import { useMusicStore } from '../../stores/useMusicStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { useToastStore } from '../../stores/useToastStore';
import { peerService } from '../../services/webrtc/peerService';
import { formatTime } from '../../utils/youtubeUtils';
import {
  ThumbsUp,
  ThumbsDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Play,
  Flame,
  Music,
  Plus,
  History,
  Clock,
  Download,
  RotateCcw,
  Radio,
} from 'lucide-react';

import type { QueueItem } from '../../types';

interface QueueListProps {
  onOpenAddModal: () => void;
}

export const QueueList: React.FC<QueueListProps> = ({ onOpenAddModal }) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

  const {
    currentTrack,
    queue,
    history,
    sortMode,
    autoPlayRadio,
    voteItem,
    moveItem,
    removeFromQueue,
    setCurrentTrack,
    clearQueue,
    clearHistory,
    setPlaybackState,
    setSortMode,
    addToQueue,
    toggleAutoPlayRadio,
    exportQueueJson,
  } = useMusicStore();

  const { currentUser } = useRoomStore();
  const { addToast } = useToastStore();

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

  const handleReAddFromHistory = (item: QueueItem) => {
    if (!currentUser) return;
    const newItem: QueueItem = {
      ...item,
      id: 'q_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      votes: [],
      downvotes: [],
      priority: 0,
      addedAt: Date.now(),
      addedBy: {
        id: currentUser.id,
        name: currentUser.displayName,
        avatarColor: currentUser.avatarColor,
      },
    };

    const success = addToQueue(newItem);
    if (success) {
      peerService.broadcast('QUEUE_CHANGE', {
        queue: useMusicStore.getState().queue,
        currentTrack: useMusicStore.getState().currentTrack,
        action: 're-added',
        item: newItem,
        user: currentUser.displayName,
      });

      addToast({
        category: 'info',
        title: 'Re-added to Queue',
        message: `"${item.title}" added to queue`,
      });
    }
  };

  const handleClearAll = () => {
    if (!confirm('Clear all songs from the upcoming queue?')) return;
    clearQueue();
    peerService.broadcast('QUEUE_CHANGE', { queue: [] });
  };

  const handleExport = () => {
    const json = exportQueueJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lounge-queue-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addToast({
      category: 'info',
      title: 'Queue Exported',
      message: 'Downloaded playlist JSON file',
    });
  };

  // Helper to calculate cumulative estimated play time
  let cumulativeSeconds = 0;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>Shared Music Queue</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
              {queue.length} upcoming
            </span>
          </h3>
          <p className="text-xs text-slate-400">Vote tracks, reorder, or stream synced music together</p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Radio Toggle */}
          <button
            onClick={toggleAutoPlayRadio}
            className={`text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition border ${
              autoPlayRadio
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
            title="Auto-play Lounge Radio when queue is empty"
          >
            <Radio className={`w-3.5 h-3.5 ${autoPlayRadio ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>Radio {autoPlayRadio ? 'ON' : 'OFF'}</span>
          </button>

          {queue.length > 0 && (
            <>
              <button
                onClick={handleExport}
                className="text-xs text-slate-400 hover:text-white p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                title="Export Queue as JSON"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={handleClearAll}
                className="text-xs text-rose-400 hover:text-rose-300 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 transition"
                title="Clear Queue"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
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

      {/* Now Playing Banner */}
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
                <span className="inline-block mt-1 text-[10px] text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full">
                  Requested by {currentTrack.addedBy.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Sort Controls */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`text-xs font-bold uppercase tracking-wider pb-1 transition border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'upcoming'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Up Next ({queue.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`text-xs font-bold uppercase tracking-wider pb-1 transition border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'history'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Recently Played ({history.length})</span>
          </button>
        </div>

        {activeTab === 'upcoming' && queue.length > 1 && (
          <div className="flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-white/10 text-[11px]">
            <button
              onClick={() => setSortMode('priority')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                sortMode === 'priority' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Sort automatically by highest net votes"
            >
              Priority Sort
            </button>
            <button
              onClick={() => setSortMode('manual')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                sortMode === 'manual' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Allow manual arrow reordering"
            >
              Manual Order
            </button>
          </div>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'upcoming' && (
        <div>
          {queue.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl border border-white/5 text-center text-slate-400">
              <Music className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-300">No tracks in queue</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Add music links or browse presets to create your shared lounge playlist.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {queue.map((item, idx) => {
                const hasUpvoted = currentUser && item.votes.includes(currentUser.id);
                const hasDownvoted = currentUser && item.downvotes.includes(currentUser.id);
                const estimatedStart = cumulativeSeconds;
                cumulativeSeconds += item.duration || 180;

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

                          <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            <span>In ~{formatTime(estimatedStart)}</span>
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
      )}

      {activeTab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl border border-white/5 text-center text-slate-400">
              <History className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-300">No playback history yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Completed or skipped tracks will automatically show up here so you can re-play them anytime.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex justify-end mb-2">
                <button
                  onClick={clearHistory}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear History</span>
                </button>
              </div>

              {history.map((item) => (
                <div
                  key={item.id}
                  className="glass-card p-3 rounded-2xl border border-white/10 hover:border-white/20 transition flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 shadow"
                    />

                    <div className="overflow-hidden">
                      <h4 className="text-xs sm:text-sm font-semibold text-white truncate">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{item.author}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleReAddFromHistory(item)}
                    className="glow-btn bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow transition shrink-0"
                    title="Re-add to upcoming queue"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Re-Add</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
