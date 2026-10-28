import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Sparkles } from 'lucide-react';
import { useCalculator } from '../hooks/useCalculator';
import { Display } from './Display';
import { Keypad } from './Keypad';
import { HistoryDrawer } from './HistoryDrawer';

export const Calculator: React.FC = () => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const {
    state,
    inputDigit,
    inputDecimal,
    deleteLast,
    clearAll,
    toggleSign,
    selectBinaryOperation,
    executeUnaryOperation,
    evaluate,
    selectHistoryItem,
    clearHistory,
  } = useCalculator();

  // Physical Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        inputDigit(e.key);
        return;
      }

      if (e.key === '.' || e.key === ',') {
        inputDecimal();
        return;
      }

      if (e.key === '+') {
        void selectBinaryOperation('add');
        return;
      }

      if (e.key === '-') {
        void selectBinaryOperation('subtract');
        return;
      }

      if (e.key === '*' || e.key.toLowerCase() === 'x') {
        void selectBinaryOperation('multiply');
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        void selectBinaryOperation('divide');
        return;
      }

      if (e.key === '^') {
        void selectBinaryOperation('power');
        return;
      }

      if (e.key === '%') {
        void executeUnaryOperation('percentage');
        return;
      }

      if (e.key.toLowerCase() === 'r') {
        void executeUnaryOperation('sqrt');
        return;
      }

      if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        void evaluate();
        return;
      }

      if (e.key === 'Backspace') {
        deleteLast();
        return;
      }

      if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        clearAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputDigit, inputDecimal, deleteLast, clearAll, selectBinaryOperation, executeUnaryOperation, evaluate]);

  return (
    <div
      data-testid="calculator-chassis"
      className="bg-[#F8F9FA] rounded-[2.5rem] p-5 sm:p-7 shadow-2xl border border-white max-w-sm sm:max-w-md w-full mx-auto relative transition-all"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-1.5 text-slate-700 font-bold text-sm tracking-wide">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>PASTEL CALC</span>
        </div>
        <button
          type="button"
          onClick={() => setIsHistoryOpen(true)}
          aria-label="View history"
          data-testid="btn-history-toggle"
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-full border border-slate-200/80 shadow-xs transition-colors"
        >
          <HistoryIcon className="w-3.5 h-3.5 text-indigo-500" strokeWidth={2.2} />
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

      {/* Calculator Display */}
      <Display
        displayValue={state.displayValue}
        expressionTrail={state.expressionTrail}
        error={state.error}
        isLoading={state.isLoading}
      />

      {/* Keypad Grid */}
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
