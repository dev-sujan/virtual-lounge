import React, { useRef, useState, useEffect } from 'react';
import { useVideoStore } from '../../stores/useVideoStore';
import type { RemoteStream } from '../../stores/useVideoStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { peerService } from '../../services/webrtc/peerService';
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
  Pin,
  ExternalLink,
  Settings,
  RefreshCw,
} from 'lucide-react';

export const FloatingVideoCall: React.FC = () => {
  const {
    localStream,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    isVideoCallActive,
    remoteStreams,
    screenQuality,
    pinnedStreamId,
    isMinimized,
    isFullscreen,
    position,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    setScreenQuality,
    setPinnedStreamId,
    toggleMinimized,
    toggleFullscreen,
    setPosition,
    closeVideoCall,
  } = useVideoStore();

  const { currentUser } = useRoomStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>(isScreenSharing ? 'contain' : 'cover');

  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (localVideoRef.current && localStream && isCameraOn) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch((e) => console.warn('Local video play issue:', e));
    }
  }, [localStream, isCameraOn, isScreenSharing]);

  useEffect(() => {
    if (isScreenSharing) {
      setFitMode('contain');
    }
  }, [isScreenSharing]);

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

  const handleRequestPiP = async () => {
    if (localVideoRef.current && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await localVideoRef.current.requestPictureInPicture();
        }
      } catch (err) {
        console.warn('Picture-in-Picture error:', err);
      }
    }
  };

  const handlePullAllStreams = () => {
    peerService.requestPullStream('all');
  };

  if (!isVideoCallActive) return null;

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-20 sm:bottom-6 right-3 z-50 glass-card px-4 py-2.5 rounded-full border border-indigo-500/40 shadow-2xl flex items-center space-x-3 animate-bounce"
        style={{ backdropFilter: 'blur(16px)' }}
      >
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-white">
            {isScreenSharing ? 'Screen Share Active' : `Video Call (${remoteStreams.length + 1})`}
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

  const isLocalPinned = pinnedStreamId === 'local';

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
      className={`fixed z-[80] transition-all duration-150 ease-out select-none max-w-[calc(100vw-24px)] ${

        isFullscreen
          ? 'bg-black/95 flex flex-col p-4'
          : isScreenSharing || pinnedStreamId || remoteStreams.length > 0
          ? 'w-[calc(100vw-24px)] sm:w-96 rounded-2xl glass-card border border-indigo-500/30 shadow-2xl overflow-hidden'
          : 'w-[calc(100vw-24px)] sm:w-80 rounded-2xl glass-card border border-white/20 shadow-2xl overflow-hidden'
      }`}
    >
      {/* Header Bar */}
      <div className="p-2.5 bg-slate-900/90 border-b border-white/10 flex items-center justify-between cursor-move touch-none">
        <div className="flex items-center space-x-2 text-xs font-semibold text-white">
          <Move className="w-3.5 h-3.5 text-indigo-400" />
          <span>{isScreenSharing ? '🖥️ Screen Sharing' : 'P2P Video Lounge'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
            {remoteStreams.length + 1} online
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {/* Pull All Streams Button */}
          <button
            onClick={handlePullAllStreams}
            className="p-1 text-indigo-400 hover:text-indigo-200 rounded hover:bg-white/10"
            title="Force Re-Sync / Pull Peer Video Streams"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* PiP Button */}
          <button
            onClick={handleRequestPiP}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10"
            title="Pop-out Picture-in-Picture"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Quality Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1 rounded hover:bg-white/10 transition ${
              showSettings ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
            }`}
            title="Screen Share Quality & Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

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

      {/* Screen Share Settings Popover */}
      {showSettings && (
        <div className="p-3 bg-slate-900 border-b border-white/10 space-y-2 text-xs animate-fadeIn">
          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300">
            <span>Screen Share Quality</span>
            <span className="font-mono text-white">{screenQuality}</span>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setScreenQuality('1080p')}
              className={`flex-1 py-1 rounded-lg text-[11px] font-bold border transition ${
                screenQuality === '1080p'
                  ? 'bg-indigo-600 border-indigo-400 text-white'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              1080p (60fps Gaming)
            </button>
            <button
              onClick={() => setScreenQuality('720p')}
              className={`flex-1 py-1 rounded-lg text-[11px] font-bold border transition ${
                screenQuality === '720p'
                  ? 'bg-indigo-600 border-indigo-400 text-white'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              720p (30fps Docs)
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">Aspect Ratio Fit</span>
            <button
              onClick={() => setFitMode(fitMode === 'cover' ? 'contain' : 'cover')}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold"
            >
              {fitMode === 'contain' ? 'Fit (Contain)' : 'Fill (Crop)'}
            </button>
          </div>
        </div>
      )}

      {/* Video Grid / Stage View */}
      {(() => {
        const totalStreams = remoteStreams.length + 1; // +1 for local
        const gridCols = pinnedStreamId || isScreenSharing
          ? 'grid-cols-1'
          : totalStreams <= 2
          ? 'grid-cols-1 sm:grid-cols-2'
          : totalStreams <= 4
          ? 'grid-cols-2'
          : 'grid-cols-2 sm:grid-cols-3';
        const gridHeight = isFullscreen
          ? 'flex-1'
          : totalStreams > 2
          ? 'h-72 sm:h-80'
          : isScreenSharing || pinnedStreamId
          ? 'h-64'
          : 'h-56';
        return (
      <div className={`grid gap-2 p-2 bg-black/70 ${gridHeight} ${gridCols}`}>
        {/* Local Stream Card */}
        <div
          className={`relative rounded-xl overflow-hidden bg-slate-900 border transition-all flex items-center justify-center group ${
            isLocalPinned
              ? 'ring-2 ring-indigo-400 border-indigo-400'
              : 'border-white/10 hover:border-indigo-500/40'
          }`}
        >
          {localStream && isCameraOn ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full ${fitMode === 'contain' ? 'object-contain' : 'object-cover'} ${
                isScreenSharing ? '' : 'transform -scale-x-100'
              }`}
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

          {/* Local Overlay Badges & Controls */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-[10px] font-semibold text-white flex items-center space-x-1">
            <span>{isScreenSharing ? 'Your Screen Share' : 'You'}</span>
            {!isMicOn && <MicOff className="w-2.5 h-2.5 text-rose-400" />}
          </div>

          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex items-center space-x-1">
            <button
              onClick={() => setPinnedStreamId(isLocalPinned ? null : 'local')}
              className={`p-1.5 rounded-lg backdrop-blur transition ${
                isLocalPinned ? 'bg-indigo-600 text-white' : 'bg-black/60 text-slate-300 hover:text-white'
              }`}
              title={isLocalPinned ? 'Unpin Stage View' : 'Pin to Stage View'}
            >
              <Pin className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Remote Streams */}
        {remoteStreams.map((remote) => (
          <RemoteVideoItem
            key={remote.peerId}
            remote={remote}
            fitMode={fitMode}
            isPinned={pinnedStreamId === remote.peerId}
            onTogglePin={() => setPinnedStreamId(pinnedStreamId === remote.peerId ? null : remote.peerId)}
            onPullStream={() => peerService.requestPullStream(remote.userId)}
          />
        ))}
      </div>
        );
      })()}

      {/* Control Buttons Bar */}
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
  fitMode: 'cover' | 'contain';
  isPinned: boolean;
  onTogglePin: () => void;
  onPullStream: () => void;
}

