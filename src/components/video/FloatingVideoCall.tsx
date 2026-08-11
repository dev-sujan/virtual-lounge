import React, { useRef, useState, useEffect } from 'react';
import { useVideoStore } from '../../stores/useVideoStore';
import type { RemoteStream } from '../../stores/useVideoStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { getInitials } from '../../utils/avatarUtils';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Maximize2,
  Minimize2,
  X,
  PhoneOff,
  Move,
  Monitor,
} from 'lucide-react';

export const FloatingVideoCall: React.FC = () => {
  const {
    localStream,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    isVideoCallActive,
    remoteStreams,
    isMinimized,
    isFullscreen,
    position,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    toggleMinimized,
    toggleFullscreen,
    setPosition,
    closeVideoCall,
  } = useVideoStore();

  const { currentUser } = useRoomStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isFullscreen || isMinimized) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isFullscreen || isMinimized) return;
    const newX = Math.max(10, Math.min(window.innerWidth - 300, e.clientX - dragOffset.current.x));
    const newY = Math.max(10, Math.min(window.innerHeight - 200, e.clientY - dragOffset.current.y));
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  if (!isVideoCallActive) return null;

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-20 right-4 z-50 glass-card px-4 py-2.5 rounded-full border border-indigo-500/40 shadow-2xl flex items-center space-x-3 animate-bounce"
        style={{ backdropFilter: 'blur(16px)' }}
      >
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-white">
            Live Call ({remoteStreams.length + 1} connected)
          </span>
        </div>
        <button
          onClick={toggleMinimized}
          className="p-1 text-slate-300 hover:text-white rounded-full bg-white/10"
          title="Expand Video Window"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={
        isFullscreen
          ? { top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }
          : { top: `${position.y}px`, left: `${position.x}px` }
      }
      className={`fixed z-50 transition-all duration-150 ease-out select-none ${
        isFullscreen
          ? 'bg-black/95 flex flex-col p-4'
          : 'w-72 sm:w-80 rounded-2xl glass-card border border-white/20 shadow-2xl overflow-hidden'
      }`}
    >
      <div className="p-2.5 bg-slate-900/80 border-b border-white/10 flex items-center justify-between cursor-move touch-none">
        <div className="flex items-center space-x-2 text-xs font-semibold text-white">
          <Move className="w-3.5 h-3.5 text-indigo-400" />
          <span>P2P Video Lounge</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
            {remoteStreams.length + 1} online
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={toggleMinimized}
            className="p-1 text-slate-400 hover:text-white rounded"
            title="Minimize"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1 text-slate-400 hover:text-white rounded"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={closeVideoCall}
            className="p-1 text-slate-400 hover:text-rose-400 rounded"
            title="End Video Call"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className={`grid gap-2 p-2 bg-black/60 ${isFullscreen ? 'flex-1 grid-cols-1 sm:grid-cols-2' : 'h-52 grid-cols-1'}`}>
        <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center">
          {localStream && isCameraOn ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isScreenSharing ? '' : 'transform -scale-x-100'}`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-1 shadow"
                style={{ backgroundColor: currentUser?.avatarColor || '#6366f1' }}
              >
                {getInitials(currentUser?.displayName || 'Me')}
              </div>
              <span className="text-[10px] text-slate-400">Camera Off</span>
            </div>
          )}

          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-[10px] font-semibold text-white flex items-center space-x-1">
            <span>{isScreenSharing ? 'Your Screen' : 'You'}</span>
            {!isMicOn && <MicOff className="w-2.5 h-2.5 text-rose-400" />}
          </div>
        </div>

        {remoteStreams.map((remote) => (
          <RemoteVideoItem key={remote.peerId} remote={remote} />
        ))}
      </div>

      <div className="p-3 bg-slate-900/90 border-t border-white/10 flex items-center justify-center space-x-3">
        <button
          onClick={toggleMic}
          className={`p-3 rounded-full transition transform active:scale-95 shadow ${
            isMicOn
              ? 'bg-slate-800 text-white border border-white/20 hover:bg-slate-700'
              : 'bg-rose-500 text-white'
          }`}
          title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleCamera}
          className={`p-3 rounded-full transition transform active:scale-95 shadow ${
            isCameraOn
              ? 'bg-slate-800 text-white border border-white/20 hover:bg-slate-700'
              : 'bg-rose-500 text-white'
          }`}
          title={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
        >
          {isCameraOn ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full transition transform active:scale-95 shadow ${
            isScreenSharing
              ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/50'
              : 'bg-slate-800 text-white border border-white/20 hover:bg-slate-700'
          }`}
          title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
        >
          <Monitor className="w-4 h-4" />
        </button>

        <button
          onClick={closeVideoCall}
          className="p-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow transform active:scale-95 transition"
          title="Disconnect Call"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface RemoteVideoItemProps {
  remote: RemoteStream;
}

const RemoteVideoItem: React.FC<RemoteVideoItemProps> = ({ remote }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && remote.stream) {
      videoRef.current.srcObject = remote.stream;
    }
  }, [remote.stream]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center">
      {remote.isCameraOn ? (
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center justify-center p-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-1 shadow"
            style={{ backgroundColor: remote.avatarColor || '#6366f1' }}
          >
            {getInitials(remote.userName || 'Peer')}
          </div>
          <span className="text-[10px] text-slate-400">Camera Off</span>
        </div>
      )}

      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-[10px] font-semibold text-white flex items-center space-x-1">
        <span>{remote.userName}</span>
        {!remote.isMicOn && <MicOff className="w-2.5 h-2.5 text-rose-400" />}
      </div>
    </div>
  );
};
