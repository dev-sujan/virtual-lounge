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

  // Screen Share & Layout Enhancements
  screenQuality: '1080p' | '720p';
  pinnedStreamId: string | null;

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
  setScreenQuality: (quality: '1080p' | '720p') => void;
  setPinnedStreamId: (id: string | null) => void;
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
  isMicOn: false,
  isCameraOn: false,
  isScreenSharing: false,
  isVideoCallActive: false,
  remoteStreams: [],
  screenQuality: '1080p',
  pinnedStreamId: null,

  isMinimized: false,
  isFullscreen: false,
  position: { x: 20, y: 80 },
  activePeerInFocus: null,

  setScreenQuality: (quality) => set({ screenQuality: quality }),
  setPinnedStreamId: (id) => set({ pinnedStreamId: id }),


  setLocalStream: (stream) => set({ localStream: stream }),

  toggleMic: async () => {
    const { localStream, isMicOn } = get();
    const nextMicState = !isMicOn;
    const { peerService } = await import('../services/webrtc/peerService');
    const { useRoomStore } = await import('./useRoomStore');
    const currentUser = useRoomStore.getState().currentUser;

    if (localStream && localStream.getAudioTracks().length > 0) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = nextMicState;
      });
      set({ isMicOn: nextMicState });
    } else if (nextMicState) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newAudioTrack = audioStream.getAudioTracks()[0];
        if (newAudioTrack) {
          let updatedStream = localStream;
          if (updatedStream) {
            updatedStream.addTrack(newAudioTrack);
          } else {
            updatedStream = new MediaStream([newAudioTrack]);
          }
          const freshStream = new MediaStream(updatedStream.getTracks());
          set({ localStream: freshStream, isMicOn: true });
          peerService.updateLocalStreamTrack(freshStream);
        }
      } catch (err) {
        console.error('Failed to access microphone:', err);
        set({ isMicOn: false });
        return;
      }
    } else {
      set({ isMicOn: false });
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
    const { localStream, isCameraOn } = get();
    const nextCamState = !isCameraOn;
    const { peerService } = await import('../services/webrtc/peerService');
    const { useRoomStore } = await import('./useRoomStore');
    const currentUser = useRoomStore.getState().currentUser;

    if (localStream && localStream.getVideoTracks().length > 0) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = nextCamState;
      });
      set({ isCameraOn: nextCamState });
    } else if (nextCamState) {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = videoStream.getVideoTracks()[0];
        if (newVideoTrack) {
          let updatedStream = localStream;
          if (updatedStream) {
            updatedStream.addTrack(newVideoTrack);
          } else {
            updatedStream = new MediaStream([newVideoTrack]);
          }
          const freshStream = new MediaStream(updatedStream.getTracks());
          set({ localStream: freshStream, isCameraOn: true });
          peerService.updateLocalStreamTrack(freshStream);
        }
      } catch (err) {
        console.error('Failed to access camera:', err);
        set({ isCameraOn: false });
        return;
      }
    } else {
      set({ isCameraOn: false });
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
    const { isScreenSharing, localStream, screenQuality } = get();
    const { peerService } = await import('../services/webrtc/peerService');
    const { useToastStore } = await import('./useToastStore');
    const { useRoomStore } = await import('./useRoomStore');
    const currentUser = useRoomStore.getState().currentUser;

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
        const videoConstraints = screenQuality === '1080p'
          ? { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 60 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } };

        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: videoConstraints,
          audio: { echoCancellation: true, noiseSuppression: true },
        });

        const screenVideoTrack = screenStream.getVideoTracks()[0];

        // Retain current mic audio track so peers can hear user during screen share
        let micAudioTrack: MediaStreamTrack | null = localStream?.getAudioTracks()[0] || null;
        if (!micAudioTrack) {
          try {
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micAudioTrack = micStream.getAudioTracks()[0] || null;
          } catch {
            console.warn('Mic audio unavailable for screen share');
          }
        }

        const combinedTracks: MediaStreamTrack[] = [screenVideoTrack];
        if (micAudioTrack) {
          combinedTracks.push(micAudioTrack);
        }

        const combinedStream = new MediaStream(combinedTracks);
        
        screenVideoTrack.onended = async () => {
          try {
            const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            set({ localStream: camStream, isScreenSharing: false, isCameraOn: true });
            peerService.updateLocalStreamTrack(camStream);
          } catch {
            set({ isScreenSharing: false });
          }
        };

        set({ localStream: combinedStream, isScreenSharing: true, isCameraOn: true });
        peerService.updateLocalStreamTrack(combinedStream);

        useToastStore.getState().addToast({
          category: 'media',
          title: '🖥️ Screen Sharing Started',
          message: `Streaming at ${screenQuality === '1080p' ? '1080p 60fps' : '720p 30fps'} with system audio`,
        });

        if (currentUser) {
          peerService.broadcast('MEDIA_STATUS_CHANGE', {
            userId: currentUser.id,
            userName: currentUser.displayName,
            isCameraOn: true,
            isScreenSharing: true,
          });
        }
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
