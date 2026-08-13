import React from 'react';
import {
  Reply,
  Copy,
  Volume2,
  VolumeX,
  Star,
  Edit2,
  Undo2,
  Pin,
  Trash2,
  Smile,
  Heart,
  Eye,
  Pause,
  Play,
  BarChart2,
  Check,
  CheckCheck,
  X,
} from 'lucide-react';
import type { ChatMessage, User } from '../../types';
import { getInitials } from '../../utils/avatarUtils';
import { CATEGORIZED_EMOJIS } from './chatConstants';

interface MessageBubbleProps {
  msg: ChatMessage;
  msgIndex: number;
  currentUser: { id: string; displayName: string; avatarColor: string } | null;
  peers: User[];
  isHost: boolean;
  mobileActiveMsgId: string | null;
  setMobileActiveMsgId: (id: string | null) => void;
  showEmojiPicker: string | null;
  setShowEmojiPicker: (id: string | null) => void;
  selectedEmojiCat: string;
  setSelectedEmojiCat: (cat: string) => void;
  swipeTranslateMap: Record<string, number>;
  doubleTapHeartMap: Record<string, boolean>;
  starredMsgIds: Record<string, boolean>;
  speakingMsgId: string | null;
  playingAudioId: string | null;
  audioPlaybackRate: number;
  handleTouchStart: (e: React.TouchEvent, msg: ChatMessage) => void;
  handleTouchMove: (e: React.TouchEvent, msg: ChatMessage) => void;
  handleTouchEnd: (msg: ChatMessage) => void;
  handleAddReaction: (msgId: string, emoji: string) => void;
  setReplyingTo: (msg: ChatMessage | null) => void;
  handleCopyMessageText: (text: string) => void;
  speakMessageText: (msgId: string, text: string) => void;
  toggleStarMessage: (msgId: string) => void;
  handleStartEdit: (msg: ChatMessage) => void;
  handleUnsend: (msgId: string) => void;
  handleTogglePin: (msgId: string) => void;
  handleDelete: (msgId: string) => void;
  setShowImageModal: (url: string | null) => void;
  togglePlayAudio: (msgId: string, url?: string) => void;
  cycleAudioPlaybackRate: () => void;
  handleVotePoll: (msgId: string, index: number) => void;
  renderFormattedContent: (text: string) => React.ReactNode;
  formatTimestamp: (ts: number) => string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  msgIndex,
  currentUser,
  peers,
  isHost,
  mobileActiveMsgId,
  setMobileActiveMsgId,
  showEmojiPicker,
  setShowEmojiPicker,
  selectedEmojiCat,
  setSelectedEmojiCat,
  swipeTranslateMap,
  doubleTapHeartMap,
  starredMsgIds,
  speakingMsgId,
  playingAudioId,
  audioPlaybackRate,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleAddReaction,
  setReplyingTo,
  handleCopyMessageText,
  speakMessageText,
  toggleStarMessage,
  handleStartEdit,
  handleUnsend,
  handleTogglePin,
  handleDelete,
  setShowImageModal,
  togglePlayAudio,
  cycleAudioPlaybackRate,
  handleVotePoll,
  renderFormattedContent,
  formatTimestamp,
}) => {
  const isMe = msg.senderId === currentUser?.id;
  const isMobileSelected = mobileActiveMsgId === msg.id;
  const isTopMessage = msgIndex <= 1;
  const hasBeenReadByPeers = msg.readBy && msg.readBy.some((id) => id !== currentUser?.id);

  if (msg.isSystem) {
    return (
      <div className="flex justify-center my-1.5">
        <div className="glass-pill px-3 py-0.5 rounded-full text-[11px] font-medium text-slate-300 bg-white/5 border border-white/10 flex items-center space-x-1.5 shadow">
          <span>{msg.text}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col group relative ${isMe ? 'items-end' : 'items-start'}`}>
      {/* Reply Indicator */}
      {msg.replyTo && (
        <div className="mb-1 text-[11px] text-slate-400 bg-slate-900/60 px-2.5 py-0.5 rounded-lg border-l-2 border-indigo-500 max-w-[80%] truncate">
          <span className="font-semibold text-indigo-300">Replying to {msg.replyTo.senderName}: </span>
          <span>{msg.replyTo.text}</span>
        </div>
      )}

      <div className="flex items-start space-x-2 max-w-[88%] sm:max-w-[78%] relative">
        {/* Swipe Right to Reply Indicator */}
        {swipeTranslateMap[msg.id] !== undefined && swipeTranslateMap[msg.id] > 0 && (
          <div
            className="absolute left-[-28px] top-1/2 -translate-y-1/2 text-indigo-400 flex items-center justify-center transition-opacity"
            style={{ opacity: Math.min((swipeTranslateMap[msg.id] || 0) / 35, 1) }}
          >
            <Reply className="w-5 h-5" />
          </div>
        )}

        {!isMe && (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow mt-0.5"
            style={{ backgroundColor: msg.senderAvatarColor }}
          >
            {getInitials(msg.senderName)}
          </div>
        )}

        <div className="flex flex-col">
          {!isMe && (
            <div className="flex items-center space-x-1.5 ml-1 mb-0.5">
              <span className="text-[11px] font-semibold text-slate-300">
                {msg.senderName}
              </span>
              {(() => {
                const senderPeer = peers.find((p) => p.id === msg.senderId);
                const activity = senderPeer?.currentActivity;
                if (!activity) return null;
                return (
                  <span className="text-[9px] text-indigo-300 bg-white/10 backdrop-blur-md px-1.5 py-0.2 rounded-full border border-white/15 font-mono font-medium">
                    {activity}
                  </span>
                );
              })()}
            </div>
          )}

          <div
            onClick={() => setMobileActiveMsgId(isMobileSelected ? null : msg.id)}
            onTouchStart={(e) => handleTouchStart(e, msg)}
            onTouchMove={(e) => handleTouchMove(e, msg)}
            onTouchEnd={() => handleTouchEnd(msg)}
            style={{ transform: `translateX(${swipeTranslateMap[msg.id] || 0}px)` }}
            className={`px-3 py-1.5 rounded-2xl text-xs sm:text-sm relative shadow-md transition-transform duration-75 select-none touch-pan-y ${
              msg.isUnsent
                ? 'bg-slate-900/80 text-slate-400 italic border border-white/10'
                : msg.isVanish
                ? 'bg-gradient-to-r from-purple-900/90 to-pink-900/90 text-purple-100 border border-purple-500/40 shadow-purple-500/20 animate-pulse'
                : isMe
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none'
                : 'bg-slate-800/90 text-slate-100 border border-white/10 rounded-tl-none'
            } ${msg.isPinned ? 'ring-2 ring-indigo-400/50 shadow-indigo-500/20' : ''}`}
          >
            {/* Double Tap Floating Heart Animation Burst */}
            {doubleTapHeartMap[msg.id] && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-bounce">
                <Heart className="w-10 h-10 text-rose-500 fill-rose-500 drop-shadow-xl" />
              </div>
            )}

            {/* Pinned Badge */}
            {msg.isPinned && (
              <div className="mb-1 flex items-center space-x-1 text-[10px] text-indigo-300 font-bold uppercase tracking-wider">
                <Pin className="w-3 h-3 fill-current" />
                <span>Pinned Message</span>
              </div>
            )}

            {/* Image Attachment */}
            {msg.imageUrl && !msg.isUnsent && (
              <div
                onClick={() => setShowImageModal(msg.imageUrl || null)}
                className="mb-1.5 rounded-xl overflow-hidden cursor-pointer relative group/img max-w-xs border border-white/20 shadow-md"
              >
                <img src={msg.imageUrl} alt="Attachment" className="w-full h-auto max-h-48 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white text-xs space-x-1 font-semibold">
                  <Eye className="w-4 h-4" />
                  <span>Expand</span>
                </div>
              </div>
            )}

            {/* Voice Note Attachment */}
            {msg.audioUrl && !msg.isUnsent && (
              <div className="flex items-center justify-between space-x-3 bg-black/30 p-2 rounded-xl border border-white/10 mb-1 min-w-[180px]">
                <div className="flex items-center space-x-2 overflow-hidden">
                  <button
                    onClick={() => togglePlayAudio(msg.id, msg.audioUrl)}
                    className="w-7 h-7 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white flex items-center justify-center shadow transition shrink-0"
                  >
                    {playingAudioId === msg.id ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>

                  {/* Animated Waveform Visualizer */}
                  <div className="flex items-center space-x-1 h-4 shrink-0">
                    {[0.4, 0.8, 0.5, 1, 0.6, 0.9, 0.4].map((height, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-200 ${
                          playingAudioId === msg.id ? 'bg-indigo-400 animate-pulse' : 'bg-white/30'
                        }`}
                        style={{ height: playingAudioId === msg.id ? `${height * 100}%` : '40%' }}
                      />
                    ))}
                  </div>

                  <span className="text-[10px] text-slate-300 font-mono shrink-0">
                    0:0{msg.audioDuration || 3}
                  </span>
                </div>

                {playingAudioId === msg.id && (
                  <button
                    onClick={cycleAudioPlaybackRate}
                    className="text-[10px] font-mono font-bold bg-white/15 px-1.5 py-0.5 rounded text-indigo-200 shrink-0 hover:bg-white/25 transition"
                    title="Voice Playback Speed"
                  >
                    {audioPlaybackRate}x
                  </button>
                )}
              </div>
            )}

            {/* Interactive Chat Poll */}
            {msg.poll && !msg.isUnsent && (
              <div className="space-y-1.5 mb-1.5 p-2.5 bg-black/40 rounded-xl border border-white/10 min-w-[200px]">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                  <span className="flex items-center space-x-1">
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>{msg.poll.question}</span>
                  </span>
                </div>

                <div className="space-y-1">
                  {msg.poll.options.map((opt, idx) => {
                    const totalVotes = msg.poll!.options.reduce((sum, o) => sum + o.votes.length, 0);
                    const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                    const hasVoted = currentUser && opt.votes.includes(currentUser.id);

                    return (
                      <button
                        key={idx}
                        onClick={() => handleVotePoll(msg.id, idx)}
                        className={`w-full p-1.5 rounded-lg text-xs flex flex-col transition border relative overflow-hidden text-left ${
                          hasVoted
                            ? 'bg-indigo-500/30 border-indigo-400 text-white font-bold'
                            : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                        }`}
                      >
                        {/* Progress bar background */}
                        <div
                          className="absolute inset-0 bg-indigo-500/20 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />

                        <div className="relative z-10 flex justify-between items-center w-full">
                          <span className="truncate pr-2">{opt.text}</span>
                          <span className="font-mono text-[10px] font-bold text-indigo-300 shrink-0">
                            {pct}% ({opt.votes.length})
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Text content with inline/flex timestamp for max space utilization */}
            {!msg.poll && (
              <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-0.5">
                <p className="whitespace-pre-wrap break-words leading-snug">{renderFormattedContent(msg.text)}</p>
                <div className="flex items-center space-x-1 text-[9px] opacity-75 font-mono shrink-0 ml-auto self-end">
                  {msg.isEdited && <span className="italic text-slate-400">(edited)</span>}
                  <span>{formatTimestamp(msg.timestamp)}</span>
                  {isMe && !msg.isUnsent && (
                    <span title={hasBeenReadByPeers ? 'Read by peers' : 'Sent'}>
                      {hasBeenReadByPeers ? (
                        <CheckCheck className="w-3 h-3 text-sky-400 inline ml-0.5" />
                      ) : (
                        <Check className="w-3 h-3 text-slate-400 inline ml-0.5" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reactions Pill Display */}
          {Object.keys(msg.reactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                <button
                  key={emoji}
                  onClick={() => handleAddReaction(msg.id, emoji)}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition flex items-center space-x-1 ${
                    userIds.includes(currentUser?.id || '')
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-slate-900/60 border-white/10 text-slate-300'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="font-bold text-[10px] font-mono">{userIds.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Toolbar - Desktop Hover + Mobile Touch Fix + Top Message Safety */}
      {!msg.isUnsent && (
        <div
          className={`absolute transition-all flex items-center space-x-1 bg-slate-900/95 border border-white/15 rounded-full px-2 py-1 shadow-xl z-20 ${
            isTopMessage
              ? isMe
                ? 'top-full mt-1.5 right-0 sm:right-[10%]'
                : 'top-full mt-1.5 left-0 sm:left-[10%]'
              : isMe
                ? '-top-9 left-1/2 -translate-x-1/2 sm:top-0 sm:translate-x-0 sm:right-[82%] sm:left-auto'
                : '-top-9 left-1/2 -translate-x-1/2 sm:top-0 sm:translate-x-0 sm:left-[82%] sm:right-auto'
          } ${
            isMobileSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
          }`}
        >
          <button
            onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
            className="p-1 text-slate-400 hover:text-amber-400 rounded-full transition"
            title="Add Reaction"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setReplyingTo(msg)}
            className="p-1 text-slate-400 hover:text-indigo-400 rounded-full transition"
            title="Reply"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleCopyMessageText(msg.text)}
            className="p-1 text-slate-400 hover:text-indigo-300 rounded-full transition"
            title="Copy Text"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => speakMessageText(msg.id, msg.text)}
            className={`p-1 rounded-full transition ${
              speakingMsgId === msg.id ? 'text-amber-400 animate-pulse' : 'text-slate-400 hover:text-amber-300'
            }`}
            title={speakingMsgId === msg.id ? 'Stop Reading Aloud' : 'Read Aloud (Text-to-Speech)'}
          >
            {speakingMsgId === msg.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => toggleStarMessage(msg.id)}
            className={`p-1 rounded-full transition ${
              starredMsgIds[msg.id] ? 'text-amber-400' : 'text-slate-400 hover:text-amber-300'
            }`}
            title={starredMsgIds[msg.id] ? 'Unstar Message' : 'Star/Bookmark Message'}
          >
            <Star className={`w-3.5 h-3.5 ${starredMsgIds[msg.id] ? 'fill-amber-400' : ''}`} />
          </button>
          {isMe && (
            <button
              onClick={() => handleStartEdit(msg)}
              className="p-1 text-slate-400 hover:text-indigo-300 rounded-full transition"
              title="Edit Message"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {isMe && (
            <button
              onClick={() => handleUnsend(msg.id)}
              className="p-1 text-slate-400 hover:text-amber-400 rounded-full transition"
              title="Unsend Message"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => handleTogglePin(msg.id)}
            className={`p-1 rounded-full transition ${
              msg.isPinned ? 'text-indigo-400' : 'text-slate-400 hover:text-indigo-300'
            }`}
            title={msg.isPinned ? 'Unpin Message' : 'Pin Message'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          {(isMe || isHost) && (
            <button
              onClick={() => handleDelete(msg.id)}
              className="p-1 text-slate-400 hover:text-rose-400 rounded-full transition"
              title="Delete Message"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Categorized Quick Emoji Popover */}
      {showEmojiPicker === msg.id && (
        <div className="mt-2 p-2.5 rounded-2xl bg-slate-900/95 border border-white/15 shadow-2xl z-30 animate-fadeIn space-y-1.5 max-w-xs relative">
          <div className="flex items-center justify-between border-b border-white/10 pb-1 text-[10px]">
            <div className="flex space-x-1 overflow-x-auto no-scrollbar pr-1">
              {Object.keys(CATEGORIZED_EMOJIS).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedEmojiCat(cat)}
                  className={`px-2 py-0.5 rounded-lg whitespace-nowrap font-medium transition ${
                    selectedEmojiCat === cat ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.split(' ')[0]}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setShowEmojiPicker(null);
                setMobileActiveMsgId(null);
              }}
              className="p-1 text-slate-400 hover:text-white rounded-md shrink-0 transition"
              title="Close Emoji Picker"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-6 gap-1">
            {CATEGORIZED_EMOJIS[selectedEmojiCat]?.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleAddReaction(msg.id, emoji)}
                className="hover:scale-125 transition transform p-1 text-base rounded hover:bg-white/10"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
