import { useState, useEffect, useCallback, useRef } from 'react';
import { checkServerHealth } from '../services/api';

export interface UseApiHealthOptions {
  pollingIntervalMs?: number;
}

export function useApiHealth({ pollingIntervalMs = 10000 }: UseApiHealthOptions = {}) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const activeControllerRef = useRef<AbortController | null>(null);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
    }
    const controller = new AbortController();
    activeControllerRef.current = controller;

    try {
      const ok = await checkServerHealth(controller.signal);
      setIsOnline(ok);
      return ok;
    } catch {
      setIsOnline(false);
      return false;
    } finally {
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const performCheck = async () => {
      const controller = new AbortController();
      try {
        const ok = await checkServerHealth(controller.signal);
        if (isMounted) {
          setIsOnline(ok);
        }
      } catch {
        if (isMounted) {
          setIsOnline(false);
        }
      }
    };

    void performCheck();

    const intervalId = setInterval(() => {
      void performCheck();
    }, pollingIntervalMs);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
    };
  }, [pollingIntervalMs]);

  return { isOnline, checkHealth };
}
