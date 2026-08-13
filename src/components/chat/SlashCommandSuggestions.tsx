import React from 'react';
import { Terminal } from 'lucide-react';
import type { SlashCommandInfo } from './chatConstants';

interface SlashCommandSuggestionsProps {
  commands: SlashCommandInfo[];
  selectedIndex: number;
  onSelectCommand: (cmd: SlashCommandInfo) => void;
  onHoverCommand: (index: number) => void;
}

export const SlashCommandSuggestions: React.FC<SlashCommandSuggestionsProps> = ({
  commands,
  selectedIndex,
  onSelectCommand,
  onHoverCommand,
}) => {
  if (commands.length === 0) return null;

  return (
    <div className="absolute bottom-16 left-3 right-3 z-30 glass-card rounded-2xl border border-indigo-500/40 bg-slate-900/95 shadow-2xl p-2 animate-fadeIn space-y-1 max-h-56 overflow-y-auto">
      <div className="px-2.5 py-1.5 flex justify-between items-center text-[10px] uppercase font-bold text-indigo-300 border-b border-white/10">
        <span className="flex items-center space-x-1.5">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Slash Commands</span>
        </span>
        <span className="text-slate-400 font-mono">Use ↑↓ & Tab / Enter to select</span>
      </div>

      {commands.map((cmd, idx) => {
        const isSelected = idx === selectedIndex;
        return (
          <button
            key={cmd.command}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelectCommand(cmd);
            }}
            onMouseEnter={() => onHoverCommand(idx)}
            className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between cursor-pointer ${isSelected
                ? 'bg-indigo-600/90 text-white shadow-md'
                : 'hover:bg-white/5 text-slate-200'
              }`}
          >
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <span className="text-base shrink-0">{cmd.icon}</span>
              <div className="overflow-hidden">
                <div className="flex items-center space-x-2">
                  <span className="font-bold font-mono text-xs text-indigo-200">{cmd.command}</span>
                  <span className="text-[10px] opacity-75 font-mono truncate text-slate-300">{cmd.syntax}</span>
                </div>
                <p className="text-[11px] text-slate-300 opacity-90 truncate">{cmd.description}</p>
              </div>
            </div>

            {isSelected && (
              <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded text-white shrink-0">
                Tab / ↵
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
