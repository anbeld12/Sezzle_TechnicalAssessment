import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApiHealth } from './useApiHealth';
import * as apiService from '../services/api';

describe('useApiHealth hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initially checks health on mount and sets isOnline to true when healthy', async () => {
    vi.spyOn(apiService, 'checkServerHealth').mockResolvedValue(true);

    const { result } = renderHook(() => useApiHealth());

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
    });
    expect(apiService.checkServerHealth).toHaveBeenCalledTimes(1);
  });

  it('sets isOnline to false when health check fails', async () => {
    vi.spyOn(apiService, 'checkServerHealth').mockResolvedValue(false);

    const { result } = renderHook(() => useApiHealth());

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
    });
    expect(apiService.checkServerHealth).toHaveBeenCalledTimes(1);
  });

  it('polls periodically and allows manual re-check', async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(apiService, 'checkServerHealth').mockResolvedValue(true);

    const { result } = renderHook(() => useApiHealth({ pollingIntervalMs: 10000 }));

    expect(spy).toHaveBeenCalledTimes(1);

    // Fast forward 10 seconds
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    expect(spy).toHaveBeenCalledTimes(2);

    // Change mock to false and trigger manual re-check
    spy.mockResolvedValueOnce(false);
    await act(async () => {
      const ok = await result.current.checkHealth();
      expect(ok).toBe(false);
    });
    expect(result.current.isOnline).toBe(false);

    vi.useRealTimers();
  });
});
