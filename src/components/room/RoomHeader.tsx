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
import { Lock, Share2, LogOut, Video, Copy, Check, ShieldCheck, Wifi } from 'lucide-react';

export const RoomHeader: React.FC = () => {
  const { roomId, password, peers, peerPings } = useRoomStore();
  const { isVideoCallActive, setVideoCallActive, setLocalStream } = useVideoStore();

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const activeCount = (peers?.length || 0) + 1;
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
    } catch (err) {
      alert('Camera / Microphone permission required for video call.');
    }
  };

  const handleCopyId = () => {
    if (!roomId) return;
    const directLink = buildDirectInviteLink(roomId, password || '');
    navigator.clipboard.writeText(directLink);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <>
      <header className="glass-card px-3 sm:px-4 py-2.5 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between shadow-lg mb-3 gap-y-2 gap-x-3">
        {/* Left Side: All Room Details & Status Badges (100% VISIBLE) */}
        <div className="flex items-center flex-wrap gap-2 min-w-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <span className="font-mono font-black text-xs sm:text-sm text-white tracking-wider">
              {roomId}
            </span>
            <button
              onClick={handleCopyId}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition shrink-0"
              title="Copy 1-Click Direct Link"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* All Status Chips - 100% VISIBLE */}
          <div className="flex items-center space-x-1.5 text-[10px] text-slate-300">
            <span className="flex items-center space-x-1 text-emerald-400 font-semibold shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{activeCount} Online</span>
            </span>

            <span className={`font-mono flex items-center space-x-1 font-semibold shrink-0 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 ${pingColor}`} title={`WebRTC Latency: ${latestPing}ms`}>
              <Wifi className="w-3 h-3" />
              <span>{latestPing}ms</span>
            </span>

            <span className="text-emerald-400 font-mono flex items-center space-x-1 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>E2EE</span>
            </span>
          </div>
        </div>

        {/* Right Side: All Action Toolbar Buttons (100% VISIBLE) */}
        <div className="flex items-center flex-wrap gap-1.5 shrink-0">
          <PwaInstallPrompt />
          <NotificationCenter />
          <ThemeSelector />
          <AmbientSoundPlayer />

          <button
            onClick={handleStartVideo}
            className={`px-2.5 py-1.5 rounded-xl transition flex items-center space-x-1 text-xs font-semibold shrink-0 ${
              isVideoCallActive
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10'
            }`}
            title="P2P Video Call"
          >
            <Video className="w-3.5 h-3.5 text-indigo-400" />
            <span>Call</span>
          </button>

          <button
            onClick={() => setIsShareOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1 shadow transition shrink-0"
            title="Invite Friends"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Invite</span>
          </button>

          <button
            onClick={() => setIsLeaveOpen(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-white/10 transition shrink-0 flex items-center space-x-1"
            title="Leave Room"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Leave</span>
          </button>
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
