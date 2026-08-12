import { create } from 'zustand';
import type { QueueItem, PlaybackState, RepeatMode } from '../types';
import { PRESET_LOUNGE_TRACKS } from '../utils/loungePresets';

interface MusicState {
  currentTrack: QueueItem | null;
  queue: QueueItem[];
  history: QueueItem[];
  skipVotes: string[]; // User IDs who voted to skip current song
  playback: PlaybackState;
  repeatMode: RepeatMode;
  shuffleMode: boolean;
  autoPlayRadio: boolean;
  sortMode: 'priority' | 'manual';

  // Actions
  setCurrentTrack: (track: QueueItem | null) => void;
  setQueue: (queue: QueueItem[]) => void;
  setHistory: (history: QueueItem[]) => void;
  setSkipVotes: (votes: string[]) => void;
  addToQueue: (item: QueueItem) => boolean;
  removeFromQueue: (itemId: string) => void;
  reorderQueue: (newQueue: QueueItem[]) => void;
  moveItem: (itemId: string, direction: 'up' | 'down') => void;
  voteItem: (itemId: string, userId: string, voteType: 'up' | 'down') => void;
  toggleSkipVote: (userId: string, totalUsersCount: number) => { votes: string[]; skipped: boolean };
  clearSkipVotes: () => void;
  clearQueue: () => void;
  clearHistory: () => void;
  setSortMode: (mode: 'priority' | 'manual') => void;
  toggleAutoPlayRadio: () => void;
  exportQueueJson: () => string;
  importQueueJson: (jsonStr: string) => { success: boolean; count: number; error?: string };

  setPlaybackState: (updates: Partial<PlaybackState>) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setShuffleMode: (enabled: boolean) => void;
  toggleShuffle: () => void;
  skipTrack: (direction: 'next' | 'prev') => void;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  currentTrack: null,
  queue: [],
  history: [],
  skipVotes: [],
  playback: {
    isPlaying: false,
    currentTime: 0,
    lastUpdated: Date.now(),
    updatedBy: 'system',
    volume: 80,
    isMuted: false,
    playbackRate: 1,
  },
  repeatMode: 'off',
  shuffleMode: false,
  autoPlayRadio: true,
  sortMode: 'priority',

  setCurrentTrack: (track) => set({ currentTrack: track }),

  setQueue: (queue) => set({ queue }),

  setHistory: (history) => set({ history }),

  setSkipVotes: (skipVotes) => set({ skipVotes }),

  addToQueue: (item) => {
    const { queue, currentTrack } = get();
    if (queue.some((q) => q.videoId === item.videoId) || currentTrack?.videoId === item.videoId) {
      return false;
    }
    const newQueue = [...queue, item];

    if (!currentTrack) {
      set({
        currentTrack: item,
        playback: { ...get().playback, isPlaying: true, currentTime: 0, lastUpdated: Date.now() },
      });
    } else {
      set({ queue: newQueue });
    }
    return true;
  },

  removeFromQueue: (itemId) => {
    set({ queue: get().queue.filter((item) => item.id !== itemId) });
  },

  reorderQueue: (newQueue) => set({ queue: newQueue }),

  moveItem: (itemId, direction) => {
    const { queue } = get();
    const index = queue.findIndex((q) => q.id === itemId);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= queue.length) return;

