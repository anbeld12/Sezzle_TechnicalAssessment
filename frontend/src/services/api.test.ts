import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateOnServer, CalculatorApiError } from './api';
import type { CalculateRequest, CalculateResponse } from '../types/calculator';

describe('calculateOnServer', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('successfully executes calculation and parses 200 OK response', async () => {
    const mockResponse: CalculateResponse = {
      result: 42,
      operation: 'multiply',
      operand1: 6,
      operand2: 7,
      expression: '6 × 7 = 42',
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as unknown as Response);

    const payload: CalculateRequest = {
      operand1: 6,
      operand2: 7,
      operation: 'multiply',
    };

    const result = await calculateOnServer(payload);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/v1/calculate',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('throws CalculatorApiError with backend code and status on 422 Unprocessable Entity', async () => {
    const errorBody = {
      error: {
        code: 'DIVISION_BY_ZERO',
        message: 'division by zero is undefined',
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      json: async () => errorBody,
    } as unknown as Response);

    const payload: CalculateRequest = {
      operand1: 10,
      operand2: 0,
      operation: 'divide',
    };

    await expect(calculateOnServer(payload)).rejects.toSatisfy((err) => {
      expect(err).toBeInstanceOf(CalculatorApiError);
      const apiErr = err as CalculatorApiError;
      expect(apiErr.code).toBe('DIVISION_BY_ZERO');
      expect(apiErr.status).toBe(422);
      expect(apiErr.message).toBe('division by zero is undefined');
      return true;
    });
  });

  it('throws CalculatorApiError on 400 Bad Request with missing operand', async () => {
    const errorBody = {
      error: {
        code: 'MISSING_OPERAND',
        message: 'second operand is required for binary operation',
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => errorBody,
    } as unknown as Response);

    const payload: CalculateRequest = {
      operand1: 10,
      operation: 'add',
    };

    await expect(calculateOnServer(payload)).rejects.toMatchObject({
      name: 'CalculatorApiError',
      code: 'MISSING_OPERAND',
      status: 400,
      message: 'second operand is required for binary operation',
    });
  });

  it('handles non-JSON error response gracefully', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: async () => {
        throw new Error('Not JSON');
      },
    } as unknown as Response);

    const payload: CalculateRequest = {
      operand1: 1,
      operand2: 2,
      operation: 'add',
    };

    await expect(calculateOnServer(payload)).rejects.toMatchObject({
      name: 'CalculatorApiError',
      code: 'API_ERROR',
      status: 502,
      message: 'Bad Gateway',
    });
  });

  it('throws network error when fetch is rejected', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const payload: CalculateRequest = {
      operand1: 10,
      operand2: 20,
      operation: 'add',
    };

    await expect(calculateOnServer(payload)).rejects.toMatchObject({
      name: 'CalculatorApiError',
      code: 'NETWORK_ERROR',
      status: 0,
      message: 'Unable to reach calculation service. Please check your connection.',
    });
  });
});
