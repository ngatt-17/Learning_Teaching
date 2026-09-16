import { useCallback, useEffect, useState } from 'react';
import { ApiError } from './api';

export interface AsyncState<T> {
  data: T | undefined;
  error: ApiError | null;
  loading: boolean;
  reload: () => void;
  /** Local update after a successful mutation; function updaters only run once data exists. */
  setData: (updater: T | ((previous: T) => T)) => void;
}

interface Settled<T> {
  key: string | null;
  data: T | undefined;
  error: ApiError | null;
}

const toApiError = (err: unknown) => (err instanceof ApiError ? err : new ApiError(0, String(err)));

/**
 * Load data for a screen. `deps` (primitive values) re-run the loader; `reload()` re-runs it
 * on demand. `loading` is derived — true until the run for the current deps has settled — and
 * responses from an outdated run are ignored.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: ReadonlyArray<string | number | boolean | null | undefined>): AsyncState<T> {
  const [tick, setTick] = useState(0);
  const key = `${JSON.stringify(deps)}#${tick}`;
  const [settled, setSettled] = useState<Settled<T>>({ key: null, data: undefined, error: null });

  useEffect(() => {
    let cancelled = false;
    loader()
      .then((data) => {
        if (!cancelled) setSettled({ key, data, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) setSettled((s) => ({ key, data: s.data, error: toApiError(err) }));
      });
    return () => {
      cancelled = true;
    };
    // The loader closes over the same values as `deps`, which are encoded in `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const loading = settled.key !== key;
  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback(
    (updater: T | ((previous: T) => T)) =>
      setSettled((s) => {
        if (typeof updater !== 'function') return { ...s, data: updater };
        return s.data === undefined ? s : { ...s, data: (updater as (p: T) => T)(s.data) };
      }),
    [],
  );

  return { data: settled.data, error: loading ? null : settled.error, loading, reload, setData };
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.detail;
  if (err instanceof Error) return err.message;
  return String(err);
}
