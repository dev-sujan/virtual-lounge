import React, { useState, useEffect } from 'react';
import { useRoomStore } from '../stores/useRoomStore';
import { generateRoomId, generatePassword, generateUserId, parseInviteParams, AVATAR_COLORS } from '../utils/roomUtils';
import { Music, Sparkles, ArrowRight, ShieldCheck, PlayCircle, Video, Gamepad2, Check, Lock, Key } from 'lucide-react';

export const Home: React.FC = () => {
  const [tab, setTab] = useState<'create' | 'join'>('create');

  // Form Fields
  const [displayName, setDisplayName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isAutoFilledPassword, setIsAutoFilledPassword] = useState(false);
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);

  // Generated Fields for Create
  const [generatedRoomId, setGeneratedRoomId] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');

  const { setRoomSession } = useRoomStore();

  useEffect(() => {
    // Check if URL hash or search parameters contain room and password (e.g. #room=SM7K9P&pwd=123456)
    const { roomId, password } = parseInviteParams();
    if (roomId) {
      setRoomIdInput(roomId);
      setTab('join');
      if (password) {
        setPasswordInput(password);
        setIsAutoFilledPassword(true);
      }
    }

    setGeneratedRoomId(generateRoomId());
    setGeneratedPassword(generatePassword());
  }, []);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    const user = {
      id: generateUserId(),
      displayName: displayName.trim(),
      avatarColor: selectedColor,
      isHost: true,
      isMicOn: true,
      isCameraOn: true,
      joinedAt: Date.now(),
    };

    setRoomSession(generatedRoomId, generatedPassword, user, true);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !roomIdInput.trim() || !passwordInput.trim()) return;

    const user = {
      id: generateUserId(),
      displayName: displayName.trim(),
      avatarColor: selectedColor,
      isHost: false,
      isMicOn: true,
      isCameraOn: true,
      joinedAt: Date.now(),
    };

    setRoomSession(roomIdInput.trim().toUpperCase(), passwordInput.trim(), user, false);
  };

  return (
    <div className="min-h-screen bg-[#07080c] text-white flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Dynamic Background Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[140px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="px-6 py-6 max-w-6xl mx-auto w-full flex justify-between items-center z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center space-x-1.5">
              <span>SyncLounge</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                P2P
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Private Synchronized Social Space</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 font-semibold glass-pill px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Backendless • P2P Encrypted</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="px-4 py-8 max-w-xl mx-auto w-full z-10">
        {/* Hero Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Listen • Chat • Watch • Play Together</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Your Private Shared Lounge
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Create or join a temporary private room with synchronized music, real-time chat, video calling & multiplayer games.
          </p>
        </div>

        {/* Card Form */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl backdrop-blur-2xl">
          {/* Tab Controls */}
          <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-white/10 mb-6">
            <button
              onClick={() => setTab('create')}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                tab === 'create'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Room
            </button>
            <button
              onClick={() => setTab('join')}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                tab === 'join'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Join Room
            </button>
          </div>

          {/* Form Fields */}
          {tab === 'create' ? (
            <form onSubmit={handleCreateRoom} className="space-y-5">
              {/* Generated Room Credentials */}
              <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-white/10">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Room ID
                  </span>
                  <span className="text-lg font-mono font-extrabold text-indigo-300">
                    {generatedRoomId}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Password
                  </span>
                  <span className="text-lg font-mono font-extrabold text-purple-300">
                    {generatedPassword}
                  </span>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Your Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Sujan"
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Choose Avatar Color
                </label>
                <div className="flex items-center space-x-2">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-8 h-8 rounded-full transition transform hover:scale-110 flex items-center justify-center ${
                        selectedColor === color ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-80'
                      }`}
                    >
                      {selectedColor === color && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!displayName.trim()}
                className="w-full glow-btn bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center space-x-2 shadow-xl shadow-indigo-500/25 transition transform active:scale-98 disabled:opacity-50"
              >
                <span>Launch Lounge</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Room ID (6 Characters)
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                  placeholder="e.g. SM7K9P"
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono font-bold text-white uppercase placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Room Password
                  </label>
                  {isAutoFilledPassword && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium flex items-center space-x-1">
                      <Check className="w-2.5 h-2.5" />
                      <span>Auto-filled from direct link</span>
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setIsAutoFilledPassword(false);
                  }}
                  placeholder="e.g. 482913"
                  className={`w-full bg-slate-900/80 border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition ${
                    isAutoFilledPassword
                      ? 'border-emerald-500/50 bg-emerald-950/10 focus:border-emerald-400'
                      : 'border-white/10 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Your Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Choose Avatar Color
                </label>
                <div className="flex items-center space-x-2">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-8 h-8 rounded-full transition transform hover:scale-110 flex items-center justify-center ${
                        selectedColor === color ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-80'
                      }`}
                    >
                      {selectedColor === color && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!displayName.trim() || !roomIdInput.trim() || !passwordInput.trim()}
                className="w-full glow-btn bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center space-x-2 shadow-xl shadow-indigo-500/25 transition transform active:scale-98 disabled:opacity-50"
              >
                <span>Enter Lounge</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Feature Pill Highlights */}
        <div className="grid grid-cols-3 gap-3 mt-8 text-center text-xs text-slate-400">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center">
            <PlayCircle className="w-5 h-5 text-indigo-400 mb-1" />
            <span className="font-semibold text-white">Sync Music</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center">
            <Video className="w-5 h-5 text-purple-400 mb-1" />
            <span className="font-semibold text-white">Video Call</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center">
            <Gamepad2 className="w-5 h-5 text-pink-400 mb-1" />
            <span className="font-semibold text-white">Mini Games</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 border-t border-white/5 z-10">
        SyncLounge • Static PWA Architecture for GitHub Pages
      </footer>
    </div>
  );
};
