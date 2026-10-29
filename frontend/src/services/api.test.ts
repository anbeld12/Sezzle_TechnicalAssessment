import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateOnServer,
  checkServerHealth,
  CalculatorApiError,
  getFriendlyError,
  HUMANIZED_ERRORS,
} from './api';
import type { CalculateRequest, CalculateResponse } from '../types/calculator';

describe('Humanized Error Mappings', () => {
  it('maps all standard error codes to empathetic copy', () => {
    expect(getFriendlyError('DIVISION_BY_ZERO')).toEqual({
      title: "Can't divide by zero",
      message: 'Try dividing by any other number.',
    });
    expect(getFriendlyError('NUMERIC_OVERFLOW')).toEqual({
      title: 'Number is way too big!',
      message: 'This result exceeds the display capacity.',
    });
    expect(getFriendlyError('NEGATIVE_SQUARE_ROOT')).toEqual({
      title: 'Invalid square root',
      message: 'Square roots only work with zero or positive numbers.',
    });
    expect(getFriendlyError('DOMAIN_ERROR')).toEqual({
      title: 'Math error',
      message: "That combination of numbers doesn't have a real answer.",
    });
    expect(getFriendlyError('MISSING_OPERAND')).toEqual({
      title: 'Incomplete calculation',
      message: 'Please enter a valid number and operation.',
    });
    expect(getFriendlyError('INVALID_OPERATION')).toEqual({
      title: 'Incomplete calculation',
      message: 'Please enter a valid number and operation.',
    });
    expect(getFriendlyError('INVALID_JSON')).toEqual({
      title: 'Incomplete calculation',
      message: 'Please enter a valid number and operation.',
    });
    expect(getFriendlyError('NETWORK_ERROR')).toEqual({
      title: 'Server Offline',
      message: 'Cannot connect to the calculation service. Please make sure the backend is running.',
    });
    expect(getFriendlyError('SERVER_OFFLINE')).toEqual({
      title: 'Server Offline',
      message: 'Cannot connect to the calculation service. Please make sure the backend is running.',
    });
    expect(getFriendlyError('API_ERROR', '502 Bad Gateway')).toEqual({
      title: 'Server Offline',
      message: 'Cannot connect to the calculation service. Please make sure the backend is running.',
    });
    expect(getFriendlyError('RANDOM_CODE', 'Custom helper')).toEqual({
      title: 'Incomplete calculation',
      message: 'Custom helper',
    });
    expect(HUMANIZED_ERRORS.DIVISION_BY_ZERO.title).toBe("Can't divide by zero");
  });
});

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

  it('handles non-JSON 502 Bad Gateway response as SERVER_OFFLINE error', async () => {
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
      code: 'SERVER_OFFLINE',
      status: 502,
      message: 'Cannot connect to the calculation service. Please make sure the backend is running.',
      friendly: {
        title: 'Server Offline',
        message: 'Cannot connect to the calculation service. Please make sure the backend is running.',
      },
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
      message: 'Cannot connect to the calculation service. Please make sure the backend is running.',
      friendly: {
        title: 'Server Offline',
        message: 'Cannot connect to the calculation service. Please make sure the backend is running.',
      },
    });
  });
});

describe('checkServerHealth', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns true when server health endpoint returns 200 with status: ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    } as unknown as Response);

    const isHealthy = await checkServerHealth();
    expect(isHealthy).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/v1/health',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('returns false when server health endpoint returns non-200', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ status: 'unavailable' }),
    } as unknown as Response);

    const isHealthy = await checkServerHealth();
    expect(isHealthy).toBe(false);
  });

  it('returns false when health check fetch throws network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    const isHealthy = await checkServerHealth();
    expect(isHealthy).toBe(false);
  });
});
