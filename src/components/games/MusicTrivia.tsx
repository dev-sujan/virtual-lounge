import React, { useState, useEffect } from 'react';
import { useRoomStore } from '../../stores/useRoomStore';
import { peerService } from '../../services/webrtc/peerService';
import { getInitials } from '../../utils/avatarUtils';
import { Trophy, Clock, CheckCircle2, XCircle, RotateCcw, Award } from 'lucide-react';


export interface TriviaQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
}

const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    id: 1,
    question: 'Which legendary band performed "Bohemian Rhapsody"?',
    options: ['The Beatles', 'Queen', 'Pink Floyd', 'Led Zeppelin'],
    correctIndex: 1,
    category: 'Classic Rock',
  },
  {
    id: 2,
    question: 'What is the genre most associated with "Lofi Girl"?',
    options: ['Synthwave', 'Lofi Hip-Hop', 'Heavy Metal', 'Dubstep'],
    correctIndex: 1,
    category: 'Lounge Vibe',
  },
  {
    id: 3,
    question: 'Who released the record-breaking hit single "Blinding Lights"?',
    options: ['Drake', 'The Weeknd', 'Post Malone', 'Bruno Mars'],
    correctIndex: 1,
    category: 'Pop Hits',
  },
  {
    id: 4,
    question: 'Which artist holds the title for the most Grammy Awards in history?',
    options: ['Beyoncé', 'Michael Jackson', 'Stevie Wonder', 'Jay-Z'],
    correctIndex: 0,
    category: 'Music History',
  },
  {
    id: 5,
    question: 'What instrument is known as the "king of instruments"?',
    options: ['Electric Guitar', 'Pipe Organ', 'Grand Piano', 'Violin'],
    correctIndex: 1,
    category: 'Instruments',
  },
  {
    id: 6,
    question: 'Which iconic album features a prism dispersing light into a rainbow?',
    options: ['Abbey Road', 'The Dark Side of the Moon', 'Thriller', 'Nevermind'],
    correctIndex: 1,
    category: 'Classic Rock',
  },
  {
    id: 7,
    question: 'What tempo measurement term means "fast and lively"?',
    options: ['Adagio', 'Largo', 'Allegro', 'Andante'],
    correctIndex: 2,
    category: 'Music Theory',
  },
];

import { useGameStore } from '../../stores/useGameStore';


