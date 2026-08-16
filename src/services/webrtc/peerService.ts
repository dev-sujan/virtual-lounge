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
  public peer: Peer | null = null;
  public connections: Map<string, DataConnection> = new Map();
  public mediaCalls: Map<string, MediaConnection> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;
  private messageHandlers: MessageHandler[] = [];
  private isInitialized = false;
  private autoReconnectTimer: ReturnType<typeof setInterval> | null = null;
  private isReconnecting = false;
  private pendingHostConnectPromise: Promise<DataConnection | null> | null = null;
  private pendingPeerConnectPromises: Map<string, Promise<DataConnection | null>> = new Map();
  private processedMessages = new Set<string>();

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
            this.peer.on('error', (altErr) => {
              console.warn('[P2P] Alt-peer error:', altErr.type, altErr.message);
              resolve(altId);
            });
            this.peer.on('disconnected', () => {
              console.warn('[P2P] Alt-peer disconnected from signaling server, attempting reconnect...');
              this.peer?.reconnect();
            });
          } else {
            resolve(peerId);
          }
        });

        this.peer.on('disconnected', () => {
          console.warn('[P2P] Peer disconnected from signaling server, attempting reconnect...');
          if (this.peer && !this.peer.destroyed) {
            this.peer.reconnect();
          }
        });
      } catch (err) {
        console.error('[P2P] Failed to instantiate PeerJS:', err);
        resolve(peerId);
      }
    });
  }

  public connectToHost(roomId: string, hostPeerId?: string): Promise<DataConnection | null> {
    if (!this.peer || this.peer.destroyed) return Promise.resolve(null);

    const targetId = hostPeerId || `synclounge-room-${roomId.toLowerCase()}`;

    // 1. If already connected to host & open — reuse existing connection
    const existing = this.connections.get(targetId);
    if (existing && existing.open) {
      return Promise.resolve(existing);
    }

    // 2. If a connection attempt is already in-flight, reuse the same promise
    if (this.pendingHostConnectPromise) {
      return this.pendingHostConnectPromise;
    }

    // 3. Clean up dead connection if present
    if (existing) {
      try { existing.close(); } catch {}
      this.connections.delete(targetId);
    }

    this.pendingHostConnectPromise = new Promise((resolve) => {
      let settled = false;
      const cleanup = (result: DataConnection | null) => {
        if (!settled) {
          settled = true;
          this.pendingHostConnectPromise = null;
          resolve(result);
        }
      };

      try {
        console.log('[P2P] Connecting to host:', targetId);
        const conn = this.peer!.connect(targetId, { reliable: true });
        this.setupDataConnection(conn);

        conn.on('open', () => {
          console.log('[P2P] Connected to host peer:', targetId);
          cleanup(conn);
        });

        conn.on('close', () => {
          cleanup(null);
        });

        conn.on('error', (err) => {
          console.warn('[P2P] Connection error with host:', err);
          cleanup(null);
        });

        // 6 second timeout for ICE negotiation
        setTimeout(() => {
          const activeConn = this.connections.get(targetId);
          cleanup(activeConn && activeConn.open ? activeConn : null);
        }, 6000);
      } catch (err) {
        console.error('[P2P] Error connecting to host:', err);
        cleanup(null);
      }
    });

    return this.pendingHostConnectPromise;
  }

  public connectToPeer(peerId: string): Promise<DataConnection | null> {
    if (!this.peer || this.peer.destroyed) return Promise.resolve(null);

    const existing = this.connections.get(peerId);
    if (existing && existing.open) {
      return Promise.resolve(existing);
    }

    if (this.pendingPeerConnectPromises.has(peerId)) {
      return this.pendingPeerConnectPromises.get(peerId)!;
    }

    if (existing) {
      try { existing.close(); } catch {}
      this.connections.delete(peerId);
    }

    const promise = new Promise<DataConnection | null>((resolve) => {
      let settled = false;
      const cleanup = (result: DataConnection | null) => {
        if (!settled) {
          settled = true;
          this.pendingPeerConnectPromises.delete(peerId);
          resolve(result);
        }
      };

      try {
        const conn = this.peer!.connect(peerId, { reliable: true });
        this.setupDataConnection(conn);
        conn.on('open', () => cleanup(conn));
        conn.on('close', () => cleanup(null));
        conn.on('error', () => cleanup(null));
        setTimeout(() => {
          const activeConn = this.connections.get(peerId);
          cleanup(activeConn && activeConn.open ? activeConn : null);
        }, 4000);
      } catch {
        cleanup(null);
      }
    });

    this.pendingPeerConnectPromises.set(peerId, promise);
    return promise;
  }

  public startAutoReconnect(roomId: string) {
    if (this.isReconnecting) return;
    this.isReconnecting = true;

    let attempts = 0;
    const maxAttempts = 20;

    console.log('[P2P] Starting auto-reconnect to host...');

    const runReconnect = async () => {
      if (!this.isReconnecting) return;
      attempts++;
      const { isHost } = useRoomStore.getState();

      const hostId = `synclounge-room-${roomId.toLowerCase()}`;
      const activeHostConn = this.connections.get(hostId);

      if (isHost || (activeHostConn && activeHostConn.open) || attempts > maxAttempts) {
        this.isReconnecting = false;
        if (this.autoReconnectTimer) clearTimeout(this.autoReconnectTimer);
        this.autoReconnectTimer = null;
        if (attempts > maxAttempts && (!activeHostConn || !activeHostConn.open)) {
          useRoomStore.getState().setConnectionStatus('error', 'Reconnection timed out. Click to retry.');
        }
        return;
      }

      console.log(`[P2P] Auto-reconnecting to host (attempt ${attempts}/${maxAttempts})...`);
      useRoomStore.getState().setConnectionStatus('connecting');

      const conn = await this.connectToHost(roomId);
      if (conn && conn.open) {
        this.isReconnecting = false;
        if (this.autoReconnectTimer) clearTimeout(this.autoReconnectTimer);
        this.autoReconnectTimer = null;
        return;
      }

      const nextDelay = Math.min(12000, Math.floor(2000 * Math.pow(1.3, attempts - 1) + Math.random() * 500));
      this.autoReconnectTimer = setTimeout(runReconnect, nextDelay);
    };

    this.autoReconnectTimer = setTimeout(runReconnect, 1000);
  }

  private setupDataConnection(conn: DataConnection) {
    // Store immediately to prevent duplicate connection attempts.
    this.connections.set(conn.peer, conn);

    let openHandled = false;
    const handleOpen = () => {
      if (openHandled) return;
      openHandled = true;

      this.connections.set(conn.peer, conn);
      console.log('[P2P] DataChannel opened with peer:', conn.peer);
      const { currentUser, isHost, password, roomId } = useRoomStore.getState();

      // Only send JOIN_REQUEST when connecting to the host peer.
      const isConnectingToHost = conn.peer.startsWith(`synclounge-room-`);

      if (!isHost && currentUser && isConnectingToHost) {
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
    };

    conn.on('open', handleOpen);

    if (conn.open) {
      handleOpen();
    }

    conn.on('data', async (data: any) => {
      await this.handleIncomingMessage(data as SyncMessagePayload, conn.peer);
    });

    conn.on('close', () => {
      console.log('[P2P] DataChannel closed with peer:', conn.peer);
      // Only delete if this exact instance is still in the map
      if (this.connections.get(conn.peer) === conn) {
        this.connections.delete(conn.peer);
      }

      const { isHost, roomId } = useRoomStore.getState();
      const hostPeerId = `synclounge-room-${(roomId || '').toLowerCase()}`;
      const isHostConn = conn.peer === hostPeerId || conn.peer.startsWith(`synclounge-room-`);

      // ONLY trigger auto-reconnect if guest lost its connection to host
      if (!isHost && roomId && isHostConn) {
        const activeHost = this.connections.get(hostPeerId);
        if (!activeHost || !activeHost.open) {
          this.startAutoReconnect(roomId);
        }
      }
    });

    conn.on('error', (err) => {
      console.warn('[P2P] Data Connection error:', err);
      if (this.connections.get(conn.peer) === conn) {
        this.connections.delete(conn.peer);
      }
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

  private async handleIncomingMessage(msg: SyncMessagePayload, sourcePeerId?: string) {
    if (!msg || !msg.type) return;

    // Deduplicate identical messages arriving via both WebRTC and BroadcastChannel
    const msgPayloadSnippet = typeof msg.payload === 'object' && msg.payload?.ciphertext
      ? msg.payload.ciphertext.slice(0, 24)
      : String(msg.payload || '').slice(0, 24);
    const msgKey = `${msg.type}_${msg.senderId}_${msg.timestamp}_${msgPayloadSnippet}`;
    if (this.processedMessages.has(msgKey)) {
      return;
    }
    this.processedMessages.add(msgKey);
    if (this.processedMessages.size > 200) {
      const first = this.processedMessages.values().next().value;
      if (first !== undefined) this.processedMessages.delete(first);
    }

    const { password, roomId } = useRoomStore.getState();

    // Decrypt payload using AES-256-GCM E2EE secret key
    const normalizedPassword = (password || '').trim();
    const activeRoomId = (roomId || 'default_lounge').toLowerCase().trim();
    const secretKey = `synclounge_${activeRoomId}_${normalizedPassword}`;
    const payload = await decryptPayload(msg.payload, secretKey);

    await dispatchMessage(msg.type, payload, msg.senderId, { peerService: this, sourcePeerId });

    // HOST RELAY: If this node is the host and message came from a guest,
    // forward the original encrypted wire message to all other connected peers.
    // This is the key fix for >2 person rooms: Host acts as relay hub.
    const { isHost: nowIsHost, currentUser: nowCurrentUser } = useRoomStore.getState();
    if (nowIsHost && nowCurrentUser && msg.senderId !== nowCurrentUser.id) {
      // Messages that should NOT be relayed (host-only or would cause loops)
      const noRelayTypes: SyncEventType[] = ['PING', 'PONG', 'JOIN_REQUEST', 'JOIN_RESPONSE', 'HOST_ANNOUNCE'];
      if (!noRelayTypes.includes(msg.type)) {
        this.connections.forEach((conn, connPeerId) => {
          // Relay to all peers EXCEPT the source connection
          const isSender = sourcePeerId
            ? connPeerId === sourcePeerId
            : connPeerId.endsWith(msg.senderId.slice(-6)) || connPeerId === msg.senderId;
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

    // Always call the host if we are not the host
    const hostPeerId = `synclounge-room-${roomId.toLowerCase()}`;
    if (hostPeerId !== this.peer.id) {
      targetPeerIds.push(hostPeerId);
    }

    // Call every other guest in the room
    peers.forEach((peerUser) => {
      if (peerUser.id !== currentUser?.id) {
        const guestPeerId = `synclounge-${roomId.toLowerCase()}-${peerUser.id.slice(-6)}`;
        if (guestPeerId !== this.peer?.id && !targetPeerIds.includes(guestPeerId)) {
          targetPeerIds.push(guestPeerId);
        }
      }
    });

    console.log('[P2P] Calling all peers for video grid:', targetPeerIds);

    targetPeerIds.forEach((targetId) => {
      this.callPeer(targetId, stream);
    });
  }

  private handleIncomingCall(call: MediaConnection) {
    const videoStore = useVideoStore.getState();
    const localStream = videoStore.localStream;

    call.answer(localStream || undefined);
    this.setupMediaCall(call);
  }

  private setupMediaCall(call: MediaConnection) {
    this.mediaCalls.set(call.peer, call);

    call.on('stream', (remoteStream) => {
      console.log('[P2P] Received remote stream from peer:', call.peer, 'tracks:', remoteStream.getTracks().length);
      const { peers, currentUser } = useRoomStore.getState();

      let peerInfo = peers.find(
        (p) => call.peer.includes(p.id.slice(-6)) || p.id === call.peer
      );

      if (!peerInfo && call.peer.includes('room-')) {
        peerInfo = peers.find((p) => p.isHost) || (currentUser?.isHost ? currentUser : undefined);
      }

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
    this.isReconnecting = false;
    if (this.autoReconnectTimer) {
      clearTimeout(this.autoReconnectTimer);
      this.autoReconnectTimer = null;
    }
    this.pendingHostConnectPromise = null;
    this.pendingPeerConnectPromises.clear();
    this.processedMessages.clear();
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
