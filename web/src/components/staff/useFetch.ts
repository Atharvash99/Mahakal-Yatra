"use client";

import { useCallback, useEffect, useState } from "react";
import { useStaff } from "./StaffProvider";

type State<T> = { key: string; data: T | null; error: string };

/** GET a staff endpoint. `loading` is derived, so no state is set synchronously inside the effect. */
export function useFetch<T>(path: string | null) {
  const { call, user } = useStaff();
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<State<T>>({ key: "", data: null, error: "" });
  const key = `${path}#${tick}`;

  useEffect(() => {
    if (!path || !user) return;
    let alive = true;
    call<T>(path).then((r) => {
      if (!alive) return;
      setState(r.ok ? { key, data: r.data, error: "" } : { key, data: null, error: r.data.detail ?? "Could not load this page." });
    });
    return () => { alive = false; };
  }, [path, key, call, user]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const loading = !!path && state.key !== key;
  return { data: state.data, error: state.error, loading, reload };
}
