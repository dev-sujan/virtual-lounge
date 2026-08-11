import { create } from 'zustand';
import type { QueueItem, PlaybackState, RepeatMode } from '../types';

interface MusicState {
  currentTrack: QueueItem | null;
  queue: QueueItem[];
  playback: PlaybackState;
  repeatMode: RepeatMode;
  shuffleMode: boolean;

  // Actions
  setCurrentTrack: (track: QueueItem | null) => void;
  setQueue: (queue: QueueItem[]) => void;
  addToQueue: (item: QueueItem) => boolean;
  removeFromQueue: (itemId: string) => void;
  reorderQueue: (newQueue: QueueItem[]) => void;
  moveItem: (itemId: string, direction: 'up' | 'down') => void;
  voteItem: (itemId: string, userId: string, voteType: 'up' | 'down') => void;
  clearQueue: () => void;

  setPlaybackState: (updates: Partial<PlaybackState>) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  skipTrack: (direction: 'next' | 'prev') => void;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  currentTrack: null,
  queue: [],
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

  setCurrentTrack: (track) => set({ currentTrack: track }),

  setQueue: (queue) => set({ queue }),

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
    set({ queue: newQueue });
  },

  voteItem: (itemId, userId, voteType) => {
    const { queue } = get();
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

    const sortedQueue = [...updatedQueue].sort((a, b) => b.priority - a.priority);
    set({ queue: sortedQueue });
  },

  clearQueue: () => set({ queue: [] }),

  setPlaybackState: (updates) => {
    set({
      playback: {
        ...get().playback,
        ...updates,
        lastUpdated: Date.now(),
      },
    });
  },

  setRepeatMode: (mode) => set({ repeatMode: mode }),

  toggleShuffle: () => set({ shuffleMode: !get().shuffleMode }),

  skipTrack: (direction) => {
    const { currentTrack, queue, repeatMode, shuffleMode } = get();

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
