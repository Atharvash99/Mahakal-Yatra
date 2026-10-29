"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { STAFF_TOKEN_KEY, staffCall, type CallResult, type StaffUser } from "@/lib/staff";

type Ctx = {
  user: StaffUser | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  /** Authenticated call. A 401 signs the user out. */
  call: <T>(path: string, body?: unknown, method?: string) => Promise<CallResult<T>>;
};

const StaffContext = createContext<Ctx | null>(null);

export function useStaff() {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error("useStaff must be used inside StaffProvider");
  return ctx;
}

function readToken(): string | null {
  try {
    return sessionStorage.getItem(STAFF_TOKEN_KEY);
  } catch {
    return null;
  }
}

export default function StaffProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<StaffUser | null>(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    try { sessionStorage.removeItem(STAFF_TOKEN_KEY); } catch {}
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    (async () => {
      const saved = readToken();
      if (saved) {
        const r = await staffCall<StaffUser>("/me/", saved);
        if (r.ok) { setToken(saved); setUser(r.data); } else if (r.status === 401) logout();
      }
      setReady(true);
    })();
  }, [logout]);

  const login = useCallback(async (username: string, password: string) => {
    const r = await staffCall<{ token: string; me: StaffUser }>("/login/", null, { username, password });
    if (!r.ok) return r.data.detail ?? "Could not sign in.";
    try { sessionStorage.setItem(STAFF_TOKEN_KEY, r.data.token); } catch {}
    setToken(r.data.token);
    setUser(r.data.me);
    return null;
  }, []);

  const call = useCallback(
    async <T,>(path: string, body?: unknown, method?: string) => {
      const r = await staffCall<T>(path, token, body, method);
      if (r.status === 401) logout();
      return r;
    },
    [token, logout],
  );

  const value = useMemo(() => ({ user, ready, login, logout, call }), [user, ready, login, logout, call]);
  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}
