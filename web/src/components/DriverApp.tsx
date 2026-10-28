"use client";

import { useCallback, useEffect, useState } from "react";
import { API, inr, niceDate } from "@/lib/api";

type Trip = {
  id: number; ref: string; customer_name: string; customer_phone: string; package: string; travel_date: string;
  travellers: number; pickup_point: string; pickup_time: string | null; special_requests: string;
  balance_due: number; vehicle: string; notes: string; started: boolean; completed: boolean;
};

const TOKEN = "mahakalyatra.driver";
const field = "mt-1 w-full rounded-xl border border-gold/50 bg-white px-3 py-3 text-base outline-none focus:border-saffron";

async function call<T>(path: string, token: string | null, body?: unknown): Promise<{ ok: boolean; status: number; data: T & { detail?: string } }> {
  try {
    const res = await fetch(`${API}/api/driver${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
  } catch {
    return { ok: false, status: 0, data: { detail: "No connection. Check your network and try again." } as T & { detail?: string } };
  }
}

export default function DriverApp() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [today, setToday] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cash, setCash] = useState<Record<number, string>>({});
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async (t: string) => {
    const r = await call<{ trips: Trip[]; today: string }>("/trips/", t);
    if (r.status === 401) { localStorage.removeItem(TOKEN); setToken(null); return; }
    if (r.ok) { setTrips(r.data.trips); setToday(r.data.today); setError(""); } else setError(r.data.detail ?? "Could not load trips.");
    setLoaded(true);
  }, []);

  useEffect(() => {
    (async () => {
      if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
      const saved = localStorage.getItem(TOKEN);
      if (saved) { setToken(saved); await load(saved); }
      setReady(true);
    })();
  }, [load]);

  async function login(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError("");
    const r = await call<{ token: string; name: string }>("/login/", null, { phone, pin });
    setBusy(false);
    if (!r.ok) { setError(r.data.detail ?? "Could not sign in."); return; }
    localStorage.setItem(TOKEN, r.data.token);
    setToken(r.data.token); setName(r.data.name); setPin("");
    load(r.data.token);
  }

  async function act(t: Trip, action: "start" | "complete") {
    if (!token) return;
    setBusy(true); setError("");
    const body = action === "complete" ? { cash_collected: Number(cash[t.id] || 0) } : {};
    const r = await call<Trip>(`/trips/${t.id}/${action}/`, token, body);
    setBusy(false);
    if (!r.ok) { setError(r.data.detail ?? "Something went wrong."); return; }
    load(token);
  }

  if (!ready) return <div className="mx-auto h-64 max-w-md animate-pulse rounded-3xl bg-sand/60" />;

  if (!token) {
    return (
      <form onSubmit={login} className="mx-auto max-w-sm space-y-4 rounded-3xl border border-gold/40 bg-white p-6 shadow-xl">
        <h2 className="font-display text-2xl font-bold text-maroon">Driver sign in</h2>
        <label className="block text-sm font-medium text-maroon">Mobile number
          <input required type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
        </label>
        <label className="block text-sm font-medium text-maroon">4-digit PIN
          <input required type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value)} className={field} />
        </label>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button disabled={busy} className="w-full rounded-full bg-saffron px-6 py-3.5 text-base font-semibold text-night disabled:opacity-60">
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-xs text-neutral-500">Ask the operations team for your PIN.</p>
      </form>
    );
  }

  if (!loaded) return <div className="mx-auto h-64 max-w-md animate-pulse rounded-3xl bg-sand/60" />;

  const todays = trips.filter((t) => t.travel_date === today);
  const upcoming = trips.filter((t) => t.travel_date > today);

  const card = (t: Trip) => {
    const isToday = t.travel_date === today;
    return (
      <article key={t.id} className="rounded-3xl border border-gold/40 bg-white p-5 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-saffron-2">{t.ref} · {niceDate(t.travel_date)}</p>
            <h3 className="mt-1 font-display text-xl font-semibold text-maroon">{t.customer_name}</h3>
            <p className="text-sm text-neutral-600">{t.package} · {t.travellers} traveller{t.travellers > 1 ? "s" : ""}</p>
          </div>
          {t.completed && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Done</span>}
          {t.started && !t.completed && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">On trip</span>}
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-neutral-500">Pickup</dt><dd className="text-right font-medium">{t.pickup_point || "Ask customer"}{t.pickup_time && ` · ${t.pickup_time}`}</dd></div>
          <div className="flex justify-between"><dt className="text-neutral-500">Vehicle</dt><dd className="font-medium">{t.vehicle}</dd></div>
          <div className="flex justify-between"><dt className="text-neutral-500">Collect on trip</dt><dd className="font-semibold text-maroon">{inr(t.balance_due)}</dd></div>
          {t.special_requests && <p className="rounded-xl bg-gold-soft/60 p-3 text-xs text-maroon">Note: {t.special_requests}</p>}
        </dl>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <a href={`tel:${t.customer_phone}`} className="rounded-full border border-maroon py-3 text-center text-sm font-semibold text-maroon">Call customer</a>
          <a href={`https://wa.me/91${t.customer_phone}`} target="_blank" rel="noreferrer" className="rounded-full border border-emerald-700 py-3 text-center text-sm font-semibold text-emerald-800">WhatsApp</a>
        </div>
        {!t.completed && isToday && !t.started && (
          <button disabled={busy} onClick={() => act(t, "start")} className="mt-3 w-full rounded-full bg-saffron py-3.5 text-base font-semibold text-night disabled:opacity-60">Start trip</button>
        )}
        {t.started && !t.completed && (
          <div className="mt-3 space-y-3">
            <label className="block text-sm font-medium text-maroon">Cash collected (₹)
              <input type="number" inputMode="numeric" min={0} max={t.balance_due} value={cash[t.id] ?? ""} onChange={(e) => setCash({ ...cash, [t.id]: e.target.value })} className={field} placeholder={`up to ${t.balance_due}`} />
            </label>
            <button disabled={busy} onClick={() => act(t, "complete")} className="w-full rounded-full bg-maroon py-3.5 text-base font-semibold text-gold-soft disabled:opacity-60">Complete trip</button>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-600">{name ? `Namaste, ${name}` : "Your trips"}</p>
        <div className="flex gap-3 text-sm">
          <button onClick={() => token && load(token)} className="font-semibold text-maroon underline">Refresh</button>
          <button onClick={() => { localStorage.removeItem(TOKEN); setToken(null); }} className="text-neutral-500 underline">Sign out</button>
        </div>
      </div>
      {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-maroon">Today</h2>
        {todays.length ? todays.map(card) : <p className="rounded-2xl bg-white p-5 text-sm text-neutral-500">No trips today.</p>}
      </section>
      {upcoming.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold text-maroon">Upcoming</h2>
          {upcoming.map(card)}
        </section>
      )}
    </div>
  );
}
