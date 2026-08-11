import React from 'react';
import { useToastStore } from '../../stores/useToastStore';
import {
  CheckCircle2,
  AlertTriangle,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Music,
  Gamepad2,
  X,
  Bell,
} from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto transform transition-all duration-300 ease-out animate-slide-in flex items-start p-3.5 rounded-2xl glass-card border border-white/20 shadow-2xl backdrop-blur-xl bg-slate-900/90 text-white"
        >
          <div className="mr-3 mt-0.5 flex-shrink-0">
            {getToastIcon(toast.category, toast.icon)}
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <h4 className="text-xs font-bold leading-tight text-white flex items-center">
              <span>{toast.title}</span>
            </h4>
            {toast.message && (
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug line-clamp-2">
                {toast.message}
              </p>
            )}
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition flex-shrink-0"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

function getToastIcon(category: string, customIcon?: string) {
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
