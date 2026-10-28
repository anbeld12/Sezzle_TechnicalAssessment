import React from 'react';
import { History as HistoryIcon, Trash2, X } from 'lucide-react';
import type { HistoryEntry } from '../types/calculator';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onSelect: (result: number) => void;
  onClear: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onClear,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      data-testid="history-drawer"
      className="absolute inset-0 bg-[#F8F9FA]/95 dark:bg-[#1E293B]/95 backdrop-blur-md rounded-[2.5rem] p-6 z-20 flex flex-col justify-between shadow-2xl border border-white dark:border-slate-700/80 transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold text-lg">
          <HistoryIcon className="w-5 h-5 text-indigo-500 dark:text-[#C7CEFF]" strokeWidth={2.2} />
          <span>Calculation History</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close history"
          className="p-1.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-slate-500 dark:text-slate-400 transition-colors"
        >
          <X className="w-5 h-5" strokeWidth={2.2} />
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2.5 my-2">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-400 text-sm text-center px-4">
            <HistoryIcon className="w-8 h-8 mb-2 opacity-40" strokeWidth={1.5} />
            <p>No calculations recorded yet.</p>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">Calculations will appear here automatically.</p>
          </div>
        ) : (
          history.map((item) => (
            <button
              key={item.id}
              type="button"
              data-testid="history-entry-item"
              onClick={() => {
                onSelect(item.result);
                onClose();
              }}
              className="w-full text-left bg-white/80 dark:bg-[#0F172A]/80 hover:bg-white dark:hover:bg-[#0F172A] p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-sm transition-all group active:scale-[0.98]"
            >
              <div className="text-xs text-slate-400 dark:text-slate-400 font-medium flex justify-between">
                <span>{item.timestamp}</span>
                <span className="opacity-0 group-hover:opacity-100 text-indigo-500 dark:text-[#C7CEFF] transition-opacity">
                  Use result ↵
                </span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-200 font-medium truncate mt-0.5">{item.expression}</div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-50 tracking-tight mt-0.5">{item.result}</div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex justify-end">
        <button
          type="button"
          onClick={onClear}
          disabled={history.length === 0}
          aria-label="Clear all history"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#C9184A] dark:text-[#FFADC5] hover:bg-[#FFE5EC] dark:hover:bg-[#421C29] px-3 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Trash2 className="w-4 h-4" strokeWidth={2.2} />
          <span>Clear History</span>
        </button>
      </div>
    </div>
  );
};
