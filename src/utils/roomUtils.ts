import type { RoomSession } from '../types';

const SESSION_KEY = 'synclounge_session_v1';

export function getRandomBytes(size: number): Uint8Array {
  const array = new Uint8Array(size);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < size; i++) array[i] = Math.floor(Math.random() * 256);
  }
  return array;
}

export function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = getRandomBytes(6);
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(bytes[i] % chars.length);
  }
  return result;
}

export function generatePassword(): string {
  const bytes = getRandomBytes(4);
  const num = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return (100000 + (num % 900000)).toString();
}

export function generateUserId(): string {
  const bytes = getRandomBytes(8);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return 'usr_' + hex;
}

export const AVATAR_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#f43f5e', // Rose
];

export function getRandomAvatarColor(): string {
  const bytes = getRandomBytes(1);
  return AVATAR_COLORS[bytes[0] % AVATAR_COLORS.length];
}

export function saveSessionToStorage(session: RoomSession): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Failed to save session to storage:', err);
  }
}

export function getSessionFromStorage(): RoomSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RoomSession;
  } catch (err) {
    console.error('Failed to read session from storage:', err);
    return null;
  }
}

export function clearSessionStorage(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (err) {
    console.error('Failed to clear session storage:', err);
  }
}

export interface InviteParams {
  roomId: string | null;
  password: string | null;
}

export function parseInviteParams(): InviteParams {
  const hash = window.location.hash.substring(1);
  const search = window.location.search.substring(1);

  const hashParams = new URLSearchParams(hash);
  const searchParams = new URLSearchParams(search);

  let roomId = hashParams.get('room') || searchParams.get('room');
  let password =
    hashParams.get('pwd') ||
    hashParams.get('password') ||
    searchParams.get('pwd') ||
    searchParams.get('password');

  if (!roomId && window.location.hash.includes('room=')) {
    const rMatch = window.location.hash.match(/room=([A-Z0-9]{6})/i);
    if (rMatch) roomId = rMatch[1];
    const pMatch = window.location.hash.match(/(?:pwd|password)=([A-Z0-9]+)/i);
    if (pMatch) password = pMatch[1];
  }

  return {
    roomId: roomId ? roomId.toUpperCase() : null,
    password: password || null,
  };
}

export function buildDirectInviteLink(roomId: string, password: string): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#room=${roomId}&pwd=${password}`;
}
