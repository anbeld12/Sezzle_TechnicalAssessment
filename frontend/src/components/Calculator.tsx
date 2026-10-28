import React, { useState, useEffect, useRef, useCallback } from 'react';
import { History as HistoryIcon, Sun, Moon } from 'lucide-react';
import { useCalculator } from '../hooks/useCalculator';
import { Display } from './Display';
import { Keypad } from './Keypad';
import { HistoryDrawer } from './HistoryDrawer';

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
    }, 120);
  }, []);

  useEffect(() => {
    return () => {
      if (pressedTimerRef.current) {
        clearTimeout(pressedTimerRef.current);
      }
    };
  }, []);

  // Physical Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
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

      if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        triggerKeyFeedback('btn-equals');
        void evaluate();
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
      className="bg-[#F8F9FA] dark:bg-[#1E222A] rounded-[2.5rem] p-5 sm:p-7 shadow-2xl border border-white dark:border-[#2E3544] max-w-sm sm:max-w-md w-full mx-auto relative transition-colors duration-200"
    >
      {/* Top Header Bar: Model Badge, Status Pill, Theme Toggle & History */}
      <div className="flex items-center justify-between mb-4 px-1 gap-2">
        <div className="flex items-center gap-2">
          {/* Industrial Model Badge */}
          <span
            data-testid="model-badge"
            className="font-mono text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 dark:bg-[#282D37] dark:text-slate-300 border border-slate-300/70 dark:border-[#353B48] select-none"
          >
            CALC-01
          </span>

          {/* Live Status Pill */}
          <div
            data-testid="api-status-pill"
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all select-none ${
              state.isLoading
                ? 'bg-indigo-100/80 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300/70 dark:border-indigo-800/60 animate-pulse'
                : 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-800/60'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                state.isLoading ? 'bg-indigo-500 animate-ping' : 'bg-emerald-500'
              }`}
            />
            <span>{state.isLoading ? 'Calculating...' : 'API Ready'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Day / Night Pastel Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            data-testid="theme-toggle"
            className="p-1.5 rounded-full bg-white hover:bg-slate-50 dark:bg-[#282D37] dark:hover:bg-[#353B48] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-[#353B48] shadow-2xs transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
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
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white hover:bg-slate-50 dark:bg-[#282D37] dark:hover:bg-[#353B48] px-2.5 py-1.5 rounded-full border border-slate-200/80 dark:border-[#353B48] shadow-2xs transition-colors"
          >
            <HistoryIcon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" strokeWidth={2.2} />
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
        pendingOperation={state.pendingOperation}
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
