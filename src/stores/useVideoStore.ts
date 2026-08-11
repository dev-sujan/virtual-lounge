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
  updateRemoteStatusByUserId: (userId: string, updates: Partial<RemoteStream>) => void;

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

  toggleMic: async () => {
    const { localStream, isMicOn, isCameraOn } = get();
    const nextMicState = !isMicOn;
    const { peerService } = await import('../services/webrtc/peerService');
    const { useRoomStore } = await import('./useRoomStore');
    const currentUser = useRoomStore.getState().currentUser;

    if (!nextMicState) {
      // Turning microphone OFF: stop audio track to release microphone hardware completely
      if (localStream) {
        localStream.getAudioTracks().forEach((track) => {
          track.stop();
          localStream.removeTrack(track);
        });
      }
      set({ isMicOn: false });
    } else {
      // Turning microphone ON: request fresh microphone audio stream
      try {
        const newMicStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isCameraOn });
        const newAudioTrack = newMicStream.getAudioTracks()[0];

        let updatedStream = localStream;
        if (updatedStream) {
          // Remove old audio tracks if any
          updatedStream.getAudioTracks().forEach((t) => updatedStream!.removeTrack(t));
          if (newAudioTrack) {
            updatedStream.addTrack(newAudioTrack);
          }
        } else {
          updatedStream = newMicStream;
        }

        const freshStream = new MediaStream(updatedStream.getTracks());
        set({ localStream: freshStream, isMicOn: true });

        // Update active WebRTC peer connections with the new audio track
        peerService.updateLocalStreamTrack(freshStream);
      } catch (err) {
        console.error('Failed to turn microphone back on:', err);
        set({ isMicOn: false });
        return;
      }
    }

    try {
      if (currentUser) {
        peerService.broadcast('MEDIA_STATUS_CHANGE', {
          userId: currentUser.id,
          userName: currentUser.displayName,
          isMicOn: nextMicState,
        });
      }
    } catch (e) {
      console.warn('Failed to broadcast mic toggle:', e);
    }
  },

  toggleCamera: async () => {
    const { localStream, isCameraOn, isMicOn } = get();
    const nextCamState = !isCameraOn;
    const { peerService } = await import('../services/webrtc/peerService');
    const { useRoomStore } = await import('./useRoomStore');
    const currentUser = useRoomStore.getState().currentUser;

    if (!nextCamState) {
      // Turning camera OFF: stop video track to release hardware camera completely
      if (localStream) {
        localStream.getVideoTracks().forEach((track) => {
          track.stop();
          localStream.removeTrack(track);
        });
      }
      set({ isCameraOn: false });
    } else {
      // Turning camera ON: request fresh camera video stream
      try {
        const newCamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: isMicOn });
        const newVideoTrack = newCamStream.getVideoTracks()[0];

        let updatedStream = localStream;
        if (updatedStream) {
          // Remove old video tracks if any
          updatedStream.getVideoTracks().forEach((t) => updatedStream!.removeTrack(t));
          if (newVideoTrack) {
            updatedStream.addTrack(newVideoTrack);
          }
        } else {
          updatedStream = newCamStream;
        }

        // Create a new MediaStream reference so React components detect store change
        const freshStream = new MediaStream(updatedStream.getTracks());
        set({ localStream: freshStream, isCameraOn: true });

        // Update active WebRTC peer connections with the new video track
        peerService.updateLocalStreamTrack(freshStream);
      } catch (err) {
        console.error('Failed to turn camera back on:', err);
        set({ isCameraOn: false });
        return;
      }
    }

    try {
      if (currentUser) {
        peerService.broadcast('MEDIA_STATUS_CHANGE', {
          userId: currentUser.id,
          userName: currentUser.displayName,
          isCameraOn: nextCamState,
        });
      }
    } catch (e) {
      console.warn('Failed to broadcast camera toggle:', e);
    }
  },

  toggleScreenShare: async () => {
    const { isScreenSharing } = get();
    // Dynamic import to avoid circular import issues with peerService
    const { peerService } = await import('../services/webrtc/peerService');

    if (isScreenSharing) {
      // Revert to user camera media stream if available
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        set({ localStream: camStream, isScreenSharing: false, isCameraOn: true });
        peerService.updateLocalStreamTrack(camStream);
      } catch {
        set({ isScreenSharing: false });
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        screenTrack.onended = async () => {
          try {
            const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            set({ localStream: camStream, isScreenSharing: false, isCameraOn: true });
            peerService.updateLocalStreamTrack(camStream);
          } catch {
            set({ isScreenSharing: false });
          }
        };

        set({ localStream: screenStream, isScreenSharing: true, isCameraOn: true });
        peerService.updateLocalStreamTrack(screenStream);
      } catch (err) {
        console.warn('Screen share canceled or not supported:', err);
      }
    }
  },

  setVideoCallActive: (active) => set({ isVideoCallActive: active }),

  addRemoteStream: (remote) => {
    const current = get().remoteStreams;
    const existingIndex = current.findIndex((r) => r.peerId === remote.peerId || (r.userId && r.userId === remote.userId));
    if (existingIndex >= 0) {
      const updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...remote };
      set({ remoteStreams: updated });
    } else {
      set({ remoteStreams: [...current, remote] });
    }
  },

  removeRemoteStream: (peerId) => {
    set({ remoteStreams: get().remoteStreams.filter((r) => r.peerId !== peerId) });
  },

  updateRemoteStatus: (peerId, updates) => {
    set({
      remoteStreams: get().remoteStreams.map((r) => (r.peerId === peerId ? { ...r, ...updates } : r)),
    });
  },

  updateRemoteStatusByUserId: (userId: string, updates: Partial<RemoteStream>) => {
    set({
      remoteStreams: get().remoteStreams.map((r) =>
        r.userId === userId || r.peerId.includes(userId.slice(-6)) ? { ...r, ...updates } : r
      ),
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
