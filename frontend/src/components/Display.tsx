import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

interface DisplayProps {
  displayValue: string;
  expressionTrail: string;
  error: string | null;
  isLoading: boolean;
}

export const Display: React.FC<DisplayProps> = ({
  displayValue,
  expressionTrail,
  error,
  isLoading,
}) => {
  // Dynamic font sizing depending on string length
  const getFontSize = (val: string) => {
    const len = val.length;
    if (len <= 10) return 'text-3xl sm:text-4xl';
    if (len <= 14) return 'text-2xl sm:text-3xl';
    return 'text-xl sm:text-2xl';
  };

  return (
    <div className="bg-white/90 rounded-3xl p-4 sm:p-5 shadow-inner border border-slate-200/70 flex flex-col justify-between min-h-[7.5rem] relative transition-all">
      {/* Expression Trail & Loading indicator */}
      <div className="flex items-center justify-between min-h-[1.25rem] mb-1">
        <div className="flex items-center gap-1 text-slate-400 text-xs">
          {isLoading && (
            <span className="flex items-center gap-1 text-indigo-500 font-medium animate-pulse" role="status">
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
              Calculating...
            </span>
          )}
        </div>
        <div
          data-testid="expression-trail"
          className="text-right text-xs sm:text-sm font-medium text-slate-400 tracking-wide truncate max-w-[85%]"
        >
          {expressionTrail || '\u00A0'}
        </div>
      </div>

      {/* Main Display Value */}
      <div
        data-testid="display-value"
        className={`text-right text-slate-700 font-bold tracking-tight tabular-nums overflow-x-auto overflow-y-hidden select-all ${getFontSize(
          displayValue
        )}`}
      >
        {displayValue}
      </div>

      {/* Error alert banner */}
      {error && (
        <div
          role="alert"
          data-testid="error-banner"
          className="mt-2 bg-[#FFE5EC] text-[#C9184A] border border-[#FFCCD5] rounded-xl px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 shadow-sm animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2.2} />
          <span className="truncate">{error}</span>
        </div>
      )}
    </div>
  );
};
