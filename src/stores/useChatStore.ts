import { create } from 'zustand';
import type { ChatMessage } from '../types';

interface ChatState {
  messages: ChatMessage[];
  typingUsers: Record<string, string>;
  replyingTo: ChatMessage | null;

  // Actions
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  deleteMessage: (msgId: string) => void;
  addReaction: (msgId: string, emoji: string, userId: string) => void;
  votePollOption: (msgId: string, optionIndex: number, userId: string) => void;
  togglePinMessage: (msgId: string) => void;
  setTypingUser: (userId: string, name: string, isTyping: boolean) => void;
  setReplyingTo: (msg: ChatMessage | null) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  typingUsers: {},
  replyingTo: null,

  addMessage: (msg) => {
    const messages = get().messages;
    if (messages.some((m) => m.id === msg.id)) return;
    set({ messages: [...messages, msg] });
  },

  setMessages: (messages) => set({ messages }),

  deleteMessage: (msgId) => {
    set({ messages: get().messages.filter((m) => m.id !== msgId) });
  },

  addReaction: (msgId, emoji, userId) => {
    const messages = get().messages.map((msg) => {
      if (msg.id !== msgId) return msg;

      const reactions = { ...msg.reactions };
      const currentUsers = reactions[emoji] || [];

      if (currentUsers.includes(userId)) {
        reactions[emoji] = currentUsers.filter((id) => id !== userId);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      } else {
        reactions[emoji] = [...currentUsers, userId];
      }

      return { ...msg, reactions };
    });

    set({ messages });
  },

  votePollOption: (msgId, optionIndex, userId) => {
    const messages = get().messages.map((msg) => {
      if (msg.id !== msgId || !msg.poll) return msg;

      const updatedOptions = msg.poll.options.map((opt, idx) => {
        // Toggle user vote on selected option, remove from others
        let votes = [...opt.votes];
        if (idx === optionIndex) {
          if (votes.includes(userId)) {
            votes = votes.filter((id) => id !== userId);
          } else {
            votes.push(userId);
          }
        } else {
          votes = votes.filter((id) => id !== userId);
        }
        return { ...opt, votes };
      });

      return {
        ...msg,
        poll: {
          ...msg.poll,
          options: updatedOptions,
        },
      };
    });

    set({ messages });
  },

  togglePinMessage: (msgId) => {
    const messages = get().messages.map((msg) => {
      if (msg.id !== msgId) return msg;
      return { ...msg, isPinned: !msg.isPinned };
    });
    set({ messages });
  },

  setTypingUser: (userId, name, isTyping) => {
    const current = { ...get().typingUsers };
    if (isTyping) {
      current[userId] = name;
    } else {
      delete current[userId];
    }
    set({ typingUsers: current });
  },

  setReplyingTo: (msg) => set({ replyingTo: msg }),

  clearChat: () => set({ messages: [], typingUsers: {}, replyingTo: null }),
}));

