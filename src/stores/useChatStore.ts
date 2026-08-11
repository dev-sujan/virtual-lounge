import { create } from 'zustand';
import type { ChatMessage } from '../types';

interface ChatState {
  messages: ChatMessage[];
  typingUsers: Record<string, string>;
  replyingTo: ChatMessage | null;
  isVanishMode: boolean;

  // Actions
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  deleteMessage: (msgId: string) => void;
  editMessage: (msgId: string, newText: string) => void;
  unsendMessage: (msgId: string) => void;
  markMessagesRead: (userId: string) => void;
  addReaction: (msgId: string, emoji: string, userId: string) => void;
  votePollOption: (msgId: string, optionIndex: number, userId: string) => void;
  togglePinMessage: (msgId: string) => void;
  setTypingUser: (userId: string, name: string, isTyping: boolean) => void;
  setReplyingTo: (msg: ChatMessage | null) => void;
  toggleVanishMode: (enabled?: boolean) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  typingUsers: {},
  replyingTo: null,
  isVanishMode: false,

  addMessage: (msg) => {
    const messages = get().messages;
    if (messages.some((m) => m.id === msg.id)) return;
    set({ messages: [...messages, msg] });

    // Handle Vanish Mode self-destruct timer
    if (msg.isVanish && msg.vanishSeconds) {
      setTimeout(() => {
        get().deleteMessage(msg.id);
      }, (msg.vanishSeconds || 10) * 1000);
    }
  },

  setMessages: (messages) => set({ messages }),

  deleteMessage: (msgId) => {
    set({ messages: get().messages.filter((m) => m.id !== msgId) });
  },

  editMessage: (msgId, newText) => {
    const messages = get().messages.map((m) => {
      if (m.id !== msgId) return m;
      return {
        ...m,
        text: newText,
        isEdited: true,
        editedAt: Date.now(),
      };
    });
    set({ messages });
  },

  unsendMessage: (msgId) => {
    const messages = get().messages.map((m) => {
      if (m.id !== msgId) return m;
      return {
        ...m,
        text: '🚫 This message was unsent',
        imageUrl: undefined,
        audioUrl: undefined,
        poll: undefined,
        isUnsent: true,
      };
    });
    set({ messages });
  },

  markMessagesRead: (userId) => {
    const messages = get().messages.map((m) => {
      const readBy = m.readBy || [];
      if (readBy.includes(userId)) return m;
      return {
        ...m,
        readBy: [...readBy, userId],
      };
    });
    set({ messages });
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

  toggleVanishMode: (enabled) => set({ isVanishMode: enabled !== undefined ? enabled : !get().isVanishMode }),

  clearChat: () => set({ messages: [], typingUsers: {}, replyingTo: null }),
}));
