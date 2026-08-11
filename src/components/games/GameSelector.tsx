import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { TicTacToe } from './TicTacToe';
import { RockPaperScissors } from './RockPaperScissors';
import { ConnectFour } from './ConnectFour';
import { MusicTrivia } from './MusicTrivia';
import { Gamepad2, Grid, Scissors, Disc, Trophy } from 'lucide-react';
import type { GameType } from '../../types';

export const GameSelector: React.FC = () => {
  const { activeGame, setActiveGame } = useGameStore();

  const games: { id: GameType; title: string; desc: string; icon: any }[] = [
    { id: 'trivia', title: 'Music Trivia', desc: 'Real-time quiz with live scoreboards', icon: Trophy },
    { id: 'tictactoe', title: 'Tic-Tac-Toe', desc: 'Classic 3x3 strategy grid', icon: Grid },
    { id: 'rps', title: 'Rock Paper Scissors', desc: 'Simultaneous action showdown', icon: Scissors },
    { id: 'connectfour', title: 'Connect Four', desc: '4-in-a-row drop battle', icon: Disc },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Gamepad2 className="w-5 h-5 text-indigo-400" />
            <span>Lounge Multiplayer Games</span>
          </h3>
          <p className="text-xs text-slate-400">Play real-time lightweight games with room members</p>
        </div>

        {activeGame !== 'none' && (
          <button
            onClick={() => setActiveGame('none')}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition"
          >
            ← Switch Game
          </button>
        )}
      </div>

      {activeGame === 'none' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {games.map((g) => {
            const Icon = g.icon;
            return (
              <button
                key={g.id}
                onClick={() => setActiveGame(g.id)}
                className="glass-card p-5 rounded-2xl border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-950/20 text-left transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                    {g.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">{g.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="animate-fadeIn">
          {activeGame === 'trivia' && <MusicTrivia onBack={() => setActiveGame('none')} />}
          {activeGame === 'tictactoe' && <TicTacToe />}
          {activeGame === 'rps' && <RockPaperScissors />}
          {activeGame === 'connectfour' && <ConnectFour />}
        </div>
      )}
    </div>
  );
};

