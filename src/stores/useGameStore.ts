import { create } from 'zustand';
import type { GameType, TicTacToeState, RPSState, ConnectFourState, TriviaState } from '../types';

interface GameStoreState {
  activeGame: GameType;
  ticTacToe: TicTacToeState;
  rps: RPSState;
  connectFour: ConnectFourState;
  trivia: TriviaState;

  // Actions
  setActiveGame: (game: GameType) => void;
  updateTicTacToe: (updates: Partial<TicTacToeState>) => void;
  resetTicTacToe: (firstTurnUser?: string) => void;

  updateRPS: (updates: Partial<RPSState>) => void;
  resetRPS: () => void;

  updateConnectFour: (updates: Partial<ConnectFourState>) => void;
  resetConnectFour: (firstTurnUser?: string) => void;

  updateTrivia: (updates: Partial<TriviaState>) => void;
  resetTrivia: () => void;
}

const initialTTT: TicTacToeState = {
  board: Array(9).fill(null),
  turn: '',
  winner: null,
  winningLine: null,
  scores: {},
};

const initialRPS: RPSState = {
  choices: {},
  winner: null,
  round: 1,
  scores: {},
};

const initialConnectFour: ConnectFourState = {
  board: Array(6).fill(null).map(() => Array(7).fill(null)),
  turn: '',
  winner: null,
  scores: {},
};

const initialTrivia: TriviaState = {
  currentQIndex: 0,
  scores: {},
  streaks: {},
  gameFinished: false,
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  activeGame: 'none',
  ticTacToe: initialTTT,
  rps: initialRPS,
  connectFour: initialConnectFour,
  trivia: initialTrivia,

  setActiveGame: (game) => set({ activeGame: game }),

  updateTicTacToe: (updates) => {
    set({ ticTacToe: { ...get().ticTacToe, ...updates } });
  },

  resetTicTacToe: (firstTurnUser) => {
    set({
      ticTacToe: {
        ...initialTTT,
        scores: get().ticTacToe.scores,
        turn: firstTurnUser || get().ticTacToe.turn,
      },
    });
  },

  updateRPS: (updates) => {
    set({ rps: { ...get().rps, ...updates } });
  },

  resetRPS: () => {
    set({
      rps: {
        ...initialRPS,
        scores: get().rps.scores,
      },
    });
  },

  updateConnectFour: (updates) => {
    set({ connectFour: { ...get().connectFour, ...updates } });
  },

  resetConnectFour: (firstTurnUser) => {
    set({
      connectFour: {
        ...initialConnectFour,
        scores: get().connectFour.scores,
        turn: firstTurnUser || get().connectFour.turn,
      },
    });
  },

  updateTrivia: (updates) => {
    set({ trivia: { ...get().trivia, ...updates } });
  },

  resetTrivia: () => {
    set({
      trivia: initialTrivia,
    });
  },
}));

