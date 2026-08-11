import React, { useState } from 'react';
import { extractYouTubeId, fetchYouTubeMeta } from '../../utils/youtubeUtils';
import type { YouTubeMeta } from '../../utils/youtubeUtils';
import { useMusicStore } from '../../stores/useMusicStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { peerService } from '../../services/webrtc/peerService';
import type { QueueItem } from '../../types';
import { X, Search, Music, AlertCircle, PlusCircle, Check } from 'lucide-react';

interface AddTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTrackModal: React.FC<AddTrackModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<YouTubeMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const { addToQueue } = useMusicStore();
  const { currentUser } = useRoomStore();

  if (!isOpen) return null;

  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setUrl(input);
    setError(null);
    setPreview(null);
    setAddedSuccess(false);

    const videoId = extractYouTubeId(input);
    if (videoId) {
      setLoading(true);
      try {
        const meta = await fetchYouTubeMeta(videoId);
        setPreview(meta);
      } catch (err) {
        setError('Could not fetch YouTube video details');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAdd = () => {
    if (!preview || !currentUser) return;

    const newItem: QueueItem = {
      id: 'q_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      videoId: preview.videoId,
      title: preview.title,
      author: preview.author,
      thumbnail: preview.thumbnail,
      duration: preview.duration,
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
      setError('This video is already in the active lounge queue');
      return;
    }

    peerService.broadcast('QUEUE_CHANGE', {
      queue: useMusicStore.getState().queue,
      currentTrack: useMusicStore.getState().currentTrack,
      action: 'added',
      item: newItem,
      user: currentUser.displayName,
    });

    setAddedSuccess(true);
    setTimeout(() => {
      setUrl('');
      setPreview(null);
      setAddedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="glass-card w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-white/10 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full transition hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Add Music to Lounge</h2>
            <p className="text-xs text-slate-400">Paste any YouTube or YouTube Music link below</p>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            autoFocus
          />
        </div>

        {loading && (
          <div className="py-6 flex items-center justify-center space-x-2 text-indigo-400 text-sm">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Fetching video info...</span>
          </div>
        )}

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center space-x-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {preview && (
          <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center space-x-4">
            <img
              src={preview.thumbnail}
              alt={preview.title}
              className="w-20 h-14 object-cover rounded-lg shrink-0 shadow"
            />
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-white truncate">{preview.title}</h4>
              <p className="text-xs text-indigo-300 truncate">{preview.author}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!preview || loading || addedSuccess}
            className={`glow-btn px-6 py-2 rounded-xl text-sm font-medium flex items-center space-x-2 transition shadow-lg ${
              addedSuccess
                ? 'bg-emerald-500 text-white'
                : preview
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
                : 'bg-white/10 text-slate-500 cursor-not-allowed'
            }`}
          >
            {addedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added to Queue!</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Add to Queue</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
