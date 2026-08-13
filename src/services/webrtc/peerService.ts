import Peer from 'peerjs';
import type { DataConnection, MediaConnection } from 'peerjs';
import type { SyncMessagePayload, SyncEventType } from '../../types';
import { useRoomStore } from '../../stores/useRoomStore';
import { useVideoStore } from '../../stores/useVideoStore';
import { useToastStore } from '../../stores/useToastStore';
import { encryptPayload, decryptPayload } from '../../utils/cryptoUtils';
import { dispatchMessage } from './handlers/messageRouter';

type MessageHandler = (msg: SyncMessagePayload) => void;

class PeerService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private mediaCalls: Map<string, MediaConnection> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;
  private messageHandlers: MessageHandler[] = [];
  private isInitialized = false;
  private autoReconnectTimer: ReturnType<typeof setInterval> | null = null;

  public init(roomId: string, userId: string, isHost: boolean): Promise<string> {
    // Return existing active peer if already initializing or connected
    if (this.peer && !this.peer.destroyed) {
      if (this.isInitialized) {
        return Promise.resolve(this.peer.id);
      }
      return new Promise((resolve) => {
        let resolved = false;
        this.peer?.once('open', (id) => {
          if (!resolved) { resolved = true; resolve(id); }
        });
        setTimeout(() => {
          if (!resolved) { resolved = true; resolve(this.peer?.id || `synclounge-${roomId.toLowerCase()}-${userId.slice(-6)}`); }
        }, 3000);
      });
    }

    if (this.peer) {
      try {
        this.destroy();
      } catch {}
    }


    return new Promise((resolve) => {
      try {
        this.broadcastChannel = new BroadcastChannel(`synclounge_bcast_${roomId}`);
        this.broadcastChannel.onmessage = async (event) => {
          if (event.data && event.data.senderId !== userId) {
            await this.handleIncomingMessage(event.data);
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
              { urls: 'stun:stun3.l.google.com:19302' },
              { urls: 'stun:stun4.l.google.com:19302' },
              { urls: 'stun:stun.services.mozilla.com' },
              { urls: 'stun:global.stun.twilio.com:3478' },
            ],
          },
        });

        this.peer.on('open', (id) => {
          console.log('[P2P] Peer initialized with ID:', id);
          this.isInitialized = true;
          if (isHost) {
            if (this.broadcastChannel) {
              try {
                this.broadcastChannel.postMessage({
                  type: 'HOST_ANNOUNCE',
                  senderId: userId,
                  timestamp: Date.now(),
                  payload: { roomId },
                });
              } catch {}
            }
            const knownPeers = useRoomStore.getState().peers;
            knownPeers.forEach((p) => {
              if (p.id !== userId) {
                const guestPeerId = `synclounge-${roomId.toLowerCase()}-${p.id.slice(-6)}`;
                this.connectToPeer(guestPeerId);
              }
            });
          }
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

    // Already connected to host & open — reuse existing connection
    if (this.connections.has(targetId)) {
      const existing = this.connections.get(targetId);
      if (existing && existing.open) {
        return Promise.resolve(existing);
      }
      this.connections.delete(targetId);
    }

    return new Promise((resolve) => {
      try {
        let resolved = false;
        const conn = this.peer!.connect(targetId, { reliable: true });
        this.setupDataConnection(conn);
        conn.on('open', () => {
          console.log('[P2P] Connected to host peer:', targetId);
          if (!resolved) { resolved = true; resolve(conn); }
        });
        // Fallback timeout if ICE negotiation takes longer than expected
        setTimeout(() => {
          if (!resolved) { resolved = true; resolve(this.connections.get(targetId) || conn); }
        }, 5000);
      } catch (err) {
        console.error('[P2P] Error connecting to host:', err);
        resolve(null);
      }
    });
  }

  public connectToPeer(peerId: string): Promise<DataConnection | null> {
    if (!this.peer) return Promise.resolve(null);
    if (this.connections.has(peerId)) {
      const existing = this.connections.get(peerId);
      if (existing && existing.open) {
        return Promise.resolve(existing);
      }
      this.connections.delete(peerId);
    }
    return new Promise((resolve) => {
      try {
        let resolved = false;
        const conn = this.peer!.connect(peerId, { reliable: true });
        this.setupDataConnection(conn);
        conn.on('open', () => { if (!resolved) { resolved = true; resolve(conn); } });
        setTimeout(() => { if (!resolved) { resolved = true; resolve(conn); } }, 3000);
      } catch {
        resolve(null);
      }
    });
  }

  public startAutoReconnect(roomId: string) {
    if (this.autoReconnectTimer) return;

    let attempts = 0;
    const maxAttempts = 25;
    console.log('[P2P] Connection lost. Starting exponential backoff auto-reconnect...');

    const runReconnect = async () => {
      attempts++;
      const { isHost, currentUser } = useRoomStore.getState();

      const hostId = `synclounge-room-${roomId.toLowerCase()}`;
      const activeHostConn = this.connections.get(hostId);

      if (isHost || (activeHostConn && activeHostConn.open) || attempts > maxAttempts) {
        if (this.autoReconnectTimer) clearTimeout(this.autoReconnectTimer);
        this.autoReconnectTimer = null;
        return;
      }

      console.log(`[P2P] Auto-reconnecting to room "${roomId}" (attempt ${attempts}/${maxAttempts})...`);
      const conn = await this.connectToHost(roomId);
      if (conn && currentUser && conn.open) {
        const normalizedPassword = (useRoomStore.getState().password || '').trim();
        this.sendToPeer(conn, 'JOIN_REQUEST', {
          password: normalizedPassword,
          user: currentUser,
        });
        if (this.autoReconnectTimer) clearTimeout(this.autoReconnectTimer);
        this.autoReconnectTimer = null;
        return;
      }

      // Exponential backoff delay with random jitter (2s, 3.5s, 5.5s... max 15s)
      const nextDelay = Math.min(15000, Math.floor(2000 * Math.pow(1.4, attempts - 1) + Math.random() * 600));
      this.autoReconnectTimer = setTimeout(runReconnect, nextDelay);
    };

    this.autoReconnectTimer = setTimeout(runReconnect, 1000);
  }

  private setupDataConnection(conn: DataConnection) {
    this.connections.set(conn.peer, conn);

    conn.on('open', () => {
      console.log('[P2P] DataChannel opened with peer:', conn.peer);
      const { currentUser, isHost, password, roomId } = useRoomStore.getState();

      // Only send JOIN_REQUEST when connecting to the host peer.
      // In mesh mode guests also connect to each other - those don't need JOIN_REQUEST.
      const isConnectingToHost = conn.peer.includes(`synclounge-room-`);

      if (!isHost && currentUser && isConnectingToHost) {
        // Send JOIN_REQUEST directly over this specific DataChannel connection
        const normalizedPassword = (password || '').trim();
        const activeRoomId = (roomId || 'default_lounge').toLowerCase().trim();
        const secretKey = `synclounge_${activeRoomId}_${normalizedPassword}`;

        encryptPayload(
          { password: normalizedPassword, user: currentUser },
          secretKey
        ).then((encryptedPayload) => {
          const message: SyncMessagePayload = {
            type: 'JOIN_REQUEST',
            senderId: currentUser.id,
            timestamp: Date.now(),
            payload: encryptedPayload,
          };
          if (conn.open) {
            conn.send(message);
          }
        });
      }
    });

    conn.on('data', async (data: any) => {
      await this.handleIncomingMessage(data as SyncMessagePayload);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      const { isHost, roomId } = useRoomStore.getState();
      if (!isHost && roomId) {
        this.startAutoReconnect(roomId);
      }
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

  // Send an encrypted message directly to a single peer DataConnection
  public async sendToPeer(conn: DataConnection, type: SyncEventType, payload: any) {
    const { currentUser, roomId, password } = useRoomStore.getState();
    if (!currentUser || !conn.open) return;

    const normalizedPassword = (password || '').trim();
    const activeRoomId = (roomId || 'default_lounge').toLowerCase().trim();
    const secretKey = `synclounge_${activeRoomId}_${normalizedPassword}`;
    const encryptedPayload = await encryptPayload(payload, secretKey);

    const message: SyncMessagePayload = {
      type,
      senderId: currentUser.id,
      timestamp: Date.now(),
      payload: encryptedPayload,
    };

    try {
      conn.send(message);
    } catch (e) {
      console.warn('[P2P] sendToPeer failed:', e);
    }
  }

  public async broadcast(type: SyncEventType, payload: any) {

    const { currentUser, roomId, password } = useRoomStore.getState();
    if (!currentUser) return;

    // Normalize encryption key secret per room & password
    const normalizedPassword = (password || '').trim();
    const activeRoomId = (roomId || 'default_lounge').toLowerCase().trim();
    const secretKey = `synclounge_${activeRoomId}_${normalizedPassword}`;
    const encryptedPayload = await encryptPayload(payload, secretKey);

    const message: SyncMessagePayload = {
      type,
      senderId: currentUser.id,
      timestamp: Date.now(),
      payload: encryptedPayload,
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

  private async handleIncomingMessage(msg: SyncMessagePayload) {
    if (!msg || !msg.type) return;

    const { password, roomId } = useRoomStore.getState();

    // Decrypt payload using AES-256-GCM E2EE secret key
    const normalizedPassword = (password || '').trim();
    const activeRoomId = (roomId || 'default_lounge').toLowerCase().trim();
    const secretKey = `synclounge_${activeRoomId}_${normalizedPassword}`;
    const payload = await decryptPayload(msg.payload, secretKey);

    await dispatchMessage(msg.type, payload, msg.senderId, { peerService: this });

    // HOST RELAY: If this node is the host and message came from a guest,
    // forward the original encrypted wire message to all other connected peers.
    // This is the key fix for >2 person rooms: Host acts as relay hub.
    const { isHost: nowIsHost, currentUser: nowCurrentUser } = useRoomStore.getState();
    if (nowIsHost && nowCurrentUser && msg.senderId !== nowCurrentUser.id) {
      // Messages that should NOT be relayed (host-only or would cause loops)
      const noRelayTypes: SyncEventType[] = ['PING', 'PONG', 'JOIN_REQUEST', 'JOIN_RESPONSE', 'HOST_ANNOUNCE'];
      if (!noRelayTypes.includes(msg.type)) {
        this.connections.forEach((conn, connPeerId) => {
          // Relay to all peers EXCEPT the sender (identified by last 6 chars of their userId)
          const isSender = connPeerId.endsWith(msg.senderId.slice(-6)) || connPeerId === msg.senderId;
          if (!isSender && conn.open) {
            try {
              conn.send(msg); // Forward original encrypted message as-is
            } catch (e) {
              console.warn('[P2P] Relay forward failed:', e);
            }
          }
        });
      }
    }

    this.messageHandlers.forEach((handler) => handler(msg));
  }

  public requestPullStream(targetUserId: string) {
    if (!this.peer) return;
    console.log('[P2P] Requesting stream pull from user:', targetUserId);
    useToastStore.getState().addToast({
      category: 'info',
      title: '🔄 Pulling Peer Video Stream',
      message: 'Re-establishing WebRTC media connection...',
    });
    this.broadcast('PULL_PEER_STREAM', {
      targetUserId,
      requesterPeerId: this.peer.id,
    });
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
    const { peers, roomId, currentUser } = useRoomStore.getState();
    if (!roomId) return;

    const targetPeerIds: string[] = [];

    // Always call the host
    const hostPeerId = `synclounge-room-${roomId.toLowerCase()}`;
    if (hostPeerId !== this.peer.id) {
      targetPeerIds.push(hostPeerId);
    }

    // Also call every other guest in the room
    peers.forEach((peerUser) => {
      if (!peerUser.isHost && peerUser.id !== currentUser?.id) {
        const guestPeerId = `synclounge-${roomId.toLowerCase()}-${peerUser.id.slice(-6)}`;
        if (guestPeerId !== this.peer?.id && !targetPeerIds.includes(guestPeerId)) {
          targetPeerIds.push(guestPeerId);
        }
      }
    });

    console.log('[P2P] Calling all peers for video:', targetPeerIds);

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
    if (this.autoReconnectTimer) {
      clearTimeout(this.autoReconnectTimer);
      this.autoReconnectTimer = null;
    }
    this.messageHandlers = [];

    this.connections.forEach((conn) => conn.close());
    this.connections.clear();

    this.mediaCalls.forEach((call) => call.close());
    this.mediaCalls.clear();

    this.broadcastChannel?.close();
    this.broadcastChannel = null;

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.isInitialized = false;
  }
}

export const peerService = new PeerService();
