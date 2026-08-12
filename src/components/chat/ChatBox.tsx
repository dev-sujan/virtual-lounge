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
  Eye,
  Pin,
  BarChart2,
  Terminal,
  Edit2,
  Undo2,
  Flame,
  Check,
  CheckCheck,
} from 'lucide-react';


interface SlashCommandInfo {
  command: string;
  syntax: string;
  description: string;
  icon: string;
}

const SLASH_COMMANDS_CATALOG: SlashCommandInfo[] = [
  { command: '/poll', syntax: '/poll "Question" "Option A" "Option B"', description: 'Create an interactive chat poll', icon: '📊' },
  { command: '/8ball', syntax: '/8ball "Will we finish playlist?"', description: 'Ask Magic 8-Ball a fortune question', icon: '🎱' },
  { command: '/dice', syntax: '/dice', description: 'Roll a random 6-sided die', icon: '🎲' },
  { command: '/coin', syntax: '/coin', description: 'Flip a coin (Heads or Tails)', icon: '🪙' },
  { command: '/shrug', syntax: '/shrug', description: 'Append ¯\\_(ツ)_/¯', icon: '¯\\_(ツ)_/¯' },
  { command: '/tableflip', syntax: '/tableflip', description: 'Append (╯°□°）╯︵ ┻━┻', icon: '(╯°□°）╯' },
  { command: '/unflip', syntax: '/unflip', description: 'Append ┬─┬ノ( º _ ºノ)', icon: '┬─┬' },
];

const CATEGORIZED_EMOJIS: Record<string, string[]> = {
  '🎉 Party & Vibe': ['🔥', '💃', '🎵', '🎉', '🚀', '💯', '✨', '🙌', '🎶', '🥳', '🍸', '🎧'],
  '😃 Smileys': ['😂', '😍', '😎', '🤩', '🥳', '🙃', '😇', '🤔', '😴', '😮', '🤯', '😜'],
  '❤️ Love & Support': ['❤️', '💖', '💙', '💜', '🤍', '💪', '🙏', '👏', '🤝', '👑', '⭐', '🌟'],
  '🍕 Food & Drinks': ['☕', '🍺', '🍷', '🍕', '🍔', '🍿', '🍩', '🧋', '🍉', '🎂', '🍻', '🌮'],
};

