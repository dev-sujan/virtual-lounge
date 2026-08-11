import { create } from 'zustand';

export interface RemoteStream {
  peerId: string;
  userId: string;
  userName: string;
  avatarColor: string;
  stream: MediaStream;
  isMicOn: boolean;
  isCameraOn: boolean;
}

interface VideoState {
  localStream: MediaStream | null;
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isVideoCallActive: boolean;
  remoteStreams: RemoteStream[];

  // Floating Window UI
  isMinimized: boolean;
  isFullscreen: boolean;
  position: { x: number; y: number };
  activePeerInFocus: string | null; // peerId

  // Actions
  setLocalStream: (stream: MediaStream | null) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
  setVideoCallActive: (active: boolean) => void;
  addRemoteStream: (remote: RemoteStream) => void;
  removeRemoteStream: (peerId: string) => void;
  updateRemoteStatus: (peerId: string, updates: Partial<RemoteStream>) => void;

  toggleMinimized: () => void;
  toggleFullscreen: () => void;
  setPosition: (pos: { x: number; y: number }) => void;
  setActivePeerInFocus: (peerId: string | null) => void;
  closeVideoCall: () => void;
}

export const useVideoStore = create<VideoState>((set, get) => ({
  localStream: null,
  isMicOn: true,
  isCameraOn: true,
  isScreenSharing: false,
  isVideoCallActive: false,
  remoteStreams: [],

  isMinimized: false,
  isFullscreen: false,
  position: { x: 20, y: 80 },
  activePeerInFocus: null,

  setLocalStream: (stream) => set({ localStream: stream }),

  toggleMic: () => {
    const { localStream, isMicOn } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMicOn;
      });
    }
    set({ isMicOn: !isMicOn });
  },

  toggleCamera: () => {
    const { localStream, isCameraOn } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOn;
      });
    }
    set({ isCameraOn: !isCameraOn });
  },

  toggleScreenShare: async () => {
    const { isScreenSharing } = get();
    if (isScreenSharing) {
      // Revert to user camera media stream if available
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        set({ localStream: camStream, isScreenSharing: false, isCameraOn: true });
      } catch {
        set({ isScreenSharing: false });
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        screenTrack.onended = () => {
          set({ isScreenSharing: false });
        };

        set({ localStream: screenStream, isScreenSharing: true, isCameraOn: true });
      } catch (err) {
        console.warn('Screen share canceled or not supported:', err);
      }
    }
  },

  setVideoCallActive: (active) => set({ isVideoCallActive: active }),

  addRemoteStream: (remote) => {
    const current = get().remoteStreams;
    if (current.some((r) => r.peerId === remote.peerId)) return;
    set({ remoteStreams: [...current, remote] });
  },

  removeRemoteStream: (peerId) => {
    set({ remoteStreams: get().remoteStreams.filter((r) => r.peerId !== peerId) });
  },

  updateRemoteStatus: (peerId, updates) => {
    set({
      remoteStreams: get().remoteStreams.map((r) => (r.peerId === peerId ? { ...r, ...updates } : r)),
    });
  },

  toggleMinimized: () => set({ isMinimized: !get().isMinimized }),

  toggleFullscreen: () => set({ isFullscreen: !get().isFullscreen, isMinimized: false }),

  setPosition: (pos) => set({ position: pos }),

  setActivePeerInFocus: (peerId) => set({ activePeerInFocus: peerId }),

  closeVideoCall: () => {
    const { localStream } = get();
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    set({
      localStream: null,
      isVideoCallActive: false,
      isScreenSharing: false,
      remoteStreams: [],
      isFullscreen: false,
      isMinimized: false,
    });
  },
}));
