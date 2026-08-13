import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../stores/useChatStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { peerService } from '../../services/webrtc/peerService';
import { playSendSound, playReactionSound } from '../../utils/soundUtils';
import type { ChatMessage } from '../../types';
import { Sparkles, ChevronDown } from 'lucide-react';

import { SLASH_COMMANDS_CATALOG, type SlashCommandInfo } from './chatConstants';
import { ChatHeaderBar } from './ChatHeaderBar';
import { MessageBubble } from './MessageBubble';
import { SlashCommandSuggestions } from './SlashCommandSuggestions';
import { AttachmentPickerModal } from './AttachmentPickerModal';
import { PollCreationModal } from './PollCreationModal';
import { ChatInputBar } from './ChatInputBar';
import { ImageLightboxModal } from './ImageLightboxModal';

export const ChatBox: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachTab, setAttachTab] = useState<'stickers' | 'gifs' | 'url'>('stickers');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showImageModal, setShowImageModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'audio' | 'poll' | 'pinned' | 'starred'>('all');
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const [selectedEmojiCat, setSelectedEmojiCat] = useState<string>('🎉 Party & Vibe');

  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const [showSlashSuggestions, setShowSlashSuggestions] = useState(false);
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);

  const [mobileActiveMsgId, setMobileActiveMsgId] = useState<string | null>(null);

  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioPlaybackRate, setAudioPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [starredMsgIds, setStarredMsgIds] = useState<Record<string, boolean>>({});
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const [swipeTranslateMap, setSwipeTranslateMap] = useState<Record<string, number>>({});
  const [doubleTapHeartMap, setDoubleTapHeartMap] = useState<Record<string, boolean>>({});
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ id: string; x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<any>(null);
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);

  const typingTimeoutRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const triggerHaptic = (pattern: number | number[] = 25) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (e) {}
  };

  const handleTouchStart = (e: React.TouchEvent, msg: ChatMessage) => {
    if (msg.isSystem || msg.isUnsent) return;
    const touch = e.touches[0];
    const now = Date.now();
    if (lastTapRef.current && lastTapRef.current.id === msg.id && now - lastTapRef.current.time < 300) {
      clearTimeout(longPressTimerRef.current);
      triggerHaptic([25, 35]);
      handleAddReaction(msg.id, '❤️');
      setDoubleTapHeartMap((prev) => ({ ...prev, [msg.id]: true }));
      setTimeout(() => setDoubleTapHeartMap((prev) => ({ ...prev, [msg.id]: false })), 850);
      lastTapRef.current = null;
      return;
    }
    lastTapRef.current = { id: msg.id, time: now };
    touchStartRef.current = { id: msg.id, x: touch.clientX, y: touch.clientY, time: now };
    longPressTimerRef.current = setTimeout(() => {
      triggerHaptic(45);
      setMobileActiveMsgId(msg.id);
      setShowEmojiPicker(msg.id);
    }, 450);
  };

  const handleTouchMove = (e: React.TouchEvent, msg: ChatMessage) => {
    if (!touchStartRef.current || touchStartRef.current.id !== msg.id) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    if (Math.abs(deltaY) > 8 || Math.abs(deltaX) > 8) clearTimeout(longPressTimerRef.current);
    if (deltaX > 0 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
      const translation = Math.min(deltaX * 0.5, 75);
      setSwipeTranslateMap((prev) => ({ ...prev, [msg.id]: translation }));
    }
  };

  const handleTouchEnd = (msg: ChatMessage) => {
    clearTimeout(longPressTimerRef.current);
    const translation = swipeTranslateMap[msg.id] || 0;
    if (translation >= 35) {
      triggerHaptic(30);
      setReplyingTo(msg);
    }
    setSwipeTranslateMap((prev) => ({ ...prev, [msg.id]: 0 }));
    touchStartRef.current = null;
  };

  const handleCopyMessageText = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerHaptic(20);
  };

  const toggleStarMessage = (msgId: string) => {
    triggerHaptic(20);
    setStarredMsgIds((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const speakMessageText = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleFeedScroll = () => {
    if (!feedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 140;
    setShowScrollBottom(isScrolledUp);
  };

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

  const { currentUser, isHost, peers } = useRoomStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  useEffect(() => {
    if (currentUser) {
      markMessagesRead(currentUser.id);
      peerService.broadcast('CHAT_READ_RECEIPT', { userId: currentUser.id });
    }
  }, [messages.length, currentUser, markMessagesRead]);

  const matchingSlashCommands = inputText.startsWith('/')
    ? SLASH_COMMANDS_CATALOG.filter((c) => c.command.toLowerCase().startsWith(inputText.trim().toLowerCase()))
    : [];

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
      const answers = ['It is certain! 🎱', 'Without a doubt! ✨', 'Ask again later 🔮', 'Cannot predict now 🌫️', 'Don’t count on it ❌', 'My sources say no 🚫', 'Outlook good! 🚀', 'Signs point to yes! ✅'];
      const question = trimmed.replace('/8ball', '').trim();
      const ans = answers[Math.floor(Math.random() * answers.length)];
      return { processedText: `🎱 asked: "${question || 'the future'}" → ${ans}`, isAction: '8ball' };
    }
    if (trimmed.startsWith('/poll')) {
      const matches = trimmed.match(/"([^"]+)"/g);
      if (matches && matches.length >= 3) {
        const q = matches[0].replace(/"/g, '');
        const opts = matches.slice(1).map((m) => m.replace(/"/g, ''));
        return {
          processedText: `📊 Lounge Poll: ${q}`,
          poll: { question: q, options: opts.map((opt) => ({ text: opt, votes: [] })) },
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
    } else setShowSlashSuggestions(false);

    if (!currentUser) return;
    if (!isTypingLocal) {
      setIsTypingLocal(true);
      peerService.broadcast('TYPING_INDICATOR', { userId: currentUser.id, name: currentUser.displayName, isTyping: true });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingLocal(false);
      peerService.broadcast('TYPING_INDICATOR', { userId: currentUser.id, name: currentUser.displayName, isTyping: false });
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
    if (cmd.command === '/poll') {
      setShowPollModal(true);
      setInputText('');
    } else {
      setInputText(cmd.syntax);
    }
    setShowSlashSuggestions(false);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        if (cmd.command !== '/poll') {
          inputRef.current.setSelectionRange(cmd.syntax.length, cmd.syntax.length);
        }
      }
    }, 50);
  };

  const handleSendMessage = (e?: React.FormEvent, customImg?: string, customPoll?: any) => {
    if (e) e.preventDefault();
    if (editingMsgId) {
      handleSaveEdit();
      return;
    }
    const rawText = inputText.trim();
    if (!rawText && !customImg && !imageUrlInput && !customPoll) return;
    if (!currentUser) return;

    let finalPoll = customPoll;
    let processedText = '';
    let isAction: string | undefined;

    if (!customPoll) {
      const res = processSlashCommands(rawText);
      processedText = res.processedText;
      isAction = res.isAction;
      finalPoll = res.poll;
    } else {
      processedText = rawText;
    }

    const finalImg = customImg || (imageUrlInput.trim() ? imageUrlInput.trim() : undefined);

    if (finalPoll && rawText === '/poll') {
      setShowPollModal(true);
      return;
    }

    const newMsg: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderAvatarColor: currentUser.avatarColor,
      text: finalPoll ? `📊 Poll: ${finalPoll.question}` : isAction ? `${currentUser.displayName} ${processedText}` : processedText || (finalImg ? 'Shared an image' : ''),
      timestamp: Date.now(),
      reactions: {},
      imageUrl: finalImg,
      attachmentType: finalPoll ? 'poll' : finalImg ? 'image' : undefined,
      poll: finalPoll,
      isSystem: !!isAction,
      readBy: [currentUser.id],
      isVanish: isVanishMode,
      vanishSeconds: isVanishMode ? 10 : undefined,
      replyTo: replyingTo ? { id: replyingTo.id, senderName: replyingTo.senderName, text: replyingTo.text } : undefined,
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
      peerService.broadcast('TYPING_INDICATOR', { userId: currentUser.id, name: currentUser.displayName, isTyping: false });
    }
  };

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMsgId(msg.id);
    setEditingText(msg.text);
    setInputText(msg.text);
    if (inputRef.current) inputRef.current.focus();
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
    const pollData = { question: pollQuestion.trim(), options: validOpts.map((text) => ({ text, votes: [] })) };
    handleSendMessage(undefined, undefined, pollData);
    setPollQuestion('');
    setPollOptions(['', '']);
    setShowPollModal(false);
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => sendVoiceNote(reader.result as string, recordingSeconds);
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((prev) => prev + 1), 1000);
    } catch (err) { alert('Microphone permission is required to record voice notes.'); }
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
    if (activeAudioRef.current) activeAudioRef.current.pause();
    const audio = new Audio(audioUrl);
    audio.playbackRate = audioPlaybackRate;
    activeAudioRef.current = audio;
    setPlayingAudioId(msgId);
    audio.play().catch(() => setPlayingAudioId(null));
    audio.onended = () => setPlayingAudioId(null);
  };

  const cycleAudioPlaybackRate = () => {
    const next = audioPlaybackRate === 1 ? 1.5 : audioPlaybackRate === 1.5 ? 2 : 1;
    setAudioPlaybackRate(next);
    if (activeAudioRef.current) activeAudioRef.current.playbackRate = next;
  };

  const handleAddReaction = (msgId: string, emoji: string) => {
    if (!currentUser) return;
    addReaction(msgId, emoji, currentUser.id);
    peerService.broadcast('CHAT_REACTION', { msgId, emoji, userId: currentUser.id });
    playReactionSound();
    setShowEmojiPicker(null);
    setMobileActiveMsgId(null);
  };

  const handleDelete = (msgId: string) => {
    deleteMessage(msgId);
    peerService.broadcast('CHAT_DELETE', { msgId });
  };

  const exportChatHistory = () => {
    const chatText = messages.map((m) => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.senderName}: ${m.text}`).join('\n');
    const blob = new Blob([chatText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SyncLounge-Chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderFormattedContent = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return (
      <span>
        {parts.map((part, idx) => {
          if (part.match(urlRegex)) {
            return (
              <a key={idx} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:text-indigo-100 underline break-all font-mono" onClick={(e) => e.stopPropagation()}>
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
  const activeTypingNames = Object.values(typingUsers).filter((name) => name !== currentUser?.displayName);

  let filteredMessages = messages;
  if (isSearching && searchQuery.trim()) {
    filteredMessages = filteredMessages.filter((m) => m.text.toLowerCase().includes(searchQuery.toLowerCase()) || m.senderName.toLowerCase().includes(searchQuery.toLowerCase()));
  }
  if (mediaFilter !== 'all') {
    if (mediaFilter === 'image') filteredMessages = filteredMessages.filter((m) => m.imageUrl);
    else if (mediaFilter === 'audio') filteredMessages = filteredMessages.filter((m) => m.audioUrl);
    else if (mediaFilter === 'poll') filteredMessages = filteredMessages.filter((m) => m.poll);
    else if (mediaFilter === 'pinned') filteredMessages = filteredMessages.filter((m) => m.isPinned);
    else if (mediaFilter === 'starred') filteredMessages = filteredMessages.filter((m) => starredMsgIds[m.id]);
  }

  // Effect to handle manual trigger of PollCreationModal from attachments tab
  useEffect(() => {
    if (inputText.trim() === '/poll' || inputText.trim() === '/poll ') {
      // Allow user to use it if they type it, but handled in handleSendMessage above.
    }
  }, [inputText]);

  return (
    <div className={`glass-card rounded-2xl border transition-all flex flex-col h-[580px] max-h-[85vh] shadow-2xl overflow-hidden relative ${isVanishMode ? 'border-purple-500/50 shadow-purple-500/20' : 'border-white/10'}`}>
      <ChatHeaderBar
        messages={messages}
        isVanishMode={isVanishMode}
        onToggleVanish={handleToggleVanish}
        isSearching={isSearching}
        setIsSearching={setIsSearching}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onExport={exportChatHistory}
        isHost={isHost}
        onClearChat={clearChat}
        mediaFilter={mediaFilter}
        setMediaFilter={setMediaFilter}
        pinnedMessages={pinnedMessages}
        starredMsgIds={starredMsgIds}
      />

      <div ref={feedRef} onScroll={handleFeedScroll} className="flex-1 overflow-y-auto p-3 space-y-2 relative">
        {(showEmojiPicker || mobileActiveMsgId) && (
          <div className="fixed inset-0 z-10 bg-black/20 cursor-pointer" onClick={() => { setShowEmojiPicker(null); setMobileActiveMsgId(null); }} />
        )}
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
            <Sparkles className="w-8 h-8 text-indigo-400 mb-2 animate-pulse" />
            <h4 className="font-bold text-white text-sm">{isSearching ? 'No messages match your search' : 'Private Social Lounge Chat'}</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              {isSearching ? 'Try searching with a different keyword or username.' : 'Send text, emojis, image links, voice notes, live polls (/poll), or commands (/8ball, /dice).'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg, msgIndex) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              msgIndex={msgIndex}
              currentUser={currentUser}
              peers={peers}
              isHost={isHost}
              mobileActiveMsgId={mobileActiveMsgId}
              setMobileActiveMsgId={setMobileActiveMsgId}
              showEmojiPicker={showEmojiPicker}
              setShowEmojiPicker={setShowEmojiPicker}
              selectedEmojiCat={selectedEmojiCat}
              setSelectedEmojiCat={setSelectedEmojiCat}
              swipeTranslateMap={swipeTranslateMap}
              doubleTapHeartMap={doubleTapHeartMap}
              starredMsgIds={starredMsgIds}
              speakingMsgId={speakingMsgId}
              playingAudioId={playingAudioId}
              audioPlaybackRate={audioPlaybackRate}
              handleTouchStart={handleTouchStart}
              handleTouchMove={handleTouchMove}
              handleTouchEnd={handleTouchEnd}
              handleAddReaction={handleAddReaction}
              setReplyingTo={setReplyingTo}
              handleCopyMessageText={handleCopyMessageText}
              speakMessageText={speakMessageText}
              toggleStarMessage={toggleStarMessage}
              handleStartEdit={handleStartEdit}
              handleUnsend={handleUnsend}
              handleTogglePin={handleTogglePin}
              handleDelete={handleDelete}
              setShowImageModal={setShowImageModal}
              togglePlayAudio={togglePlayAudio}
              cycleAudioPlaybackRate={cycleAudioPlaybackRate}
              handleVotePoll={handleVotePoll}
              renderFormattedContent={renderFormattedContent}
              formatTimestamp={formatTimestamp}
            />
          ))
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {activeTypingNames.length > 0 && (
        <div className="px-4 py-1 text-xs text-indigo-300 italic bg-slate-900/40 flex items-center space-x-1.5 shrink-0 z-10">
          <div className="flex space-x-1"><span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" /></div>
          <span>{activeTypingNames.join(', ')} {activeTypingNames.length > 1 ? 'are' : 'is'} typing...</span>
        </div>
      )}

      {showScrollBottom && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 animate-fadeIn pointer-events-auto">
          <button
            onClick={() => { triggerHaptic(20); messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
            className="bg-indigo-600/95 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-full shadow-2xl flex items-center space-x-1.5 border border-white/25 transition transform active:scale-95 hover:scale-105 backdrop-blur-md"
          >
            <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
            <span className="text-[11px] font-bold tracking-wide">Latest Messages</span>
          </button>
        </div>
      )}

      {showSlashSuggestions && matchingSlashCommands.length > 0 && (
        <SlashCommandSuggestions
          commands={matchingSlashCommands}
          selectedIndex={selectedSlashIndex}
          onSelectCommand={applySlashCommand}
          onHoverCommand={setSelectedSlashIndex}
        />
      )}

      {showAttachMenu && (
        <AttachmentPickerModal
          attachTab={attachTab}
          setAttachTab={setAttachTab}
          onClose={() => setShowAttachMenu(false)}
          onSendAttachment={(url) => handleSendMessage(undefined, url)}
          imageUrlInput={imageUrlInput}
          setImageUrlInput={setImageUrlInput}
          onSendImageUrl={() => handleSendMessage()}
          onShowPolls={() => {
            setShowAttachMenu(false);
            setShowPollModal(true);
          }}
        />
      )}

      <PollCreationModal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        pollQuestion={pollQuestion}
        setPollQuestion={setPollQuestion}
        pollOptions={pollOptions}
        setPollOptions={setPollOptions}
        onCreatePoll={handleCreatePoll}
      />

      <ChatInputBar
        inputText={inputText}
        setInputText={setInputText}
        editingMsgId={editingMsgId}
        editingText={editingText}
        setEditingText={setEditingText}
        handleInputChange={handleInputChange}
        handleInputKeyDown={handleInputKeyDown}
        handleSendMessage={handleSendMessage}
        showAttachMenu={showAttachMenu}
        setShowAttachMenu={setShowAttachMenu}
        startRecording={startRecording}
        cancelRecording={cancelRecording}
        stopRecording={stopRecording}
        isRecording={isRecording}
        recordingSeconds={recordingSeconds}
        inputRef={inputRef}
        imageUrlInput={imageUrlInput}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        handleCancelEdit={handleCancelEdit}
      />

      {showImageModal && (
        <ImageLightboxModal imageUrl={showImageModal} onClose={() => setShowImageModal(null)} />
      )}
    </div>
  );
};
