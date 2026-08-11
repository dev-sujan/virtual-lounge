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
    }
    setIsRestored(true);
  }, []);

  return { isRestored };
}