const PRESET_STICKERS = [
  { name: 'Party Vibe', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=60' },
  { name: 'Chill Beats', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=60' },
  { name: 'Neon Lights', url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=60' },
  { name: 'Lofi Coffee', url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=60' },
];

const PRESET_GIFS = [
  { name: 'Dance Party', url: 'https://media.giphy.com/media/l3q2t2KAyv88ab8hG/giphy.gif' },
  { name: 'Vibe Cat', url: 'https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif' },
  { name: 'Lofi Chill', url: 'https://media.giphy.com/media/13l7w7N4Vr1fh6/giphy.gif' },
  { name: 'Hype Popcorn', url: 'https://media.giphy.com/media/gl0mkIZOW6Nwc/giphy.gif' },
  { name: 'DJ Beat', url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif' },
  { name: 'Mind Blown', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
];

export const ChatBox: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachTab, setAttachTab] = useState<'stickers' | 'gifs' | 'polls' | 'url'>('stickers');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showImageModal, setShowImageModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'audio' | 'poll' | 'pinned'>('all');
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const [selectedEmojiCat, setSelectedEmojiCat] = useState<string>('🎉 Party & Vibe');

  // Editing State
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Slash Command Suggestions state
  const [showSlashSuggestions, setShowSlashSuggestions] = useState(false);
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);

  // Mobile active action menu state (for touch devices where hover isn't supported)
  const [mobileActiveMsgId, setMobileActiveMsgId] = useState<string | null>(null);

  // Poll creation state inside attach menu
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

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
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    typingUsers,
    replyingTo,
    isVanishMode,
    addMessage,
    deleteMessage,
    editMessage,
    unsendMessage,
    markMessagesRead,
    addReaction,
    votePollOption,
    togglePinMessage,
    setReplyingTo,
    toggleVanishMode,
    clearChat,
  } = useChatStore();

  const { currentUser, isHost } = useRoomStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Read receipts auto-sync
  useEffect(() => {
    if (currentUser) {
      markMessagesRead(currentUser.id);
      peerService.broadcast('CHAT_READ_RECEIPT', { userId: currentUser.id });
    }
  }, [messages.length, currentUser?.id]);

  // Filter matching slash commands based on input
  const matchingSlashCommands = inputText.startsWith('/')
    ? SLASH_COMMANDS_CATALOG.filter((c) =>
        c.command.toLowerCase().startsWith(inputText.trim().toLowerCase())
      )
    : [];

  // Handle Extended Slash Commands Execution
  const processSlashCommands = (text: string): { processedText: string; isAction?: string; poll?: any } => {
    const trimmed = text.trim();

    if (trimmed === '/shrug') return { processedText: '¯\\_(ツ)_/¯' };
    if (trimmed === '/tableflip') return { processedText: '(╯°□°）╯︵ ┻━┻' };
    if (trimmed === '/unflip') return { processedText: '┬─┬ノ( º _ ºノ)' };

    if (trimmed === '/dice') {
      const roll = Math.floor(Math.random() * 6) + 1;
      return { processedText: `🎲 rolled a ${roll}!`, isAction: 'dice' };
    }

    if (trimmed === '/coin') {
      const coin = Math.random() > 0.5 ? 'Heads 🪙' : 'Tails 🪙';
      return { processedText: `flipped a coin: ${coin}`, isAction: 'coin' };
    }

    if (trimmed.startsWith('/8ball')) {
      const answers = [
        'It is certain! 🎱',
        'Without a doubt! ✨',
        'Ask again later 🔮',
        'Cannot predict now 🌫️',
        'Don’t count on it ❌',
        'My sources say no 🚫',
        'Outlook good! 🚀',
        'Signs point to yes! ✅',
      ];
      const question = trimmed.replace('/8ball', '').trim();
      const ans = answers[Math.floor(Math.random() * answers.length)];
      return { processedText: `🎱 asked: "${question || 'the future'}" → ${ans}`, isAction: '8ball' };
    }

    // /poll "Question" "Opt 1" "Opt 2"
    if (trimmed.startsWith('/poll')) {
      const matches = trimmed.match(/"([^"]+)"/g);
      if (matches && matches.length >= 3) {
        const q = matches[0].replace(/"/g, '');
        const opts = matches.slice(1).map((m) => m.replace(/"/g, ''));
        return {
          processedText: `📊 Lounge Poll: ${q}`,
          poll: {
            question: q,
            options: opts.map((opt) => ({ text: opt, votes: [] })),
          },
        };
      }
    }

    return { processedText: text };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (val.startsWith('/')) {
      setShowSlashSuggestions(true);
      setSelectedSlashIndex(0);
    } else {
      setShowSlashSuggestions(false);
    }

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

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSlashSuggestions && matchingSlashCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSlashIndex((prev) => (prev + 1) % matchingSlashCommands.length);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSlashIndex((prev) => (prev - 1 + matchingSlashCommands.length) % matchingSlashCommands.length);
        return;
      }

      if (e.key === 'Tab' || e.key === 'Enter') {
        const targetCmd = matchingSlashCommands[selectedSlashIndex];
        if (targetCmd) {
          e.preventDefault();
          applySlashCommand(targetCmd);
          return;
        }
      }

      if (e.key === 'Escape') {
        setShowSlashSuggestions(false);
        return;
      }
    }
  };

  const applySlashCommand = (cmd: SlashCommandInfo) => {
    setInputText(cmd.syntax);
    setShowSlashSuggestions(false);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(cmd.syntax.length, cmd.syntax.length);
      }
    }, 50);
  };

  const handleSendMessage = (e?: React.FormEvent, customImg?: string, customPoll?: any) => {
    if (e) e.preventDefault();

    // If in editing mode, save edit instead of sending new message
    if (editingMsgId) {
      handleSaveEdit();
      return;
    }

    const rawText = inputText.trim();
    if (!rawText && !customImg && !imageUrlInput && !customPoll) return;
    if (!currentUser) return;

    const { processedText, isAction, poll: slashPoll } = processSlashCommands(rawText);
    const finalImg = customImg || (imageUrlInput.trim() ? imageUrlInput.trim() : undefined);
    const finalPoll = customPoll || slashPoll;

    const newMsg: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderAvatarColor: currentUser.avatarColor,
      text: finalPoll
        ? `📊 Poll: ${finalPoll.question}`
        : isAction
        ? `${currentUser.displayName} ${processedText}`
        : processedText || (finalImg ? 'Shared an image' : ''),
      timestamp: Date.now(),
      reactions: {},
      imageUrl: finalImg,
      attachmentType: finalPoll ? 'poll' : finalImg ? 'image' : undefined,
      poll: finalPoll,
      isSystem: !!isAction,
      readBy: [currentUser.id],
      isVanish: isVanishMode,
      vanishSeconds: isVanishMode ? 10 : undefined,
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
    setShowSlashSuggestions(false);
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

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMsgId(msg.id);
    setEditingText(msg.text);
    setInputText(msg.text);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSaveEdit = () => {
    if (!editingMsgId || !editingText.trim()) return;
    editMessage(editingMsgId, editingText.trim());
    peerService.broadcast('CHAT_EDIT', { msgId: editingMsgId, newText: editingText.trim() });
    setEditingMsgId(null);
    setEditingText('');
    setInputText('');
  };

  const handleCancelEdit = () => {
    setEditingMsgId(null);
    setEditingText('');
    setInputText('');
  };

  const handleUnsend = (msgId: string) => {
    unsendMessage(msgId);
    peerService.broadcast('CHAT_UNSEND', { msgId });
  };

  const handleToggleVanish = () => {
    const nextState = !isVanishMode;
    toggleVanishMode(nextState);
    peerService.broadcast('VANISH_MODE_TOGGLE', { enabled: nextState });
  };

  const handleCreatePoll = () => {
    if (!pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2) return;
    const validOpts = pollOptions.filter((o) => o.trim());

    const pollData = {
      question: pollQuestion.trim(),
      options: validOpts.map((text) => ({ text, votes: [] })),
    };

    handleSendMessage(undefined, undefined, pollData);
    setPollQuestion('');
    setPollOptions(['', '']);
  };

  const handleVotePoll = (msgId: string, optionIndex: number) => {
    if (!currentUser) return;
    votePollOption(msgId, optionIndex, currentUser.id);
    peerService.broadcast('CHAT_POLL_VOTE', { msgId, optionIndex, userId: currentUser.id });
  };

  const handleTogglePin = (msgId: string) => {
    togglePinMessage(msgId);
    peerService.broadcast('CHAT_PIN_TOGGLE', { msgId });
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
      readBy: [currentUser.id],
      isVanish: isVanishMode,
      vanishSeconds: isVanishMode ? 10 : undefined,
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

  // Render markdown & auto-link formatting
  const renderFormattedContent = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return (
      <span>
        {parts.map((part, idx) => {
          if (part.match(urlRegex)) {
            return (
              <a
                key={idx}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-300 hover:text-indigo-100 underline break-all font-mono"
                onClick={(e) => e.stopPropagation()}
              >
                {part}
              </a>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </span>
    );
  };

  const pinnedMessages = messages.filter((m) => m.isPinned);
  const activeTypingNames = Object.values(typingUsers).filter(
    (name) => name !== currentUser?.displayName
  );

  let filteredMessages = messages;

  if (isSearching && searchQuery.trim()) {
    filteredMessages = filteredMessages.filter(
      (m) =>
        m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (mediaFilter !== 'all') {
    if (mediaFilter === 'image') filteredMessages = filteredMessages.filter((m) => m.imageUrl);
    else if (mediaFilter === 'audio') filteredMessages = filteredMessages.filter((m) => m.audioUrl);
    else if (mediaFilter === 'poll') filteredMessages = filteredMessages.filter((m) => m.poll);
    else if (mediaFilter === 'pinned') filteredMessages = filteredMessages.filter((m) => m.isPinned);
  }

  return (
    <div
      className={`glass-card rounded-2xl border transition-all flex flex-col h-[580px] max-h-[85vh] shadow-2xl overflow-hidden relative ${
        isVanishMode ? 'border-purple-500/50 shadow-purple-500/20' : 'border-white/10'
      }`}
    >
      {/* Header Bar with Search, Media Filters & Vanish Mode Switcher */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-white/10 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white tracking-wide">P2P Lounge Chat</span>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-indigo-500/30">
            {messages.length} msgs
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Vanish Mode Toggle */}
          <button
            onClick={handleToggleVanish}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center space-x-1 transition border ${
              isVanishMode
                ? 'bg-purple-600/30 text-purple-300 border-purple-400 shadow animate-pulse'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
            title="Toggle Vanish Mode (Self-Destructing Messages)"
          >
            <Flame className="w-3.5 h-3.5 text-purple-400" />
            <span>Vanish {isVanishMode ? 'ON' : 'OFF'}</span>
          </button>

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

      {/* Filter Tabs Bar */}
      <div className="px-3 py-1.5 bg-slate-950/40 border-b border-white/5 flex items-center space-x-1 overflow-x-auto text-[11px] shrink-0">
        <button
          onClick={() => setMediaFilter('all')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition ${
            mediaFilter === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          All Feed
        </button>
        <button
          onClick={() => setMediaFilter('image')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center space-x-1 ${
            mediaFilter === 'image' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-3 h-3" />
          <span>Photos</span>
        </button>
        <button
          onClick={() => setMediaFilter('audio')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center space-x-1 ${
            mediaFilter === 'audio' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Mic className="w-3 h-3" />
          <span>Voice</span>
        </button>
        <button
          onClick={() => setMediaFilter('poll')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center space-x-1 ${
            mediaFilter === 'poll' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart2 className="w-3 h-3" />
          <span>Polls</span>
        </button>
        <button
          onClick={() => setMediaFilter('pinned')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center space-x-1 ${
            mediaFilter === 'pinned' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Pin className="w-3 h-3" />
          <span>Pinned ({pinnedMessages.length})</span>
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
          <button onClick={handleToggleVanish} className="text-[10px] bg-white/10 px-2 py-0.5 rounded hover:bg-white/20">
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
                : 'Send text, emojis, image links, voice notes, live polls (/poll), or commands (/8ball, /dice).'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            const isMobileSelected = mobileActiveMsgId === msg.id;
            const hasBeenReadByPeers = msg.readBy && msg.readBy.some((id) => id !== currentUser?.id);

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
                {/* Reply Indicator */}
                {msg.replyTo && (
                  <div className="mb-1 text-[11px] text-slate-400 bg-slate-900/60 px-3 py-1 rounded-lg border-l-2 border-indigo-500 max-w-[80%] truncate">
                    <span className="font-semibold text-indigo-300">Replying to {msg.replyTo.senderName}: </span>
                    <span>{msg.replyTo.text}</span>
                  </div>
                )}

                <div className="flex items-start space-x-2 max-w-[88%] sm:max-w-[78%]">
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
                      onClick={() => setMobileActiveMsgId(isMobileSelected ? null : msg.id)}
                      className={`p-3 rounded-2xl text-sm relative shadow-md transition-all ${
                        msg.isUnsent
                          ? 'bg-slate-900/80 text-slate-400 italic border border-white/10'
                          : msg.isVanish
                          ? 'bg-gradient-to-r from-purple-900/90 to-pink-900/90 text-purple-100 border border-purple-500/40 shadow-purple-500/20 animate-pulse'
                          : isMe
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none'
                          : 'bg-slate-800/90 text-slate-100 border border-white/10 rounded-tl-none'
                      } ${msg.isPinned ? 'ring-2 ring-indigo-400/50 shadow-indigo-500/20' : ''}`}
                    >
                      {/* Pinned Badge */}
                      {msg.isPinned && (
                        <div className="mb-1.5 flex items-center space-x-1 text-[10px] text-indigo-300 font-bold uppercase tracking-wider">
                          <Pin className="w-3 h-3 fill-current" />
                          <span>Pinned Message</span>
                        </div>
                      )}

                      {/* Vanish Badge */}
                      {msg.isVanish && (
                        <div className="mb-1 flex items-center space-x-1 text-[10px] text-purple-300 font-bold">
                          <Flame className="w-3 h-3 text-purple-400" />
                          <span>Vanish Message</span>
                        </div>
                      )}

                      {/* Image Attachment */}
                      {msg.imageUrl && !msg.isUnsent && (
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
                      {msg.audioUrl && !msg.isUnsent && (
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

                      {/* Interactive Chat Poll */}
                      {msg.poll && !msg.isUnsent && (
                        <div className="space-y-2 mb-2 p-3 bg-black/40 rounded-xl border border-white/10 min-w-[220px]">
                          <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                            <span className="flex items-center space-x-1">
                              <BarChart2 className="w-3.5 h-3.5" />
                              <span>{msg.poll.question}</span>
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {msg.poll.options.map((opt, idx) => {
                              const totalVotes = msg.poll!.options.reduce((sum, o) => sum + o.votes.length, 0);
                              const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                              const hasVoted = currentUser && opt.votes.includes(currentUser.id);

                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleVotePoll(msg.id, idx)}
                                  className={`w-full p-2 rounded-lg text-xs flex flex-col transition border relative overflow-hidden text-left ${
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

                      {/* Text content with formatting */}
                      {!msg.poll && <p className="whitespace-pre-wrap break-words leading-relaxed">{renderFormattedContent(msg.text)}</p>}

                      {/* Timestamp & Read Receipts */}
                      <div className="flex items-center justify-end space-x-1 mt-1 text-[9px] opacity-75 font-mono">
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

                {/* Action Toolbar - Desktop Hover + Mobile Touch Fix */}
                {!msg.isUnsent && (
                  <div
                    className={`absolute transition-all flex items-center space-x-1 bg-slate-900/95 border border-white/15 rounded-full px-2 py-1 shadow-xl z-10 ${
                      isMe
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
                  <div className="mt-2 p-2 rounded-2xl bg-slate-900/95 border border-white/15 shadow-2xl z-20 animate-fadeIn space-y-1.5 max-w-xs">
                    <div className="flex space-x-1 border-b border-white/10 pb-1 overflow-x-auto text-[10px]">
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
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {activeTypingNames.length > 0 && (
        <div className="px-4 py-1 text-xs text-indigo-300 italic bg-slate-900/40 flex items-center space-x-1.5 shrink-0">
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
        <div className="bg-indigo-950/50 px-4 py-2 border-t border-indigo-500/30 flex items-center justify-between shrink-0">
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

      {/* Edit Mode Preview */}
      {editingMsgId && (
        <div className="bg-amber-950/50 px-4 py-2 border-t border-amber-500/30 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center space-x-2 font-bold text-amber-300">
            <Edit2 className="w-3.5 h-3.5" />
            <span>Editing message</span>
          </div>
          <button onClick={handleCancelEdit} className="text-slate-400 hover:text-white p-1 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Slash Command Suggestions Popover Deck */}
      {showSlashSuggestions && matchingSlashCommands.length > 0 && (
        <div className="absolute bottom-16 left-3 right-3 z-30 glass-card rounded-2xl border border-indigo-500/40 bg-slate-900/95 shadow-2xl p-2 animate-fadeIn space-y-1 max-h-56 overflow-y-auto">
          <div className="px-2.5 py-1.5 flex justify-between items-center text-[10px] uppercase font-bold text-indigo-300 border-b border-white/10">
            <span className="flex items-center space-x-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Slash Commands</span>
            </span>
            <span className="text-slate-400 font-mono">Use ↑↓ & Tab / Enter to select</span>
          </div>

          {matchingSlashCommands.map((cmd, idx) => {
            const isSelected = idx === selectedSlashIndex;
            return (
              <button
                key={cmd.command}
                type="button"
                onClick={() => applySlashCommand(cmd)}
                onMouseEnter={() => setSelectedSlashIndex(idx)}
                className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-indigo-600/90 text-white shadow-md'
                    : 'hover:bg-white/5 text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <span className="text-base shrink-0">{cmd.icon}</span>
                  <div className="overflow-hidden">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold font-mono text-xs text-indigo-200">{cmd.command}</span>
                      <span className="text-[10px] opacity-75 font-mono truncate text-slate-300">{cmd.syntax}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 opacity-90 truncate">{cmd.description}</p>
                  </div>
                </div>

                {isSelected && (
                  <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded text-white shrink-0">
                    Tab / ↵
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Attachment Popover Panel (Stickers, GIFs, Poll Creator, URL) */}
      {showAttachMenu && (
        <div className="p-4 bg-slate-900/95 border-t border-white/10 space-y-3 animate-fadeIn z-20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2 text-xs font-bold">
              <button
                onClick={() => setAttachTab('stickers')}
                className={`px-3 py-1 rounded-lg transition ${
                  attachTab === 'stickers' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Stickers
              </button>
              <button
                onClick={() => setAttachTab('gifs')}
                className={`px-3 py-1 rounded-lg transition ${
                  attachTab === 'gifs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                GIFs
              </button>
              <button
                onClick={() => setAttachTab('polls')}
                className={`px-3 py-1 rounded-lg transition ${
                  attachTab === 'polls' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Polls
              </button>
              <button
                onClick={() => setAttachTab('url')}
                className={`px-3 py-1 rounded-lg transition ${
                  attachTab === 'url' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Image URL
              </button>
            </div>

            <button onClick={() => setShowAttachMenu(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {attachTab === 'stickers' && (
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
          )}

          {attachTab === 'gifs' && (
            <div className="grid grid-cols-3 gap-2">
              {PRESET_GIFS.map((g) => (
                <button
                  key={g.name}
                  onClick={() => handleSendMessage(undefined, g.url)}
                  className="rounded-xl overflow-hidden border border-white/10 hover:border-indigo-400 transition relative group h-16 shadow"
                >
                  <img src={g.url} alt={g.name} className="w-full h-full object-cover" />
                  <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] font-bold text-white opacity-90 group-hover:opacity-100">
                    {g.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {attachTab === 'polls' && (
            <div className="space-y-2 text-xs">
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Poll Question (e.g., What genre next?)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              <div className="space-y-1">
                {pollOptions.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const copy = [...pollOptions];
                      copy[idx] = e.target.value;
                      setPollOptions(copy);
                    }}
                    placeholder={`Option ${idx + 1}`}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                ))}
              </div>

              <div className="flex justify-between items-center pt-1">
                {pollOptions.length < 4 && (
                  <button
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    + Add Option
                  </button>
                )}

                <button
                  onClick={handleCreatePoll}
                  disabled={!pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow transition ml-auto"
                >
                  Create Poll
                </button>
              </div>
            </div>
          )}

          {attachTab === 'url' && (
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
          )}
        </div>
      )}

      {/* Voice Recording Overlay */}
      {isRecording ? (
        <div className="p-3 bg-rose-950/80 border-t border-rose-500/40 flex items-center justify-between animate-pulse shrink-0">
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
        <form onSubmit={handleSendMessage} className="p-3 bg-slate-900/80 border-t border-white/10 flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`p-2 rounded-xl transition ${
              showAttachMenu ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Attach Image / Poll / GIF"
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
              ref={inputRef}
              type="text"
              value={editingMsgId ? editingText : inputText}
              onChange={(e) => (editingMsgId ? setEditingText(e.target.value) : handleInputChange(e))}
              onKeyDown={handleInputKeyDown}
              placeholder={editingMsgId ? 'Edit message...' : 'Type message or /poll, /8ball, /dice...'}
              className={`w-full bg-white/5 border rounded-xl pl-4 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition ${
                editingMsgId ? 'border-amber-500/60 focus:border-amber-400' : 'border-white/10 focus:border-indigo-500'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() && !editingText.trim() && !imageUrlInput.trim()}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 disabled:opacity-40 text-white flex items-center justify-center shadow-lg transition transform active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Expanded Image Lightbox Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setShowImageModal(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85dvh] overflow-hidden rounded-2xl border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImageModal(null)}
              className="absolute top-3 right-3 p-2.5 bg-black/70 text-white rounded-full hover:bg-black transition z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={showImageModal} alt="Expanded preview" className="w-full h-full object-contain max-h-[80dvh]" />
          </div>
        </div>
      )}
    </div>
  );
};
