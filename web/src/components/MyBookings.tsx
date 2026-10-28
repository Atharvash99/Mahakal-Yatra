"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Art";
import { inr, niceDate, openRazorpay, post, recallBooking, rememberBooking, type Booking, type PaymentOrder } from "@/lib/api";
import { whatsappLink } from "@/lib/whatsapp";

const field =
  "mt-1 w-full rounded-xl border border-gold/50 bg-cream/60 px-3 py-2.5 text-sm outline-none transition focus:border-saffron focus:ring-2 focus:ring-saffron/30";

const STEPS = [
  { key: "pending_payment", label: "Reserved" },
  { key: "confirmed", label: "Confirmed" },
  { key: "assigned", label: "Driver assigned" },
  { key: "completed", label: "Completed" },
] as const;

export default function MyBookings() {
  const [ref, setRef] = useState("");
  const [phone, setPhone] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [refundPct, setRefundPct] = useState(0);
  const [note, setNote] = useState("");

  async function load(r: string, p: string) {
    setBusy(true); setError("");
    const res = await post<{ booking: Booking }>("/bookings/lookup/", { ref: r, phone: p });
    setBusy(false);
    if (res.ok) { setBooking(res.data.booking); rememberBooking(r.toUpperCase(), p); }
    else { setBooking(null); setError(res.error); }
  }

  // reopen the booking just made in this browser session
  useEffect(() => {
    (async () => {
      const saved = recallBooking();
      if (!saved) return;
      const res = await post<{ booking: Booking }>("/bookings/lookup/", saved);
      setRef(saved.ref);
      setPhone(saved.phone);
      if (res.ok) setBooking(res.data.booking);
    })();
  }, []);

  function askCancel() {
    if (!booking) return;
    const hoursLeft = (new Date(booking.travel_date + "T06:00:00").getTime() - Date.now()) / 36e5;
    const rule = [...booking.cancellation_policy]
      .sort((a, b) => b.hours_before - a.hours_before)
      .find((r) => hoursLeft >= r.hours_before);
    setRefundPct(rule?.refund_percent ?? 0);
    setConfirmCancel(true);
  }

  async function payBalance() {
    if (!booking) return;
    setBusy(true); setNote("");
    const res = await post<{ payment: PaymentOrder }>("/bookings/pay-balance/", { ref: booking.ref, phone });
    if (!res.ok) { setBusy(false); setError(res.error); return; }
    const order = res.data.payment;
    if (order.gateway === "razorpay") {
      setBusy(false);
      openRazorpay(order, booking.customer_name, () => load(booking.ref, phone));
      return;
    }
    await post("/bookings/mock-pay/", { ref: booking.ref, phone, order_id: order.order_id });
    setBusy(false);
    setNote("Balance paid (test mode). Thank you!");
    load(booking.ref, phone);
  }

  async function cancel() {
    if (!booking) return;
    setBusy(true);
    const res = await post<{ booking: Booking; refund: { amount: number; percent: number } | null }>("/bookings/cancel/", { ref: booking.ref, phone });
    setBusy(false);
    setConfirmCancel(false);
    if (!res.ok) { setError(res.error); return; }
    setBooking(res.data.booking);
    setNote(res.data.refund ? `Cancelled. Refund of ${inr(res.data.refund.amount)} (${res.data.refund.percent}%) will be sent to your original payment method.` : "Booking cancelled.");
  }

  const canCancel = booking && ["pending_payment", "confirmed", "assigned"].includes(booking.status);
  const cancelled = booking && ["cancelled", "refunded"].includes(booking.status);
  const stepIndex = booking ? STEPS.findIndex((s) => s.key === booking.status) : -1;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <form onSubmit={(e) => { e.preventDefault(); load(ref, phone); }} className="rounded-3xl border border-gold/40 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl font-bold text-maroon">Find your booking</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-maroon">Booking reference
            <input required value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} placeholder="MYXXXXXX" className={field} />
          </label>
          <label className="block text-sm font-medium text-maroon">Mobile number
            <input required type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        <button disabled={busy} className="mt-5 rounded-full bg-maroon px-7 py-3 font-semibold text-gold-soft hover:bg-maroon-2 disabled:opacity-60">
          {busy ? "Looking…" : "View booking"}
        </button>
      </form>

      {note && <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">{note}</p>}

      {booking && (
        <article className="overflow-hidden rounded-3xl border border-gold/40 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-maroon to-maroon-2 px-6 py-5 text-white">
            <p className="text-xs uppercase tracking-widest text-gold">Booking {booking.ref}</p>
            <h3 className="mt-1 font-display text-2xl font-bold">{booking.package_name}</h3>
            <p className="mt-1 text-sm text-gold-soft/90">
              {niceDate(booking.travel_date)} · {booking.travellers} traveller{booking.travellers > 1 ? "s" : ""}
              {booking.festival_label && ` · ${booking.festival_label}`}
            </p>
          </div>

          <div className="p-6">
            {cancelled ? (
              <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
                This booking is {booking.status_label.toLowerCase()}.
                {booking.refunds[0] && ` Refund ${inr(booking.refunds[0].amount)} (${booking.refunds[0].percent}%): ${booking.refunds[0].status}.`}
              </p>
            ) : (
              <ol className="flex items-start justify-between gap-2">
                {STEPS.map((s, i) => {
                  const done = i <= stepIndex;
                  return (
                    <li key={s.key} className="flex flex-1 flex-col items-center text-center">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold ${done ? "border-saffron bg-saffron text-night" : "border-gold/50 text-neutral-400"}`}>
                        {done ? "✓" : i + 1}
                      </span>
                      <span className={`mt-2 text-xs ${done ? "font-semibold text-maroon" : "text-neutral-400"}`}>{s.label}</span>
                    </li>
                  );
                })}
              </ol>
            )}

            {booking.driver_card && (
              <div className="mt-6 rounded-2xl border border-gold/40 bg-cream p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-saffron-2">Your driver card</p>
                <div className="mt-3 flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-saffron to-gold text-night">
                    <Icon name="driver" className="h-8 w-8" />
                  </span>
                  <div>
                    <p className="font-display text-xl font-semibold text-maroon">{booking.driver_card.driver_name}</p>
                    <p className="text-sm text-neutral-600">★ {booking.driver_card.rating} · {booking.driver_card.years_experience} yrs experience</p>
                  </div>
                </div>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                  <div className="rounded-lg bg-white px-3 py-2"><dt className="text-xs text-neutral-500">Vehicle</dt><dd className="font-medium">{booking.driver_card.vehicle}</dd></div>
                  <div className="rounded-lg bg-white px-3 py-2"><dt className="text-xs text-neutral-500">Number</dt><dd className="font-medium">{booking.driver_card.vehicle_number}</dd></div>
                  <div className="rounded-lg bg-white px-3 py-2"><dt className="text-xs text-neutral-500">Pickup</dt><dd className="font-medium">{booking.driver_card.pickup_time ?? "As agreed"}</dd></div>
                </dl>
                <a href={`tel:${booking.driver_card.driver_phone}`} className="mt-4 inline-block text-sm font-semibold text-maroon underline">Call driver: {booking.driver_card.driver_phone}</a>
              </div>
            )}

            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between"><dt>Total</dt><dd className="font-semibold">{inr(booking.price.total)}</dd></div>
              <div className="flex justify-between"><dt>Paid</dt><dd>{inr(booking.price.paid)}</dd></div>
              {!cancelled && <div className="flex justify-between font-semibold text-maroon"><dt>Balance due on trip</dt><dd>{inr(booking.price.balance_due)}</dd></div>}
              <div className="flex justify-between text-neutral-500"><dt>Pickup</dt><dd>{booking.pickup_point || "To be confirmed"}</dd></div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              {["confirmed", "assigned"].includes(booking.status) && booking.price.balance_due > 0 && (
                <button onClick={payBalance} disabled={busy} className="rounded-full bg-saffron px-6 py-2.5 text-sm font-semibold text-night hover:bg-gold disabled:opacity-60">
                  Pay balance {inr(booking.price.balance_due)}
                </button>
              )}
              <a href={whatsappLink(`Hi MahakalYatra, booking ${booking.ref}: I need help.`)} target="_blank" rel="noreferrer"
                className="rounded-full border border-maroon px-6 py-2.5 text-sm font-semibold text-maroon hover:bg-maroon hover:text-gold-soft">
                Support on WhatsApp
              </a>
              {canCancel && !confirmCancel && (
                <button onClick={askCancel} className="rounded-full px-4 py-2.5 text-sm text-rose-700 underline">Cancel booking</button>
              )}
            </div>

            {confirmCancel && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm">
                <p className="text-rose-900">
                  Cancelling now refunds <b>{refundPct}%</b> of what you paid{booking.price.paid > 0 && ` (${inr(Math.floor((booking.price.paid * refundPct) / 100))})`}.
                  This cannot be undone.
                </p>
                <div className="mt-3 flex gap-3">
                  <button onClick={cancel} disabled={busy} className="rounded-full bg-rose-700 px-5 py-2 font-semibold text-white disabled:opacity-60">Yes, cancel</button>
                  <button onClick={() => setConfirmCancel(false)} className="rounded-full border border-rose-300 px-5 py-2">Keep booking</button>
                </div>
              </div>
            )}
          </div>
        </article>
      )}

      {!booking && (
        <p className="text-center text-sm text-neutral-500">
          New here? <Link href="/#packages" className="font-semibold text-maroon underline">Browse packages</Link>
        </p>
      )}
    </div>
  );
}
