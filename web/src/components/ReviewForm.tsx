"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { post } from "@/lib/api";

const field =
  "mt-1 w-full rounded-xl border border-gold/50 bg-cream/60 px-3 py-2.5 text-sm outline-none transition focus:border-saffron focus:ring-2 focus:ring-saffron/30";

export default function ReviewForm() {
  const params = useSearchParams();
  const [ref, setRef] = useState(params.get("ref")?.toUpperCase() ?? "");
  const [phone, setPhone] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ google: string } | null>(null);

  async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!rating) { setError("Please choose a star rating."); return; }
    setBusy(true); setError("");
    const r = await post<{ google_review_url: string }>("/reviews/submit/", { ref, phone, rating, comment });
    setBusy(false);
    if (r.ok) setDone({ google: r.data.google_review_url }); else setError(r.error);
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-xl">
        <h2 className="font-display text-3xl font-bold text-maroon">Thank you 🙏</h2>
        <p className="mt-2 text-neutral-600">Your feedback helps other pilgrims plan with confidence.</p>
        {done.google && (
          <a href={done.google} target="_blank" rel="noreferrer" className="mt-6 inline-block rounded-full bg-saffron px-7 py-3 font-semibold text-night hover:bg-gold">
            Share it on Google too
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl border border-gold/40 bg-white p-6 shadow-xl">
      <div>
        <p className="text-sm font-medium text-maroon">How was your yatra?</p>
        <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => setRating(n)} className={`text-4xl transition ${n <= rating ? "text-saffron" : "text-gold/40 hover:text-gold"}`}>
              ★
            </button>
          ))}
        </div>
      </div>
      <label className="block text-sm font-medium text-maroon">Booking reference
        <input required value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} placeholder="MYXXXXXX" className={field} />
      </label>
      <label className="block text-sm font-medium text-maroon">Mobile number used for the booking
        <input required type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
      </label>
      <label className="block text-sm font-medium text-maroon">Tell us more (optional)
        <textarea rows={3} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} className={field} />
      </label>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button disabled={busy} className="w-full rounded-full bg-saffron px-6 py-3 font-semibold text-night hover:bg-gold disabled:opacity-60">
        {busy ? "Sending…" : "Submit review"}
      </button>
    </form>
  );
}
