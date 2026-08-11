import React, { useState } from 'react';
import { useRoomStore } from '../../stores/useRoomStore';
import { useVideoStore } from '../../stores/useVideoStore';
import { AmbientSoundPlayer } from '../common/AmbientSoundPlayer';
import { ThemeSelector } from '../common/ThemeSelector';
import { NotificationCenter } from '../common/NotificationCenter';
import { ShareModal } from './ShareModal';
import { LeaveModal } from './LeaveModal';
import { buildDirectInviteLink } from '../../utils/roomUtils';
import { Lock, Share2, LogOut, Video, Copy, Check, Activity, ShieldCheck } from 'lucide-react';

export const RoomHeader: React.FC = () => {
  const { roomId, password, peers } = useRoomStore();
  const { isVideoCallActive, setVideoCallActive, setLocalStream } = useVideoStore();

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const activeCount = (peers?.length || 0) + 1;

  const handleStartVideo = async () => {
    if (isVideoCallActive) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setVideoCallActive(true);
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
      <header className="glass-card px-4 py-3 rounded-2xl border border-white/10 flex items-center justify-between shadow-xl mb-4">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Lock className="w-4 h-4" />
          </div>

          <div className="overflow-hidden">
            <div className="flex items-center space-x-2">
              <span className="font-mono font-extrabold text-sm sm:text-base text-white tracking-wider truncate">
                {roomId}
              </span>
              <button
                onClick={handleCopyId}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition"
                title="Copy Room ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center space-x-2 text-[11px]">
              <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>{activeCount} Online</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-indigo-300 font-mono flex items-center space-x-1 font-semibold">
                <Activity className="w-3 h-3 text-indigo-400" />
                <span>P2P Synced</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-mono flex items-center space-x-1 font-bold bg-emerald-500/10 px-2 py-0.2 rounded-full border border-emerald-500/30" title="End-to-End Encrypted via WebCrypto AES-256-GCM">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>E2EE (AES-256)</span>
              </span>
            </div>

          </div>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Notification Center */}
          <NotificationCenter />

          {/* Theme Selector */}
          <ThemeSelector />

          {/* Ambient Sounds Player */}
          <AmbientSoundPlayer />



          <button
            onClick={handleStartVideo}
            className={`p-2 rounded-xl transition flex items-center space-x-1 text-xs font-semibold ${
              isVideoCallActive
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
            }`}
            title="Start P2P Video Call"
          >
            <Video className="w-4 h-4 text-indigo-400" />
            <span className="hidden md:inline">Call</span>
          </button>

          <button
            onClick={() => setIsShareOpen(true)}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1 shadow transition"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Invite</span>
          </button>

          <button
            onClick={() => setIsLeaveOpen(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-white/10 transition"
            title="Leave Room"
          >
            <LogOut className="w-4 h-4" />
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
