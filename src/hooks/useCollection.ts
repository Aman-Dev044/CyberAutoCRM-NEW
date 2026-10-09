'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiGet, qs } from '@/lib/client';

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
} & Record<string, unknown>;

type Params = Record<string, string | number | boolean | undefined | null>;

/**
 * List fetcher with debounced search, filters, pagination and a manual
 * `refresh()` used after mutations.
 */
export function useCollection<T>(endpoint: string, initialParams: Params = {}) {
  const [params, setParams] = useState<Params>({ page: 1, limit: 20, ...initialParams });
  const [data, setData] = useState<Paged<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const latest = useRef(0);

  // Debounce only the free-text query so filters apply immediately.
  const [debouncedQ, setDebouncedQ] = useState(params.q);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(params.q), 300);
    return () => clearTimeout(t);
  }, [params.q]);

  const effective = useMemo(() => ({ ...params, q: debouncedQ }), [params, debouncedQ]);

  useEffect(() => {
    const id = ++latest.current;
    setLoading(true);
    apiGet<Paged<T>>(`${endpoint}${qs(effective)}`)
      .then((res) => {
        if (latest.current !== id) return;
        setData(res);
        setError(null);
      })
      .catch((err: Error) => {
        if (latest.current !== id) return;
        setError(err.message);
      })
      .finally(() => {
        if (latest.current === id) setLoading(false);
      });
  }, [endpoint, effective, tick]);

  const setParam = useCallback((key: string, value: Params[string]) => {
    setParams((prev) => ({ ...prev, [key]: value, ...(key !== 'page' ? { page: 1 } : {}) }));
  }, []);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return {
    data,
    items: data?.items ?? [],
    total: data?.total ?? 0,
    page: Number(params.page ?? 1),
    pages: data?.pages ?? 1,
    loading,
    error,
    params,
    setParam,
    setParams,
    refresh,
  };
}

/** Single-record fetcher for detail pages. */
export function useRecord<T>(endpoint: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!endpoint);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!endpoint) {
      setData(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    apiGet<T>(endpoint)
      .then((res) => active && (setData(res), setError(null)))
      .catch((err: Error) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [endpoint, tick]);

  return { data, loading, error, refresh: () => setTick((t) => t + 1), setData };
}
