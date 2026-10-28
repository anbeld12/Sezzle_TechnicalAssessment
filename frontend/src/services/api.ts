import type { CalculateRequest, CalculateResponse, ApiErrorPayload } from '../types/calculator';

export class CalculatorApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = 'UNKNOWN_ERROR', status = 500) {
    super(message);
    this.name = 'CalculatorApiError';
    this.code = code;
    this.status = status;
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
      'Unable to reach calculation service. Please check your connection.',
      'NETWORK_ERROR',
      0
    );
  }

  if (!response.ok) {
    let errorCode = 'API_ERROR';
    let errorMessage = `Server returned status ${response.status}`;

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
      if (response.statusText) {
        errorMessage = response.statusText;
      }
    }

    throw new CalculatorApiError(errorMessage, errorCode, response.status);
  }

  return (await response.json()) as CalculateResponse;
}