export const MusicTrivia: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { currentUser, peers } = useRoomStore();
  const { trivia, updateTrivia, resetTrivia } = useGameStore();

  const [currentQIndex, setCurrentQIndex] = useState(trivia.currentQIndex || 0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timer, setTimer] = useState(15);
  const [isAnswered, setIsAnswered] = useState(false);
  const [gameFinished, setGameFinished] = useState(trivia.gameFinished || false);

  const scores = trivia.scores || {};
  const streaks = trivia.streaks || {};

  useEffect(() => {
    if (trivia.currentQIndex !== undefined && trivia.currentQIndex !== currentQIndex) {
      setCurrentQIndex(trivia.currentQIndex);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimer(15);
    }
    if (trivia.gameFinished !== undefined) {
      setGameFinished(trivia.gameFinished);
    }
  }, [trivia.currentQIndex, trivia.gameFinished]);

  const currentQ = TRIVIA_QUESTIONS[currentQIndex];

  // Timer countdown
  useEffect(() => {
    if (gameFinished || isAnswered) return;

    if (timer <= 0) {
      setIsAnswered(true);
      if (currentUser) {
        const updatedStreaks = { ...streaks, [currentUser.id]: 0 };
        updateTrivia({ streaks: updatedStreaks });
      }
      return;
    }

    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, isAnswered, gameFinished, currentUser, streaks, updateTrivia]);

  const handleSelectOption = (idx: number) => {
    if (isAnswered || !currentUser) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctIndex;
    const addedPoints = isCorrect ? Math.max(50, timer * 10) : 0;

    const currentScore = scores[currentUser.id] || 0;
    const currentStreak = streaks[currentUser.id] || 0;

    const newScore = currentScore + addedPoints;
    const newStreak = isCorrect ? currentStreak + 1 : 0;

    const updatedScores = { ...scores, [currentUser.id]: newScore };
    const updatedStreaks = { ...streaks, [currentUser.id]: newStreak };

    const newState = {
      scores: updatedScores,
      streaks: updatedStreaks,
      currentQIndex,
      gameFinished,
    };

    updateTrivia(newState);
    peerService.broadcast('GAME_STATE_CHANGE', {
      gameType: 'trivia',
      state: newState,
    });
  };

  const handleNextQuestion = () => {
    if (currentQIndex + 1 < TRIVIA_QUESTIONS.length) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimer(15);
      const newState = { currentQIndex: nextIdx, scores, streaks, gameFinished: false };
      updateTrivia(newState);
      peerService.broadcast('GAME_STATE_CHANGE', {
        gameType: 'trivia',
        state: newState,
      });
    } else {
      setGameFinished(true);
      const newState = { currentQIndex, scores, streaks, gameFinished: true };
      updateTrivia(newState);
      peerService.broadcast('GAME_STATE_CHANGE', {
        gameType: 'trivia',
        state: newState,
      });
    }
  };

  const handleRestart = () => {
    setCurrentQIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setTimer(15);
    setGameFinished(false);
    resetTrivia();
    peerService.broadcast('GAME_STATE_CHANGE', {
      gameType: 'trivia',
      state: { currentQIndex: 0, scores: {}, streaks: {}, gameFinished: false },
    });
  };


  // Participant list sorted by score
  const participants = [currentUser, ...(peers || [])].filter(Boolean);
  const leaderboard = [...participants].sort((a, b) => (scores[b!.id] || 0) - (scores[a!.id] || 0));

  return (
    <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-6 max-w-xl mx-auto shadow-2xl relative overflow-hidden animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          onClick={onBack}
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 transition"
        >
          ← Back to Games
        </button>

        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">Lounge Music Trivia</h3>
        </div>

        <button
          onClick={handleRestart}
          className="text-xs text-indigo-400 hover:text-indigo-300 p-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 transition"
          title="Restart Trivia"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {!gameFinished ? (
        <div className="space-y-5">
          {/* Header Progress & Timer */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-indigo-300 font-bold bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full">
              Question {currentQIndex + 1} of {TRIVIA_QUESTIONS.length} • {currentQ.category}
            </span>

            <div className="flex items-center space-x-1.5 text-amber-400 font-mono font-bold text-xs bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span>{timer}s left</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
              style={{ width: `${((currentQIndex + 1) / TRIVIA_QUESTIONS.length) * 100}%` }}
            />
          </div>

          {/* Question Box */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg text-center">
            <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">{currentQ.question}</h2>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correctIndex;

              let btnClass = 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10 hover:border-indigo-400';

              if (isAnswered) {
                if (isCorrect) {
                  btnClass = 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-bold';
                } else if (isSelected && !isCorrect) {
                  btnClass = 'bg-rose-500/20 border-rose-400 text-rose-200 font-bold';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  className={`p-4 rounded-2xl text-xs sm:text-sm font-medium transition border flex items-center justify-between shadow ${btnClass}`}
                >
                  <span className="truncate pr-2">{option}</span>
                  {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Next Button when Answered */}
          {isAnswered && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNextQuestion}
                className="glow-btn bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-lg transition flex items-center space-x-1"
              >
                <span>{currentQIndex + 1 === TRIVIA_QUESTIONS.length ? 'View Results' : 'Next Question →'}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Game Over Results */
        <div className="py-6 text-center space-y-5 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-xl">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">Trivia Game Finished!</h2>
            <p className="text-xs text-slate-400">Great job testing your lounge music knowledge.</p>
          </div>

          {/* Leaderboard Table */}
          <div className="space-y-2 max-w-sm mx-auto">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left">
              Final Lounge Leaderboard
            </div>

            {leaderboard.map((user, idx) => (
              <div
                key={user!.id}
                className={`p-3 rounded-2xl border flex items-center justify-between ${
                  idx === 0
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs font-bold w-5">#{idx + 1}</span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow"
                    style={{ backgroundColor: user!.avatarColor }}
                  >
                    {getInitials(user!.displayName)}
                  </div>
                  <span className="text-xs font-bold text-white">{user!.displayName}</span>
                </div>

                <span className="font-mono text-xs font-bold text-indigo-300">
                  {scores[user!.id] || 0} pts
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handleRestart}
            className="glow-btn bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-lg transition"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};
