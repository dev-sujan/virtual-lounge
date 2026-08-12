import { useEffect, useCallback } from 'react';
import { useRoomStore } from '../stores/useRoomStore';
import { useChatStore } from '../stores/useChatStore';
import { useMusicStore } from '../stores/useMusicStore';
import { peerService } from '../services/webrtc/peerService';
import type { User } from '../types';

export function useWebRTC() {
  const { roomId, password, currentUser, isHost, connectionStatus } = useRoomStore();

  // Initialize P2P node when user session is active
  useEffect(() => {
    if (!roomId || !currentUser) return;

    let isSubscribed = true;

    async function initP2P() {
      if (!roomId || !currentUser) return;

      try {
        useRoomStore.getState().setConnectionStatus('connecting');

        await peerService.init(roomId, currentUser.id, isHost);

        if (!isSubscribed) return;

        useRoomStore.getState().setConnectionStatus('connected');

        if (!isHost) {
          // Send join request to room host
          await peerService.connectToHost(roomId);
          peerService.broadcast('JOIN_REQUEST', {
            password,
            user: currentUser,
          });
        } else {
          // Send initial system message as room host
          const messages = useChatStore.getState().messages;
          if (messages.length === 0) {
            useChatStore.getState().addMessage({
              id: 'sys_' + Date.now(),
              senderId: 'system',
              senderName: 'System',
              senderAvatarColor: '#6366f1',
              text: `🌟 Lounge Created! Share Room ID "${roomId}" with your friends.`,
              timestamp: Date.now(),
              reactions: {},
              isSystem: true,
            });
          }
        }
      } catch (err) {
        console.error('P2P setup error:', err);
        if (isSubscribed) {
          useRoomStore.getState().setConnectionStatus('error', 'Failed to connect to P2P network');
        }
      }
    }

    initP2P();

    // Heartbeat presence interval & Host State Sync
    const heartbeatTimer = setInterval(() => {
      if (currentUser && peerService) {
        peerService.broadcast('PEER_PRESENCE_UPDATE', { user: currentUser });
        peerService.broadcast('PING', { timestamp: Date.now() });

        if (isHost) {
          const musicState = useMusicStore.getState();
          const chatState = useChatStore.getState();
          const roomState = useRoomStore.getState();

          peerService.broadcast('ROOM_STATE_SYNC', {
            queue: musicState.queue,
            currentTrack: musicState.currentTrack,
            playback: musicState.playback,
            repeatMode: musicState.repeatMode,
            shuffleMode: musicState.shuffleMode,
            chatMessages: chatState.messages,
            peers: roomState.peers,
          });
        }
      }
    }, 5000);

    return () => {
      isSubscribed = false;
      clearInterval(heartbeatTimer);
    };
  }, [roomId, currentUser?.id, isHost, password]);

  // Broadcast presence updates when user changes status (e.g. mic / camera toggles)
  const updatePresence = useCallback(
    (updates: Partial<User>) => {
      const { updateCurrentUser, currentUser } = useRoomStore.getState();
      updateCurrentUser(updates);
      if (currentUser) {
        peerService.broadcast('PEER_PRESENCE_UPDATE', {
          user: { ...currentUser, ...updates },
        });
      }
    },
    []
  );

  return {
    connectionStatus,
    updatePresence,
  };
}