    const newQueue = [...queue];
    const [moved] = newQueue.splice(index, 1);
    newQueue.splice(targetIndex, 0, moved);
    set({ queue: newQueue, sortMode: 'manual' });
  },

  voteItem: (itemId, userId, voteType) => {
    const { queue, sortMode } = get();
    const updatedQueue = queue.map((item) => {
      if (item.id !== itemId) return item;

      let votes = [...item.votes];
      let downvotes = [...item.downvotes];

      if (voteType === 'up') {
        if (votes.includes(userId)) {
          votes = votes.filter((id) => id !== userId);
        } else {
          votes.push(userId);
          downvotes = downvotes.filter((id) => id !== userId);
        }
      } else {
        if (downvotes.includes(userId)) {
          downvotes = downvotes.filter((id) => id !== userId);
        } else {
          downvotes.push(userId);
          votes = votes.filter((id) => id !== userId);
        }
      }

      const priority = votes.length - downvotes.length;
      return { ...item, votes, downvotes, priority };
    });

    if (sortMode === 'priority') {
      const sortedQueue = [...updatedQueue].sort((a, b) => b.priority - a.priority);
      set({ queue: sortedQueue });
    } else {
      set({ queue: updatedQueue });
    }
  },

  toggleSkipVote: (userId, totalUsersCount) => {
    const { skipVotes } = get();
    let updatedVotes = [...skipVotes];
    if (updatedVotes.includes(userId)) {
      updatedVotes = updatedVotes.filter((id) => id !== userId);
    } else {
      updatedVotes.push(userId);
    }

    const needed = Math.max(1, Math.ceil(totalUsersCount / 2));
    const skipped = updatedVotes.length >= needed;

    set({ skipVotes: updatedVotes });

    if (skipped) {
      get().skipTrack('next');
    }

    return { votes: updatedVotes, skipped };
  },

  clearSkipVotes: () => set({ skipVotes: [] }),

  clearQueue: () => set({ queue: [] }),

  clearHistory: () => set({ history: [] }),

  setSortMode: (mode) => {
    set({ sortMode: mode });
    if (mode === 'priority') {
      const sortedQueue = [...get().queue].sort((a, b) => b.priority - a.priority);
      set({ queue: sortedQueue });
    }
  },

  toggleAutoPlayRadio: () => set({ autoPlayRadio: !get().autoPlayRadio }),

  exportQueueJson: () => {
    const { queue, currentTrack } = get();
    return JSON.stringify({ currentTrack, queue, exportedAt: Date.now() }, null, 2);
  },

  importQueueJson: (jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const itemsToImport: QueueItem[] = Array.isArray(parsed) ? parsed : parsed.queue || [];

      if (!Array.isArray(itemsToImport) || itemsToImport.length === 0) {
        return { success: false, count: 0, error: 'No valid music items found in JSON' };
      }

      const existingIds = new Set([...get().queue.map((q) => q.videoId), get().currentTrack?.videoId].filter(Boolean));
      const filtered = itemsToImport.filter((item) => item.videoId && !existingIds.has(item.videoId));

      if (filtered.length === 0) {
        return { success: false, count: 0, error: 'All items are already in the queue' };
      }

      const newQueue = [...get().queue, ...filtered];
      set({ queue: newQueue });

      if (!get().currentTrack && filtered.length > 0) {
        const first = filtered[0];
        set({
          currentTrack: first,
          queue: newQueue.filter((q) => q.id !== first.id),
          playback: { ...get().playback, isPlaying: true, currentTime: 0, lastUpdated: Date.now() },
        });
      }

      return { success: true, count: filtered.length };
    } catch (err: any) {
      return { success: false, count: 0, error: err.message || 'Invalid JSON format' };
    }
  },

  setPlaybackState: (updates) => {
    set({
      playback: {
        ...get().playback,
        ...updates,
        lastUpdated: updates.lastUpdated || Date.now(),
      },
    });
  },

  setRepeatMode: (mode) => set({ repeatMode: mode }),

  setShuffleMode: (enabled) => set({ shuffleMode: enabled }),

  toggleShuffle: () => set({ shuffleMode: !get().shuffleMode }),

  skipTrack: (direction) => {
    const { currentTrack, queue, history, repeatMode, shuffleMode, autoPlayRadio } = get();

    // Push current finished/skipped track to history if valid
    if (currentTrack) {
      const filteredHistory = history.filter((h) => h.videoId !== currentTrack.videoId);
      set({ history: [currentTrack, ...filteredHistory].slice(0, 30), skipVotes: [] });
    } else {
      set({ skipVotes: [] });
    }

    if (repeatMode === 'one' && currentTrack && direction === 'next') {
      set({
        playback: { ...get().playback, currentTime: 0, isPlaying: true, lastUpdated: Date.now() },
      });
      return;
    }

    if (queue.length === 0) {
      if (repeatMode === 'all' && currentTrack) {
        set({
          playback: { ...get().playback, currentTime: 0, isPlaying: true, lastUpdated: Date.now() },
        });
      } else if (autoPlayRadio) {
        // Fallback auto-play radio stream / preset track!
        const randomPreset = PRESET_LOUNGE_TRACKS[Math.floor(Math.random() * PRESET_LOUNGE_TRACKS.length)];
        const fallbackItem: QueueItem = {
          id: 'radio_' + Date.now().toString(36),
          videoId: randomPreset.videoId,
          title: randomPreset.title,
          author: randomPreset.author,
          thumbnail: randomPreset.thumbnail,
          duration: randomPreset.duration,
          addedBy: {
            id: 'radio_bot',
            name: '📻 Lounge Radio',
            avatarColor: '#10b981',
          },
          votes: [],
          downvotes: [],
          priority: 0,
          addedAt: Date.now(),
        };

        set({
          currentTrack: fallbackItem,
          playback: { ...get().playback, isPlaying: true, currentTime: 0, lastUpdated: Date.now() },
        });
      } else {
        set({ currentTrack: null, playback: { ...get().playback, isPlaying: false, currentTime: 0 } });
      }
      return;
    }

    let nextIndex = 0;
    if (shuffleMode && queue.length > 1) {
      nextIndex = Math.floor(Math.random() * queue.length);
    }

    const nextTrack = queue[nextIndex];
    const newQueue = queue.filter((_, idx) => idx !== nextIndex);

    set({
      currentTrack: nextTrack,
      queue: newQueue,
      playback: {
        ...get().playback,
        isPlaying: true,
        currentTime: 0,
        lastUpdated: Date.now(),
      },
    });
  },
}));

