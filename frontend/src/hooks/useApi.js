/**
 * Generic data-fetching hook with loading, error, and refresh support.
 *
 * Usage:
 *   const { data, loading, error, refresh } = useApi(getActiveCalls);
 *   const { data, loading } = useApi(getCallHistory, 20, 0, { intent: 'lead_qualify' });
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function useApi(apiFn, ...args) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const abortRef              = useRef(null);

  const fetch = useCallback(async () => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(...args);
      if (!controller.signal.aborted) {
        setData(result);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [apiFn, JSON.stringify(args)]);  // eslint-disable-line

  useEffect(() => {
    fetch();
    return () => abortRef.current?.abort();
  }, [fetch]);

  return { data, loading, error, refresh: fetch };
}

/**
 * Like useApi but polls on a fixed interval.
 * @param {Function} apiFn
 * @param {number}   intervalMs
 * @param {...any}   args
 */
export function usePolling(apiFn, intervalMs = 5000, ...args) {
  const { data, loading, error, refresh } = useApi(apiFn, ...args);

  useEffect(() => {
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { data, loading, error, refresh };
}
