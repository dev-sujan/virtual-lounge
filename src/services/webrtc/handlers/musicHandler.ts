import { useMusicStore } from '../../../stores/useMusicStore';
import { useChatStore } from '../../../stores/useChatStore';
import { useRoomStore } from '../../../stores/useRoomStore';
import { useToastStore } from '../../../stores/useToastStore';
import { playPlaySound, playPauseSound, playAirhornSound, playScratchSound, playVictorySound } from '../../../utils/soundUtils';
import type { SyncMessageHandler } from './types';

export const handlePlaybackChange: SyncMessageHandler = (payload, _senderId, _ctx) => {
  const { currentUser } = useRoomStore.getState();
  const toastStore = useToastStore.getState();
  
  const updates = payload;
  useMusicStore.getState().setPlaybackState(updates);

  if (updates.updatedBy && updates.updatedBy !== currentUser?.displayName) {
    if (updates.isPlaying !== undefined) {
      if (updates.isPlaying) {
        playPlaySound();
        toastStore.addToast({
          category: 'music',
          title: '▶️ Music Resumed',
          message: `${updates.updatedBy} started music playback`,
        });
      } else {
        playPauseSound();
        toastStore.addToast({
          category: 'music',
          title: '⏸️ Music Paused',
          message: `${updates.updatedBy} paused music playback`,
        });
      }
    }
  }
};

export const handleQueueChange: SyncMessageHandler = (payload, _senderId, _ctx) => {
  const { currentUser } = useRoomStore.getState();
  const toastStore = useToastStore.getState();
  
  const { queue, currentTrack, action, item, user } = payload;
  if (queue) useMusicStore.getState().setQueue(queue);
  if (currentTrack !== undefined) useMusicStore.getState().setCurrentTrack(currentTrack);

  if (action && item && user && user !== currentUser?.displayName) {
    toastStore.addToast({
      category: 'music',
      title: `🎵 Music Queue Updated`,
      message: `${user} ${action} "${item.title}"`,
    });

    useChatStore.getState().addMessage({
      id: 'sys_' + Date.now(),
      senderId: 'system',
      senderName: 'System',
      senderAvatarColor: '#8b5cf6',
      text: `🎵 ${user} ${action} "${item.title}"`,
      timestamp: Date.now(),
      reactions: {},
      isSystem: true,
    });
  }
};

export const handleSkipVoteChange: SyncMessageHandler = (payload, _senderId, _ctx) => {
  const { votes } = payload;
  if (votes) useMusicStore.getState().setSkipVotes(votes);
};

export const handleMusicReaction: SyncMessageHandler = (payload, _senderId, _ctx) => {
  const { emoji } = payload;
  if (emoji) {
    useMusicStore.getState().triggerReaction(emoji);
  }
};

export const handleDjSoundFx: SyncMessageHandler = (payload, _senderId, _ctx) => {
  const toastStore = useToastStore.getState();
  const { fxType, userName } = payload;
  
  if (fxType === 'airhorn') playAirhornSound();
  else if (fxType === 'scratch') playScratchSound();
  else if (fxType === 'victory') playVictorySound();

  toastStore.addToast({
    category: 'info',
    title: `🎧 DJ FX Triggered`,
    message: `${userName || 'A member'} played ${fxType === 'airhorn' ? '🎺 Airhorn' : fxType === 'scratch' ? '🎧 Vinyl Scratch' : '🏆 Victory Fanfare'}!`,
  });
};
