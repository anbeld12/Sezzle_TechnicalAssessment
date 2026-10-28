import { useState, useCallback } from 'react';
import type {
  BinaryOperation,
  UnaryOperation,
  CalculatorState,
  HistoryEntry,
} from '../types/calculator';
import { calculateOnServer, CalculatorApiError } from '../services/api';

const OPERATION_SYMBOLS: Record<BinaryOperation, string> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
  power: '^',
};

export function useCalculator() {
  const [state, setState] = useState<CalculatorState>({
    displayValue: '0',
    expressionTrail: '',
    firstOperand: null,
    pendingOperation: null,
    waitingForSecondOperand: false,
    isLoading: false,
    error: null,
    history: [],
  });

  const appendHistory = (expression: string, result: number) => {
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      expression,
      result,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    return (prev: HistoryEntry[]) => [entry, ...prev].slice(0, 25);
  };

  const inputDigit = useCallback((digit: string) => {
    setState((prev) => {
      if (prev.error !== null) {
        return {
          ...prev,
          displayValue: digit,
          firstOperand: null,
          pendingOperation: null,
          waitingForSecondOperand: false,
          error: null,
        };
      }

      if (prev.waitingForSecondOperand) {
        return {
          ...prev,
          displayValue: digit,
          waitingForSecondOperand: false,
        };
      }

      if (prev.displayValue === '0') {
        return {
          ...prev,
          displayValue: digit,
        };
      }

      // Limit to 15 digits to avoid overflow
      if (prev.displayValue.replace('-', '').length >= 15) {
        return prev;
      }

      return {
        ...prev,
        displayValue: prev.displayValue + digit,
      };
    });
  }, []);

  const inputDecimal = useCallback(() => {
    setState((prev) => {
      if (prev.error !== null) {
        return {
          ...prev,
          displayValue: '0.',
          firstOperand: null,
          pendingOperation: null,
          waitingForSecondOperand: false,
          error: null,
        };
      }

      if (prev.waitingForSecondOperand) {
        return {
          ...prev,
          displayValue: '0.',
          waitingForSecondOperand: false,
        };
      }

      if (!prev.displayValue.includes('.')) {
        return {
          ...prev,
          displayValue: prev.displayValue + '.',
        };
      }

      return prev;
    });
  }, []);

  const deleteLast = useCallback(() => {
    setState((prev) => {
      if (prev.error !== null) {
        return { ...prev, error: null };
      }

      if (prev.waitingForSecondOperand) {
        return prev;
      }

      if (prev.displayValue.length <= 1 || (prev.displayValue.length === 2 && prev.displayValue.startsWith('-'))) {
        return { ...prev, displayValue: '0' };
      }

      return {
        ...prev,
        displayValue: prev.displayValue.slice(0, -1),
      };
    });
  }, []);

  const clearAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      displayValue: '0',
      expressionTrail: '',
      firstOperand: null,
      pendingOperation: null,
      waitingForSecondOperand: false,
      isLoading: false,
      error: null,
    }));
  }, []);

  const toggleSign = useCallback(() => {
    setState((prev) => {
      if (prev.displayValue === '0' || prev.error !== null) {
        return prev;
      }
      return {
        ...prev,
        displayValue: prev.displayValue.startsWith('-')
          ? prev.displayValue.slice(1)
          : '-' + prev.displayValue,
      };
    });
  }, []);

  const selectBinaryOperation = useCallback(async (op: BinaryOperation) => {
    const symbol = OPERATION_SYMBOLS[op];

    if (state.pendingOperation !== null && state.waitingForSecondOperand) {
      // Operator replacement
      setState((prev) => ({
        ...prev,
        pendingOperation: op,
        expressionTrail: `${prev.firstOperand} ${symbol}`,
      }));
      return;
    }

    if (state.firstOperand === null) {
      const current = Number(state.displayValue);
      setState((prev) => ({
        ...prev,
        firstOperand: current,
        pendingOperation: op,
        waitingForSecondOperand: true,
        expressionTrail: `${prev.displayValue} ${symbol}`,
        error: null,
      }));
      return;
    }

    if (state.firstOperand !== null && !state.waitingForSecondOperand && state.pendingOperation !== null) {
      // Chained binary evaluation
      const currentSecond = Number(state.displayValue);
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const res = await calculateOnServer({
          operand1: state.firstOperand,
          operand2: currentSecond,
          operation: state.pendingOperation,
        });

        setState((prev) => ({
          ...prev,
          displayValue: String(res.result),
          firstOperand: res.result,
          pendingOperation: op,
          waitingForSecondOperand: true,
          expressionTrail: `${res.result} ${symbol}`,
          isLoading: false,
          error: null,
          history: appendHistory(res.expression, res.result)(prev.history),
        }));
      } catch (err: unknown) {
        const message = err instanceof CalculatorApiError ? err.message : 'Calculation failed';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
      }
    }
  }, [state.displayValue, state.firstOperand, state.pendingOperation, state.waitingForSecondOperand]);

  const executeUnaryOperation = useCallback(async (op: UnaryOperation) => {
    const current = Number(state.displayValue);
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      if (op === 'sqrt') {
        const res = await calculateOnServer({ operand1: current, operation: 'sqrt' });

        if (state.pendingOperation === null) {
          setState((prev) => ({
            ...prev,
            displayValue: String(res.result),
            expressionTrail: res.expression,
            waitingForSecondOperand: true,
            isLoading: false,
            error: null,
            history: appendHistory(res.expression, res.result)(prev.history),
          }));
        } else {
          // Inside a pending binary operation (e.g. 10 + sqrt(9))
          setState((prev) => ({
            ...prev,
            displayValue: String(res.result),
            waitingForSecondOperand: false,
            isLoading: false,
            error: null,
          }));
        }
        return;
      }

      if (op === 'percentage') {
        if (state.firstOperand === null || state.pendingOperation === null) {
          // Unary percentage (50% = 0.5)
          const res = await calculateOnServer({ operand1: current, operation: 'percentage' });
          setState((prev) => ({
            ...prev,
            displayValue: String(res.result),
            expressionTrail: res.expression,
            waitingForSecondOperand: true,
            isLoading: false,
            error: null,
            history: appendHistory(res.expression, res.result)(prev.history),
          }));
        } else {
          // Contextual percentage
          const isAddOrSubtract = state.pendingOperation === 'add' || state.pendingOperation === 'subtract';
          const res = await calculateOnServer({
            operand1: isAddOrSubtract ? state.firstOperand : current,
            operand2: isAddOrSubtract ? current : undefined,
            operation: 'percentage',
          });

          setState((prev) => ({
            ...prev,
            displayValue: String(res.result),
            waitingForSecondOperand: false,
            isLoading: false,
            error: null,
          }));
        }
      }
    } catch (err: unknown) {
      const message = err instanceof CalculatorApiError ? err.message : 'Calculation failed';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, [state.displayValue, state.firstOperand, state.pendingOperation]);

  const evaluate = useCallback(async () => {
    if (state.firstOperand === null || state.pendingOperation === null) {
      return;
    }

    const currentSecond = Number(state.displayValue);
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const res = await calculateOnServer({
        operand1: state.firstOperand,
        operand2: currentSecond,
        operation: state.pendingOperation,
      });

      setState((prev) => ({
        ...prev,
        displayValue: String(res.result),
        expressionTrail: res.expression,
        firstOperand: null,
        pendingOperation: null,
        waitingForSecondOperand: true,
        isLoading: false,
        error: null,
        history: appendHistory(res.expression, res.result)(prev.history),
      }));
    } catch (err: unknown) {
      const message = err instanceof CalculatorApiError ? err.message : 'Calculation failed';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, [state.displayValue, state.firstOperand, state.pendingOperation]);

  const selectHistoryItem = useCallback((result: number) => {
    setState((prev) => ({
      ...prev,
      displayValue: String(result),
      waitingForSecondOperand: false,
      error: null,
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setState((prev) => ({ ...prev, history: [] }));
  }, []);

  return {
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
  };
}
