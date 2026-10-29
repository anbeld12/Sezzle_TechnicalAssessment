import React, { useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  desc: string;
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ['0 – 9', '.'], desc: 'Enter numbers and decimal' },
  { keys: ['+', '−', '×', '÷'], desc: 'Basic arithmetic operations' },
  { keys: ['^', '%', 'R'], desc: 'Exponentiation (xʸ), Percentage, Square root (√x)' },
  { keys: ['Enter', '='], desc: 'Calculate result' },
  { keys: ['Backspace'], desc: 'Delete last character (resets to 0 if calculated)' },
  { keys: ['Escape', 'C'], desc: 'Clear all (AC)' },
  { keys: ['Ctrl+C', 'Cmd+C'], desc: 'Copy current display value to clipboard' },
  { keys: ['Ctrl+V', 'Cmd+V'], desc: 'Paste number into calculator' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      data-testid="shortcuts-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-[#F8F9FA] dark:bg-[#151B28] rounded-[2rem] p-6 shadow-2xl border border-white dark:border-slate-700/80 max-w-md w-full relative transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-semibold text-lg">
            <Keyboard className="w-5 h-5 text-indigo-500 dark:text-[#D1D7FF]" strokeWidth={2.2} />
            <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts modal"
            data-testid="btn-close-shortcuts"
            className="p-1.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <X className="w-5 h-5" strokeWidth={2.2} />
          </button>
        </div>

        {/* Shortcuts Map */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {SHORTCUTS.map((item) => (
            <div
              key={item.desc}
              className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/80 dark:bg-[#04060C]/60 border border-slate-200/60 dark:border-slate-800"
            >
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                {item.desc}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {item.keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-2 py-0.5 font-mono text-[11px] font-semibold bg-slate-100 dark:bg-[#252E3E] text-slate-700 dark:text-slate-100 border border-slate-300 dark:border-[#3B475C] border-b-2 dark:border-b-[#111722] rounded-md shadow-2xs"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/80 text-center text-xs text-slate-400 dark:text-slate-400">
          Press <kbd className="px-1.5 py-0.5 font-mono text-[10px] font-semibold bg-slate-100 dark:bg-[#252E3E] text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-[#3B475C] rounded">Esc</kbd> anytime to close
        </div>
      </div>
    </div>
  );
};
