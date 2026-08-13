import { useChatStore } from '../../../stores/useChatStore';
import { useToastStore } from '../../../stores/useToastStore';
import { useRoomStore } from '../../../stores/useRoomStore';
import { playMessageSound, playReactionSound } from '../../../utils/soundUtils';
import type { SyncMessageHandler } from './types';

export const handleChatMessage: SyncMessageHandler = (payload, _senderId, _ctx) => {
  const { currentUser } = useRoomStore.getState();
  const toastStore = useToastStore.getState();
  
  useChatStore.getState().addMessage(payload);
  playMessageSound();
  if (payload.senderName && payload.senderName !== currentUser?.displayName) {
    toastStore.addToast({
      category: 'info',
      title: `💬 New message from ${payload.senderName}`,
      message: payload.text,
    });
  }
};

export const handleChatReaction: SyncMessageHandler = (payload, _senderId, _ctx) => {
  const { msgId, emoji, userId } = payload;
  useChatStore.getState().addReaction(msgId, emoji, userId);
  playReactionSound();
};

export const handleChatPollVote: SyncMessageHandler = (payload, _senderId, _ctx) => {
  const { msgId, optionIndex, userId } = payload;
  useChatStore.getState().votePollOption(msgId, optionIndex, userId);
};

export const handleChatPinToggle: SyncMessageHandler = (payload, _senderId, _ctx) => {
  const { msgId } = payload;
  useChatStore.getState().togglePinMessage(msgId);
};

export const handleChatDelete: SyncMessageHandler = (payload, _senderId, _ctx) => {
  useChatStore.getState().deleteMessage(payload.msgId);
};

export const handleChatEdit: SyncMessageHandler = (payload, _senderId, _ctx) => {
  const { msgId, newText } = payload;
  useChatStore.getState().editMessage(msgId, newText);
};

export const handleChatUnsend: SyncMessageHandler = (payload, _senderId, _ctx) => {
  const { msgId } = payload;
  useChatStore.getState().unsendMessage(msgId);
};

export const handleChatReadReceipt: SyncMessageHandler = (payload, _senderId, _ctx) => {
  const { userId } = payload;
  useChatStore.getState().markMessagesRead(userId);
};

export const handleVanishModeToggle: SyncMessageHandler = (payload, _senderId, _ctx) => {
  const { enabled } = payload;
  useChatStore.getState().toggleVanishMode(enabled);
};

export const handleTypingIndicator: SyncMessageHandler = (payload, _senderId, _ctx) => {
  const { userId, name, isTyping } = payload;
  useChatStore.getState().setTypingUser(userId, name, isTyping);
};
