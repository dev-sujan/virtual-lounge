import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../stores/useChatStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { peerService } from '../../services/webrtc/peerService';
import { getInitials } from '../../utils/avatarUtils';
import { playSendSound, playReactionSound } from '../../utils/soundUtils';
import type { ChatMessage } from '../../types';
import {
  Send,
  Smile,
  Reply,
  Trash2,
  X,
  Sparkles,
  Search,
  Download,
  Image as ImageIcon,
  Mic,
  Square,
  Play,
  Pause,
  Sticker,
  Eye,
} from 'lucide-react';

const QUICK_EMOJIS = ['❤️', '🔥', '👍', '🎵', '😂', '🎉', '😮', '👏', '🚀', '💯', '✨', '🙌'];

const PRESET_STICKERS = [
  { name: 'Party Vibe', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=60' },
  { name: 'Chill Beats', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=60' },
  { name: 'Neon Lights', url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=60' },
  { name: 'Lofi Coffee', url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=60' },
];

export const ChatBox: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showImageModal, setShowImageModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isTypingLocal, setIsTypingLocal] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const typingTimeoutRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, typingUsers, replyingTo, addMessage, deleteMessage, addReaction, setReplyingTo, clearChat } =
    useChatStore();
  const { currentUser, isHost } = useRoomStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Handle Slash Commands (/shrug, /tableflip, /dice, /coin)
  const processSlashCommands = (text: string): { processedText: string; isAction?: string } => {
    if (text === '/shrug') return { processedText: '¯\\_(ツ)_/¯' };
    if (text === '/tableflip') return { processedText: '(╯°□°）╯︵ ┻━┻' };
    if (text === '/unflip') return { processedText: '┬─┬ノ( º _ ºノ)' };
    if (text === '/dice') {
      const roll = Math.floor(Math.random() * 6) + 1;
      return { processedText: `🎲 rolled a ${roll}!`, isAction: 'dice' };
    }
    if (text === '/coin') {
      const coin = Math.random() > 0.5 ? 'Heads 🪙' : 'Tails 🪙';
      return { processedText: `flipped a coin: ${coin}`, isAction: 'coin' };
    }
    return { processedText: text };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (!currentUser) return;

    if (!isTypingLocal) {
      setIsTypingLocal(true);
      peerService.broadcast('TYPING_INDICATOR', {
        userId: currentUser.id,
        name: currentUser.displayName,
        isTyping: true,
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingLocal(false);
      peerService.broadcast('TYPING_INDICATOR', {
        userId: currentUser.id,
        name: currentUser.displayName,
        isTyping: false,
      });
    }, 2000);
  };

  const handleSendMessage = (e?: React.FormEvent, customImg?: string) => {
    if (e) e.preventDefault();
    const rawText = inputText.trim();
    if (!rawText && !customImg && !imageUrlInput) return;
    if (!currentUser) return;

    const { processedText, isAction } = processSlashCommands(rawText);
    const finalImg = customImg || (imageUrlInput.trim() ? imageUrlInput.trim() : undefined);

    const newMsg: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderAvatarColor: currentUser.avatarColor,
      text: isAction ? `${currentUser.displayName} ${processedText}` : processedText || (finalImg ? 'Shared an image' : ''),
      timestamp: Date.now(),
      reactions: {},
      imageUrl: finalImg,
      attachmentType: finalImg ? 'image' : undefined,
      isSystem: !!isAction,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            text: replyingTo.text,
          }
        : undefined,
    };

    addMessage(newMsg);
    peerService.broadcast('CHAT_MESSAGE', newMsg);
    playSendSound();

    setInputText('');
    setImageUrlInput('');
    setReplyingTo(null);
    setShowAttachMenu(false);

    if (isTypingLocal) {
      setIsTypingLocal(false);
      peerService.broadcast('TYPING_INDICATOR', {
        userId: currentUser.id,
        name: currentUser.displayName,
        isTyping: false,
      });
    }
  };

  // Voice Note Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          sendVoiceNote(base64Audio, recordingSeconds);
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone permission is required to record voice notes.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const sendVoiceNote = (audioDataUrl: string, durationSec: number) => {
    if (!currentUser) return;

    const voiceMsg: ChatMessage = {
      id: 'msg_v_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderAvatarColor: currentUser.avatarColor,
      text: '🎤 Voice Note',
      timestamp: Date.now(),
      reactions: {},
      audioUrl: audioDataUrl,
      audioDuration: durationSec || 1,
      attachmentType: 'audio',
    };

    addMessage(voiceMsg);
    peerService.broadcast('CHAT_MESSAGE', voiceMsg);
    playSendSound();
  };

  const togglePlayAudio = (msgId: string, audioUrl?: string) => {
    if (!audioUrl) return;

    if (playingAudioId === msgId && activeAudioRef.current) {
      activeAudioRef.current.pause();
      setPlayingAudioId(null);
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    activeAudioRef.current = audio;
    setPlayingAudioId(msgId);

    audio.play().catch(() => setPlayingAudioId(null));
    audio.onended = () => setPlayingAudioId(null);
  };

  const handleAddReaction = (msgId: string, emoji: string) => {
    if (!currentUser) return;
    addReaction(msgId, emoji, currentUser.id);
    peerService.broadcast('CHAT_REACTION', { msgId, emoji, userId: currentUser.id });
    playReactionSound();
    setShowEmojiPicker(null);
  };

  const handleDelete = (msgId: string) => {
    deleteMessage(msgId);
    peerService.broadcast('CHAT_DELETE', { msgId });
  };

  const exportChatHistory = () => {
    const chatText = messages
      .map((m) => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.senderName}: ${m.text}`)
      .join('\n');
    const blob = new Blob([chatText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SyncLounge-Chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const activeTypingNames = Object.values(typingUsers).filter(
    (name) => name !== currentUser?.displayName
  );

  const filteredMessages = isSearching && searchQuery.trim()
    ? messages.filter(
        (m) =>
          m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  return (
    <div className="glass-card rounded-2xl border border-white/10 flex flex-col h-[560px] max-h-[85vh] shadow-2xl overflow-hidden relative">
      {/* Header Bar with Search & Export Tools */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-white/10 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white tracking-wide">P2P Encrypted Chat</span>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-indigo-500/30">
            {messages.length} msgs
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsSearching(!isSearching)}
            className={`p-1.5 rounded-lg transition ${
              isSearching ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white'
            }`}
            title="Search Chat"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={exportChatHistory}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            title="Export Chat History"
          >
            <Download className="w-4 h-4" />
          </button>
          {isHost && messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition"
              title="Clear Local Feed"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Live Search Input Bar */}
      {isSearching && (
        <div className="px-4 py-2 bg-indigo-950/40 border-b border-indigo-500/30 flex items-center space-x-2 animate-fadeIn">
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

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
            <Sparkles className="w-8 h-8 text-indigo-400 mb-2 animate-pulse" />
            <h4 className="font-bold text-white text-sm">
              {isSearching ? 'No messages match your search' : 'Private Social Lounge Chat'}
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              {isSearching
                ? 'Try searching with a different keyword or username.'
                : 'Send text, emojis, image links, voice notes, or slash commands (/dice, /shrug).'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;

            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="glass-pill px-3 py-1 rounded-full text-[11px] font-medium text-slate-300 bg-white/5 border border-white/10 flex items-center space-x-1.5 shadow">
                    <span>{msg.text}</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col group relative ${isMe ? 'items-end' : 'items-start'}`}
              >
                {msg.replyTo && (
                  <div className="mb-1 text-[11px] text-slate-400 bg-slate-900/60 px-3 py-1 rounded-lg border-l-2 border-indigo-500 max-w-[80%] truncate">
                    <span className="font-semibold text-indigo-300">Replying to {msg.replyTo.senderName}: </span>
                    <span>{msg.replyTo.text}</span>
                  </div>
                )}

                <div className="flex items-start space-x-2 max-w-[85%] sm:max-w-[75%]">
                  {!isMe && (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow mt-0.5"
                      style={{ backgroundColor: msg.senderAvatarColor }}
                    >
                      {getInitials(msg.senderName)}
                    </div>
                  )}

                  <div className="flex flex-col">
                    {!isMe && (
                      <span className="text-[11px] font-semibold text-slate-300 ml-1 mb-0.5">
                        {msg.senderName}
                      </span>
                    )}

                    <div
                      className={`p-3 rounded-2xl text-sm relative shadow-md ${
                        isMe
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none'
                          : 'bg-slate-800/90 text-slate-100 border border-white/10 rounded-tl-none'
                      }`}
                    >
                      {/* Image Attachment */}
                      {msg.imageUrl && (
                        <div
                          onClick={() => setShowImageModal(msg.imageUrl || null)}
                          className="mb-2 rounded-xl overflow-hidden cursor-pointer relative group/img max-w-xs border border-white/20 shadow-md"
                        >
                          <img src={msg.imageUrl} alt="Attachment" className="w-full h-auto max-h-48 object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white text-xs space-x-1 font-semibold">
                            <Eye className="w-4 h-4" />
                            <span>Expand</span>
                          </div>
                        </div>
                      )}

                      {/* Voice Note Attachment */}
                      {msg.audioUrl && (
                        <div className="flex items-center space-x-3 bg-black/30 p-2 rounded-xl border border-white/10 mb-1">
                          <button
                            onClick={() => togglePlayAudio(msg.id, msg.audioUrl)}
                            className="w-8 h-8 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white flex items-center justify-center shadow transition shrink-0"
                          >
                            {playingAudioId === msg.id ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                          </button>
                          <div>
                            <span className="text-xs font-bold block text-white">Voice Note</span>
                            <span className="text-[10px] text-slate-300 font-mono">
                              0:0{msg.audioDuration || 3}
                            </span>
                          </div>
                        </div>
                      )}

                      <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                      <span className="block text-[9px] opacity-60 text-right mt-1 font-mono">
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    </div>

                    {/* Reactions */}
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

                {/* Message Hover Actions */}
                <div
                  className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 bg-slate-900/90 border border-white/10 rounded-full px-2 py-1 shadow-lg z-10 ${
                    isMe ? 'right-[80%]' : 'left-[80%]'
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
                  {isMe && (
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded-full transition"
                      title="Delete Message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Quick Emoji Popover */}
                {showEmojiPicker === msg.id && (
                  <div className="mt-2 p-1.5 rounded-2xl bg-slate-900/95 border border-white/15 flex space-x-1 shadow-2xl z-20 animate-fadeIn">
                    {QUICK_EMOJIS.slice(0, 8).map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleAddReaction(msg.id, emoji)}
                        className="hover:scale-125 transition transform p-1 text-base"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {activeTypingNames.length > 0 && (
        <div className="px-4 py-1 text-xs text-indigo-300 italic bg-slate-900/40 flex items-center space-x-1.5">
          <div className="flex space-x-1">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" />
          </div>
          <span>
            {activeTypingNames.join(', ')} {activeTypingNames.length > 1 ? 'are' : 'is'} typing...
          </span>
        </div>
      )}

      {/* Reply Preview */}
      {replyingTo && (
        <div className="bg-indigo-950/50 px-4 py-2 border-t border-indigo-500/30 flex items-center justify-between">
          <div className="text-xs overflow-hidden">
            <span className="font-bold text-indigo-300">Replying to {replyingTo.senderName}: </span>
            <span className="text-slate-300 truncate">{replyingTo.text}</span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-slate-400 hover:text-white p-1 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachment Popover Panel */}
      {showAttachMenu && (
        <div className="p-4 bg-slate-900/95 border-t border-white/10 space-y-3 animate-fadeIn z-20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Sticker className="w-4 h-4 text-indigo-400" />
              <span>Share Image or Preset Sticker</span>
            </span>
            <button onClick={() => setShowAttachMenu(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="Paste Image / GIF URL..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!imageUrlInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition"
            >
              Attach
            </button>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1.5">
              Lounge Preset Stickers
            </span>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_STICKERS.map((s) => (
                <button
                  key={s.name}
                  onClick={() => handleSendMessage(undefined, s.url)}
                  className="rounded-xl overflow-hidden border border-white/10 hover:border-indigo-400 transition relative group h-14 shadow"
                >
                  <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
                  <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] font-bold text-white opacity-90 group-hover:opacity-100">
                    {s.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Voice Recording Overlay */}
      {isRecording ? (
        <div className="p-3 bg-rose-950/80 border-t border-rose-500/40 flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-bold text-rose-200">
              Recording Voice Note ({recordingSeconds}s)...
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={cancelRecording}
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={stopRecording}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Send Voice</span>
            </button>
          </div>
        </div>
      ) : (
        /* Chat Input Form */
        <form onSubmit={handleSendMessage} className="p-3 bg-slate-900/80 border-t border-white/10 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`p-2 rounded-xl transition ${
              showAttachMenu ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Attach Image / Sticker"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={startRecording}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-xl transition"
            title="Record Voice Note"
          >
            <Mic className="w-4 h-4" />
          </button>

          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder="Type message or /shrug, /dice..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() && !imageUrlInput.trim()}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 disabled:opacity-40 text-white flex items-center justify-center shadow-lg transition transform active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Expanded Image Lightbox Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
            <button
              onClick={() => setShowImageModal(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={showImageModal} alt="Expanded preview" className="w-full h-full object-contain max-h-[80vh]" />
          </div>
        </div>
      )}
    </div>
  );
};
