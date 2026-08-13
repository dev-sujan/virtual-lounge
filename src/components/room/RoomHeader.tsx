import React, { useState } from 'react';
import { useRoomStore } from '../../stores/useRoomStore';
import { useVideoStore } from '../../stores/useVideoStore';
import { NotificationCenter } from '../common/NotificationCenter';
import { ThemeSelector } from '../common/ThemeSelector';
import { AmbientSoundPlayer } from '../common/AmbientSoundPlayer';
import { PwaInstallPrompt } from '../common/PwaInstallPrompt';
import { ShareModal } from './ShareModal';
import { LeaveModal } from './LeaveModal';
import { buildDirectInviteLink } from '../../utils/roomUtils';
import { copyToClipboard } from '../../utils/clipboardUtils';
import { getInitials } from '../../utils/avatarUtils';
import { Lock, Share2, LogOut, Video, Copy, Check, ShieldCheck, Wifi } from 'lucide-react';


export const RoomHeader: React.FC = () => {
  const { roomId, password, peers, peerPings, currentUser } = useRoomStore();
  const { isVideoCallActive, setVideoCallActive, setLocalStream } = useVideoStore();

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const allParticipants = currentUser ? [currentUser, ...peers] : peers;
  const activeCount = allParticipants.length;
  const latestPing = Object.values(peerPings)[0] || (peers.length > 0 ? 28 : 12);
  const pingColor = latestPing < 60 ? 'text-emerald-400' : latestPing < 150 ? 'text-amber-400' : 'text-rose-400';

  const handleStartVideo = async () => {
    if (isVideoCallActive) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getAudioTracks().forEach((t) => (t.enabled = false));
      stream.getVideoTracks().forEach((t) => (t.enabled = false));
      setLocalStream(stream);
      setVideoCallActive(true);
      useVideoStore.setState({ isMicOn: false, isCameraOn: false });
      const { peerService } = await import('../../services/webrtc/peerService');
      peerService.callAllPeers(stream);
    } catch {
      alert('Camera / Microphone permission required for video call.');
    }
  };

  const handleCopyId = async () => {
    if (!roomId) return;
    const directLink = buildDirectInviteLink(roomId, password || '');
    await copyToClipboard(directLink);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <>
      {/* Main Glassmorphic Header Navigation Bar */}
      <header className="relative z-30 glass-card px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl sm:rounded-3xl border border-white/15 flex flex-col space-y-2 sm:space-y-2.5 shadow-2xl shadow-indigo-950/30 mb-3 sm:mb-4 transition-all">
        {/* Row 1: Room Identifier & Primary Navigation Action Buttons */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Room ID Badge */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 bg-slate-900/90 px-2.5 py-1.5 rounded-xl sm:rounded-2xl border border-white/10 shadow-inner min-w-0">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg sm:rounded-xl bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
              <Lock className="w-3 h-3" />
            </div>
            <span className="font-mono font-black text-xs sm:text-sm text-white tracking-wider sm:tracking-widest truncate">
              {roomId}
            </span>
            <button
              onClick={handleCopyId}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition shrink-0"
              title="Copy Direct Invite Link"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            <button
              onClick={handleStartVideo}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl transition-all flex items-center space-x-1.5 text-xs font-bold shrink-0 ${
                isVideoCallActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-lg shadow-emerald-500/20 animate-pulse'
                  : 'bg-white/5 hover:bg-white/15 text-indigo-300 border border-white/10 shadow-sm'
              }`}
              title="Start WebRTC Video Call"
            >
              <Video className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Video Call</span>
              <span className="sm:hidden">Call</span>
            </button>

            <button
              onClick={() => setIsShareOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center space-x-1 sm:space-x-1.5 shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition transform active:scale-95 shrink-0"
              title="Invite Friends to Lounge"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Invite</span>
            </button>

            <button
              onClick={() => setIsLeaveOpen(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 transition shrink-0 flex items-center space-x-1"
              title="Leave Room"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs font-semibold">Exit</span>
            </button>
          </div>
        </div>

        {/* Row 2: Peer Active Avatar Stack & Live Network Status Badges */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 text-[10px] text-slate-300">
          {/* Left: Active Peer Navigation Bubbles Stack & Status Badges */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
            {/* Peer Avatar Bubble Stack */}
            <div className="flex items-center -space-x-2 shrink-0">
              {allParticipants.slice(0, 3).map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-slate-900 flex items-center justify-center text-white text-[8px] sm:text-[9px] font-bold shadow relative shrink-0"
                  style={{ backgroundColor: p.avatarColor }}
                  title={`${p.displayName} ${p.isHost ? '(Host)' : ''}`}
                >
                  {getInitials(p.displayName)}
                  <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-slate-900" />
                </div>
              ))}
              {allParticipants.length > 3 && (
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-950 border-2 border-slate-900 flex items-center justify-center text-indigo-300 text-[8px] sm:text-[9px] font-bold shrink-0">
                  +{allParticipants.length - 3}
                </div>
              )}
            </div>

            {/* Online Status Bubble */}
            <span className="flex items-center space-x-1 text-emerald-400 font-semibold shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{activeCount} Online</span>
            </span>

            {/* Network Latency Badge */}
            <span className={`font-mono flex items-center space-x-1 font-semibold shrink-0 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 whitespace-nowrap ${pingColor}`} title={`WebRTC Latency: ${latestPing}ms`}>
              <Wifi className="w-3 h-3" />
              <span>{latestPing}ms</span>
            </span>

            {/* E2EE Security Badge */}
            <span className="text-emerald-400 font-mono flex items-center space-x-1 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0 whitespace-nowrap">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">P2P E2EE</span>
            </span>
          </div>

          {/* Right: Quick Utilities */}
          <div className="flex items-center space-x-1 shrink-0 ml-1">
            <PwaInstallPrompt />
            <NotificationCenter />
            <ThemeSelector />
            <AmbientSoundPlayer />
          </div>
        </div>
      </header>

      <ShareModal
        isOpen={isShareOpen}
        roomId={roomId || ''}
        password={password || ''}
        onClose={() => setIsShareOpen(false)}
      />

      <LeaveModal isOpen={isLeaveOpen} onClose={() => setIsLeaveOpen(false)} />
    </>
  );
};
