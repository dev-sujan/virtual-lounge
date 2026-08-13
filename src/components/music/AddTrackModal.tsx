import React, { useState, useEffect } from 'react';
import { extractYouTubeId, fetchYouTubeMeta, type YouTubeMeta } from '../../utils/youtubeUtils';
import { searchYouTubeTracks, PRESET_LOUNGE_TRACKS, GENRE_CATEGORIES } from '../../utils/loungePresets';
import { useMusicStore } from '../../stores/useMusicStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { useToastStore } from '../../stores/useToastStore';
import { peerService } from '../../services/webrtc/peerService';
import type { QueueItem } from '../../types';
import { X, Search, Music, AlertCircle, PlusCircle, Check, Sparkles, Radio, FileText, Download } from 'lucide-react';

interface AddTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTrackModal: React.FC<AddTrackModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'presets' | 'import'>('search');
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<YouTubeMeta[]>([]);
  const [importJsonText, setImportJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});


  const { addToQueue, importQueueJson } = useMusicStore();
  const { currentUser } = useRoomStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const videoId = extractYouTubeId(query);
        if (videoId) {
          const meta = await fetchYouTubeMeta(videoId);
          setSearchResults([meta]);
        } else {
          const results = await searchYouTubeTracks(query);
          setSearchResults(results);
          if (results.length === 0) {
            setError('No videos found for this search. Try pasting a YouTube link.');
          }
        }
      } catch {
        setError('Failed to fetch search results.');
      } finally {
        setLoading(false);
      }
    }, 400);


    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleAddTrack = (meta: YouTubeMeta) => {
    if (!currentUser) return;

    const newItem: QueueItem = {
      id: 'q_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      videoId: meta.videoId,
      title: meta.title,
      author: meta.author,
      thumbnail: meta.thumbnail,
      duration: meta.duration || 180,
      addedBy: {
        id: currentUser.id,
        name: currentUser.displayName,
        avatarColor: currentUser.avatarColor,
      },
      votes: [],
      downvotes: [],
      priority: 0,
      addedAt: Date.now(),
    };

    const success = addToQueue(newItem);

    if (!success) {
      addToast({
        category: 'warning',
        title: 'Already in Queue',
        message: `"${meta.title}" is already in the lounge queue`,
      });
      return;
    }

    setAddedIds((prev) => ({ ...prev, [meta.videoId]: true }));

    peerService.broadcast('QUEUE_CHANGE', {
      queue: useMusicStore.getState().queue,
      currentTrack: useMusicStore.getState().currentTrack,
      action: 'added',
      item: newItem,
      user: currentUser.displayName,
    });

    addToast({
      category: 'info',
      title: 'Track Added!',
      message: `Added "${meta.title}" to the shared lounge queue`,
      icon: 'music',
    });
  };

  const handleImportPlaylist = () => {
    if (!importJsonText.trim()) return;
    const res = importQueueJson(importJsonText);
    if (res.success) {
      peerService.broadcast('QUEUE_CHANGE', {
        queue: useMusicStore.getState().queue,
        currentTrack: useMusicStore.getState().currentTrack,
        action: `imported ${res.count} songs`,
        user: currentUser?.displayName,
      });

      addToast({
        category: 'info',
        title: 'Playlist Imported',
        message: `Successfully imported ${res.count} tracks to queue!`,
      });
      setImportJsonText('');
      onClose();
    } else {
      setError(res.error || 'Failed to import playlist');
    }
  };

  const filteredPresets = selectedGenre === 'all'
    ? PRESET_LOUNGE_TRACKS
    : PRESET_LOUNGE_TRACKS.filter((t) => t.genre === selectedGenre);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-card w-full max-w-2xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90dvh] sm:max-h-[85vh] relative">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center space-x-2.5 sm:space-x-3 overflow-hidden">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow shrink-0">
              <Music className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="overflow-hidden">
              <h2 className="text-base sm:text-xl font-bold text-white flex items-center space-x-1.5 sm:space-x-2">
                <span className="truncate">Add Lounge Music</span>
                <span className="text-[10px] sm:text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 sm:px-2 py-0.5 rounded-full font-mono shrink-0">
                  YouTube & Presets
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">Search YouTube, pick curated lounge hits, or import playlists</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full transition hover:bg-white/10 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="px-3 sm:px-6 pt-3 sm:pt-4 flex space-x-2 border-b border-white/5 bg-slate-950/20 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-xl text-xs font-semibold flex items-center space-x-1.5 sm:space-x-2 transition border-b-2 shrink-0 ${
              activeTab === 'search'
                ? 'border-indigo-500 text-indigo-400 bg-white/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Search & Link</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-xl text-xs font-semibold flex items-center space-x-1.5 sm:space-x-2 transition border-b-2 shrink-0 ${
              activeTab === 'presets'
                ? 'border-indigo-500 text-indigo-400 bg-white/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Lounge Presets</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-xl text-xs font-semibold flex items-center space-x-1.5 sm:space-x-2 transition border-b-2 shrink-0 ${
              activeTab === 'import'
                ? 'border-indigo-500 text-indigo-400 bg-white/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Import Playlist</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain">
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Paste YouTube video link OR search song / artist name..."
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
                  autoFocus
                />
              </div>

              {loading && (
                <div className="py-8 flex items-center justify-center space-x-2 text-indigo-400 text-sm">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span>Searching YouTube & fetching metadata...</span>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center space-x-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!loading && searchResults.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Search Results</div>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {searchResults.map((meta) => {
                      const isAdded = addedIds[meta.videoId];
                      return (
                        <div
                          key={meta.videoId}
                          className="glass-card p-3 rounded-2xl border border-white/10 hover:border-white/20 transition flex items-center justify-between group"
                        >
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <img
                              src={meta.thumbnail}
                              alt={meta.title}
                              className="w-14 h-10 object-cover rounded-xl shrink-0 shadow"
                            />
                            <div className="overflow-hidden">
                              <h4 className="text-xs sm:text-sm font-semibold text-white truncate">{meta.title}</h4>
                              <p className="text-xs text-indigo-300 truncate">{meta.author}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddTrack(meta)}
                            disabled={isAdded}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 shrink-0 transition ${
                              isAdded
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Added</span>
                              </>
                            ) : (
                              <>
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Add</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!loading && !query && (
                <div className="py-6 text-center text-slate-400 space-y-2">
                  <Radio className="w-10 h-10 mx-auto text-indigo-400/60 mb-2" />
                  <p className="text-sm font-medium text-slate-300">Search for tracks or paste a video link</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Search works with song titles like "Bohemian Rhapsody", "Lofi Beats", or any standard YouTube URL.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-white/5">
                {GENRE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedGenre(cat.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-medium transition ${
                      selectedGenre === cat.id
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredPresets.map((preset) => {
                  const isAdded = addedIds[preset.videoId];
                  return (
                    <div
                      key={preset.id}
                      className="glass-card p-3 rounded-2xl border border-white/10 hover:border-white/20 transition flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <img
                          src={preset.thumbnail}
                          alt={preset.title}
                          className="w-14 h-10 object-cover rounded-xl shrink-0 shadow"
                        />
                        <div className="overflow-hidden">
                          <h4 className="text-xs sm:text-sm font-semibold text-white truncate">{preset.title}</h4>
                          <p className="text-xs text-indigo-300 truncate">{preset.author}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddTrack(preset)}
                        disabled={isAdded}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1 shrink-0 transition ${
                          isAdded
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Paste JSON queue data from an exported lounge playlist to instantly load multiple tracks:
              </p>
              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='Paste JSON array or exported queue data here...'
                className="w-full h-44 bg-slate-950/80 border border-white/10 rounded-2xl p-4 text-xs font-mono text-indigo-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center space-x-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleImportPlaylist}
                  disabled={!importJsonText.trim()}
                  className="glow-btn bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium px-5 py-2.5 rounded-xl flex items-center space-x-2 shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>Import Playlist</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
