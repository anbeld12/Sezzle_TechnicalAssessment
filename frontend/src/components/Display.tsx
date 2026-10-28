import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { FriendlyError } from '../types/calculator';
import { formatDisplayNumber } from '../utils/formatters';

interface DisplayProps {
  displayValue: string;
  expressionTrail: string;
  error: FriendlyError | string | null;
  isLoading: boolean;
}

export const Display: React.FC<DisplayProps> = ({
  displayValue,
  expressionTrail,
  error,
  isLoading,
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
    <div className="bg-white/90 dark:bg-[#14171D] rounded-3xl p-4 sm:p-5 shadow-inner border border-slate-200/70 dark:border-[#222733] flex flex-col justify-between min-h-[7.5rem] relative transition-colors duration-200">
      {/* Expression Trail & Loading indicator */}
      <div className="flex items-center justify-between min-h-[1.25rem] mb-1">
        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-xs">
          {isLoading && (
            <span
              className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 font-medium animate-pulse"
              role="status"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
              Calculating...
            </span>
          )}
        </div>
        <div
          data-testid="expression-trail"
          className="text-right text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-400 tracking-wide truncate max-w-[85%]"
        >
          {expressionTrail || '\u00A0'}
        </div>
      </div>

      {/* Main Display Value */}
      <div
        data-testid="display-value"
        className={`text-right text-slate-700 dark:text-slate-100 font-bold tracking-tight tabular-nums overflow-x-auto overflow-y-hidden select-all ${getFontSize(
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
          className="mt-2 bg-[#FFE5EC] text-[#C9184A] border border-[#FFCCD5] dark:bg-[#3D1E28] dark:text-[#FF758F] dark:border-[#5A2C3C] rounded-xl px-3 py-2 text-xs font-medium flex items-start gap-2 shadow-sm animate-fadeIn leading-snug text-left"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#C9184A] dark:text-[#FF758F]" strokeWidth={2.2} />
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
