"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Art";
import type { TravelPackage } from "@/data/packages";
import {
  getJson, inr, niceDate, openRazorpay, post, rememberBooking,
  type ApiResult, type Booking, type PaymentOrder, type Quote,
} from "@/lib/api";
import type { Addon } from "@/lib/catalog";

type Departure = { date: string; label: string; seats_left: number; price: number };
type Created = { booking: Booking; payment: PaymentOrder };

const field =
  "mt-1 w-full rounded-xl border border-gold/50 bg-cream/60 px-3 py-2.5 text-sm outline-none transition focus:border-saffron focus:ring-2 focus:ring-saffron/30";
const today = () => new Date().toISOString().slice(0, 10);

export default function BookingFlow({ pkg, addons, initialDate, initialTravellers }: {
  pkg: TravelPackage;
  addons: Addon[];
  initialDate?: string;
  initialTravellers?: number;
}) {
  const [date, setDate] = useState(initialDate ?? "");
  const [travellers, setTravellers] = useState(initialTravellers ?? 2);
  const [picked, setPicked] = useState<string[]>([]);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const [fetchedQuote, setQuote] = useState<Quote | null>(null);
  const [fetchedError, setQuoteError] = useState("");
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [contact, setContact] = useState({
    customer_name: "", phone: "", email: "", pickup_point: pkg.pickupPoint.split(",")[0],
    special_requests: "", website: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [paid, setPaid] = useState<Booking | null>(null);

  useEffect(() => {
    getJson<Departure[]>(`/packages/${pkg.slug}/departures/`).then((d) => d && setDepartures(d));
  }, [pkg.slug]);

  // live price from the server so the breakdown always matches what is stored
  useEffect(() => {
    if (!date) return;
    let live = true;
    const t = setTimeout(async () => {
      const ask = (c: string) => post<Quote>("/quotes/", { package: pkg.slug, travel_date: date, travellers, addons: picked, coupon: c });
      let r = await ask(coupon);
      let bad = "";
      // a bad coupon must not hide the price: show the price without it and flag the coupon
      if (!r.ok && coupon) { bad = r.error; r = await ask(""); }
      if (!live) return;
      setCouponError(bad);
      if (r.ok) { setQuote(r.data); setQuoteError(""); } else { setQuote(null); setQuoteError(r.error); }
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [date, travellers, pkg.slug, picked, coupon]);

  // with no date picked, ignore whatever was fetched earlier
  const quote = date ? fetchedQuote : null;
  const quoteError = date ? fetchedError : "";
  // each step starts at the top of the page
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [created, paid]);

  const festival = useMemo(() => departures.find((d) => d.date === date), [departures, date]);

  async function createBooking(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!quote) { setFormError("Pick a valid travel date first."); return; }
    setBusy(true); setFormError(""); setFieldErrors({});
    const r: ApiResult<Created> = await post<Created>("/bookings/", {
      package: pkg.slug, travel_date: date, travellers, addons: picked,
      coupon: quote.coupon_code, ...contact,
    });
    setBusy(false);
    if (!r.ok) { setFormError(r.error); setFieldErrors(r.fields ?? {}); return; }
    setCreated(r.data);
    rememberBooking(r.data.booking.ref, contact.phone);
  }

  async function pay() {
    if (!created) return;
    const { booking, payment } = created;
    if (payment.gateway === "razorpay") {
      openRazorpay(payment, booking.customer_name, async () => {
        const r = await post<{ booking: Booking }>("/bookings/lookup/", { ref: booking.ref, phone: contact.phone });
        if (r.ok) setPaid(r.data.booking);
      });
      return;
    }
    setBusy(true);
    const r = await post<{ booking: Booking }>("/bookings/mock-pay/", {
      ref: booking.ref, phone: contact.phone, order_id: payment.order_id,
    });
    setBusy(false);
    if (r.ok) setPaid(r.data.booking); else setFormError(r.error);
  }

  const err = (k: string) => fieldErrors[k] ? <p className="mt-1 text-xs text-rose-600">{fieldErrors[k].join(" ")}</p> : null;

  /* ---------- success ---------- */
  if (paid) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-xl">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Icon name="check" className="h-8 w-8" />
        </span>
        <h2 className="mt-4 font-display text-3xl font-bold text-maroon">Booking confirmed 🙏</h2>
        <p className="mt-2 text-neutral-600">Jai Mahakal, {paid.customer_name}! Your yatra is locked in.</p>
        <p className="mt-5 rounded-2xl bg-gold-soft/60 px-4 py-3 font-display text-2xl tracking-widest text-maroon">{paid.ref}</p>
        <p className="mt-1 text-xs text-neutral-500">Keep this reference. You need it with your phone number to view your booking.</p>
        <p className="mt-4 text-sm text-neutral-700">
          {paid.package_name} · {niceDate(paid.travel_date)} · {paid.travellers} traveller{paid.travellers > 1 ? "s" : ""}
        </p>
        <p className="mt-1 text-sm text-neutral-700">Paid {inr(paid.price.paid)} · Balance {inr(paid.price.balance_due)} on the trip</p>
        <Link href="/my-bookings" className="mt-6 inline-block rounded-full bg-maroon px-7 py-3 font-semibold text-gold-soft hover:bg-maroon-2">
          View my booking
        </Link>
      </div>
    );
  }

  /* ---------- payment step ---------- */
  if (created) {
    const b = created.booking;
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-gold/40 bg-white p-8 shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-saffron-2">Step 3 of 3</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-maroon">Pay advance to confirm</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Booking <b>{b.ref}</b> is reserved. Pay the advance now and the remaining balance on the trip.
        </p>
        <dl className="mt-5 space-y-2 text-sm">
          <Row k="Package" v={b.package_name} />
          <Row k="Date" v={niceDate(b.travel_date)} />
          <Row k="Total" v={inr(b.price.total)} />
          <Row k={`Advance now (${quote?.advance_percent ?? 30}%)`} v={inr(created.payment.amount)} strong />
          <Row k="Balance on trip" v={inr(b.price.total - created.payment.amount)} />
        </dl>
        {formError && <p className="mt-3 text-sm text-rose-600">{formError}</p>}
        <button onClick={pay} disabled={busy} className="mt-6 w-full rounded-full bg-saffron px-6 py-3.5 font-semibold text-night hover:bg-gold disabled:opacity-60">
          {busy ? "Processing…" : `Pay ${inr(created.payment.amount)} advance`}
        </button>
        {created.payment.gateway === "mock" && (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
            Test mode: no real money is charged. Live payments (Razorpay or Cashfree) switch on once gateway keys are added.
          </p>
        )}
      </div>
    );
  }

  /* ---------- details step ---------- */
  return (
    <form onSubmit={createBooking} className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <section className="rounded-3xl border border-gold/40 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-saffron-2">Step 1 of 3</p>
          <h2 className="font-display text-2xl font-bold text-maroon">Choose date and travellers</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-maroon">
              Travel date
              <input type="date" required min={today()} value={date} onChange={(e) => setDate(e.target.value)} className={field} />
            </label>
            <label className="block text-sm font-medium text-maroon">
              Travellers
              <div className="mt-1 flex items-center overflow-hidden rounded-xl border border-gold/50 bg-cream/60">
                <button type="button" onClick={() => setTravellers((n) => Math.max(1, n - 1))} className="px-4 py-2.5 text-lg text-maroon hover:bg-gold-soft" aria-label="Fewer travellers">−</button>
                <span className="flex-1 text-center font-semibold">{travellers}</span>
                <button type="button" onClick={() => setTravellers((n) => Math.min(12, n + 1))} className="px-4 py-2.5 text-lg text-maroon hover:bg-gold-soft" aria-label="More travellers">+</button>
              </div>
            </label>
          </div>
          {departures.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-neutral-500">Special dates with limited seats</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {departures.map((d) => (
                  <button key={d.date} type="button" onClick={() => setDate(d.date)}
                    className={`rounded-full border px-3 py-1 text-xs ${date === d.date ? "border-saffron bg-saffron text-night" : "border-gold text-maroon hover:bg-gold-soft"}`}>
                    {d.label || "Special date"} · {niceDate(d.date)} · {d.seats_left} seats
                  </button>
                ))}
              </div>
            </div>
          )}
          {festival && <p className="mt-3 rounded-xl bg-gold-soft/60 p-3 text-sm text-maroon">🪔 {festival.label || "Special date"}: advance booking, limited seats and festival pricing apply.</p>}
          {quoteError && <p className="mt-3 text-sm text-rose-600">{quoteError}</p>}
        </section>

        {addons.length > 0 && (
          <section className="rounded-3xl border border-gold/40 bg-white p-6 shadow-sm">
            <h2 className="font-display text-2xl font-bold text-maroon">Make it special <span className="text-sm font-normal text-neutral-500">(optional)</span></h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {addons.map((a) => {
                const on = picked.includes(a.slug);
                return (
                  <label key={a.slug} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${on ? "border-saffron bg-gold-soft/50" : "border-gold/40 hover:bg-cream"}`}>
                    <input type="checkbox" checked={on} className="mt-1 accent-[#e3730a]"
                      onChange={() => setPicked(on ? picked.filter((s) => s !== a.slug) : [...picked, a.slug])} />
                    <span>
                      <span className="block font-medium text-maroon">{a.name}</span>
                      <span className="block text-xs text-neutral-600">{a.description}</span>
                      <span className="mt-1 block text-sm font-semibold">{inr(a.price)}{a.perPerson ? " / person" : ""}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-gold/40 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-saffron-2">Step 2 of 3</p>
          <h2 className="font-display text-2xl font-bold text-maroon">Your details</h2>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-maroon">Name *
              <input required maxLength={100} value={contact.customer_name} onChange={(e) => setContact({ ...contact, customer_name: e.target.value })} className={field} />
              {err("customer_name")}
            </label>
            <label className="block text-sm font-medium text-maroon">Mobile number (WhatsApp) *
              <input required type="tel" inputMode="numeric" placeholder="10-digit number" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className={field} />
              {err("phone")}
            </label>
            <label className="block text-sm font-medium text-maroon">Email (optional)
              <input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className={field} />
              {err("email")}
            </label>
            <label className="block text-sm font-medium text-maroon">Pickup point
              <input placeholder="Indore airport, hotel name…" value={contact.pickup_point} onChange={(e) => setContact({ ...contact, pickup_point: e.target.value })} className={field} />
            </label>
            <label className="block text-sm font-medium text-maroon">Special requests (wheelchair, diet…)
              <textarea rows={2} maxLength={1000} value={contact.special_requests} onChange={(e) => setContact({ ...contact, special_requests: e.target.value })} className={field} />
            </label>
            <input tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={contact.website} onChange={(e) => setContact({ ...contact, website: e.target.value })} />
          </div>
          <p className="mt-4 text-xs text-neutral-500">We only collect what is needed for your trip and use it to serve this booking.</p>
        </section>
      </div>

      {/* price summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl border border-gold/40 bg-white p-6 shadow-xl">
          <h3 className="font-display text-xl font-semibold text-maroon">{pkg.name}</h3>
          <p className="text-xs text-neutral-500">{pkg.duration}</p>
          {quote ? (
            <dl className="mt-4 space-y-2 text-sm">
              <Row k={`${inr(quote.unit_price)} × ${quote.travellers}`} v={inr(quote.base)} />
              {quote.addons.map((a) => <Row key={a.slug} k={a.name} v={inr(a.amount)} />)}
              {quote.discount > 0 && <Row k={`Coupon ${quote.coupon_code}`} v={`− ${inr(quote.discount)}`} muted />}
              <Row k="GST (included)" v={inr(quote.tax)} muted />
              <div className="my-2 border-t border-gold/40" />
              <Row k="Total" v={inr(quote.total)} strong />
              <Row k={`Pay now (${quote.advance_percent}%)`} v={inr(quote.advance)} />
              <Row k="Pay on trip" v={inr(quote.balance)} />
              {quote.seats_left !== null && <p className="pt-1 text-xs text-rose-600">Only {quote.seats_left} seats left on this date</p>}
            </dl>
          ) : (
            <p className="mt-4 text-sm text-neutral-500">Select a date to see your price.</p>
          )}
          <div className="mt-4">
            <div className="flex gap-2">
              <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="Coupon code"
                className="min-w-0 flex-1 rounded-xl border border-gold/50 bg-cream/60 px-3 py-2 text-sm outline-none focus:border-saffron" />
              <button type="button" onClick={() => setCoupon(couponInput.trim())} className="rounded-xl border border-maroon px-3 py-2 text-sm font-semibold text-maroon hover:bg-maroon hover:text-gold-soft">
                Apply
              </button>
            </div>
            {coupon && quote?.coupon_code && <p className="mt-1 text-xs text-emerald-700">Coupon applied ✓</p>}
            {coupon && couponError && <p className="mt-1 text-xs text-rose-600">{couponError}</p>}
          </div>
          {formError && <p className="mt-3 text-sm text-rose-600">{formError}</p>}
          <button disabled={busy || !quote} className="mt-5 w-full rounded-full bg-saffron px-6 py-3.5 font-semibold text-night hover:bg-gold disabled:opacity-50">
            {busy ? "Reserving…" : "Continue to payment"}
          </button>
          <ul className="mt-5 space-y-2 text-xs text-neutral-600">
            <li className="flex gap-2"><Icon name="tag" className="h-4 w-4 text-saffron-2" /> Final price, no hidden charges</li>
            <li className="flex gap-2"><Icon name="driver" className="h-4 w-4 text-saffron-2" /> Driver card the night before</li>
            <li className="flex gap-2"><Icon name="shield" className="h-4 w-4 text-saffron-2" /> Refund as per cancellation policy</li>
          </ul>
        </div>
      </aside>
    </form>
  );
}

function Row({ k, v, strong, muted }: { k: string; v: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-semibold text-maroon" : muted ? "text-neutral-500" : ""}`}>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
