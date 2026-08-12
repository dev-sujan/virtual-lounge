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
import { useVideoStore } from '../stores/useVideoStore';
import { getInitials } from '../utils/avatarUtils';
import { Music, MessageSquare, Gamepad2, Users, Mic, MicOff, Video } from 'lucide-react';

type LoungeTab = 'music' | 'chat' | 'games' | 'members';

export const Lounge: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LoungeTab>('music');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { peers, currentUser } = useRoomStore();
  const { isVideoCallActive, setVideoCallActive, setLocalStream, isMicOn, toggleMic } = useVideoStore();

  useWebRTC();

  const handleStartVideoCall = async () => {
    if (!isVideoCallActive) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        setVideoCallActive(true);
        const { peerService } = await import('../services/webrtc/peerService');
        peerService.callAllPeers(stream);
      } catch (err) {
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

  return (
    <div className="min-h-screen bg-[#07080c] text-white flex flex-col justify-between pb-20 sm:pb-8 relative">
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

        {/* Desktop Tab Selector - Transparent P2P Glassmorphic Active Tab */}
        <div className="hidden sm:flex bg-slate-900/60 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 mb-6 shadow-xl">
          <button
            onClick={() => handleTabChange('music')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
              activeTab === 'music'
                ? 'bg-white/15 backdrop-blur-md border border-white/25 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Shared Queue</span>
          </button>
          <button
            onClick={() => handleTabChange('chat')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
              activeTab === 'chat'
                ? 'bg-white/15 backdrop-blur-md border border-white/25 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Private Chat</span>
          </button>
          <button
            onClick={() => handleTabChange('games')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
              activeTab === 'games'
                ? 'bg-white/15 backdrop-blur-md border border-white/25 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Multiplayer Games</span>
          </button>
          <button
            onClick={() => handleTabChange('members')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
              activeTab === 'members'
                ? 'bg-white/15 backdrop-blur-md border border-white/25 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Peers ({(peers?.length || 0) + 1})</span>
          </button>
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 px-4 py-2 flex justify-around items-center">
        <button
          onClick={() => handleTabChange('music')}
          className={`flex flex-col items-center space-y-0.5 p-1 transition ${
            activeTab === 'music' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Music className="w-5 h-5" />
          <span className="text-[10px]">Queue</span>
        </button>

        <button
          onClick={() => handleTabChange('chat')}
          className={`flex flex-col items-center space-y-0.5 p-1 transition ${
            activeTab === 'chat' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px]">Chat</span>
        </button>

        <button
          onClick={isVideoCallActive ? toggleMic : handleStartVideoCall}
          className={`w-11 h-11 -mt-4 rounded-full flex items-center justify-center shadow-lg transition transform active:scale-95 border border-white/20 ${
            isVideoCallActive
              ? isMicOn
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                : 'bg-rose-500 text-white'
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
          }`}
        >
          {isVideoCallActive ? (
            isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />
          ) : (
            <Video className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={() => handleTabChange('games')}
          className={`flex flex-col items-center space-y-0.5 p-1 transition ${
            activeTab === 'games' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Gamepad2 className="w-5 h-5" />
          <span className="text-[10px]">Games</span>
        </button>

        <button
          onClick={() => handleTabChange('members')}
          className={`flex flex-col items-center space-y-0.5 p-1 transition ${
            activeTab === 'members' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Peers</span>
        </button>
      </nav>

      <AddTrackModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};
