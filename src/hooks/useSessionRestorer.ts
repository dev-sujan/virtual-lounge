import { useEffect, useState } from 'react';
import { getSessionFromStorage } from '../utils/roomUtils';
import { useRoomStore } from '../stores/useRoomStore';

export function useSessionRestorer() {
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    const session = getSessionFromStorage();
    if (session && session.roomId && session.user) {
      useRoomStore.getState().setRoomSession(
        session.roomId,
        session.passwordHash,
        session.user,
        session.user.isHost
      );
      if (session.peers && Array.isArray(session.peers) && session.peers.length > 0) {
        useRoomStore.getState().setPeers(session.peers);
      }
    }
    setIsRestored(true);
  }, []);

  return { isRestored };
}