const RemoteVideoItem: React.FC<RemoteVideoItemProps> = ({ remote, fitMode, isPinned, onTogglePin, onPullStream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [, setTrackUpdateCount] = useState(0);

  useEffect(() => {
    if (!remote.stream) return;

    const handleTrackChange = () => {
      setTrackUpdateCount((c) => c + 1);
    };

    remote.stream.addEventListener('addtrack', handleTrackChange);
    remote.stream.addEventListener('removetrack', handleTrackChange);

    return () => {
      remote.stream.removeEventListener('addtrack', handleTrackChange);
      remote.stream.removeEventListener('removetrack', handleTrackChange);
    };
  }, [remote.stream]);

  useEffect(() => {
    if (videoRef.current && remote.stream && remote.isCameraOn) {
      videoRef.current.srcObject = remote.stream;
      videoRef.current.play().catch((e) => console.warn('Remote video play issue:', e));
    }
  }, [remote.stream, remote.isCameraOn, remote.stream?.getTracks().length]);

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-slate-900 border transition-all flex items-center justify-center group ${
        isPinned
          ? 'ring-2 ring-indigo-400 border-indigo-400'
          : 'border-white/10 hover:border-indigo-500/40'
      }`}
    >
      {remote.isCameraOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full h-full ${fitMode === 'contain' ? 'object-contain' : 'object-cover'}`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-1 shadow"
            style={{ backgroundColor: remote.avatarColor || '#6366f1' }}
          >
            {getInitials(remote.userName || 'Peer')}
          </div>
          <span className="text-[10px] text-slate-400">Camera Off</span>

          <button
            onClick={onPullStream}
            className="mt-2 text-[10px] bg-indigo-600/80 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg flex items-center space-x-1 shadow transition"
            title="Force Pull Remote Video Stream"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Pull Stream</span>
          </button>
        </div>
      )}

      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-[10px] font-semibold text-white flex items-center space-x-1">
        <span>{remote.userName}</span>
        {!remote.isMicOn && <MicOff className="w-2.5 h-2.5 text-rose-400" />}
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex items-center space-x-1">
        <button
          onClick={onPullStream}
          className="p-1.5 rounded-lg bg-black/60 hover:bg-indigo-600 text-slate-300 hover:text-white backdrop-blur transition"
          title="Pull Peer Stream (Re-Sync Video)"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
        <button
          onClick={onTogglePin}
          className={`p-1.5 rounded-lg backdrop-blur transition ${
            isPinned ? 'bg-indigo-600 text-white' : 'bg-black/60 text-slate-300 hover:text-white'
          }`}
          title={isPinned ? 'Unpin Stage View' : 'Pin to Stage View'}
        >
          <Pin className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
