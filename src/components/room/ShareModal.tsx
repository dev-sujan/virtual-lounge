import React, { useState } from 'react';
import { X, Copy, Check, Eye, EyeOff, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  roomId: string;
  password: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, roomId, password, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const sharePayload = `🔒 Join my Private Social Lounge!\nRoom ID: ${roomId}\nPassword: ${password}\nURL: ${window.location.origin}${window.location.pathname}#room=${roomId}`;

  const handleCopyAll = () => {
    navigator.clipboard.writeText(sharePayload);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="glass-card w-full max-w-md rounded-2xl p-6 border border-white/10 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full transition hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Share Private Room</h3>
            <p className="text-xs text-slate-400">Invite friends with Room ID & Password</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-white/10 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Room ID</span>
              <span className="text-lg font-mono font-extrabold text-indigo-300 tracking-wider">
                {roomId}
              </span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(roomId);
                setCopiedText(true);
                setTimeout(() => setCopiedText(false), 2000);
              }}
              className="text-xs text-slate-300 hover:text-white p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-white/10 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Passcode</span>
              <span className="text-base font-mono font-bold text-slate-200">
                {showPassword ? password : '••••••••'}
              </span>
            </div>
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-slate-300 hover:text-white p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          onClick={handleCopyAll}
          className="w-full glow-btn bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-3 rounded-xl flex items-center justify-center space-x-2 transition shadow-lg"
        >
          {copiedText ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Copied Room Invite Details!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Full Invitation Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
