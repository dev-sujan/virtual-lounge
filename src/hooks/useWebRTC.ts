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

        // peerService.init() opens the local Peer node.
        // For guests, setupDataConnection() inside peerService automatically sends
        // JOIN_REQUEST when the DataChannel opens — so we must NOT send it again here.
        await peerService.init(roomId, currentUser.id, isHost);

        if (!isSubscribed) return;

        if (isHost) {
          useRoomStore.getState().setConnectionStatus('connected');
          // Host: post welcome system message on first session
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
        } else {
          // Guest: connect to host. setConnectionStatus('connected') will be set upon receiving JOIN_RESPONSE
          await peerService.connectToHost(roomId);
        }
      } catch (err) {
        console.error('P2P setup error:', err);
        if (isSubscribed) {
          useRoomStore.getState().setConnectionStatus('error', 'Failed to connect to P2P network');
        }
      }
    }

    initP2P();

    // Heartbeat: presence ping + host full state sync every 5 seconds
    const heartbeatTimer = setInterval(() => {
      const state = useRoomStore.getState();
      if (!state.currentUser) return;

      peerService.broadcast('PEER_PRESENCE_UPDATE', { user: state.currentUser });
      peerService.broadcast('PING', { timestamp: Date.now() });

      if (state.isHost) {
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
    }, 5000);

    // Instant re-sync on tab visibility change (resolves tab sleep / throttle drift)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const state = useRoomStore.getState();
        if (!state.currentUser) return;
        peerService.broadcast('PING', { timestamp: Date.now() });

        if (state.isHost) {
          const musicState = useMusicStore.getState();
          const chatState = useChatStore.getState();
          peerService.broadcast('ROOM_STATE_SYNC', {
            queue: musicState.queue,
            currentTrack: musicState.currentTrack,
            playback: musicState.playback,
            repeatMode: musicState.repeatMode,
            shuffleMode: musicState.shuffleMode,
            chatMessages: chatState.messages,
            peers: state.peers,
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isSubscribed = false;
      clearInterval(heartbeatTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
