import React, { useState } from 'react';
import { useMusicStore } from '../../stores/useMusicStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { useToastStore } from '../../stores/useToastStore';
import { peerService } from '../../services/webrtc/peerService';
import { formatTime } from '../../utils/youtubeUtils';
import { NowPlayingBanner } from './NowPlayingBanner';
import { QueueItemCard } from './QueueItemCard';
import {
  Flame,
  Music,
  Plus,
  History,
  Download,
  Trash2,
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
      {currentTrack && <NowPlayingBanner currentTrack={currentTrack} />}

      {/* Tabs & Sort Controls */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`text-sm font-semibold flex items-center space-x-2 pb-2 relative transition ${
              activeTab === 'upcoming' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Upcoming Queue ({queue.length})</span>
            {activeTab === 'upcoming' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`text-sm font-semibold flex items-center space-x-2 pb-2 relative transition ${
              activeTab === 'history' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History ({history.length})</span>
            {activeTab === 'history' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>
        </div>

        {activeTab === 'upcoming' && queue.length > 1 && (
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400 hidden sm:inline">Sort:</span>
            <button
              onClick={() => setSortMode('priority')}
              className={`px-2.5 py-1 rounded-lg transition ${
                sortMode === 'priority'
                  ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3 h-3 inline mr-1 text-amber-400" />
              Votes
            </button>
            <button
              onClick={() => setSortMode('manual')}
              className={`px-2.5 py-1 rounded-lg transition ${
                sortMode === 'manual'
                  ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Custom
            </button>
          </div>
        )}
      </div>

      {/* Upcoming List */}
      {activeTab === 'upcoming' && (
        <div className="space-y-3">
          {queue.length === 0 ? (
            <div className="p-8 text-center glass-card rounded-2xl border border-white/10">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Music className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Queue is empty</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
                Be the DJ! Add YouTube links or search tracks to play for everyone in the lounge.
              </p>
              <button
                onClick={onOpenAddModal}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-xl inline-flex items-center space-x-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Song</span>
              </button>
            </div>
          ) : (
            queue.map((item, index) => {
              const estimatedSecs = cumulativeSeconds;
              cumulativeSeconds += item.duration || 180;
              const estTimeStr = estimatedSecs === 0 ? 'Next' : formatTime(estimatedSecs);

              return (
                <QueueItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  currentUser={currentUser}
                  estimatedStartTime={estTimeStr}
                  onVote={handleVote}
                  onMove={handleMove}
                  onRemove={handleRemove}
                  onPlayNow={handlePlayNow}
                />
              );
            })
          )}
        </div>
      )}

      {/* History List */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span>Recently played in this session</span>
            {history.length > 0 && (
              <button onClick={clearHistory} className="hover:text-rose-400 transition">
                Clear History
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="p-8 text-center glass-card rounded-2xl border border-white/10 text-slate-400 text-xs">
              No tracks played yet in this session.
            </div>
          ) : (
            <div className="space-y-2.5">

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
