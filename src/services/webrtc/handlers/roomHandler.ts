import { useRoomStore } from '../../../stores/useRoomStore';
import { useChatStore } from '../../../stores/useChatStore';
import { useToastStore } from '../../../stores/useToastStore';
import { useMusicStore } from '../../../stores/useMusicStore';
import { useVideoStore } from '../../../stores/useVideoStore';
import { playCallSound } from '../../../utils/soundUtils';
import type { SyncMessageHandler } from './types';
import type { User } from '../../../types';

export const handlePing: SyncMessageHandler = (payload, _senderId, ctx) => {
  // Reply directly to the sender instead of broadcasting to all peers (avoids O(N²) messages)
  const senderConn = ctx.sourcePeerId
    ? ctx.peerService.connections.get(ctx.sourcePeerId)
    : null;

  if (senderConn && senderConn.open) {
    ctx.peerService.sendToPeer(senderConn, 'PONG', {
      pingTimestamp: payload.timestamp,
      serverTime: Date.now(),
    });
  } else {
    // Fallback: broadcast if we can't find the sender's connection
    ctx.peerService.broadcast('PONG', {
      pingTimestamp: payload.timestamp,
      serverTime: Date.now(),
    });
  }
};

export const handlePong: SyncMessageHandler = (payload, senderId, _ctx) => {
  if (payload.pingTimestamp) {
    const now = Date.now();
    const rtt = Math.max(1, Math.round(now - payload.pingTimestamp));
    useRoomStore.getState().setPeerPing(senderId, rtt);

    if (payload.serverTime) {
      const hostEstimatedNow = payload.serverTime + rtt / 2;
      const offset = hostEstimatedNow - now;
      useRoomStore.getState().setHostClockOffset(offset);
    }
  }
};

export const handleJoinRequest: SyncMessageHandler = (payload, _senderId, ctx) => {
  if (!payload || !payload.user) return;
  const { password, currentUser, isHost } = useRoomStore.getState();
  const toastStore = useToastStore.getState();
  
  const { password: reqPassword, user: reqUser } = payload;
  if (password && reqPassword !== password) {
    // Send rejection directly to the requesting peer's connection
    const rejectingConn = ctx.sourcePeerId
      ? ctx.peerService.connections.get(ctx.sourcePeerId)
      : null;
    if (rejectingConn && rejectingConn.open) {
      ctx.peerService.sendToPeer(rejectingConn, 'JOIN_RESPONSE', {
        targetUserId: reqUser.id,
        success: false,
        error: 'Invalid password',
      });
    }
    return;
  }

  useRoomStore.getState().addPeer(reqUser);
  toastStore.addToast({
    category: 'info',
    title: `${reqUser.displayName} joined the lounge`,
    message: 'Real-time E2E encrypted peer connected',
  });

  useChatStore.getState().addMessage({
    id: 'sys_' + Date.now(),
    senderId: 'system',
    senderName: 'System',
    senderAvatarColor: '#6366f1',
    text: `👋 ${reqUser.displayName} joined the lounge`,
    timestamp: Date.now(),
    reactions: {},
    isSystem: true,
  });

  if (isHost) {
    const joiningConn = ctx.sourcePeerId
      ? ctx.peerService.connections.get(ctx.sourcePeerId)
      : null;

    // Filter out temporary vanish messages when providing initial chat history
    const persistentChatMessages = useChatStore.getState().messages.filter((m) => !m.isVanish);
    const allParticipants = currentUser
      ? [currentUser, ...useRoomStore.getState().peers]
      : useRoomStore.getState().peers;

    const joinResponsePayload = {
      targetUserId: reqUser.id,
      success: true,
      roomState: {
        queue: useMusicStore.getState().queue,
        currentTrack: useMusicStore.getState().currentTrack,
        playback: useMusicStore.getState().playback,
        repeatMode: useMusicStore.getState().repeatMode,
        shuffleMode: useMusicStore.getState().shuffleMode,
        chatMessages: persistentChatMessages,
        peers: allParticipants,
      },
    };

    if (joiningConn && joiningConn.open) {
      ctx.peerService.sendToPeer(joiningConn, 'JOIN_RESPONSE', joinResponsePayload);
    } else {
      ctx.peerService.broadcast('JOIN_RESPONSE', joinResponsePayload);
    }

    // Announce the newly joined guest to all other peers in the room
    ctx.peerService.broadcast('PEER_PRESENCE_UPDATE', { user: reqUser });

    const videoStore = useVideoStore.getState();
    if (videoStore.isVideoCallActive && ctx.peerService.peer) {
      setTimeout(() => {
        ctx.peerService.broadcast('PULL_PEER_STREAM', {
          targetUserId: 'all',
          requesterPeerId: ctx.peerService.peer?.id,
        });
      }, 1500);
    }
  }
};

export const handleHostAnnounce: SyncMessageHandler = (payload, _senderId, ctx) => {
  const { isHost } = useRoomStore.getState();
  const { roomId: annRoomId } = payload;
  const currentRoomId = useRoomStore.getState().roomId;
  if (!isHost && currentRoomId && annRoomId && annRoomId.toUpperCase() === currentRoomId.toUpperCase()) {
    const hostPeerId = `synclounge-room-${currentRoomId.toLowerCase()}`;
    const hostConn = ctx.peerService.connections.get(hostPeerId);
    if (!hostConn || !hostConn.open) {
      console.log('[P2P] Host re-announced room presence. Connecting...');
      ctx.peerService.connectToHost(currentRoomId);
    }
  }
};

