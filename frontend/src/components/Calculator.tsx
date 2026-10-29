import React, { useState, useEffect, useRef, useCallback } from 'react';
import { History as HistoryIcon, Sun, Moon } from 'lucide-react';
import { useCalculator } from '../hooks/useCalculator';
import { useApiHealth } from '../hooks/useApiHealth';
import { Display } from './Display';
import { Keypad } from './Keypad';
import { HistoryDrawer } from './HistoryDrawer';

const COPY_FEEDBACK_MS = 2000;
const KEY_FEEDBACK_MS = 120;

/**
 * Writes text to the system clipboard. Falls back to a hidden textarea +
 * execCommand('copy') when the async Clipboard API is unavailable
 * (e.g. non-secure contexts).
 */
async function writeToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to legacy fallback
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = typeof document.execCommand === 'function' && document.execCommand('copy');
    document.body.removeChild(textarea);
    return Boolean(ok);
  } catch {
    return false;
  }
}

export const Calculator: React.FC = () => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('calc-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (typeof window.matchMedia === 'function') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    }
    return 'light';
  });

  const [pressedKeyId, setPressedKeyId] = useState<string | null>(null);
  const pressedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isCopied, setIsCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isOnline, checkHealth } = useApiHealth();

  const {
    state,
    inputDigit,
    inputDecimal,
    deleteLast,
    clearAll,
    toggleSign,
    pasteValue,
    selectBinaryOperation,
    executeUnaryOperation,
    evaluate,
    selectHistoryItem,
    clearHistory,
  } = useCalculator();

  // Immediately re-check health if an error occurs
  useEffect(() => {
    if (state.error) {
      void checkHealth();
    }
  }, [state.error, checkHealth]);

  // Apply theme class to documentElement and persist
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('calc-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const triggerKeyFeedback = useCallback((keyId: string) => {
    if (pressedTimerRef.current) {
      clearTimeout(pressedTimerRef.current);
    }
    setPressedKeyId(keyId);
    pressedTimerRef.current = setTimeout(() => {
      setPressedKeyId(null);
    }, KEY_FEEDBACK_MS);
  }, []);

  const copyDisplayValue = useCallback(async () => {
    const ok = await writeToClipboard(state.displayValue);
    if (!ok) return;

    if (copiedTimerRef.current) {
      clearTimeout(copiedTimerRef.current);
    }
    setIsCopied(true);
    copiedTimerRef.current = setTimeout(() => {
      setIsCopied(false);
    }, COPY_FEEDBACK_MS);
  }, [state.displayValue]);

  useEffect(() => {
    return () => {
      if (pressedTimerRef.current) clearTimeout(pressedTimerRef.current);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  // Physical Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
        return;
      }

      // 1. Modifier guard: never let browser/OS shortcuts reach calculator keys.
      if (e.ctrlKey || e.metaKey || e.altKey) {
        const isCopyShortcut = (e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'c';
        if (isCopyShortcut) {
          const selection = window.getSelection()?.toString() ?? '';
          if (selection.length === 0) {
            // No user text selection: copy the calculator value instead
            e.preventDefault();
            void copyDisplayValue();
          }
          // With an active selection, let the browser perform its native copy.
        }
        // Ctrl+V is handled by the 'paste' listener; Ctrl+R, Ctrl+Shift+I, Alt+..., etc. pass through.
        return;
      }

      // 2. Global Enter / = Priority: always evaluates calculation and drops any lingering focus
      if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        (document.activeElement as HTMLElement)?.blur();
        triggerKeyFeedback('btn-equals');
        void evaluate();
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        triggerKeyFeedback(`btn-${e.key}`);
        inputDigit(e.key);
        return;
      }

      if (e.key === '.' || e.key === ',') {
        triggerKeyFeedback('btn-decimal');
        inputDecimal();
        return;
      }

      if (e.key === '+') {
        triggerKeyFeedback('btn-add');
        void selectBinaryOperation('add');
        return;
      }

      if (e.key === '-') {
        triggerKeyFeedback('btn-subtract');
        void selectBinaryOperation('subtract');
        return;
      }

      if (e.key === '*' || e.key.toLowerCase() === 'x') {
        triggerKeyFeedback('btn-multiply');
        void selectBinaryOperation('multiply');
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        triggerKeyFeedback('btn-divide');
        void selectBinaryOperation('divide');
        return;
      }

      if (e.key === '^') {
        triggerKeyFeedback('btn-power');
        void selectBinaryOperation('power');
        return;
      }

      if (e.key === '%') {
        triggerKeyFeedback('btn-percentage');
        void executeUnaryOperation('percentage');
        return;
      }

      if (e.key.toLowerCase() === 'r') {
        triggerKeyFeedback('btn-sqrt');
        void executeUnaryOperation('sqrt');
        return;
      }

      if (e.key === 'Backspace') {
        triggerKeyFeedback('btn-del');
        deleteLast();
        return;
      }

      if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        triggerKeyFeedback('btn-ac');
        clearAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    inputDigit,
    inputDecimal,
    deleteLast,
    clearAll,
    selectBinaryOperation,
    executeUnaryOperation,
    evaluate,
    triggerKeyFeedback,
    copyDisplayValue,
  ]);

  // Clipboard Paste Support (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
        return;
      }
      const text = e.clipboardData?.getData('text');
      if (text) {
        pasteValue(text);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [pasteValue]);

  return (
    <div
      data-testid="calculator-chassis"
      className="bg-[#F8F9FA] dark:bg-[#151B28] rounded-[2.5rem] p-5 sm:p-7 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.08),0_4px_12px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7)] border border-white dark:border-slate-700/80 max-w-sm sm:max-w-md w-full mx-auto relative transition-colors duration-200"
    >
      {/* Top Header Bar: Model Badge, Status Pill, Theme Toggle & History */}
      <div className="flex items-center justify-between mb-4 px-1 gap-2">
        <div className="flex items-center gap-2">
          {/* Industrial Model Badge */}
          <span
            data-testid="model-badge"
            className="font-mono text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 dark:bg-[#252E3E] dark:text-white border border-slate-300/70 dark:border-[#3B475C] select-none"
          >
            CALC-01
          </span>

          {/* Live Status Pill */}
          <div
            data-testid="api-status-pill"
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all select-none ${
              state.isLoading
                ? 'bg-indigo-100/80 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-200 border border-indigo-300/70 dark:border-indigo-700/70 animate-pulse'
                : isOnline
                  ? 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-300/70 dark:border-emerald-700/70'
                  : 'bg-rose-100/80 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200 border border-rose-300/70 dark:border-rose-700/70'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                state.isLoading
                  ? 'bg-indigo-500 dark:bg-indigo-300 animate-ping'
                  : isOnline
                    ? 'bg-emerald-500 dark:bg-emerald-400'
                    : 'bg-rose-500 dark:bg-rose-400'
              }`}
            />
            <span>{state.isLoading ? 'Calculating...' : isOnline ? 'API Ready' : 'Server Offline'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Day / Night Pastel Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            data-testid="theme-toggle"
            className="p-1.5 rounded-full bg-white hover:bg-slate-50 dark:bg-[#252E3E] dark:hover:bg-[#2F3A4E] text-slate-600 dark:text-white border border-slate-200/80 dark:border-[#3B475C] shadow-2xs transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* History Drawer Toggle Button */}
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            aria-label="View history"
            data-testid="btn-history-toggle"
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-white hover:text-slate-900 dark:hover:text-white bg-white hover:bg-slate-50 dark:bg-[#252E3E] dark:hover:bg-[#2F3A4E] px-2.5 py-1.5 rounded-full border border-slate-200/80 dark:border-[#3B475C] shadow-2xs transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <HistoryIcon className="w-3.5 h-3.5 text-indigo-500 dark:text-[#D1D7FF]" strokeWidth={2.2} />
            <span>History</span>
            {state.history.length > 0 && (
              <span
                data-testid="history-count"
                className="ml-0.5 bg-indigo-500 text-white rounded-full px-1.5 text-[10px] font-bold"
              >
                {state.history.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Calculator Display */}
      <Display
        displayValue={state.displayValue}
        expressionTrail={state.expressionTrail}
        error={state.error}
        isLoading={state.isLoading}
        isCopied={isCopied}
        onCopy={() => void copyDisplayValue()}
      />

      {/* Keypad Grid with tactile feedback */}
      <Keypad
        onDigit={inputDigit}
        onDecimal={inputDecimal}
        onDelete={deleteLast}
        onClear={clearAll}
        onToggleSign={toggleSign}
        onBinaryOperation={selectBinaryOperation}
        onUnaryOperation={executeUnaryOperation}
        onEvaluate={evaluate}
        isLoading={state.isLoading}
        pressedKeyId={pressedKeyId}
      />

      {/* Slide-over History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={state.history}
        onSelect={selectHistoryItem}
        onClear={clearHistory}
      />
    </div>
  );
};
