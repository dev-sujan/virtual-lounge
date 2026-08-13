import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  FastForward,
  Flame,
} from 'lucide-react';
import { formatTime } from '../../utils/youtubeUtils';
import { AudioEqualizer } from './AudioEqualizer';
import type { PlaybackState } from '../../types';

interface MusicPlayerControlsProps {
  playback: PlaybackState;
  localTime: number;
  duration: number;
  repeatMode: 'off' | 'all' | 'one';
  shuffleMode: boolean;
  playbackSpeed: number;
  skipVotesCount: number;
  skipVotesNeeded: number;
  hasUserVotedSkip: boolean;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePlay: () => void;
  onSkipTrack: (direction: 'next' | 'prev') => void;
  onToggleShuffle: () => void;
  onCycleRepeatMode: () => void;
  onCycleSpeed: () => void;
  onVoteSkip: () => void;
  onToggleMute: () => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const MusicPlayerControls: React.FC<MusicPlayerControlsProps> = ({
  playback,
  localTime,
  duration,
  repeatMode,
  shuffleMode,
  playbackSpeed,
  skipVotesCount,
  skipVotesNeeded,
  hasUserVotedSkip,
  onSeek,
  onTogglePlay,
  onSkipTrack,
  onToggleShuffle,
  onCycleRepeatMode,
  onCycleSpeed,
  onVoteSkip,
  onToggleMute,
  onVolumeChange,
}) => {
  return (
    <div>
      {/* Progress Slider */}
      <div className="space-y-1 mb-4">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={localTime}
          onChange={onSeek}
          className="custom-slider w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="flex justify-between text-[11px] font-mono text-slate-400">
          <span>{formatTime(localTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls Row */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
        {/* Mode Toggles */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={onToggleShuffle}
            className={`p-2 rounded-xl transition ${
              shuffleMode
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Shuffle Queue"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={onCycleRepeatMode}
            className={`p-2 rounded-xl transition relative ${
              repeatMode !== 'off'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            <Repeat className="w-4 h-4" />
            {repeatMode === 'one' && (
              <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-indigo-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center">
                1
              </span>
            )}
          </button>

          <button
            onClick={onCycleSpeed}
            className="p-1.5 rounded-xl text-xs font-mono font-bold bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition flex items-center space-x-1"
            title="Change Playback Speed"
          >
            <FastForward className="w-3.5 h-3.5 text-indigo-400" />
            <span>{playbackSpeed}x</span>
          </button>

          {/* Audio Equalizer & Sound Effects Deck */}
          <AudioEqualizer />
        </div>

        {/* Play / Skip Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onSkipTrack('prev')}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition"
            title="Previous Song"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transform active:scale-95 transition-all"
            title={playback.isPlaying ? 'Pause' : 'Play'}
          >
            {playback.isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            onClick={() => onSkipTrack('next')}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition"
            title="Next Song"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Vote to Skip & Volume */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onVoteSkip}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border ${
              hasUserVotedSkip
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
            title="Vote to skip current song with lounge members"
          >
            <Flame className={`w-3.5 h-3.5 ${hasUserVotedSkip ? 'text-rose-400 fill-current' : 'text-slate-400'}`} />
            <span>Skip ({skipVotesCount}/{skipVotesNeeded})</span>
          </button>

          <div className="hidden sm:flex items-center space-x-2">
            <button onClick={onToggleMute} className="text-slate-400 hover:text-white">
              {playback.isMuted || playback.volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={playback.isMuted ? 0 : playback.volume}
              onChange={onVolumeChange}
              className="w-16 accent-indigo-500 bg-white/10 h-1 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
