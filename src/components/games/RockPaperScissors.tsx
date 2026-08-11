import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { peerService } from '../../services/webrtc/peerService';
import confetti from 'canvas-confetti';
import { RefreshCw } from 'lucide-react';

type Choice = 'rock' | 'paper' | 'scissors';

const CHOICES: { id: Choice; label: string; icon: string }[] = [
  { id: 'rock', label: 'Rock', icon: '🪨' },
  { id: 'paper', label: 'Paper', icon: '📄' },
  { id: 'scissors', label: 'Scissors', icon: '✂️' },
];

export const RockPaperScissors: React.FC = () => {
  const { rps, updateRPS } = useGameStore();
  const { currentUser, peers } = useRoomStore();

  const myChoice = currentUser ? rps.choices[currentUser.id] : null;

  const handleSelectChoice = (choice: Choice) => {
    if (!currentUser) return;

    const newChoices = { ...rps.choices, [currentUser.id]: choice };
    const peerIds = [currentUser.id, ...peers.map((p) => p.id)];

    let winner: string | null = null;

    if (peerIds.length >= 2 && newChoices[peerIds[0]] && newChoices[peerIds[1]]) {
      const c1 = newChoices[peerIds[0]];
      const c2 = newChoices[peerIds[1]];

      if (c1 === c2) {
        winner = 'draw';
      } else if (
        (c1 === 'rock' && c2 === 'scissors') ||
        (c1 === 'paper' && c2 === 'rock') ||
        (c1 === 'scissors' && c2 === 'paper')
      ) {
        winner = peerIds[0];
      } else {
        winner = peerIds[1];
      }

      if (winner && winner !== 'draw') {
        confetti({ particleCount: 70, spread: 50, origin: { y: 0.7 } });
      }
    }

    const newScores = { ...rps.scores };
    if (winner && winner !== 'draw') {
      newScores[winner] = (newScores[winner] || 0) + 1;
    }

    const newState = {
      choices: newChoices,
      winner,
      scores: newScores,
    };

    updateRPS(newState);
    peerService.broadcast('GAME_STATE_CHANGE', {
      gameType: 'rps',
      state: newState,
    });
  };

  const handleNextRound = () => {
    const newState = { choices: {}, winner: null, round: rps.round + 1 };
    updateRPS(newState);
    peerService.broadcast('GAME_STATE_CHANGE', {
      gameType: 'rps',
      state: newState,
    });
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col items-center space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-1">Rock Paper Scissors</h3>
        <p className="text-xs text-slate-400">Round #{rps.round} • Simultaneous secret pick</p>
      </div>

      <div className="flex justify-center space-x-4">
        {CHOICES.map((c) => (
          <button
            key={c.id}
            onClick={() => handleSelectChoice(c.id)}
            disabled={!!rps.winner}
            className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center transition-all transform active:scale-95 shadow-lg border ${
              myChoice === c.id
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 border-indigo-400 ring-2 ring-indigo-400 scale-105'
                : 'bg-white/5 hover:bg-white/10 border-white/10'
            }`}
          >
            <span className="text-3xl mb-1">{c.icon}</span>
            <span className="text-[10px] font-bold text-white">{c.label}</span>
          </button>
        ))}
      </div>

      {rps.winner && (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 text-center w-full max-w-xs animate-fadeIn">
          <h4 className="text-sm font-bold text-white mb-1">
            {rps.winner === 'draw'
              ? '🤝 It is a Draw!'
              : rps.winner === currentUser?.id
              ? '🎉 You Won the Round!'
              : '🏆 Opponent Won!'}
          </h4>
          <button
            onClick={handleNextRound}
            className="mt-3 glow-btn bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-xl flex items-center space-x-1 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Next Round</span>
          </button>
        </div>
      )}
    </div>
  );
};
