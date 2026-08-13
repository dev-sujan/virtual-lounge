import React from 'react';
import { Modal } from '../common/Modal';

interface PollCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pollQuestion: string;
  setPollQuestion: (q: string) => void;
  pollOptions: string[];
  setPollOptions: (opts: string[]) => void;
  onCreatePoll: () => void;
}

export const PollCreationModal: React.FC<PollCreationModalProps> = ({
  isOpen,
  onClose,
  pollQuestion,
  setPollQuestion,
  pollOptions,
  setPollOptions,
  onCreatePoll,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Interactive Poll" maxWidth="max-w-md">
      <div className="space-y-4 text-sm">
        <input
          type="text"
          value={pollQuestion}
          onChange={(e) => setPollQuestion(e.target.value)}
          placeholder="Poll Question (e.g., What genre next?)"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />

        <div className="space-y-2">
          {pollOptions.map((opt, idx) => (
            <input
              key={idx}
              type="text"
              value={opt}
              onChange={(e) => {
                const copy = [...pollOptions];
                copy[idx] = e.target.value;
                setPollOptions(copy);
              }}
              placeholder={`Option ${idx + 1}`}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          ))}
        </div>

        <div className="flex justify-between items-center pt-2">
          {pollOptions.length < 4 && (
            <button
              onClick={() => setPollOptions([...pollOptions, ''])}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              + Add Option
            </button>
          )}

          <div className="ml-auto flex items-center space-x-2">
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onCreatePoll}
              disabled={!pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-bold px-4 py-2 rounded-xl shadow transition"
            >
              Create Poll
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
