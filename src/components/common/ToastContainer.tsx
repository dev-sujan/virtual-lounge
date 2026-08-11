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
    <div className="fixed top-16 right-4 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto transform transition-all duration-300 ease-out animate-fadeIn flex flex-col p-3.5 rounded-2xl glass-card border border-white/20 shadow-2xl backdrop-blur-xl bg-slate-900/95 text-white relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 overflow-hidden">
              <div className="mt-0.5 shrink-0">{getToastIcon(toast.category, toast.icon)}</div>

              <div className="overflow-hidden pr-2">
                <h4 className="text-xs font-bold leading-tight text-white">{toast.title}</h4>
                {toast.message && (
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-snug line-clamp-2">
                    {toast.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              {toast.actionLabel && toast.onAction && (
                <button
                  onClick={() => {
                    toast.onAction?.();
                    removeToast(toast.id);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold shadow transition"
                >
                  {toast.actionLabel}
                </button>
              )}

              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Progress Timer Line */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500/30 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full animate-progress" />
          </div>
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
