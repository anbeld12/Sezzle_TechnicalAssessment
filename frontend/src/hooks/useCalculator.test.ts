import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalculator } from './useCalculator';
import * as apiService from '../services/api';

vi.mock('../services/api', () => ({
  calculateOnServer: vi.fn(),
  CalculatorApiError: class extends Error {
    readonly code: string;
    readonly status: number;
    constructor(message: string, code = 'ERROR', status = 400) {
      super(message);
      this.name = 'CalculatorApiError';
      this.code = code;
      this.status = status;
    }
  },
}));

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

    expect(result.current.state.error).toBe('division by zero is undefined');

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

    expect(result.current.state.error).toBe('Calculation failed');

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

    expect(result.current.state.error).toBe('square root of a negative number is undefined in real numbers');
  });
});
