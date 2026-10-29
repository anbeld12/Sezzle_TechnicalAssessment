import type {
  CalculateRequest,
  CalculateResponse,
  ApiErrorPayload,
  FriendlyError,
} from '../types/calculator';

export const HUMANIZED_ERRORS: Record<string, FriendlyError> = {
  DIVISION_BY_ZERO: {
    title: "Can't divide by zero",
    message: 'Try dividing by any other number.',
  },
  NUMERIC_OVERFLOW: {
    title: 'Number is way too big!',
    message: 'This result exceeds the display capacity.',
  },
  NEGATIVE_SQUARE_ROOT: {
    title: 'Invalid square root',
    message: 'Square roots only work with zero or positive numbers.',
  },
  DOMAIN_ERROR: {
    title: 'Math error',
    message: "That combination of numbers doesn't have a real answer.",
  },
  MISSING_OPERAND: {
    title: 'Incomplete calculation',
    message: 'Please enter a valid number and operation.',
  },
  INVALID_OPERATION: {
    title: 'Incomplete calculation',
    message: 'Please enter a valid number and operation.',
  },
  INVALID_JSON: {
    title: 'Incomplete calculation',
    message: 'Please enter a valid number and operation.',
  },
  SERVER_OFFLINE: {
    title: 'Server Offline',
    message: 'Cannot connect to the calculation service. Please make sure the backend is running.',
  },
  NETWORK_ERROR: {
    title: 'Server Offline',
    message: 'Cannot connect to the calculation service. Please make sure the backend is running.',
  },
};

export function getFriendlyError(code: string, fallbackMessage?: string): FriendlyError {
  if (HUMANIZED_ERRORS[code]) {
    return HUMANIZED_ERRORS[code];
  }
  if (
    fallbackMessage &&
    /bad gateway|gateway timeout|service unavailable|502|503|504|failed to fetch|server offline|connection/i.test(
      fallbackMessage
    )
  ) {
    return HUMANIZED_ERRORS.SERVER_OFFLINE;
  }
  return {
    title: 'Incomplete calculation',
    message: fallbackMessage || 'Please enter a valid number and operation.',
  };
}

export class CalculatorApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly friendly: FriendlyError;

  constructor(message: string, code = 'UNKNOWN_ERROR', status = 500) {
    super(message);
    this.name = 'CalculatorApiError';
    this.code = code;
    this.status = status;
    this.friendly = getFriendlyError(code, message);
  }
}

export async function checkServerHealth(signal?: AbortSignal): Promise<boolean> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
  const url = `${baseUrl}/api/v1/health`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { status?: string };
    return data?.status === 'ok';
  } catch {
    return false;
  }
}

export async function calculateOnServer(
  payload: CalculateRequest,
  signal?: AbortSignal
): Promise<CalculateResponse> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
  const url = `${baseUrl}/api/v1/calculate`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new CalculatorApiError(
      'Cannot connect to the calculation service. Please make sure the backend is running.',
      'NETWORK_ERROR',
      0
    );
  }

  if (!response.ok) {
    let errorCode = 'API_ERROR';
    let errorMessage = `Server returned status ${response.status}`;

    if (response.status === 502 || response.status === 503 || response.status === 504) {
      errorCode = 'SERVER_OFFLINE';
      errorMessage = 'Cannot connect to the calculation service. Please make sure the backend is running.';
    }

    try {
      const errorJson = (await response.json()) as ApiErrorPayload;
      if (errorJson?.error?.message) {
        errorMessage = errorJson.error.message;
      }
      if (errorJson?.error?.code) {
        errorCode = errorJson.error.code;
      }
    } catch {
      // Body was not valid JSON; fallback to status text or generic message
      if (response.statusText && errorCode !== 'SERVER_OFFLINE') {
        errorMessage = response.statusText;
      }
    }

    throw new CalculatorApiError(errorMessage, errorCode, response.status);
  }

  return (await response.json()) as CalculateResponse;
}
