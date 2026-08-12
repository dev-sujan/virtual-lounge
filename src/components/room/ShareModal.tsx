import React, { useState } from 'react';
import { X, Copy, Check, Eye, EyeOff, Share2, Link, Zap } from 'lucide-react';
import { buildDirectInviteLink } from '../../utils/roomUtils';

interface ShareModalProps {
  isOpen: boolean;
  roomId: string;
  password: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, roomId, password, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedDirectLink, setCopiedDirectLink] = useState(false);
  const [copiedFullMsg, setCopiedFullMsg] = useState(false);

  if (!isOpen) return null;

  const directLink = buildDirectInviteLink(roomId, password);
  const sharePayload = `🔒 Join my Private Social Lounge!\nRoom ID: ${roomId}\nPasscode: ${password}\n\n⚡ 1-Click Direct Join Link (No password prompt):\n${directLink}`;

  const handleCopyDirectLink = () => {
    navigator.clipboard.writeText(directLink);
    setCopiedDirectLink(true);
    setTimeout(() => setCopiedDirectLink(false), 2000);
  };

  const handleCopyFullMsg = () => {
    navigator.clipboard.writeText(sharePayload);
    setCopiedFullMsg(true);
    setTimeout(() => setCopiedFullMsg(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="glass-card w-full max-w-md rounded-2xl p-4 sm:p-6 border border-white/10 shadow-2xl relative max-h-[90dvh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2.5 text-slate-400 hover:text-white rounded-full transition hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Share Private Lounge</h3>
            <p className="text-xs text-slate-400">1-click direct link or room credentials</p>
          </div>
        </div>

        {/* 1-Click Direct Link Banner */}
        <div className="bg-gradient-to-r from-indigo-950/40 to-purple-950/40 p-4 rounded-xl border border-indigo-500/30 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>1-Click Direct Access Link</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-semibold bg-emerald-500/20 px-2 py-0.2 rounded-full border border-emerald-500/30">
              No password needed
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mb-3">
            Friends opening this link will enter the lounge directly without typing any password.
          </p>
          <button
            onClick={handleCopyDirectLink}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center space-x-2 transition shadow"
          >
            {copiedDirectLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copied 1-Click Direct Link!</span>
              </>
            ) : (
              <>
                <Link className="w-4 h-4" />
                <span>Copy 1-Click Direct Link</span>
              </>
            )}
          </button>
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
                setCopiedDirectLink(true);
                setTimeout(() => setCopiedDirectLink(false), 2000);
              }}
              className="text-xs text-slate-300 hover:text-white p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
              title="Copy Room ID"
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
          onClick={handleCopyFullMsg}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium py-2.5 rounded-xl flex items-center justify-center space-x-2 transition text-xs"
        >
          {copiedFullMsg ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Copied Full Invite Details!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Full Invitation Text</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
