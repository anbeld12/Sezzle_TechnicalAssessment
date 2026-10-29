import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpLeft, Check, Copy, History as HistoryIcon, Trash2, X } from 'lucide-react';
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async (id: string, result: number) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(String(result));
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = String(result);
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        if (typeof document.execCommand === 'function') {
          document.execCommand('copy');
        }
        document.body.removeChild(textarea);
      }

      setCopiedId(id);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedId(null);
      }, 1800);
    } catch (err) {
      console.error('Failed to copy history item:', err);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      data-testid="history-drawer"
      className="absolute inset-0 bg-[#F8F9FA]/95 dark:bg-[#151B28]/95 backdrop-blur-md rounded-[2.5rem] p-6 z-20 flex flex-col justify-between shadow-2xl border border-white dark:border-slate-700/80 transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold text-lg">
          <HistoryIcon className="w-5 h-5 text-indigo-500 dark:text-[#D1D7FF]" strokeWidth={2.2} />
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
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              data-testid="history-entry-item"
              onClick={() => {
                onSelect(item.result);
                onClose();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(item.result);
                  onClose();
                }
              }}
              className="w-full text-left bg-white/80 dark:bg-[#04060C]/80 hover:bg-white dark:hover:bg-[#04060C] p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-sm transition-all group cursor-pointer active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <div className="text-xs text-slate-400 dark:text-slate-400 font-medium flex items-center justify-between">
                <span>{item.timestamp}</span>
                <div className="flex items-center gap-2">
                  <span className="opacity-0 group-hover:opacity-100 text-indigo-500 dark:text-[#D1D7FF] transition-opacity flex items-center gap-1 text-[11px] font-medium">
                    <ArrowUpLeft className="w-3 h-3" strokeWidth={2.2} />
                    <span>Click to load</span>
                  </span>
                  <button
                    type="button"
                    data-testid="btn-copy-history"
                    title={copiedId === item.id ? 'Copied' : 'Copy result'}
                    aria-label={copiedId === item.id ? 'Copied' : 'Copy result to clipboard'}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleCopy(item.id, item.result);
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                      copiedId === item.id
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-[#0E3522] dark:text-[#9AF5BA]'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" strokeWidth={2} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <Copy className="w-3.5 h-3.5" strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-200 font-medium truncate mt-0.5">{item.expression}</div>
              <div className="text-lg font-bold text-slate-800 dark:text-white tracking-tight mt-0.5">{item.result}</div>
            </div>
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
          className="flex items-center gap-1.5 text-xs font-semibold text-[#C9184A] dark:text-[#FFB5CA] hover:bg-[#FFE5EC] dark:hover:bg-[#3D1622] px-3 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Trash2 className="w-4 h-4" strokeWidth={2.2} />
          <span>Clear History</span>
        </button>
      </div>
    </div>
  );
};
