"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TravelPackage } from "@/data/packages";

const box =
  "mt-1 w-full rounded-xl border border-gold/40 bg-white/95 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-saffron/50";

export default function QuickPlan({ packages }: { packages: TravelPackage[] }) {
  const router = useRouter();
  const [pkg, setPkg] = useState((packages.find((p) => p.slug === "ujjain-omkareshwar-2-days") ?? packages[0]).slug);
  const [date, setDate] = useState("");
  const [n, setN] = useState(2);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = new URLSearchParams({ n: String(n) });
        if (date) q.set("date", date);
        router.push(`/book/${pkg}?${q}`);
      }}
      className="animate-fade-up delay-3 mx-auto mt-10 grid max-w-3xl gap-3 rounded-3xl border border-gold/30 bg-white/10 p-4 text-left shadow-2xl backdrop-blur-md sm:grid-cols-[1.4fr_1fr_0.7fr_auto] sm:items-end"
    >
      <label className="text-xs font-medium text-gold-soft">
        Package
        <select value={pkg} onChange={(e) => setPkg(e.target.value)} className={box}>
          {packages.map((p) => (
            <option key={p.slug} value={p.slug}>{p.name}</option>
          ))}
        </select>
      </label>
      <label className="text-xs font-medium text-gold-soft">
        Travel date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={box} />
      </label>
      <label className="text-xs font-medium text-gold-soft">
        Travellers
        <input type="number" min={1} max={12} value={n} onChange={(e) => setN(Math.min(12, Math.max(1, Number(e.target.value) || 1)))} className={box} />
      </label>
      <button className="rounded-xl bg-saffron px-6 py-2.5 font-semibold text-night shadow-lg shadow-saffron/30 transition hover:bg-gold">
        Check price
      </button>
    </form>
  );
}
