import type { RoomSession } from '../types';

const SESSION_KEY = 'synclounge_session_v1';

export function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generatePassword(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateUserId(): string {
  return 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
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
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
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
