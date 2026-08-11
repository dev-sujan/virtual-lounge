import React, { useEffect, useRef, useState } from 'react';
import { useMusicStore } from '../../stores/useMusicStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { peerService } from '../../services/webrtc/peerService';
import { formatTime } from '../../utils/youtubeUtils';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Shuffle, Repeat, Plus } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  onOpenAddModal: () => void;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ onOpenAddModal }) => {
  const { currentTrack, playback, repeatMode, shuffleMode, setPlaybackState, skipTrack, setRepeatMode, toggleShuffle } =
    useMusicStore();
  const { currentUser } = useRoomStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [localTime, setLocalTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const isInternalSeeking = useRef(false);

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
      if (Math.abs(actualTime - expectedTime) > 1.5) {
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
      }
    }, 500);

    return () => clearInterval(timer);
  }, [isPlayerReady]);

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

  return (
    <div className="glass-card rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 border border-white/10">
      <div className="relative aspect-video w-full bg-black/80 group">
        <div ref={containerRef} className="w-full h-full" />

        {!currentTrack && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900/90 to-black">
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-4 animate-pulse">
              <Plus className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Your Lounge Queue is Empty</h3>
            <p className="text-slate-400 text-sm max-w-sm mb-6">
              Add any YouTube music link or song to start listening together synchronously in real time.
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

        {currentTrack && (
          <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10 opacity-90 group-hover:opacity-100 transition-opacity">
            <div className="glass-pill px-3 py-1.5 rounded-full flex items-center space-x-2 text-xs font-medium text-white/90 max-w-[70%] truncate shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="truncate">Added by {currentTrack.addedBy.name}</span>
            </div>
            <button
              onClick={onOpenAddModal}
              className="glass-pill hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-full flex items-center space-x-1 font-medium transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Music</span>
            </button>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 bg-slate-900/60 backdrop-blur-lg">
        {currentTrack ? (
          <div>
            <div className="mb-3">
              <h2 className="text-base sm:text-lg font-bold text-white truncate">{currentTrack.title}</h2>
              <p className="text-xs text-indigo-300 font-medium truncate">{currentTrack.author}</p>
            </div>

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

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={toggleShuffle}
                  className={`p-2 rounded-xl transition ${
                    shuffleMode ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
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
              </div>

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
        ) : (
          <div className="py-2 text-center text-slate-400 text-sm">
            Select or add a YouTube track to start streaming together.
          </div>
        )}
      </div>
    </div>
  );
};
