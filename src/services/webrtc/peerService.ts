import Peer from 'peerjs';
import type { DataConnection, MediaConnection } from 'peerjs';
import type { SyncMessagePayload, SyncEventType, User } from '../../types';
import { useRoomStore } from '../../stores/useRoomStore';
import { useMusicStore } from '../../stores/useMusicStore';
import { useChatStore } from '../../stores/useChatStore';
import { useGameStore } from '../../stores/useGameStore';
import { useVideoStore } from '../../stores/useVideoStore';
import { useToastStore } from '../../stores/useToastStore';
import { playMessageSound, playReactionSound } from '../../utils/soundUtils';

type MessageHandler = (msg: SyncMessagePayload) => void;

class PeerService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private mediaCalls: Map<string, MediaConnection> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;
  private messageHandlers: MessageHandler[] = [];
  private isInitialized = false;

  public init(roomId: string, userId: string, isHost: boolean): Promise<string> {
    if (this.isInitialized && this.peer) {
      return Promise.resolve(this.peer.id);
    }

    return new Promise((resolve) => {
      this.destroy();

      try {
        this.broadcastChannel = new BroadcastChannel(`synclounge_bcast_${roomId}`);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.senderId !== userId) {
            this.handleIncomingMessage(event.data);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported:', err);
      }

      const peerId = isHost
        ? `synclounge-room-${roomId.toLowerCase()}`
        : `synclounge-${roomId.toLowerCase()}-${userId.slice(-6)}`;

      try {
        this.peer = new Peer(peerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
            ],
          },
        });

        this.peer.on('open', (id) => {
          console.log('[P2P] Peer initialized with ID:', id);
          this.isInitialized = true;
          resolve(id);
        });

        this.peer.on('connection', (conn) => {
          this.setupDataConnection(conn);
        });

        this.peer.on('call', (call) => {
          this.handleIncomingCall(call);
        });

        this.peer.on('error', (err) => {
          console.warn('[P2P] PeerJS warning/error:', err.type, err.message);
          if (err.type === 'unavailable-id' && isHost) {
            const altId = `synclounge-${roomId.toLowerCase()}-host-${userId.slice(-4)}`;
            this.peer = new Peer(altId, {
              config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
            });
            this.peer.on('open', (id) => {
              this.isInitialized = true;
              resolve(id);
            });
            this.peer.on('connection', (conn) => this.setupDataConnection(conn));
            this.peer.on('call', (call) => this.handleIncomingCall(call));
          } else {
            resolve(peerId);
          }
        });
      } catch (err) {
        console.error('[P2P] Failed to instantiate PeerJS:', err);
        resolve(peerId);
      }
    });
  }

  public connectToHost(roomId: string, hostPeerId?: string): Promise<DataConnection | null> {
    if (!this.peer) return Promise.resolve(null);

    const targetId = hostPeerId || `synclounge-room-${roomId.toLowerCase()}`;
    return new Promise((resolve) => {
      try {
        const conn = this.peer!.connect(targetId, { reliable: true });
        this.setupDataConnection(conn);
        conn.on('open', () => {
          console.log('[P2P] Connected to host peer:', targetId);
          resolve(conn);
        });
        setTimeout(() => resolve(conn), 3000);
      } catch (err) {
        console.error('[P2P] Error connecting to host:', err);
        resolve(null);
      }
    });
  }

  private setupDataConnection(conn: DataConnection) {
    this.connections.set(conn.peer, conn);

    conn.on('data', (data: any) => {
      this.handleIncomingMessage(data as SyncMessagePayload);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      const roomStore = useRoomStore.getState();
      roomStore.removePeer(conn.peer);
    });

    conn.on('error', (err) => {
      console.warn('[P2P] Data Connection error:', err);
    });
  }

  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  public broadcast(type: SyncEventType, payload: any) {

    const { currentUser } = useRoomStore.getState();
    if (!currentUser) return;

    const message: SyncMessagePayload = {
      type,
      senderId: currentUser.id,
      timestamp: Date.now(),
      payload,
    };

    this.connections.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(message);
        } catch (e) {
          console.warn('[P2P] Failed to send via DataChannel:', e);
        }
      }
    });

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch (e) {
        console.warn('[P2P] Failed to send via BroadcastChannel:', e);
      }
    }
  }

  private handleIncomingMessage(msg: SyncMessagePayload) {
    if (!msg || !msg.type) return;

    const { password, currentUser, isHost } = useRoomStore.getState();

    switch (msg.type) {
      case 'JOIN_REQUEST': {
        const { password: reqPassword, user: reqUser } = msg.payload;
        if (password && reqPassword !== password) {
          this.broadcast('JOIN_RESPONSE', {
            targetUserId: reqUser.id,
            success: false,
            error: 'Invalid password',
          });
          return;
        }

        useRoomStore.getState().addPeer(reqUser);
        useToastStore.getState().addToast({
          category: 'info',
          title: `${reqUser.displayName} joined the lounge`,
          message: 'Real-time peer connected',
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
          this.broadcast('JOIN_RESPONSE', {
            targetUserId: reqUser.id,
            success: true,
            roomState: {
              queue: useMusicStore.getState().queue,
              currentTrack: useMusicStore.getState().currentTrack,
              playback: useMusicStore.getState().playback,
              repeatMode: useMusicStore.getState().repeatMode,
              shuffleMode: useMusicStore.getState().shuffleMode,
              chatMessages: useChatStore.getState().messages,
              peers: [...useRoomStore.getState().peers, currentUser],
            },
          });
        }
        break;
      }

      case 'JOIN_RESPONSE': {
        const { targetUserId, success, error, roomState } = msg.payload;
        if (currentUser && targetUserId === currentUser.id) {
          if (!success) {
            useRoomStore.getState().setConnectionStatus('error', error || 'Room join rejected');
          } else if (roomState) {
            if (roomState.queue) useMusicStore.getState().setQueue(roomState.queue);
            if (roomState.currentTrack) useMusicStore.getState().setCurrentTrack(roomState.currentTrack);
            if (roomState.playback) useMusicStore.getState().setPlaybackState(roomState.playback);
            if (roomState.chatMessages) useChatStore.getState().setMessages(roomState.chatMessages);
            if (roomState.peers) {
              const filteredPeers = roomState.peers.filter((p: User) => p.id !== currentUser.id);
              useRoomStore.getState().setPeers(filteredPeers);
            }
          }
        }
        break;
      }

      case 'PLAYBACK_CHANGE': {
        useMusicStore.getState().setPlaybackState(msg.payload);
        break;
      }

      case 'QUEUE_CHANGE': {
        const { queue, currentTrack, action, item, user } = msg.payload;
        if (queue) useMusicStore.getState().setQueue(queue);
        if (currentTrack !== undefined) useMusicStore.getState().setCurrentTrack(currentTrack);

        if (action && item && user) {
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
        break;
      }

      case 'SKIP_VOTE_CHANGE': {
        const { votes } = msg.payload;
        if (votes) useMusicStore.getState().setSkipVotes(votes);
        break;
      }


      case 'CHAT_MESSAGE': {
        useChatStore.getState().addMessage(msg.payload);
        playMessageSound();
        break;
      }

      case 'CHAT_REACTION': {
        const { msgId, emoji, userId } = msg.payload;
        useChatStore.getState().addReaction(msgId, emoji, userId);
        playReactionSound();
        break;
      }

      case 'CHAT_DELETE': {
        useChatStore.getState().deleteMessage(msg.payload.msgId);
        break;
      }

      case 'TYPING_INDICATOR': {
        const { userId, name, isTyping } = msg.payload;
        useChatStore.getState().setTypingUser(userId, name, isTyping);
        break;
      }

      case 'GAME_STATE_CHANGE': {
        const { gameType, state } = msg.payload;
        const gameStore = useGameStore.getState();
        if (gameType === 'tictactoe') {
          gameStore.updateTicTacToe(state);
        } else if (gameType === 'rps') {
          gameStore.updateRPS(state);
        } else if (gameType === 'connectfour') {
          gameStore.updateConnectFour(state);
        }
        break;
      }

      case 'PEER_PRESENCE_UPDATE': {
        const { user } = msg.payload;
        if (user) {
          useRoomStore.getState().addPeer(user);
        }
        break;
      }

      case 'MEDIA_STATUS_CHANGE': {
        const { userId, userName, isMicOn, isCameraOn } = msg.payload;
        useVideoStore.getState().updateRemoteStatusByUserId(userId, {
          ...(isMicOn !== undefined && { isMicOn }),
          ...(isCameraOn !== undefined && { isCameraOn }),
        });

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
        break;
      }

      case 'LEAVE_ROOM': {
        const { userId, userName } = msg.payload;
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
        break;
      }

      default:
        break;
    }

    this.messageHandlers.forEach((handler) => handler(msg));
  }

  public callPeer(peerId: string, stream: MediaStream): MediaConnection | null {
    if (!this.peer) return null;
    try {
      if (this.mediaCalls.has(peerId)) {
        const existingCall = this.mediaCalls.get(peerId);
        existingCall?.close();
        this.mediaCalls.delete(peerId);
      }
      console.log('[P2P] Calling peer:', peerId);
      const call = this.peer.call(peerId, stream);
      this.setupMediaCall(call);
      return call;
    } catch (err) {
      console.error('[P2P] Failed to call peer:', err);
      return null;
    }
  }

  public callAllPeers(stream: MediaStream) {
    if (!this.peer) return;
    const { peers, roomId, isHost } = useRoomStore.getState();

    const targetPeerIds: string[] = [];

    if (!isHost && roomId) {
      targetPeerIds.push(`synclounge-room-${roomId.toLowerCase()}`);
    }

    peers.forEach((peerUser) => {
      if (roomId && !peerUser.isHost) {
        const guestPeerId = `synclounge-${roomId.toLowerCase()}-${peerUser.id.slice(-6)}`;
        if (guestPeerId !== this.peer?.id) {
          targetPeerIds.push(guestPeerId);
        }
      }
    });

    targetPeerIds.forEach((targetId) => {
      const existingCall = this.mediaCalls.get(targetId);
      if (!existingCall || (existingCall as any).open === false) {
        this.callPeer(targetId, stream);
      } else {
        const updated = this.updateLocalStreamTrack(stream, targetId);
        if (!updated) {
          this.callPeer(targetId, stream);
        }
      }
    });
  }

  private handleIncomingCall(call: MediaConnection) {
    const videoStore = useVideoStore.getState();
    const localStream = videoStore.localStream;

    call.answer(localStream || undefined);
    this.setupMediaCall(call);

    if (localStream) {
      setTimeout(() => {
        this.updateLocalStreamTrack(localStream, call.peer);
      }, 500);
    }
  }

  private setupMediaCall(call: MediaConnection) {
    this.mediaCalls.set(call.peer, call);

    call.on('stream', (remoteStream) => {
      console.log('[P2P] Received remote stream from peer:', call.peer, 'tracks:', remoteStream.getTracks().length);
      const peers = useRoomStore.getState().peers;
      const peerInfo = peers.find(
        (p) => call.peer.includes(p.id.slice(-6)) || p.id === call.peer || (p.isHost && call.peer.includes('room-'))
      );

      const videoStore = useVideoStore.getState();
      videoStore.addRemoteStream({
        peerId: call.peer,
        userId: peerInfo?.id || call.peer,
        userName: peerInfo?.displayName || (call.peer.includes('room-') ? 'Host' : 'Peer User'),
        avatarColor: peerInfo?.avatarColor || '#6366f1',
        stream: remoteStream,
        isMicOn: true,
        isCameraOn: true,
      });

      if (!videoStore.isVideoCallActive) {
        videoStore.setVideoCallActive(true);
      }
    });

    call.on('close', () => {
      this.mediaCalls.delete(call.peer);
      useVideoStore.getState().removeRemoteStream(call.peer);
    });

    call.on('error', (err) => {
      console.warn('[P2P] Media Call Error:', err);
    });
  }

  public updateLocalStreamTrack(newStream: MediaStream, targetPeerId?: string): boolean {
    const videoTrack = newStream.getVideoTracks()[0];
    const audioTrack = newStream.getAudioTracks()[0];
    let hasUpdatedAnySender = false;

    const callsToUpdate = targetPeerId
      ? [this.mediaCalls.get(targetPeerId)].filter(Boolean) as MediaConnection[]
      : Array.from(this.mediaCalls.values());

    callsToUpdate.forEach((call) => {
      const pc = (call as any).peerConnection as RTCPeerConnection | undefined;
      if (pc && pc.connectionState !== 'closed' && pc.connectionState !== 'failed') {
        const senders = pc.getSenders();
        let videoSender = senders.find((s) => s.track?.kind === 'video');
        let audioSender = senders.find((s) => s.track?.kind === 'audio');

        if (videoTrack) {
          if (videoSender) {
            videoSender.replaceTrack(videoTrack).catch((e) => console.warn('[P2P] replaceTrack video err:', e));
            hasUpdatedAnySender = true;
          } else {
            try {
              pc.addTrack(videoTrack, newStream);
              hasUpdatedAnySender = true;
            } catch (e) {
              console.warn('[P2P] addTrack video err:', e);
            }
          }
        }

        if (audioTrack) {
          if (audioSender) {
            audioSender.replaceTrack(audioTrack).catch((e) => console.warn('[P2P] replaceTrack audio err:', e));
            hasUpdatedAnySender = true;
          } else {
            try {
              pc.addTrack(audioTrack, newStream);
              hasUpdatedAnySender = true;
            } catch (e) {
              console.warn('[P2P] addTrack audio err:', e);
            }
          }
        }
      }
    });

    return hasUpdatedAnySender;
  }

  public destroy() {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();

    this.mediaCalls.forEach((call) => call.close());
    this.mediaCalls.clear();

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.isInitialized = false;
  }
}

export const peerService = new PeerService();
