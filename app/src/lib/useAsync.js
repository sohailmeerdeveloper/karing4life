import { useCallback, useEffect, useRef, useState } from 'react';

/** Runs an async loader, re-running when deps change. Returns { data, error, loading, reload, setData }. */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: undefined, error: null, loading: true });
  const seq = useRef(0);
  const run = useCallback(async (quiet) => {
    const n = ++seq.current;
    if (!quiet) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fn();
      if (n === seq.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (n === seq.current) setState((s) => ({ ...s, error, loading: false }));
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, [run]);
  const setData = useCallback((f) => setState((s) => ({ ...s, data: typeof f === 'function' ? f(s.data) : f })), []);
  return { ...state, reload: run, setData };
}
