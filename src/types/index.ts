export interface User {
  id: string;
  displayName: string;
  avatarColor: string;
  isHost: boolean;
  isMicOn: boolean;
  isCameraOn: boolean;
  joinedAt: number;
  pingMs?: number;
  vibeStatus?: string;
}

export interface RoomSession {
  roomId: string;
  passwordHash: string; // Plain password or hash for P2P authentication
  userId: string;
  user: User;
  peers?: User[];
  createdAt: number;
}

export interface QueueItem {
  id: string;
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  duration: number; // in seconds
  addedBy: {
    id: string;
    name: string;
    avatarColor: string;
  };
  votes: string[]; // array of user IDs who upvoted
  downvotes: string[]; // array of user IDs who downvoted
  priority: number;
  addedAt: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  lastUpdated: number;
  updatedBy: string;
  volume: number; // 0 to 100
  isMuted: boolean;
  playbackRate: number;
}

export type RepeatMode = 'off' | 'one' | 'all';

export interface ChatReaction {
  emoji: string;
  users: string[]; // User IDs
}

export interface ChatPollOption {
  text: string;
  votes: string[]; // User IDs
}

export interface ChatPoll {
  question: string;
  options: ChatPollOption[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarColor: string;
  text: string;
  timestamp: number;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  reactions: Record<string, string[]>; // emoji -> array of user IDs
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  attachmentType?: 'image' | 'audio' | 'sticker' | 'poll';
  poll?: ChatPoll;
  isPinned?: boolean;
  isSystem?: boolean;
  readBy?: string[]; // Array of user IDs who have read this message
  isEdited?: boolean;
  editedAt?: number;
  isUnsent?: boolean;
  isVanish?: boolean;
  vanishSeconds?: number;
}

// Game Types
export type GameType = 'none' | 'tictactoe' | 'rps' | 'connectfour' | 'trivia';


export interface TicTacToeState {
  board: (string | null)[]; // 9 cells
  turn: string; // userId
  winner: string | null; // userId or 'draw' or null
  winningLine: number[] | null;
  scores: Record<string, number>;
}

export interface RPSChoice {
  userId: string;
  choice: 'rock' | 'paper' | 'scissors' | null;
}

export interface RPSState {
  choices: Record<string, 'rock' | 'paper' | 'scissors' | null>;
  winner: string | null; // userId or 'draw' or null
  round: number;
  scores: Record<string, number>;
}

export interface ConnectFourState {
  board: (string | null)[][]; // 6 rows x 7 cols
  turn: string;
  winner: string | null;
  scores: Record<string, number>;
}

// P2P Event Messages over WebRTC DataChannel / BroadcastChannel
export type SyncEventType =
  | 'JOIN_REQUEST'
  | 'JOIN_RESPONSE'
  | 'PEER_PRESENCE_UPDATE'
  | 'PLAYBACK_CHANGE'
  | 'QUEUE_CHANGE'
  | 'CHAT_MESSAGE'
  | 'CHAT_REACTION'
  | 'CHAT_DELETE'
  | 'CHAT_EDIT'
  | 'CHAT_READ_RECEIPT'
  | 'CHAT_UNSEND'
  | 'VANISH_MODE_TOGGLE'
  | 'CHAT_POLL_VOTE'
  | 'CHAT_PIN_TOGGLE'
  | 'TYPING_INDICATOR'
  | 'GAME_STATE_CHANGE'
  | 'MEDIA_STATUS_CHANGE'
  | 'FULL_STATE_SYNC'
  | 'LEAVE_ROOM'
  | 'MUSIC_REACTION'
  | 'SKIP_VOTE_CHANGE'
  | 'REQUEST_MEDIA_STREAM'
  | 'PULL_PEER_STREAM'
  | 'ROOM_STATE_SYNC'
  | 'HOST_ANNOUNCE'
  | 'PING'
  | 'PONG';



export interface SyncMessagePayload {
  type: SyncEventType;
  senderId: string;
  timestamp: number;
  payload: any;
}


