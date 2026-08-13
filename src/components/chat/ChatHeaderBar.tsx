import React from 'react';
import { Sparkles, Flame, Search, Download, Trash2, Image as ImageIcon, Mic, BarChart2, Pin, Star, X } from 'lucide-react';
import type { ChatMessage } from '../../types';

interface ChatHeaderBarProps {
  messages: ChatMessage[];
  isVanishMode: boolean;
  onToggleVanish: () => void;
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onExport: () => void;
  isHost: boolean;
  onClearChat: () => void;
  mediaFilter: 'all' | 'image' | 'audio' | 'poll' | 'pinned' | 'starred';
  setMediaFilter: (filter: 'all' | 'image' | 'audio' | 'poll' | 'pinned' | 'starred') => void;
  pinnedMessages: ChatMessage[];
  starredMsgIds: Record<string, boolean>;
}

export const ChatHeaderBar: React.FC<ChatHeaderBarProps> = ({
  messages,
  isVanishMode,
  onToggleVanish,
  isSearching,
  setIsSearching,
  searchQuery,
  setSearchQuery,
  onExport,
  isHost,
  onClearChat,
  mediaFilter,
  setMediaFilter,
  pinnedMessages,
  starredMsgIds,
}) => {
  return (
    <>
      {/* Header Bar with Search, Media Filters & Vanish Mode Switcher */}
      <div className="px-3.5 py-2 bg-slate-900/90 border-b border-white/10 flex items-center justify-between z-10 shrink-0 gap-2">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">P2P Lounge Chat</span>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-indigo-500/30 whitespace-nowrap shrink-0">
            {messages.length} msgs
          </span>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Vanish Mode Toggle */}
          <button
            onClick={onToggleVanish}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center space-x-1.5 transition border whitespace-nowrap shrink-0 ${
              isVanishMode
                ? 'bg-purple-600/30 text-purple-300 border-purple-400 shadow-md animate-pulse'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
            }`}
            title="Toggle Vanish Mode (Self-Destructing Messages)"
          >
            <Flame className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>Vanish {isVanishMode ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setIsSearching(!isSearching)}
            className={`p-1.5 rounded-lg transition ${
              isSearching ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Search Chat"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onExport}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
            title="Export Chat History"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {isHost && messages.length > 0 && (
            <button
              onClick={onClearChat}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition"
              title="Clear Local Feed"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="px-3 py-1.5 bg-slate-950/60 border-b border-white/10 flex items-center space-x-1.5 overflow-x-auto no-scrollbar text-[11px] shrink-0">
        <button
          onClick={() => setMediaFilter('all')}
          className={`px-2.5 py-1 rounded-xl font-semibold transition whitespace-nowrap shrink-0 ${
            mediaFilter === 'all'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md border border-indigo-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          All Feed
        </button>
        <button
          onClick={() => setMediaFilter('image')}
          className={`px-2.5 py-1 rounded-xl font-semibold transition whitespace-nowrap shrink-0 flex items-center space-x-1 ${
            mediaFilter === 'image'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md border border-indigo-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ImageIcon className="w-3 h-3" />
          <span>Photos</span>
        </button>
        <button
          onClick={() => setMediaFilter('audio')}
          className={`px-2.5 py-1 rounded-xl font-semibold transition whitespace-nowrap shrink-0 flex items-center space-x-1 ${
            mediaFilter === 'audio'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md border border-indigo-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Mic className="w-3 h-3" />
          <span>Voice</span>
        </button>
        <button
          onClick={() => setMediaFilter('poll')}
          className={`px-2.5 py-1 rounded-xl font-semibold transition whitespace-nowrap shrink-0 flex items-center space-x-1 ${
            mediaFilter === 'poll'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md border border-indigo-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart2 className="w-3 h-3" />
          <span>Polls</span>
        </button>
        <button
          onClick={() => setMediaFilter('pinned')}
          className={`px-2.5 py-1 rounded-xl font-semibold transition whitespace-nowrap shrink-0 flex items-center space-x-1 ${
            mediaFilter === 'pinned'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md border border-indigo-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Pin className="w-3 h-3" />
          <span>Pinned ({pinnedMessages.length})</span>
        </button>
        <button
          onClick={() => setMediaFilter('starred')}
          className={`px-2.5 py-1 rounded-xl font-semibold transition whitespace-nowrap shrink-0 flex items-center space-x-1 ${
            mediaFilter === 'starred'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md border border-indigo-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span>Saved ({Object.values(starredMsgIds).filter(Boolean).length})</span>
        </button>
      </div>

      {/* Pinned Announcement Bar */}
      {pinnedMessages.length > 0 && mediaFilter !== 'pinned' && (
        <div className="bg-indigo-950/60 border-b border-indigo-500/30 px-3 py-2 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center space-x-2 overflow-hidden">
            <Pin className="w-3.5 h-3.5 text-indigo-400 shrink-0 animate-bounce" />
            <div className="text-xs truncate">
              <span className="font-bold text-indigo-300">Pinned by {pinnedMessages[pinnedMessages.length - 1].senderName}: </span>
              <span className="text-white">{pinnedMessages[pinnedMessages.length - 1].text}</span>
            </div>
          </div>
          <button
            onClick={() => setMediaFilter('pinned')}
            className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 shrink-0 font-medium hover:bg-indigo-500/30"
          >
            View All ({pinnedMessages.length})
          </button>
        </div>
      )}

      {/* Vanish Mode Banner */}
      {isVanishMode && (
        <div className="bg-purple-950/70 border-b border-purple-500/40 px-3 py-1.5 flex items-center justify-between shrink-0 text-xs font-bold text-purple-200 animate-pulse">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-purple-400" />
            <span>✨ Vanish Mode Active — Messages self-destruct after 10s</span>
          </div>
          <button onClick={onToggleVanish} className="text-[10px] bg-white/10 px-2 py-0.5 rounded hover:bg-white/20">
            Turn Off
          </button>
        </div>
      )}

      {/* Live Search Bar */}
      {isSearching && (
        <div className="px-4 py-2 bg-indigo-950/40 border-b border-indigo-500/30 flex items-center space-x-2 animate-fadeIn shrink-0">
          <Search className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages by content or sender..."
            className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </>
  );
};
