import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalculator } from './useCalculator';
import * as apiService from '../services/api';
import type { CalculateResponse } from '../types/calculator';

vi.mock('../services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/api')>();
  return {
    ...actual,
    calculateOnServer: vi.fn(),
  };
});

describe('useCalculator Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useCalculator());

    expect(result.current.state.displayValue).toBe('0');
    expect(result.current.state.expressionTrail).toBe('');
    expect(result.current.state.firstOperand).toBeNull();
    expect(result.current.state.pendingOperation).toBeNull();
    expect(result.current.state.waitingForSecondOperand).toBe(false);
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.error).toBeNull();
    expect(result.current.state.history).toEqual([]);
  });

  it('handles digit entry and multi-digit numbers', () => {
    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('4');
    });
    expect(result.current.state.displayValue).toBe('4');

    act(() => {
      result.current.inputDigit('2');
    });
    expect(result.current.state.displayValue).toBe('42');
  });

  it('handles decimal input and ignores repeated dots', () => {
    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('3');
      result.current.inputDecimal();
      result.current.inputDigit('1');
      result.current.inputDecimal(); // should be ignored
      result.current.inputDigit('4');
    });

    expect(result.current.state.displayValue).toBe('3.14');
  });

  it('handles backspace delete and sign toggling', () => {
    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('9');
      result.current.inputDigit('8');
    });
    expect(result.current.state.displayValue).toBe('98');

    act(() => {
      result.current.toggleSign();
    });
    expect(result.current.state.displayValue).toBe('-98');

    act(() => {
      result.current.deleteLast();
    });
    expect(result.current.state.displayValue).toBe('-9');

    act(() => {
      result.current.deleteLast();
    });
    expect(result.current.state.displayValue).toBe('0');
  });

  it('resets state on clearAll (AC)', () => {
    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('7');
      result.current.selectBinaryOperation('add');
      result.current.clearAll();
    });

    expect(result.current.state.displayValue).toBe('0');
    expect(result.current.state.firstOperand).toBeNull();
    expect(result.current.state.pendingOperation).toBeNull();
    expect(result.current.state.expressionTrail).toBe('');
  });

  it('replaces pending operator when pressed consecutively', () => {
    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('5');
    });

    act(() => {
      void result.current.selectBinaryOperation('add');
    });
    expect(result.current.state.pendingOperation).toBe('add');
    expect(result.current.state.expressionTrail).toBe('5 +');

    act(() => {
      void result.current.selectBinaryOperation('multiply');
    });
    expect(result.current.state.pendingOperation).toBe('multiply');
    expect(result.current.state.expressionTrail).toBe('5 ×');
  });

  it('evaluates binary operation on evaluate (=)', async () => {
    const mockCalculate = vi.mocked(apiService.calculateOnServer);
    mockCalculate.mockResolvedValueOnce({
      result: 15,
      operation: 'add',
      operand1: 10,
      operand2: 5,
      expression: '10 + 5 = 15',
    });

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('1');
      result.current.inputDigit('0');
    });

    act(() => {
      void result.current.selectBinaryOperation('add');
    });

    act(() => {
      result.current.inputDigit('5');
    });

    await act(async () => {
      await result.current.evaluate();
    });

    expect(mockCalculate).toHaveBeenCalledWith({
      operand1: 10,
      operand2: 5,
      operation: 'add',
    });
    expect(result.current.state.displayValue).toBe('15');
    expect(result.current.state.expressionTrail).toBe('10 + 5 = 15');
    expect(result.current.state.firstOperand).toBeNull();
    expect(result.current.state.history.length).toBe(1);
    expect(result.current.state.history[0].result).toBe(15);
  });

  it('handles chained operations sequentially', async () => {
    const mockCalculate = vi.mocked(apiService.calculateOnServer);
    mockCalculate.mockResolvedValueOnce({
      result: 8,
      operation: 'add',
      operand1: 5,
      operand2: 3,
      expression: '5 + 3 = 8',
    });

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('5');
    });

    act(() => {
      void result.current.selectBinaryOperation('add');
    });

    act(() => {
      result.current.inputDigit('3');
    });

    await act(async () => {
      await result.current.selectBinaryOperation('multiply');
    });

    expect(mockCalculate).toHaveBeenCalledWith({
      operand1: 5,
      operand2: 3,
      operation: 'add',
    });
    expect(result.current.state.displayValue).toBe('8');
    expect(result.current.state.firstOperand).toBe(8);
    expect(result.current.state.pendingOperation).toBe('multiply');
    expect(result.current.state.expressionTrail).toBe('8 ×');
  });

  it('handles unary square root operation', async () => {
    const mockCalculate = vi.mocked(apiService.calculateOnServer);
    mockCalculate.mockResolvedValueOnce({
      result: 9,
      operation: 'sqrt',
      operand1: 81,
      expression: '√(81) = 9',
    });

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('8');
      result.current.inputDigit('1');
    });

    await act(async () => {
      await result.current.executeUnaryOperation('sqrt');
    });

    expect(mockCalculate).toHaveBeenCalledWith({
      operand1: 81,
      operation: 'sqrt',
    });
    expect(result.current.state.displayValue).toBe('9');
    expect(result.current.state.expressionTrail).toBe('√(81) = 9');
  });

  it('handles API error state and clears on new digit entry', async () => {
    const mockCalculate = vi.mocked(apiService.calculateOnServer);
    mockCalculate.mockRejectedValueOnce(
      new apiService.CalculatorApiError('division by zero is undefined', 'DIVISION_BY_ZERO', 422)
    );

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('1');
      result.current.inputDigit('0');
    });

    act(() => {
      void result.current.selectBinaryOperation('divide');
    });

    act(() => {
      result.current.inputDigit('0');
    });

    await act(async () => {
      await result.current.evaluate();
    });

    expect(result.current.state.error).toEqual({
      title: "Can't divide by zero",
      message: 'Try dividing by any other number.',
    });
    // Stuck operator state is cleared on error
    expect(result.current.state.pendingOperation).toBeNull();
    expect(result.current.state.waitingForSecondOperand).toBe(true);

    // Entering a new digit should auto-clear the error
    act(() => {
      result.current.inputDigit('7');
    });

    expect(result.current.state.error).toBeNull();
    expect(result.current.state.displayValue).toBe('7');
  });

  it('allows selecting and clearing history', () => {
    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.selectHistoryItem(99);
    });
    expect(result.current.state.displayValue).toBe('99');

    act(() => {
      result.current.clearHistory();
    });
    expect(result.current.state.history).toEqual([]);
  });

  it('caps display value at 15 digits', () => {
    const { result } = renderHook(() => useCalculator());

    for (let i = 0; i < 20; i++) {
      act(() => {
        result.current.inputDigit('1');
      });
    }

    expect(result.current.state.displayValue.length).toBe(15);
  });

  it('handles percentage in single operand and contextual modes', async () => {
    const mockCalculate = vi.mocked(apiService.calculateOnServer);
    // 1. Single operand mode
    mockCalculate.mockResolvedValueOnce({
      result: 0.5,
      operation: 'percentage',
      operand1: 50,
      expression: '50% = 0.5',
    });

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('5');
      result.current.inputDigit('0');
    });

    await act(async () => {
      await result.current.executeUnaryOperation('percentage');
    });

    expect(mockCalculate).toHaveBeenCalledWith({
      operand1: 50,
      operation: 'percentage',
    });
    expect(result.current.state.displayValue).toBe('0.5');

    // 2. Contextual add mode: 200 + 10% -> resolves 10% of 200 = 20
    mockCalculate.mockResolvedValueOnce({
      result: 20,
      operation: 'percentage',
      operand1: 200,
      operand2: 10,
      expression: '10% of 200 = 20',
    });

    act(() => {
      result.current.clearAll();
      result.current.inputDigit('2');
      result.current.inputDigit('0');
      result.current.inputDigit('0');
    });

    act(() => {
      void result.current.selectBinaryOperation('add');
    });

    act(() => {
      result.current.inputDigit('1');
      result.current.inputDigit('0');
    });

    await act(async () => {
      await result.current.executeUnaryOperation('percentage');
    });

    expect(mockCalculate).toHaveBeenCalledWith({
      operand1: 200,
      operand2: 10,
      operation: 'percentage',
    });
    expect(result.current.state.displayValue).toBe('20');
  });

  it('handles sqrt inside pending binary operation', async () => {
    const mockCalculate = vi.mocked(apiService.calculateOnServer);
    mockCalculate.mockResolvedValueOnce({
      result: 3,
      operation: 'sqrt',
      operand1: 9,
      expression: '√(9) = 3',
    });

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('1');
      result.current.inputDigit('0');
    });

    act(() => {
      void result.current.selectBinaryOperation('add');
    });

    act(() => {
      result.current.inputDigit('9');
    });

    await act(async () => {
      await result.current.executeUnaryOperation('sqrt');
    });

    expect(mockCalculate).toHaveBeenCalledWith({
      operand1: 9,
      operation: 'sqrt',
    });
    expect(result.current.state.displayValue).toBe('3');
  });

  it('handles chained calculation failure and unary failure', async () => {
    const mockCalculate = vi.mocked(apiService.calculateOnServer);
    mockCalculate.mockRejectedValueOnce(new Error('Network drop'));

    const { result } = renderHook(() => useCalculator());

    act(() => {
      result.current.inputDigit('5');
    });
    act(() => {
      void result.current.selectBinaryOperation('add');
    });
    act(() => {
      result.current.inputDigit('2');
    });

    await act(async () => {
      await result.current.selectBinaryOperation('multiply');
    });

    expect(result.current.state.error).toEqual({
      title: 'Incomplete calculation',
      message: 'Network drop',
    });
    expect(result.current.state.pendingOperation).toBeNull();
    expect(result.current.state.waitingForSecondOperand).toBe(true);

    // Unary failure
    mockCalculate.mockRejectedValueOnce(
      new apiService.CalculatorApiError('square root of a negative number is undefined in real numbers', 'NEGATIVE_SQUARE_ROOT', 422)
    );

    act(() => {
      result.current.clearAll();
      result.current.inputDigit('4');
      result.current.toggleSign();
    });

    await act(async () => {
      await result.current.executeUnaryOperation('sqrt');
    });

    expect(result.current.state.error).toEqual({
      title: 'Invalid square root',
      message: 'Square roots only work with zero or positive numbers.',
    });
    expect(result.current.state.pendingOperation).toBeNull();
    expect(result.current.state.waitingForSecondOperand).toBe(true);
  });

  describe('Edge-Case Hardening & Stress Testing', () => {
    it('resets display to 0 on backspace when waitingForSecondOperand or display has scientific notation', async () => {
      const mockCalculate = vi.mocked(apiService.calculateOnServer);
      mockCalculate.mockResolvedValueOnce({
        result: 1.4134e73,
        operation: 'power',
        operand1: 10,
        operand2: 73,
        expression: '10 ^ 73 = 1.4134e+73',
      });

      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.inputDigit('1');
        result.current.inputDigit('0');
      });
      act(() => {
        void result.current.selectBinaryOperation('power');
      });
      act(() => {
        result.current.inputDigit('7');
        result.current.inputDigit('3');
      });

      await act(async () => {
        await result.current.evaluate();
      });

      expect(result.current.state.waitingForSecondOperand).toBe(true);
      expect(result.current.state.displayValue).toContain('e');

      // Post-result Backspace must reset cleanly to '0' instead of slicing off exponent digits
      act(() => {
        result.current.deleteLast();
      });

      expect(result.current.state.displayValue).toBe('0');
      expect(result.current.state.waitingForSecondOperand).toBe(false);
    });

    it('handles clipboard paste for formatted numbers and ignores non-numbers', () => {
      const { result } = renderHook(() => useCalculator());

      // 1. Valid formatted number with commas
      act(() => {
        const success = result.current.pasteValue('1,250.75');
        expect(success).toBe(true);
      });
      expect(result.current.state.displayValue).toBe('1250.75');

      // 2. Valid negative number with spaces
      act(() => {
        const success = result.current.pasteValue(' -42.5 ');
        expect(success).toBe(true);
      });
      expect(result.current.state.displayValue).toBe('-42.5');

      // 3. Invalid non-numeric string gracefully ignored
      act(() => {
        const success = result.current.pasteValue('hello-world');
        expect(success).toBe(false);
      });
      expect(result.current.state.displayValue).toBe('-42.5');

      // 4. Exceeds length bounds gracefully ignored
      act(() => {
        const success = result.current.pasteValue('1234567890123456789');
        expect(success).toBe(false);
      });
      expect(result.current.state.displayValue).toBe('-42.5');
    });

    it('prevents rapid concurrent spam while calculation is in-flight', async () => {
      let resolvePromise: (value: CalculateResponse) => void = () => {};
      const pendingPromise = new Promise<CalculateResponse>((resolve) => {
        resolvePromise = resolve;
      });

      const mockCalculate = vi.mocked(apiService.calculateOnServer);
      mockCalculate.mockReturnValueOnce(pendingPromise);

      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.inputDigit('5');
      });
      act(() => {
        void result.current.selectBinaryOperation('add');
      });
      act(() => {
        result.current.inputDigit('5');
      });

      // First evaluation triggers calculateOnServer
      let firstEvalPromise: Promise<void>;
      act(() => {
        firstEvalPromise = result.current.evaluate();
      });

      // Second rapid evaluation while loading must be ignored
      act(() => {
        void result.current.evaluate();
      });

      expect(mockCalculate).toHaveBeenCalledTimes(1);

      // Resolve the initial promise
      await act(async () => {
        resolvePromise({
          result: 10,
          operation: 'add',
          operand1: 5,
          operand2: 5,
          expression: '5 + 5 = 10',
        });
        await firstEvalPromise!;
      });

      expect(result.current.state.displayValue).toBe('10');
      expect(mockCalculate).toHaveBeenCalledTimes(1);
    });

    it('safely handles lone negative sign and trailing decimal in calculations', async () => {
      const mockCalculate = vi.mocked(apiService.calculateOnServer);
      mockCalculate.mockResolvedValueOnce({
        result: 0,
        operation: 'add',
        operand1: 0,
        operand2: 0,
        expression: '0 + 0 = 0',
      });

      const { result } = renderHook(() => useCalculator());

      // Enter "-" then "." -> display is "-0." or "-"
      act(() => {
        result.current.toggleSign();
      });
      act(() => {
        result.current.inputDecimal();
      });

      // User hits operator without typing any numbers: should safely parse as 0 without NaN
      act(() => {
        void result.current.selectBinaryOperation('add');
      });

      expect(result.current.state.firstOperand).toBe(0);
      expect(result.current.state.error).toBeNull();
    });

    it('resets display value to 0 and updates expression trail when binary operator is selected', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.inputDigit('4');
        result.current.inputDigit('2');
      });
      expect(result.current.state.displayValue).toBe('42');

      act(() => {
        void result.current.selectBinaryOperation('add');
      });

      // Display value must reset to '0' indicating readiness for the second operand
      expect(result.current.state.displayValue).toBe('0');
      expect(result.current.state.firstOperand).toBe(42);
      expect(result.current.state.pendingOperation).toBe('add');
      expect(result.current.state.expressionTrail).toBe('42 +');
      expect(result.current.state.waitingForSecondOperand).toBe(true);

      // Typing the next digit replaces the '0'
      act(() => {
        result.current.inputDigit('8');
      });
      expect(result.current.state.displayValue).toBe('8');
      expect(result.current.state.waitingForSecondOperand).toBe(false);
    });

    it('keeps display value as 0 when changing consecutive operators', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.inputDigit('9');
      });
      act(() => {
        void result.current.selectBinaryOperation('add');
      });
      expect(result.current.state.displayValue).toBe('0');
      expect(result.current.state.expressionTrail).toBe('9 +');

      act(() => {
        void result.current.selectBinaryOperation('multiply');
      });
      expect(result.current.state.displayValue).toBe('0');
      expect(result.current.state.pendingOperation).toBe('multiply');
      expect(result.current.state.expressionTrail).toBe('9 ×');
    });
  });
});
