import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { peerService } from '../../services/webrtc/peerService';
import confetti from 'canvas-confetti';
import { RefreshCw } from 'lucide-react';

export const ConnectFour: React.FC = () => {
  const { connectFour, updateConnectFour, resetConnectFour } = useGameStore();
  const { currentUser, peers } = useRoomStore();

  const opponent = peers[0];
  const isMyTurn = connectFour.turn === currentUser?.id || !connectFour.turn;

  const handleDrop = (colIndex: number) => {
    if (!currentUser || connectFour.winner || !isMyTurn) return;

    // Find lowest available row in column
    let targetRow = -1;
    for (let r = 5; r >= 0; r--) {
      if (!connectFour.board[r][colIndex]) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) return; // Column full

    const color = currentUser.isHost ? 'RED' : 'YELLOW';
    const newBoard = connectFour.board.map((row) => [...row]);
    newBoard[targetRow][colIndex] = color;

    // Check winner
    let winner: string | null = null;
    if (checkConnect4Win(newBoard, color)) {
      winner = currentUser.id;
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 } });
    }

    const nextTurn = opponent ? opponent.id : currentUser.id;

    const newState = {
      board: newBoard,
      turn: nextTurn,
      winner,
    };

    updateConnectFour(newState);
    peerService.broadcast('GAME_STATE_CHANGE', {
      gameType: 'connectfour',
      state: newState,
    });
  };

  const checkConnect4Win = (board: (string | null)[][], color: string): boolean => {
    // Horizontal, Vertical, Diagonal checks
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        if (board[r][c] === color) {
          if (c + 3 < 7 && board[r][c + 1] === color && board[r][c + 2] === color && board[r][c + 3] === color) return true;
          if (r + 3 < 6 && board[r + 1][c] === color && board[r + 2][c] === color && board[r + 3][c] === color) return true;
          if (r + 3 < 6 && c + 3 < 7 && board[r + 1][c + 1] === color && board[r + 2][c + 2] === color && board[r + 3][c + 3] === color) return true;
          if (r - 3 >= 0 && c + 3 < 7 && board[r - 1][c + 1] === color && board[r - 2][c + 2] === color && board[r - 3][c + 3] === color) return true;
        }
      }
    }
    return false;
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col items-center space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-1">Connect Four</h3>
        <p className="text-xs text-slate-400">
          {connectFour.winner
            ? connectFour.winner === currentUser?.id
              ? '🎉 You Won Connect Four!'
              : '🏆 Opponent Won!'
            : isMyTurn
            ? '🎯 Drop your token'
            : '⏳ Opponent drop turn...'}
        </p>
      </div>

      {/* Board */}
      <div className="bg-indigo-950 p-3 rounded-2xl border border-indigo-500/30 shadow-2xl flex flex-col space-y-2">
        {connectFour.board.map((row, rIdx) => (
          <div key={rIdx} className="flex space-x-2">
            {row.map((cell, cIdx) => (
              <button
                key={cIdx}
                onClick={() => handleDrop(cIdx)}
                disabled={!!connectFour.winner || !isMyTurn}
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full transition-all border ${
                  cell === 'RED'
                    ? 'bg-rose-500 border-rose-400 shadow-lg scale-95'
                    : cell === 'YELLOW'
                    ? 'bg-amber-400 border-amber-300 shadow-lg scale-95'
                    : 'bg-slate-900/90 border-slate-700 hover:bg-slate-800'
                }`}
              />
            ))}
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          resetConnectFour(currentUser?.id);
          peerService.broadcast('GAME_STATE_CHANGE', {
            gameType: 'connectfour',
            state: { board: Array(6).fill(null).map(() => Array(7).fill(null)), winner: null },
          });
        }}
        className="glow-btn bg-white/10 text-white text-xs font-medium px-4 py-2 rounded-xl flex items-center space-x-2"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>New Match</span>
      </button>
    </div>
  );
};
