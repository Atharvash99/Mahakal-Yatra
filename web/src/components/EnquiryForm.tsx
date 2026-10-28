"use client";

import { useState } from "react";
import { packages } from "@/data/packages";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Errors = Record<string, string[]>;

const field =
  "mt-1 w-full rounded-xl border border-gold/50 bg-cream/60 px-3 py-2.5 text-sm outline-none transition focus:border-saffron focus:ring-2 focus:ring-saffron/30";

export default function EnquiryForm({ defaultPackage = "" }: { defaultPackage?: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errors, setErrors] = useState<Errors>({});

  async function onSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      name: f.get("name"),
      phone: f.get("phone"),
      email: f.get("email"),
      package_slug: f.get("package_slug"),
      travellers: Number(f.get("travellers") || 1),
      pickup_point: f.get("pickup_point"),
      message: f.get("message"),
      website: f.get("website"),
    };
    const date = f.get("travel_date");
    if (date) body.travel_date = date;

    setStatus("sending");
    setErrors({});
    try {
      const res = await fetch(`${API}/api/enquiries/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 201) {
        setStatus("done");
        return;
      }
      if (res.status === 400) setErrors(await res.json());
      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="font-display text-2xl font-semibold text-emerald-900">Thank you! 🙏</h2>
        <p className="mt-2 text-sm text-neutral-700">
          We received your enquiry and will contact you on WhatsApp or phone shortly.
        </p>
      </div>
    );
  }

  const err = (k: string) =>
    errors[k] ? <p className="mt-1 text-xs text-red-600">{errors[k].join(" ")}</p> : null;

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-gold/40 bg-white p-6 shadow-xl">
      <label className="block text-sm font-medium text-maroon">
        Name *
        <input name="name" required maxLength={100} className={field} />
        {err("name")}
      </label>
      <label className="block text-sm font-medium text-maroon">
        Mobile number *
        <input name="phone" type="tel" required inputMode="numeric" placeholder="10-digit number" className={field} />
        {err("phone")}
      </label>
      <label className="block text-sm font-medium text-maroon">
        Email (optional)
        <input name="email" type="email" className={field} />
        {err("email")}
      </label>
      <label className="block text-sm font-medium text-maroon">
        Package
        <select name="package_slug" defaultValue={defaultPackage} className={field}>
          <option value="">Not sure yet</option>
          {packages.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-maroon">
          Travel date
          <input name="travel_date" type="date" className={field} />
          {err("travel_date")}
        </label>
        <label className="block text-sm font-medium text-maroon">
          Travellers
          <input name="travellers" type="number" min={1} max={100} defaultValue={2} className={field} />
          {err("travellers")}
        </label>
      </div>
      <label className="block text-sm font-medium text-maroon">
        Pickup point
        <input name="pickup_point" placeholder="Indore airport, hotel nameâ€¦" className={field} />
      </label>
      <label className="block text-sm font-medium text-maroon">
        Message
        <textarea name="message" rows={3} maxLength={1000} className={field} />
      </label>
      {/* honeypot: hidden from people, bots fill it */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {status === "error" && (
        <p className="text-sm text-red-600">
          {Object.keys(errors).length ? "Please fix the highlighted fields." : "Could not send. Please try again or WhatsApp us."}
        </p>
      )}
      <button
        disabled={status === "sending"}
        className="w-full rounded-full bg-saffron px-6 py-3 font-semibold text-night transition hover:bg-gold disabled:opacity-60"
      >
        {status === "sending" ? "Sendingâ€¦" : "Send enquiry"}
      </button>
      <p className="text-xs text-neutral-500">
        We only use your details to respond to this enquiry.
      </p>
    </form>
  );
}

