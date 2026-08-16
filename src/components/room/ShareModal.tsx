import React, { useState } from 'react';
import { X, Eye, EyeOff, Share2, Link, Zap, QrCode, Smartphone, Mail } from 'lucide-react';
import { buildDirectInviteLink } from '../../utils/roomUtils';
import { Modal } from '../common/Modal';
import { CopyButton } from '../common/CopyButton';

interface ShareModalProps {
  isOpen: boolean;
  roomId: string;
  password: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, roomId, password, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'share' | 'qr'>('link');

  const directLink = buildDirectInviteLink(roomId, password);
  const shareTitle = `Join my SyncLounge Private Room (${roomId})`;
  const shareText = `🎵 Join my private SyncLounge room! Watch YouTube synced in real-time, chat with E2EE, and play mini-games together.`;
  const fullShareMessage = `🔒 ${shareText}\n\n⚡ 1-Click Direct Join:\n${directLink}\n\n🔑 Room ID: ${roomId} | Passcode: ${password}`;

  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleNativeShare = async () => {
    if (!hasNativeShare) return;
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: directLink,
      });
    } catch {
      // User dismissed or canceled
    }
  };

  const socialPlatforms = [
    {
      name: 'WhatsApp',
      color: 'from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500',
      textColor: 'text-emerald-300',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.667-.699c.974.547 1.879.833 2.793.833h.005c3.18 0 5.767-2.586 5.768-5.766 0-1.54-.599-2.989-1.688-4.078-1.09-1.089-2.539-1.689-4.084-1.641zM12.031 2C6.505 2 2.015 6.49 2.015 12.016c0 1.94.557 3.754 1.523 5.304L2 22l4.819-1.488a9.983 9.983 0 005.212 1.504h.005c5.526 0 10.016-4.49 10.016-10.016C22.052 6.49 17.557 2 12.031 2zm3.328 12.518c-.143.402-.83.743-1.157.784-.316.039-.718.06-2.12-.518-1.583-.653-2.614-2.271-2.693-2.376-.079-.105-.643-.855-.643-1.632 0-.777.409-1.158.555-1.316.143-.158.314-.198.419-.198.105 0 .21.002.302.007.097.005.228-.037.356.27.132.316.447 1.09.486 1.17.039.079.066.172.013.277-.053.105-.079.172-.158.264-.079.092-.167.206-.239.277-.079.079-.161.164-.069.322.092.158.41 6.77 1.484 1.341.656.347 1.209.455 1.38.534.172.079.272.066.374-.053.102-.118.437-.508.555-.683.118-.175.236-.145.394-.086.158.059 1.003.473 1.174.558.172.086.287.129.329.201.042.072.042.417-.101.819z" />
        </svg>
      ),
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareMessage)}`,
    },
    {
      name: 'Telegram',
      color: 'from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500',
      textColor: 'text-sky-300',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .36z" />
        </svg>
      ),
      url: `https://t.me/share/url?url=${encodeURIComponent(directLink)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'X (Twitter)',
      color: 'from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800',
      textColor: 'text-slate-200',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(directLink)}`,
    },
    {
      name: 'Reddit',
      color: 'from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500',
      textColor: 'text-orange-300',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.56 12 8 12.56 8 13.25c0 .688.56 1.25 1.25 1.25.688 0 1.25-.562 1.25-1.25 0-.69-.562-1.25-1.25-1.25zm5.5 0c-.688 0-1.25.56-1.25 1.25 0 .688.562 1.25 1.25 1.25.69 0 1.25-.562 1.25-1.25 0-.69-.56-1.25-1.25-1.25zm-5.465 4.316a.434.434 0 0 0-.14.606c.642.983 1.696 1.48 2.855 1.48 1.16 0 2.213-.497 2.855-1.48a.434.434 0 0 0-.728-.472c-.48.736-1.277 1.108-2.127 1.108-.85 0-1.647-.372-2.127-1.108a.434.434 0 0 0-.588-.134z" />
        </svg>
      ),
      url: `https://reddit.com/submit?url=${encodeURIComponent(directLink)}&title=${encodeURIComponent(shareTitle)}`,
    },
    {
      name: 'Facebook',
      color: 'from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700',
      textColor: 'text-blue-300',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(directLink)}`,
    },
    {
      name: 'Email',
      color: 'from-violet-700 to-purple-800 hover:from-violet-600 hover:to-purple-700',
      textColor: 'text-violet-300',
      icon: <Mail className="w-4 h-4" />,
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(fullShareMessage)}`,
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md" className="max-h-[90dvh] overflow-y-auto">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-2.5 text-slate-400 hover:text-white rounded-full transition hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center z-10"
        title="Close Modal"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-center space-x-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 border border-indigo-400/40 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
          <Share2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Share Private Lounge</h3>
          <p className="text-xs text-slate-400">Invite friends via 1-click link, social apps, or QR</p>
        </div>
      </div>

      {/* Tab Switching */}
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('link')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
            activeTab === 'link' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Link className="w-3.5 h-3.5" />
          <span>Direct Link</span>
        </button>
        <button
          onClick={() => setActiveTab('share')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
            activeTab === 'share' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share On</span>
        </button>
        <button
          onClick={() => setActiveTab('qr')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition ${
            activeTab === 'qr' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>QR Code</span>
        </button>
      </div>

      {activeTab === 'share' ? (
        <div className="space-y-4 mb-4 animate-fadeIn">
          {/* Native System Share Button (if supported) */}
          {hasNativeShare && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 border border-indigo-400/40 transition transform active:scale-98"
            >
              <Smartphone className="w-4 h-4" />
              <span>Share via System / Installed Apps...</span>
            </button>
          )}

          {/* Social Platforms Grid */}
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-white/10 space-y-2">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-2">
              Share to Messaging & Social
            </span>

            <div className="grid grid-cols-2 gap-2">
              {socialPlatforms.map((platform) => (
                <a
                  key={platform.name}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2.5 rounded-xl bg-gradient-to-r ${platform.color} border border-white/10 flex items-center space-x-2.5 text-white transition transform active:scale-95 shadow-sm`}
                >
                  <div className="shrink-0">{platform.icon}</div>
                  <span className="text-xs font-bold truncate">{platform.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'qr' ? (
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-white/15 flex flex-col items-center justify-center text-center space-y-3 mb-6 animate-fadeIn">
          <div className="p-3 bg-white rounded-2xl shadow-2xl border border-slate-200">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(directLink)}`}
              alt="Room Invite QR Code"
              className="w-48 h-48 object-contain rounded-lg"
            />
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-300 block">Scan to Join Lounge</span>
            <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
              Scan this QR code with any smartphone camera to open the lounge directly!
            </p>
          </div>
        </div>
      ) : (
        /* 1-Click Direct Link Banner */
        <div className="bg-gradient-to-r from-indigo-950/40 to-purple-950/40 p-4 rounded-xl border border-indigo-500/30 mb-4 animate-fadeIn">
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
          <CopyButton
            textToCopy={directLink}
            label="Copy 1-Click Direct Link"
            successMessage="Copied 1-Click Direct Link!"
            className="w-full !bg-indigo-600 hover:!bg-indigo-500 !text-white !border-none shadow py-2.5"
          />
        </div>
      )}

      {/* Room ID and Passcode Cards */}
      <div className="space-y-3 mb-5">
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-white/10 flex justify-between items-center">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Room ID</span>
            <span className="text-lg font-mono font-extrabold text-indigo-300 tracking-wider">
              {roomId}
            </span>
          </div>
          <CopyButton
            textToCopy={roomId}
            className="!p-2"
          />
        </div>

        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-white/10 flex justify-between items-center">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Passcode</span>
            <span className="text-base font-mono font-bold text-slate-200">
              {showPassword ? password : '••••••••'}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <CopyButton
              textToCopy={password}
              className="!p-2"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-slate-300 hover:text-white p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
              title={showPassword ? 'Hide Passcode' : 'Show Passcode'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <CopyButton
        textToCopy={fullShareMessage}
        label="Copy Full Invitation Text"
        successMessage="Copied Full Invite Details!"
        className="w-full py-2.5 rounded-xl"
      />
    </Modal>
  );
};