export const handleRoomStateSync: SyncMessageHandler = (payload, _senderId, _ctx) => {
  const { isHost, currentUser } = useRoomStore.getState();
  if (!isHost) {
    const { queue, currentTrack, playback, repeatMode, shuffleMode, peers } = payload;
    if (queue) useMusicStore.getState().setQueue(queue);
    if (currentTrack !== undefined) useMusicStore.getState().setCurrentTrack(currentTrack);
    if (playback) {
      const localPlayback = useMusicStore.getState().playback;
      const elapsed = localPlayback.isPlaying
        ? (Date.now() - localPlayback.lastUpdated) / 1000
        : 0;
      const localExpected = localPlayback.currentTime + elapsed;
      const syncTime = playback.currentTime +
        (playback.isPlaying ? (Date.now() - playback.lastUpdated) / 1000 : 0);
      if (Math.abs(localExpected - syncTime) > 3 || localPlayback.isPlaying !== playback.isPlaying) {
        useMusicStore.getState().setPlaybackState({
          ...playback,
          currentTime: syncTime,
          lastUpdated: Date.now(),
        });
      }
    }
    if (repeatMode) useMusicStore.getState().setRepeatMode(repeatMode);
    if (shuffleMode !== undefined) useMusicStore.getState().setShuffleMode(shuffleMode);
    if (peers && currentUser) {
      const filteredPeers = peers.filter((p: User) => p.id !== currentUser.id);
      useRoomStore.getState().setPeers(filteredPeers);
    }
  }
};

export const handleJoinResponse: SyncMessageHandler = (payload, _senderId, _ctx) => {
  const { currentUser } = useRoomStore.getState();
  const { targetUserId, success, error, roomState } = payload;
  if (currentUser && targetUserId === currentUser.id) {
    if (!success) {
      useRoomStore.getState().setConnectionStatus('error', error || 'Room join rejected');
    } else if (roomState) {
      // Mark guest as connected — this is the authoritative signal from the host
      useRoomStore.getState().setConnectionStatus('connected');
      if (roomState.queue) useMusicStore.getState().setQueue(roomState.queue);
      if (roomState.currentTrack) useMusicStore.getState().setCurrentTrack(roomState.currentTrack);
      if (roomState.playback) useMusicStore.getState().setPlaybackState(roomState.playback);
      if (roomState.chatMessages) {
        // Exclude vanished messages
        const validChat = roomState.chatMessages.filter((m: any) => !m.isVanish);
        useChatStore.getState().setMessages(validChat);
      }
      if (roomState.peers) {
        const filteredPeers = roomState.peers.filter((p: User) => p.id !== currentUser.id);
        useRoomStore.getState().setPeers(filteredPeers);
      }
    }
  }
};

export const handlePeerPresenceUpdate: SyncMessageHandler = (payload, _senderId, _ctx) => {
  const { user } = payload;
  if (user) {
    const { currentUser } = useRoomStore.getState();
    if (currentUser && user.id === currentUser.id) return;
    useRoomStore.getState().addPeer(user);
  }
};

export const handleMediaStatusChange: SyncMessageHandler = (payload, _senderId, _ctx) => {
  const { userId, userName, isMicOn, isCameraOn } = payload;
  useVideoStore.getState().updateRemoteStatusByUserId(userId, {
    ...(isMicOn !== undefined && { isMicOn }),
    ...(isCameraOn !== undefined && { isCameraOn }),
  });

  playCallSound();

  const toastStore = useToastStore.getState();
  if (isMicOn !== undefined) {
    toastStore.addToast({
      category: 'media',
      title: `${userName || 'Peer'} ${isMicOn ? 'unmuted' : 'muted'} microphone`,
      icon: isMicOn ? 'mic-on' : 'mic-off',
    });
  }
  if (isCameraOn !== undefined) {
    toastStore.addToast({
      category: 'media',
      title: `${userName || 'Peer'} turned ${isCameraOn ? 'on' : 'off'} camera`,
      icon: isCameraOn ? 'video-on' : 'video-off',
    });
  }
};

export const handlePullPeerStream: SyncMessageHandler = async (payload, _senderId, ctx) => {
  const { targetUserId, requesterPeerId } = payload;
  const currentUserId = useRoomStore.getState().currentUser?.id;
  if (currentUserId && (targetUserId === currentUserId || targetUserId === 'all')) {
    console.log('[P2P] Peer requested stream pull, re-initiating calls to all peers');
    const videoStore = useVideoStore.getState();
    let streamToUse = videoStore.localStream;
    if (!streamToUse) {
      try {
        streamToUse = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        videoStore.setLocalStream(streamToUse);
      } catch {}
    }
    if (streamToUse) {
      ctx.peerService.callAllPeers(streamToUse);
      if (requesterPeerId && !ctx.peerService.mediaCalls.has(requesterPeerId)) {
        ctx.peerService.callPeer(requesterPeerId, streamToUse);
      }
    }
  }
};

export const handleLeaveRoom: SyncMessageHandler = (payload, _senderId, _ctx) => {
  const { userId, userName } = payload;

  useRoomStore.getState().removePeer(userId);
  useToastStore.getState().addToast({
    category: 'warning',
    title: `${userName || 'A user'} left the lounge`,
  });
  useChatStore.getState().addMessage({
    id: 'sys_' + Date.now(),
    senderId: 'system',
    senderName: 'System',
    senderAvatarColor: '#f43f5e',
    text: `🚪 ${userName} left the room`,
    timestamp: Date.now(),
    reactions: {},
    isSystem: true,
  });
};
