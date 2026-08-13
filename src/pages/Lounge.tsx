import React, { useState } from 'react';
import { useRoomStore } from '../stores/useRoomStore';
import { useWebRTC } from '../hooks/useWebRTC';
import { RoomHeader } from '../components/room/RoomHeader';
import { YouTubePlayer } from '../components/music/YouTubePlayer';
import { AddTrackModal } from '../components/music/AddTrackModal';
import { QueueList } from '../components/queue/QueueList';
import { ChatBox } from '../components/chat/ChatBox';
import { GameSelector } from '../components/games/GameSelector';
import { FloatingVideoCall } from '../components/video/FloatingVideoCall';
import { ToastContainer } from '../components/common/ToastContainer';
import { TermsModal } from '../components/common/TermsModal';
import { useVideoStore } from '../stores/useVideoStore';
import { getInitials } from '../utils/avatarUtils';
import { Music, MessageSquare, Gamepad2, Users, Mic, MicOff, Video } from 'lucide-react';

type LoungeTab = 'music' | 'chat' | 'games' | 'members';

export const Lounge: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LoungeTab>('music');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const { peers, currentUser } = useRoomStore();
  const { isVideoCallActive, setVideoCallActive, setLocalStream, isMicOn, toggleMic } = useVideoStore();

  useWebRTC();

  const handleStartVideoCall = async () => {
    if (!isVideoCallActive) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getAudioTracks().forEach((t) => (t.enabled = false));
        stream.getVideoTracks().forEach((t) => (t.enabled = false));
        setLocalStream(stream);
        setVideoCallActive(true);
        useVideoStore.setState({ isMicOn: false, isCameraOn: false });
        const { peerService } = await import('../services/webrtc/peerService');
        peerService.callAllPeers(stream);
      } catch {
        alert('Camera / Microphone permission required.');
      }
    }
  };

  const handleTabChange = (tab: LoungeTab) => {
    setActiveTab(tab);
    const activityMap: Record<LoungeTab, string> = {
      music: '🎧 Listening to Music',
      chat: '💬 In Live Chat',
      games: '🎮 Playing Mini-Games',
      members: '👥 Viewing Peers',
    };
    const activity = activityMap[tab];
    if (currentUser) {
      useRoomStore.getState().updateCurrentUser({ currentActivity: activity });
      import('../services/webrtc/peerService').then(({ peerService }) => {
        peerService.broadcast('PEER_PRESENCE_UPDATE', {
          user: { ...currentUser, currentActivity: activity },
        });
      });
    }
  };

  // Helper to get active peers per navigation tab
  const getPeersInTab = (tab: LoungeTab) => {
    const all = currentUser ? [currentUser, ...peers] : peers;
    return all.filter((p) => {
      const act = p.currentActivity?.toLowerCase() || '';
      if (tab === 'music') return act.includes('music') || act.includes('listening') || !act;
      if (tab === 'chat') return act.includes('chat');
      if (tab === 'games') return act.includes('game') || act.includes('playing');
      if (tab === 'members') return true;
      return false;
    });
  };

  const navItems: { id: LoungeTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'music', label: 'Shared Queue', icon: Music },
    { id: 'chat', label: 'Private Chat', icon: MessageSquare },
    { id: 'games', label: 'Multiplayer Games', icon: Gamepad2 },
    { id: 'members', label: 'Peers', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#07080c] text-white flex flex-col justify-between pb-28 sm:pb-8 relative">
      {/* Real-time Synchronization Toast Notification Pop-ups */}
      <ToastContainer />

      {/* Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-purple-600/15 blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-4xl mx-auto w-full px-3 sm:px-6 pt-4 flex-1">
        {/* Room Header */}
        <RoomHeader />

        {/* YouTube Synchronized Music Player */}
        <div className="mb-6">
          <YouTubePlayer onOpenAddModal={() => setIsAddModalOpen(true)} />
        </div>

        {/* Desktop Tab Selector - Peer Active Navigation Bubble Bar */}
        <div className="hidden sm:flex bg-slate-900/80 backdrop-blur-2xl p-1.5 rounded-3xl border border-white/15 mb-6 shadow-2xl shadow-indigo-950/40 relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            const tabPeers = getPeersInTab(item.id);
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex-1 py-3 px-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 transition-all duration-300 relative group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 backdrop-blur-md border border-indigo-400/50 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110 text-indigo-300' : ''}`} />
                <span>{item.label}</span>

                {/* Peer Active Navigation Bubble Badge */}
                {tabPeers.length > 0 && (
                  <div className="flex items-center space-x-1 ml-1.5 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-400/30 shadow-sm">
                    {/* Mini Avatar Overlaps */}
                    <div className="flex items-center -space-x-1.5">
                      {tabPeers.slice(0, 2).map((p) => (
                        <div
                          key={p.id}
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-slate-900 shadow-sm"
                          style={{ backgroundColor: p.avatarColor }}
                          title={p.displayName}
                        >
                          {getInitials(p.displayName)}
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] text-indigo-300 font-mono font-extrabold">{tabPeers.length}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="mb-8">
          {activeTab === 'music' && <QueueList onOpenAddModal={() => setIsAddModalOpen(true)} />}
          {activeTab === 'chat' && <ChatBox />}
          {activeTab === 'games' && <GameSelector />}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span>Room Participants ({(peers?.length || 0) + 1})</span>
                </h3>
                {currentUser?.isHost && (
                  <span className="text-xs bg-amber-500/20 text-amber-300 font-mono px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    👑 Host Controls Active
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentUser && (
                  <div className="glass-card p-4 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow"
                        style={{ backgroundColor: currentUser.avatarColor }}
                      >
                        {getInitials(currentUser.displayName)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                          <span>{currentUser.displayName}</span>
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.2 rounded-full border border-indigo-500/30">
                            {currentUser.isHost ? 'Host (You)' : 'You'}
                          </span>
                        </h4>
                        <span className="text-[11px] text-emerald-400 font-semibold">Online • P2P Connected</span>
                      </div>
                    </div>
                  </div>
                )}

                {peers.map((peer) => (
                  <div key={peer.id} className="glass-card p-4 rounded-2xl border border-white/10 flex items-center justify-between group">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow shrink-0"
                        style={{ backgroundColor: peer.avatarColor }}
                      >
                        {getInitials(peer.displayName)}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-bold text-white flex items-center space-x-1.5 truncate">
                          <span className="truncate">{peer.displayName}</span>
                          {peer.isHost && (
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.2 rounded-full shrink-0">
                              Host
                            </span>
                          )}
                        </h4>
                        <span className="text-[11px] text-emerald-400 font-semibold">Online</span>
                      </div>
                    </div>

                    {currentUser?.isHost && (
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={async () => {
                            const { useRoomStore } = await import('../stores/useRoomStore');
                            useRoomStore.getState().removePeer(peer.id);
                            const { peerService } = await import('../services/webrtc/peerService');
                            peerService.broadcast('LEAVE_ROOM', { userId: peer.id, userName: peer.displayName });
                          }}
                          className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold transition"
                          title="Remove peer from room"
                        >
                          Kick
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Floating Draggable WebRTC Video Call Window */}
      <FloatingVideoCall />

      {/* Mobile Floating Bottom Navigation Bar with Peer Active Navigation Bubbles */}
      <nav className="sm:hidden fixed bottom-3 left-3 right-3 z-40 bg-slate-950/95 backdrop-blur-2xl border border-white/15 rounded-3xl pt-2 pb-1.5 px-2 flex justify-around items-center shadow-2xl shadow-indigo-950/70">
        <button
          onClick={() => handleTabChange('music')}
          className={`px-3 py-1.5 rounded-2xl flex flex-col items-center space-y-0.5 transition-all duration-300 ${
            activeTab === 'music'
              ? 'bg-gradient-to-b from-indigo-500/30 to-purple-500/20 text-indigo-300 font-bold border border-indigo-500/40 shadow-md shadow-indigo-500/30 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Music className="w-5 h-5" />
            {getPeersInTab('music').length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] rounded-full bg-indigo-600 border border-indigo-300 text-white text-[9px] font-extrabold flex items-center justify-center px-1 shadow-md">
                {getPeersInTab('music').length}
              </span>
            )}
          </div>
          <span className="text-[10px]">Queue</span>
        </button>

        <button
          onClick={() => handleTabChange('chat')}
          className={`px-3 py-1.5 rounded-2xl flex flex-col items-center space-y-0.5 transition-all duration-300 ${
            activeTab === 'chat'
              ? 'bg-gradient-to-b from-indigo-500/30 to-purple-500/20 text-indigo-300 font-bold border border-indigo-500/40 shadow-md shadow-indigo-500/30 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {getPeersInTab('chat').length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] rounded-full bg-indigo-600 border border-indigo-300 text-white text-[9px] font-extrabold flex items-center justify-center px-1 shadow-md">
                {getPeersInTab('chat').length}
              </span>
            )}
          </div>
          <span className="text-[10px]">Chat</span>
        </button>

        {/* Center Floating Video Call Control Bubble */}
        <button
          onClick={isVideoCallActive ? toggleMic : handleStartVideoCall}
          className={`w-12 h-12 -mt-6 rounded-full flex items-center justify-center shadow-xl shadow-indigo-600/40 border border-white/30 transition transform active:scale-90 hover:scale-105 ${
            isVideoCallActive
              ? isMicOn
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white ring-4 ring-emerald-500/30 animate-pulse'
                : 'bg-rose-500 text-white ring-4 ring-rose-500/30'
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500'
          }`}
          title={isVideoCallActive ? (isMicOn ? 'Mute Mic' : 'Unmute Mic') : 'Start Video Call'}
        >
          {isVideoCallActive ? (
            isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />
          ) : (
            <Video className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={() => handleTabChange('games')}
          className={`px-3 py-1.5 rounded-2xl flex flex-col items-center space-y-0.5 transition-all duration-300 ${
            activeTab === 'games'
              ? 'bg-gradient-to-b from-indigo-500/30 to-purple-500/20 text-indigo-300 font-bold border border-indigo-500/40 shadow-md shadow-indigo-500/30 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Gamepad2 className="w-5 h-5" />
            {getPeersInTab('games').length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] rounded-full bg-indigo-600 border border-indigo-300 text-white text-[9px] font-extrabold flex items-center justify-center px-1 shadow-md">
                {getPeersInTab('games').length}
              </span>
            )}
          </div>
          <span className="text-[10px]">Games</span>
        </button>

        <button
          onClick={() => handleTabChange('members')}
          className={`px-3 py-1.5 rounded-2xl flex flex-col items-center space-y-0.5 transition-all duration-300 ${
            activeTab === 'members'
              ? 'bg-gradient-to-b from-indigo-500/30 to-purple-500/20 text-indigo-300 font-bold border border-indigo-500/40 shadow-md shadow-indigo-500/30 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Users className="w-5 h-5" />
            {getPeersInTab('members').length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] rounded-full bg-indigo-600 border border-indigo-300 text-white text-[9px] font-extrabold flex items-center justify-center px-1 shadow-md">
                {getPeersInTab('members').length}
              </span>
            )}
          </div>
          <span className="text-[10px]">Peers</span>
        </button>
      </nav>

      <AddTrackModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
};
