import React from 'react';
import { X } from 'lucide-react';
import { PRESET_STICKERS, PRESET_GIFS } from './chatConstants';

interface AttachmentPickerModalProps {
  attachTab: 'stickers' | 'gifs' | 'url';
  setAttachTab: (tab: 'stickers' | 'gifs' | 'url') => void;
  onClose: () => void;
  onSendAttachment: (url: string) => void;
  imageUrlInput: string;
  setImageUrlInput: (url: string) => void;
  onSendImageUrl: () => void;
  onShowPolls: () => void;
}

export const AttachmentPickerModal: React.FC<AttachmentPickerModalProps> = ({
  attachTab,
  setAttachTab,
  onClose,
  onSendAttachment,
  imageUrlInput,
  setImageUrlInput,
  onSendImageUrl,
  onShowPolls,
}) => {
  return (
    <div className="p-4 bg-slate-900/95 border-t border-white/10 space-y-3 animate-fadeIn z-20 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex space-x-2 text-xs font-bold">
          <button
            onClick={() => setAttachTab('stickers')}
            className={`px-3 py-1 rounded-lg transition ${
              attachTab === 'stickers' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Stickers
          </button>
          <button
            onClick={() => setAttachTab('gifs')}
            className={`px-3 py-1 rounded-lg transition ${
              attachTab === 'gifs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            GIFs
          </button>
          <button
            onClick={onShowPolls}
            className="px-3 py-1 rounded-lg transition text-slate-400 hover:text-white"
          >
            Polls
          </button>
          <button
            onClick={() => setAttachTab('url')}
            className={`px-3 py-1 rounded-lg transition ${
              attachTab === 'url' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Image URL
          </button>
        </div>

        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {attachTab === 'stickers' && (
        <div className="grid grid-cols-4 gap-2">
          {PRESET_STICKERS.map((s) => (
            <button
              key={s.name}
              onClick={() => onSendAttachment(s.url)}
              className="rounded-xl overflow-hidden border border-white/10 hover:border-indigo-400 transition relative group h-14 shadow"
            >
              <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
              <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] font-bold text-white opacity-90 group-hover:opacity-100">
                {s.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {attachTab === 'gifs' && (
        <div className="grid grid-cols-3 gap-2">
          {PRESET_GIFS.map((g) => (
            <button
              key={g.name}
              onClick={() => onSendAttachment(g.url)}
              className="rounded-xl overflow-hidden border border-white/10 hover:border-indigo-400 transition relative group h-16 shadow"
            >
              <img src={g.url} alt={g.name} className="w-full h-full object-cover" />
              <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] font-bold text-white opacity-90 group-hover:opacity-100">
                {g.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {attachTab === 'url' && (
        <div className="flex space-x-2">
          <input
            type="text"
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
            placeholder="Paste Image / GIF URL..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={onSendImageUrl}
            disabled={!imageUrlInput.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition"
          >
            Attach
          </button>
        </div>
      )}
    </div>
  );
};
