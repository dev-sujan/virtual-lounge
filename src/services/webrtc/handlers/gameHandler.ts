import { useGameStore } from '../../../stores/useGameStore';
import type { SyncMessageHandler } from './types';

export const handleGameStateChange: SyncMessageHandler = (payload, _senderId, _ctx) => {
  const { activeGame, gameType, state } = payload;
  const gameStore = useGameStore.getState();
  if (activeGame !== undefined) {
    gameStore.setActiveGame(activeGame);
  }
  if (gameType === 'tictactoe' && state) {
    gameStore.updateTicTacToe(state);
  } else if (gameType === 'rps' && state) {
    gameStore.updateRPS(state);
  } else if (gameType === 'connectfour' && state) {
    gameStore.updateConnectFour(state);
  } else if (gameType === 'trivia' && state) {
    gameStore.updateTrivia(state);
  }
};
