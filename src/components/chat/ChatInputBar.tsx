import React from 'react';
import { Send, Image as ImageIcon, Mic, X, Square } from 'lucide-react';
import type { ChatMessage } from '../../types';

interface ChatInputBarProps {
  inputText: string;
  setInputText: (text: string | ((prev: string) => string)) => void;
  editingMsgId: string | null;
  editingText: string;
  setEditingText: (text: string) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleSendMessage: (e?: React.FormEvent) => void;
  showAttachMenu: boolean;
  setShowAttachMenu: (show: boolean) => void;
  startRecording: () => void;
  cancelRecording: () => void;
  stopRecording: () => void;
  isRecording: boolean;
  recordingSeconds: number;
  inputRef: React.RefObject<HTMLInputElement | null>;
  imageUrlInput: string;
  replyingTo: ChatMessage | null;
  setReplyingTo: (msg: ChatMessage | null) => void;
  handleCancelEdit: () => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  inputText,
  setInputText,
  editingMsgId,
  editingText,
  setEditingText,
  handleInputChange,
  handleInputKeyDown,
  handleSendMessage,
  showAttachMenu,
  setShowAttachMenu,
  startRecording,
  cancelRecording,
  stopRecording,
  isRecording,
  recordingSeconds,
  inputRef,
  imageUrlInput,
  replyingTo,
  setReplyingTo,
  handleCancelEdit,
}) => {
  return (
    <div className="shrink-0">
      {/* Reply Preview */}
      {replyingTo && (
        <div className="bg-indigo-950/50 px-4 py-2 border-t border-indigo-500/30 flex items-center justify-between shrink-0">
          <div className="text-xs overflow-hidden">
            <span className="font-bold text-indigo-300">Replying to {replyingTo.senderName}: </span>
            <span className="text-slate-300 truncate">{replyingTo.text}</span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-slate-400 hover:text-white p-1 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Edit Mode Preview */}
      {editingMsgId && (
        <div className="bg-amber-950/50 px-4 py-2 border-t border-amber-500/30 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center space-x-2 font-bold text-amber-300">
            <span>Editing message</span>
          </div>
          <button onClick={handleCancelEdit} className="text-slate-400 hover:text-white p-1 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isRecording ? (
        <div className="p-3 bg-rose-950/80 border-t border-rose-500/40 flex items-center justify-between animate-pulse shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span className="text-xs font-bold text-rose-200 shrink-0">
              Recording ({recordingSeconds}s)
            </span>

            {/* Recording Audio Waveform Visualizer */}
            <div className="hidden sm:flex items-center space-x-1 h-4">
              {[0.6, 1, 0.4, 0.8, 0.5, 0.9].map((h, i) => (
                <div key={i} className="w-1 bg-rose-400 rounded-full animate-bounce" style={{ height: `${h * 100}%` }} />
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={cancelRecording}
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={stopRecording}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Send Voice</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Quick Tap Emoji Ribbon Bar */}
          <div className="px-3 py-1 bg-slate-950/60 border-t border-white/5 flex items-center space-x-2 overflow-x-auto no-scrollbar text-sm">
            <span className="text-[10px] font-bold uppercase text-slate-500 shrink-0 font-mono">Quick:</span>
            {['🔥', '💃', '🎵', '😂', '❤️', '👍', '👏', '🥳', '🍸', '🎧', '🙌', '💯'].map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setInputText((prev) => prev + e)}
                className="hover:scale-125 transform transition px-1 py-0.5 shrink-0"
              >
                {e}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="p-3 bg-slate-900/80 border-t border-white/10 flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className={`p-2 rounded-xl transition ${
                showAttachMenu ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Attach Image / Poll / GIF"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={startRecording}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-xl transition"
              title="Record Voice Note"
            >
              <Mic className="w-4 h-4" />
            </button>

            <div className="flex-1 relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={editingMsgId ? editingText : inputText}
                onChange={(e) => (editingMsgId ? setEditingText(e.target.value) : handleInputChange(e))}
                onKeyDown={handleInputKeyDown}
                placeholder={editingMsgId ? 'Edit message...' : 'Type message or /poll, /8ball, /dice...'}
                className={`w-full bg-white/5 border rounded-xl pl-4 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition ${
                  editingMsgId ? 'border-amber-500/60 focus:border-amber-400' : 'border-white/10 focus:border-indigo-500'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() && !editingText.trim() && !imageUrlInput.trim()}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 disabled:opacity-40 text-white flex items-center justify-center shadow-lg transition transform active:scale-95 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
