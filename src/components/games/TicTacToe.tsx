import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { peerService } from '../../services/webrtc/peerService';
import confetti from 'canvas-confetti';
import { playVictorySound } from '../../utils/soundUtils';
import { RefreshCw } from 'lucide-react';


const WINNING_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const TicTacToe: React.FC = () => {
  const { ticTacToe, updateTicTacToe, resetTicTacToe } = useGameStore();
  const { currentUser, peers } = useRoomStore();

  const otherPeer = peers.find((p) => p.id !== currentUser?.id);
  const hostPeer = peers.find((p) => p.isHost);
  const isPlayer1 = currentUser?.isHost
    ? true
    : hostPeer
    ? false
    : otherPeer && currentUser
    ? currentUser.id < otherPeer.id
    : true;
  const symbol = isPlayer1 ? 'X' : 'O';
  const player1Id = isPlayer1 ? currentUser?.id : otherPeer?.id;
  const player2Id = isPlayer1 ? otherPeer?.id : currentUser?.id;

  const currentTurn = ticTacToe.turn || player1Id || currentUser?.id;
  const isMyTurn = currentTurn === currentUser?.id;

  const handleCellClick = (index: number) => {
    if (!currentUser || ticTacToe.board[index] || ticTacToe.winner || !isMyTurn) return;

    const newBoard = [...ticTacToe.board];
    newBoard[index] = symbol;

    let winner: string | null = null;
    let winningLine: number[] | null = null;

    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        winner = currentUser.id;
        winningLine = combo;
        playVictorySound();
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        break;
      }
    }

    if (!winner && newBoard.every((cell) => cell !== null)) {
      winner = 'draw';
    }

    const nextTurn = currentTurn === player1Id ? (player2Id || player1Id) : player1Id;

    const newScores = { ...ticTacToe.scores };
    if (winner && winner !== 'draw') {
      newScores[winner] = (newScores[winner] || 0) + 1;
    }

    const newState = {
      board: newBoard,
      turn: nextTurn,
      winner,
      winningLine,
      scores: newScores,
    };

    updateTicTacToe(newState);
    peerService.broadcast('GAME_STATE_CHANGE', {
      gameType: 'tictactoe',
      state: newState,
    });
  };

  const handleRestart = () => {
    const firstTurn = player1Id || currentUser?.id;
    resetTicTacToe(firstTurn);
    peerService.broadcast('GAME_STATE_CHANGE', {
      gameType: 'tictactoe',
      state: { board: Array(9).fill(null), winner: null, winningLine: null, turn: firstTurn },
    });
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col items-center space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-1">Tic-Tac-Toe</h3>
        <p className="text-xs text-slate-400">
          {ticTacToe.winner
            ? ticTacToe.winner === 'draw'
              ? '🤝 Game Draw!'
              : ticTacToe.winner === currentUser?.id
              ? '🎉 You Won!'
              : '🏆 Opponent Won!'
            : isMyTurn
            ? '🎯 Your Turn to Move'
            : '⏳ Waiting for Opponent move...'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 w-64 h-64 bg-slate-900/60 p-3 rounded-2xl border border-white/10 shadow-inner">
        {ticTacToe.board.map((cell, idx) => {
          const isWinningCell = ticTacToe.winningLine?.includes(idx);

          return (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              disabled={!!cell || !!ticTacToe.winner || !isMyTurn}
              className={`rounded-xl text-3xl font-extrabold flex items-center justify-center transition-all transform active:scale-95 ${
                isWinningCell
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg scale-105'
                  : cell === 'X'
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : cell === 'O'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-white/5 hover:bg-white/10 border border-white/5 text-transparent'
              }`}
            >
              {cell}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleRestart}
        className="glow-btn bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-4 py-2 rounded-xl flex items-center space-x-2 border border-white/10"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>New Match</span>
      </button>
    </div>
  );
};
