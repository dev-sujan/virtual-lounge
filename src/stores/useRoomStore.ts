import { create } from 'zustand';
import type { User, RoomSession } from '../types';
import { saveSessionToStorage, clearSessionStorage } from '../utils/roomUtils';

interface RoomState {
  roomId: string | null;
  password: string | null;
  currentUser: User | null;
  peers: User[];
  isHost: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  errorMessage: string | null;

  // Actions
  setRoomSession: (roomId: string, password: string, user: User, isHost: boolean) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  setPeers: (peers: User[]) => void;
  addPeer: (peer: User) => void;
  removePeer: (peerId: string) => void;
  updatePeerStatus: (peerId: string, updates: Partial<User>) => void;
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error', error?: string) => void;
  leaveRoom: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  roomId: null,
  password: null,
  currentUser: null,
  peers: [],
  isHost: false,
  connectionStatus: 'disconnected',
  errorMessage: null,

  setRoomSession: (roomId, password, user, isHost) => {
    const session: RoomSession = {
      roomId,
      passwordHash: password,
      userId: user.id,
      user,
      peers: get().peers,
      createdAt: Date.now(),
    };
    saveSessionToStorage(session);
    set({
      roomId,
      password,
      currentUser: user,
      isHost,
      connectionStatus: 'connected',
      errorMessage: null,
    });
  },

  updateCurrentUser: (updates) => {
    const current = get().currentUser;
    if (!current) return;
    const updated = { ...current, ...updates };
    set({ currentUser: updated });

    const session: RoomSession = {
      roomId: get().roomId || '',
      passwordHash: get().password || '',
      userId: updated.id,
      user: updated,
      createdAt: Date.now(),
    };
    saveSessionToStorage(session);
  },

  setPeers: (peers) => {
    set({ peers });
    const current = get().currentUser;
    if (current && get().roomId) {
      saveSessionToStorage({
        roomId: get().roomId || '',
        passwordHash: get().password || '',
        userId: current.id,
        user: current,
        peers,
        createdAt: Date.now(),
      });
    }
  },

  addPeer: (peer) => {
    const peers = get().peers;
    if (peers.some((p) => p.id === peer.id)) return;
    const newPeers = [...peers, peer];
    set({ peers: newPeers });
    const current = get().currentUser;
    if (current && get().roomId) {
      saveSessionToStorage({
        roomId: get().roomId || '',
        passwordHash: get().password || '',
        userId: current.id,
        user: current,
        peers: newPeers,
        createdAt: Date.now(),
      });
    }
  },

  removePeer: (peerId) => {
    const newPeers = get().peers.filter((p) => p.id !== peerId);
    set({ peers: newPeers });
    const current = get().currentUser;
    if (current && get().roomId) {
      saveSessionToStorage({
        roomId: get().roomId || '',
        passwordHash: get().password || '',
        userId: current.id,
        user: current,
        peers: newPeers,
        createdAt: Date.now(),
      });
    }
  },

  updatePeerStatus: (peerId, updates) => {
    set({
      peers: get().peers.map((p) => (p.id === peerId ? { ...p, ...updates } : p)),
    });
  },

  setConnectionStatus: (status, error) => {
    set({ connectionStatus: status, errorMessage: error || null });
  },

  leaveRoom: () => {
    clearSessionStorage();
    set({
      roomId: null,
      password: null,
      currentUser: null,
      peers: [],
      isHost: false,
      connectionStatus: 'disconnected',
      errorMessage: null,
    });
  },
}));
