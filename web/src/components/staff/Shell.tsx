"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useStaff } from "./StaffProvider";
import { Button, Field, Loading, Spinner, inputClass } from "./ui";
import type { Capabilities } from "@/lib/staff";

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const NAV: { href: string; label: string; icon: string; needs?: keyof Capabilities }[] = [
  { href: "/staff", label: "Dashboard", icon: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10" },
  { href: "/staff/bookings", label: "Bookings", icon: "M8 7V4m8 3V4M4 9h16M5 6h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1z", needs: "bookings" },
  { href: "/staff/refunds", label: "Refunds", icon: "M9 14l-4-4 4-4M5 10h9a5 5 0 010 10h-3", needs: "refunds" },
  { href: "/staff/fleet", label: "Drivers & vehicles", icon: "M5 17h14M6 17V9l2-4h8l2 4v8M7 13h10M7.5 17v2m9-2v2", needs: "fleet" },
  { href: "/staff/enquiries", label: "Enquiries", icon: "M4 5h16v11H8l-4 4V5z", needs: "enquiries" },
  { href: "/staff/finance", label: "Finance", icon: "M4 20V10m6 10V4m6 16v-7m4 7H2", needs: "finance" },
];

function LoginScreen() {
  const { login } = useStaff();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const err = await login(username.trim(), password);
    if (err) setError(err);
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="font-deva text-3xl text-maroon">ॐ</span>
          <span className="font-display text-xl font-semibold text-slate-900">MahakalYatra</span>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Staff sign in</h1>
            <p className="mt-1 text-sm text-slate-500">Operations, support and accounts.</p>
          </div>
          <Field label="Username">
            <input className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required />
          </Field>
          <Field label="Password">
            <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </Field>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-inset ring-rose-200" role="alert">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" busy={busy}>Sign in</Button>
        </form>
      </div>
    </div>
  );
}

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useStaff();
  const path = usePathname();
  const items = NAV.filter((n) => !n.needs || user?.can[n.needs]);
  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {items.map((n) => {
        const active = n.href === "/staff" ? path === "/staff" : path.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
          >
            <Icon d={n.icon} />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useStaff();
  const [open, setOpen] = useState(false);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100"><Spinner className="h-6 w-6 text-slate-500" /></div>;
  }
  if (!user) return <LoginScreen />;

  const brand = (
    <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
      <span className="font-deva text-2xl text-gold">ॐ</span>
      <span className="font-display text-lg font-semibold text-white">MahakalYatra</span>
      <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-300">Staff</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-night md:flex">
        {brand}
        <Nav />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-night">
            {brand}
            <Nav onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Icon d="M4 6h16M4 12h16M4 18h16" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.role}</p>
            </div>
            <Button size="sm" onClick={logout}>Sign out</Button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

export function PageLoading() {
  return <Loading />;
}
