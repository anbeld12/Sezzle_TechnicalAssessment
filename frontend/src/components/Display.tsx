import React from 'react';
import { AlertCircle, Check, Copy, Loader2 } from 'lucide-react';
import type { FriendlyError } from '../types/calculator';
import { formatDisplayNumber } from '../utils/formatters';

interface DisplayProps {
  displayValue: string;
  expressionTrail: string;
  error: FriendlyError | string | null;
  isLoading: boolean;
  isCopied?: boolean;
  onCopy?: () => void;
}

export const Display: React.FC<DisplayProps> = ({
  displayValue,
  expressionTrail,
  error,
  isLoading,
  isCopied = false,
  onCopy,
}) => {
  const formattedValue = formatDisplayNumber(displayValue);

  // Dynamic font sizing depending on string length
  const getFontSize = (val: string) => {
    const len = val.length;
    if (len <= 10) return 'text-3xl sm:text-4xl';
    if (len <= 14) return 'text-2xl sm:text-3xl';
    return 'text-xl sm:text-2xl';
  };

  const errorTitle = error ? (typeof error === 'string' ? error : error.title) : null;
  const errorMessage = error && typeof error !== 'string' ? error.message : null;

  return (
    <div className="bg-white/90 dark:bg-[#0F172A] rounded-3xl p-4 sm:p-5 shadow-inner border border-slate-200/70 dark:border-slate-700/90 flex flex-col justify-between min-h-[7.5rem] relative transition-colors duration-200">
      {/* Copy control, status feedback & expression trail */}
      <div className="flex items-center justify-between gap-2 min-h-[1.5rem] mb-1">
        <div className="flex items-center gap-1.5 text-xs shrink-0">
          {onCopy && (
            <button
              type="button"
              onClick={onCopy}
              aria-label="Copy result to clipboard"
              data-testid="btn-copy"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#8CE9AC]" strokeWidth={2.4} />
              ) : (
                <Copy className="w-3.5 h-3.5" strokeWidth={2.2} />
              )}
            </button>
          )}
          {isCopied ? (
            <span
              role="status"
              data-testid="copy-feedback"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300/70 dark:bg-[#143829] dark:text-[#8CE9AC] dark:border-[#235C44] animate-fadeIn"
            >
              ✓ Copied to clipboard
            </span>
          ) : (
            isLoading && (
              <span
                className="flex items-center gap-1 text-indigo-500 dark:text-[#C7CEFF] font-medium animate-pulse"
                role="status"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
                Calculating...
              </span>
            )
          )}
        </div>
        <div
          data-testid="expression-trail"
          className="text-right text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-300 tracking-wide truncate min-w-0"
        >
          {expressionTrail || '\u00A0'}
        </div>
      </div>

      {/* Main Display Value */}
      <div
        data-testid="display-value"
        className={`text-right text-slate-700 dark:text-slate-50 font-bold tracking-tight tabular-nums overflow-x-auto overflow-y-hidden select-all ${getFontSize(
          formattedValue
        )}`}
      >
        {formattedValue}
      </div>

      {/* Error alert banner */}
      {error && (
        <div
          role="alert"
          data-testid="error-banner"
          className="mt-2 bg-[#FFE5EC] text-[#C9184A] border border-[#FFCCD5] dark:bg-[#421C29] dark:text-[#FFADC5] dark:border-[#692C41] rounded-xl px-3 py-2 text-xs font-medium flex items-start gap-2 shadow-sm animate-fadeIn leading-snug text-left"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#C9184A] dark:text-[#FFADC5]" strokeWidth={2.2} />
          <div className="flex flex-col">
            <span className="font-bold">{errorTitle}</span>
            {errorMessage && (
              <span className="text-[11px] opacity-90 mt-0.5">{errorMessage}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
