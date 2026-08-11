import React, { useState } from 'react';
import { useToastStore } from '../../stores/useToastStore';
import type { ToastCategory } from '../../stores/useToastStore';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Music,
  Gamepad2,
  X,
  Volume2,
  VolumeX,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const { history, unreadCount, markAllRead, clearHistory, soundEnabled, toggleSoundEnabled } =
    useToastStore();


  const [isOpen, setIsOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<ToastCategory | 'all'>('all');

  const handleOpenDrawer = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      markAllRead();
    }
  };

  const filteredHistory =
    filterCategory === 'all' ? history : history.filter((h) => h.category === filterCategory);

  return (
    <div className="relative">
      <button
        onClick={handleOpenDrawer}
        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition relative"
        title="Lounge Notification Center"
      >
        <Bell className="w-4 h-4 text-amber-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center shadow animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 z-50 glass-card p-4 rounded-2xl border border-white/15 shadow-2xl w-80 sm:w-96 animate-fadeIn space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">Lounge Activity Log</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.2 rounded-full border border-amber-500/30 font-mono">
                {history.length} events
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={toggleSoundEnabled}
                className={`p-1.5 rounded-lg border transition ${
                  soundEnabled ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-white/5 text-slate-400 border-white/10'
                }`}
                title={soundEnabled ? 'Notification Sounds ON' : 'Notification Sounds Muted'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition"
                  title="Clear Notification History"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto text-[11px] pb-1">
            {(['all', 'music', 'media', 'game', 'warning', 'info'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wider transition shrink-0 ${
                  filterCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Notification List Feed */}
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {filteredHistory.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <Bell className="w-6 h-6 text-slate-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-white">No notifications yet</p>
                <p className="text-[11px] text-slate-500">Lounge room activities will appear here in real-time.</p>
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition flex items-start justify-between ${
                    item.read ? 'bg-white/5 border-white/10' : 'bg-amber-500/10 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-start space-x-2.5 overflow-hidden">
                    <div className="mt-0.5 shrink-0">{getCategoryIcon(item.category, item.icon)}</div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-white leading-tight truncate">{item.title}</h4>
                      {item.message && (
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-snug line-clamp-2">
                          {item.message}
                        </p>
                      )}
                      <span className="text-[9px] text-slate-400 font-mono flex items-center space-x-1 mt-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </div>
                  </div>

                  {item.actionLabel && item.onAction && (
                    <button
                      onClick={() => {
                        item.onAction?.();
                        setIsOpen(false);
                      }}
                      className="ml-2 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold shrink-0 shadow transition"
                    >
                      {item.actionLabel}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function getCategoryIcon(category: ToastCategory, customIcon?: string) {
  if (customIcon === 'mic-off') return <MicOff className="w-4 h-4 text-rose-400" />;
  if (customIcon === 'mic-on') return <Mic className="w-4 h-4 text-emerald-400" />;
  if (customIcon === 'video-off') return <VideoOff className="w-4 h-4 text-rose-400" />;
  if (customIcon === 'video-on') return <Video className="w-4 h-4 text-emerald-400" />;

  switch (category) {
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    case 'media':
      return <Video className="w-4 h-4 text-indigo-400" />;
    case 'music':
      return <Music className="w-4 h-4 text-purple-400" />;
    case 'game':
      return <Gamepad2 className="w-4 h-4 text-pink-400" />;
    case 'info':
    default:
      return <Bell className="w-4 h-4 text-sky-400" />;
  }
}
