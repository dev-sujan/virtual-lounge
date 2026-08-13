import type { SyncEventType } from '../../../types';
import type { SyncMessageHandler, SyncMessageContext } from './types';

import * as chatHandlers from './chatHandler';
import * as musicHandlers from './musicHandler';
import * as gameHandlers from './gameHandler';
import * as roomHandlers from './roomHandler';

const handlers = new Map<SyncEventType, SyncMessageHandler>([
  ['CHAT_MESSAGE', chatHandlers.handleChatMessage],
  ['CHAT_REACTION', chatHandlers.handleChatReaction],
  ['CHAT_POLL_VOTE', chatHandlers.handleChatPollVote],
  ['CHAT_PIN_TOGGLE', chatHandlers.handleChatPinToggle],
  ['CHAT_DELETE', chatHandlers.handleChatDelete],
  ['CHAT_EDIT', chatHandlers.handleChatEdit],
  ['CHAT_UNSEND', chatHandlers.handleChatUnsend],
  ['CHAT_READ_RECEIPT', chatHandlers.handleChatReadReceipt],
  ['VANISH_MODE_TOGGLE', chatHandlers.handleVanishModeToggle],
  ['TYPING_INDICATOR', chatHandlers.handleTypingIndicator],

  ['PLAYBACK_CHANGE', musicHandlers.handlePlaybackChange],
  ['QUEUE_CHANGE', musicHandlers.handleQueueChange],
  ['SKIP_VOTE_CHANGE', musicHandlers.handleSkipVoteChange],
  ['MUSIC_REACTION', musicHandlers.handleMusicReaction],
  ['DJ_SOUND_FX', musicHandlers.handleDjSoundFx],

  ['GAME_STATE_CHANGE', gameHandlers.handleGameStateChange],

  ['PING', roomHandlers.handlePing],
  ['PONG', roomHandlers.handlePong],
  ['JOIN_REQUEST', roomHandlers.handleJoinRequest],
  ['HOST_ANNOUNCE', roomHandlers.handleHostAnnounce],
  ['ROOM_STATE_SYNC', roomHandlers.handleRoomStateSync],
  ['JOIN_RESPONSE', roomHandlers.handleJoinResponse],
  ['PEER_PRESENCE_UPDATE', roomHandlers.handlePeerPresenceUpdate],
  ['MEDIA_STATUS_CHANGE', roomHandlers.handleMediaStatusChange],
  ['PULL_PEER_STREAM', roomHandlers.handlePullPeerStream],
  ['LEAVE_ROOM', roomHandlers.handleLeaveRoom],
]);

export const dispatchMessage = async (
  type: SyncEventType,
  payload: any,
  senderId: string,
  ctx: SyncMessageContext
): Promise<void> => {
  const handler = handlers.get(type);
  if (handler) {
    await handler(payload, senderId, ctx);
  } else {
    console.warn(`[P2P] No handler registered for event type: ${type}`);
  }
};
