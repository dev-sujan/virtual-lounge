import React, { useEffect, useRef, useState } from 'react';
import { useMusicStore } from '../../stores/useMusicStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { useToastStore } from '../../stores/useToastStore';
import { peerService } from '../../services/webrtc/peerService';
import { formatTime } from '../../utils/youtubeUtils';
import { AudioEqualizer } from './AudioEqualizer';
import type { SyncMessagePayload } from '../../types';

import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Plus,
  FastForward,
  Maximize2,
  Minimize2,
  Flame,
} from 'lucide-react';


declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number; // percentage horizontal position
}

interface YouTubePlayerProps {
  onOpenAddModal: () => void;
}

const REACTION_EMOJIS = ['🔥', '💃', '🎵', '👏', '❤️', '⚡'];
const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ onOpenAddModal }) => {
  const {
    currentTrack,
    playback,
    repeatMode,
    shuffleMode,
    skipVotes,
    setPlaybackState,
    skipTrack,
    setRepeatMode,
    toggleShuffle,
    toggleSkipVote,
  } = useMusicStore();

  const { currentUser, peers } = useRoomStore();
  const { addToast } = useToastStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [localTime, setLocalTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [isTheater, setIsTheater] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const isInternalSeeking = useRef(false);

  // Register listener for remote reactions
  useEffect(() => {
    const unsub = peerService.onMessage?.((msg: SyncMessagePayload) => {
      if (msg.type === 'MUSIC_REACTION') {
        const { emoji } = msg.payload;
        triggerFloatingEmoji(emoji);
      }
    });


    return () => {
      if (unsub) unsub();
    };
  }, []);

  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };
  }, []);

  const initPlayer = () => {
    if (!containerRef.current || playerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '100%',
      width: '100%',
      videoId: currentTrack?.videoId || '',
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
      },
      events: {
        onReady: (event: any) => {
          setIsPlayerReady(true);
          if (playback.volume !== undefined) {
            event.target.setVolume(playback.volume);
          }
          if (playback.isPlaying) {
            event.target.playVideo();
          }
        },
        onStateChange: (event: any) => {
          if (event.data === 0) {
            skipTrack('next');
          }
        },
      },
    });
  };

  useEffect(() => {
    if (isPlayerReady && playerRef.current && currentTrack?.videoId) {
      const currentVideoData = playerRef.current.getVideoData?.();
      if (currentVideoData?.video_id !== currentTrack.videoId) {
        playerRef.current.loadVideoById({
          videoId: currentTrack.videoId,
          startSeconds: playback.currentTime || 0,
        });
      }
    }
  }, [currentTrack?.videoId, isPlayerReady]);

  useEffect(() => {
    if (!isPlayerReady || !playerRef.current || isInternalSeeking.current) return;

    try {
      const state = playerRef.current.getPlayerState?.();
      if (playback.isPlaying && state !== 1 && state !== 3) {
        playerRef.current.playVideo();
      } else if (!playback.isPlaying && state === 1) {
        playerRef.current.pauseVideo();
      }

      let expectedTime = playback.currentTime;
      if (playback.isPlaying) {
        const elapsed = (Date.now() - playback.lastUpdated) / 1000;
        expectedTime += elapsed;
      }

      const actualTime = playerRef.current.getCurrentTime?.() || 0;
      if (Math.abs(actualTime - expectedTime) > 3.0) {
        playerRef.current.seekTo(expectedTime, true);
      }
    } catch (err) {
      console.warn('Player sync error:', err);
    }
  }, [playback.isPlaying, playback.currentTime, playback.lastUpdated, isPlayerReady]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isPlayerReady && playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        const dur = playerRef.current.getDuration();
        setLocalTime(time || 0);
        if (dur && dur > 0) setDuration(dur);

        // Keep musicStore playback state updated in real-time as song plays
        if (playback.isPlaying && currentUser?.isHost) {
          useMusicStore.getState().setPlaybackState({
            currentTime: time || 0,
            lastUpdated: Date.now(),
          });
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlayerReady, playback.isPlaying, currentUser?.isHost]);

  const handleTogglePlay = () => {
    if (!currentUser) return;
    const newIsPlaying = !playback.isPlaying;
    const time = playerRef.current?.getCurrentTime?.() || localTime;

    const updates = {
      isPlaying: newIsPlaying,
      currentTime: time,
      updatedBy: currentUser.displayName,
      lastUpdated: Date.now(),
    };

    setPlaybackState(updates);
    peerService.broadcast('PLAYBACK_CHANGE', updates);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setLocalTime(newTime);
    isInternalSeeking.current = true;

    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(newTime, true);
    }

    if (currentUser) {
      const updates = {
        currentTime: newTime,
        isPlaying: playback.isPlaying,
        updatedBy: currentUser.displayName,
        lastUpdated: Date.now(),
      };
      setPlaybackState(updates);
      peerService.broadcast('PLAYBACK_CHANGE', updates);
    }

    setTimeout(() => {
      isInternalSeeking.current = false;
    }, 300);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value, 10);
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(vol);
    }
    setPlaybackState({ volume: vol, isMuted: vol === 0 });
  };

  const handleToggleMute = () => {
    const newMute = !playback.isMuted;
    if (playerRef.current) {
      if (newMute) playerRef.current.mute();
      else playerRef.current.unMute();
    }
    setPlaybackState({ isMuted: newMute });
  };

  const handleCycleSpeed = () => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextSpeed = PLAYBACK_SPEEDS[(currentIndex + 1) % PLAYBACK_SPEEDS.length];
    setPlaybackSpeed(nextSpeed);
    if (playerRef.current && playerRef.current.setPlaybackRate) {
      playerRef.current.setPlaybackRate(nextSpeed);
    }
  };

  const handleVoteSkip = () => {
    if (!currentUser) return;
    const totalUsers = (peers?.length || 0) + 1; // peers + self
    const { votes, skipped } = toggleSkipVote(currentUser.id, totalUsers);

    peerService.broadcast('SKIP_VOTE_CHANGE', { votes });

    if (skipped) {
      addToast({
        category: 'info',
        title: 'Track Skipped',
        message: 'Vote threshold reached. Advancing to next track!',
      });
    }
  };

  const triggerFloatingEmoji = (emoji: string) => {
    const newEmoji: FloatingEmoji = {
      id: 'fe_' + Math.random().toString(36).substring(2, 9),
      emoji,
      x: Math.floor(Math.random() * 70) + 15,
    };

    setFloatingEmojis((prev) => [...prev, newEmoji]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== newEmoji.id));
    }, 2200);
  };

  const handleSendEmojiReaction = (emoji: string) => {
    triggerFloatingEmoji(emoji);
    peerService.broadcast('MUSIC_REACTION', { emoji });
  };

  const totalRoomUsers = (peers?.length || 0) + 1;
  const skipVotesNeeded = Math.max(1, Math.ceil(totalRoomUsers / 2));
  const hasUserVotedSkip = currentUser && skipVotes.includes(currentUser.id);

  return (
    <div className={`relative transition-all duration-300 ${isTheater ? 'col-span-full' : ''}`}>
      {/* Ambient background glow */}
      {currentTrack && (
        <div
          className="absolute -inset-2 rounded-3xl opacity-20 blur-xl transition-all duration-700 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${currentTrack.thumbnail})` }}
        />
      )}

      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 border border-white/10 relative">
        {/* Floating Emoji Particles Layer */}
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
          {floatingEmojis.map((fe) => (
            <div
              key={fe.id}
              className="absolute bottom-16 text-3xl animate-floatUp opacity-90 transition-all drop-shadow-lg"
              style={{ left: `${fe.x}%` }}
            >
              {fe.emoji}
            </div>
          ))}
        </div>

        {/* Video Screen Container */}
        <div className={`relative w-full bg-black/90 group ${isTheater ? 'aspect-[21/9]' : 'aspect-video'}`}>
          <div ref={containerRef} className="w-full h-full" />

          {!currentTrack && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900/95 to-black">
              <div className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-4 animate-pulse">
                <Plus className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Your Lounge Queue is Empty</h3>
              <p className="text-slate-400 text-sm max-w-sm mb-6">
                Add any YouTube music link, search tracks, or select a lounge preset to listen together synchronously.
              </p>
              <button
                onClick={onOpenAddModal}
                className="glow-btn bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium px-6 py-2.5 rounded-full flex items-center space-x-2 transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Add Song to Queue</span>
              </button>
            </div>
          )}

          {/* Top Bar Overlay */}
          {currentTrack && (
            <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10 opacity-90 group-hover:opacity-100 transition-opacity">
              <div className="glass-pill px-3 py-1.5 rounded-full flex items-center space-x-2 text-xs font-medium text-white/90 max-w-[65%] truncate shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="truncate">Added by {currentTrack.addedBy.name}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsTheater(!isTheater)}
                  className="glass-pill hover:bg-white/20 text-white p-1.5 rounded-full transition"
                  title={isTheater ? 'Standard View' : 'Theater Mode'}
                >
                  {isTheater ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={onOpenAddModal}
                  className="glass-pill hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-full flex items-center space-x-1 font-medium transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Music</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Player Controls Deck */}
        <div className="p-4 sm:p-5 bg-slate-900/80 backdrop-blur-xl">
          {currentTrack ? (
            <div>
              {/* Title & Emoji Reactions Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="overflow-hidden">
                  <h2 className="text-base sm:text-lg font-bold text-white truncate">{currentTrack.title}</h2>
                  <p className="text-xs text-indigo-300 font-medium truncate">{currentTrack.author}</p>
                </div>

                {/* Floating Reaction Bar */}
                <div className="flex items-center space-x-1 bg-slate-950/60 px-2 py-1 rounded-2xl border border-white/10 shrink-0 self-start sm:self-auto">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSendEmojiReaction(emoji)}
                      className="p-1 hover:scale-125 transform transition text-sm"
                      title={`Send ${emoji} reaction`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Slider */}
              <div className="space-y-1 mb-4">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={localTime}
                  onChange={handleSeek}
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
                    onClick={toggleShuffle}
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
                    onClick={() =>
                      setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')
                    }
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
                    onClick={handleCycleSpeed}
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
                    onClick={() => skipTrack('prev')}
                    className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition"
                    title="Previous Song"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleTogglePlay}
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
                    onClick={() => skipTrack('next')}
                    className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition"
                    title="Next Song"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>

                {/* Vote to Skip & Volume */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleVoteSkip}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border ${
                      hasUserVotedSkip
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                    title="Vote to skip current song with lounge members"
                  >
                    <Flame className={`w-3.5 h-3.5 ${hasUserVotedSkip ? 'text-rose-400 fill-current' : 'text-slate-400'}`} />
                    <span>Skip ({skipVotes.length}/{skipVotesNeeded})</span>
                  </button>

                  <div className="hidden sm:flex items-center space-x-2">
                    <button onClick={handleToggleMute} className="text-slate-400 hover:text-white">
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
                      onChange={handleVolumeChange}
                      className="w-16 accent-indigo-500 bg-white/10 h-1 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-2 text-center text-slate-400 text-sm">
              Select or add a YouTube track to start streaming together.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
