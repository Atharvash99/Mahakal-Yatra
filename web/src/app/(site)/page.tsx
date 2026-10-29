import Link from "next/link";
import ChatBot from "@/components/ChatBot";
import QuickPlan from "@/components/QuickPlan";
import { Icon, Mandala, Skyline } from "@/components/Art";
import { inr } from "@/data/packages";
import { getPackages, getReviews } from "@/lib/catalog";
import { whatsappLink } from "@/lib/whatsapp";

const features = [
  { icon: "tag", title: "Fixed all-inclusive price", text: "One clear price with a visible includes and excludes panel. No surprises on trip day." },
  { icon: "driver", title: "Named driver and vehicle", text: "Driver name, photo and vehicle number sent on WhatsApp the night before." },
  { icon: "elder", title: "Family and elder friendly", text: "Relaxed itineraries, vegetarian meal stops and wheelchair information." },
  { icon: "chat", title: "Live trip support", text: "A real person on WhatsApp from pickup to drop, not a call-centre queue." },
] as const;

const steps = [
  { icon: "chat", title: "Tell us your plan", text: "Message us or send an enquiry with your dates and group size." },
  { icon: "list", title: "Get a clear quote", text: "Exact inclusions, exclusions and cancellation terms, in writing." },
  { icon: "calendar", title: "Confirm with advance", text: "Pay a small advance to lock your date. Balance on the trip." },
  { icon: "car", title: "Travel with peace of mind", text: "Meet your named driver and enjoy darshan without worry." },
] as const;

const faqs = [
  {
    q: "Can you guarantee Bhasma Aarti entry?",
    a: "No. Bhasma Aarti permissions are managed by the Mahakaleshwar temple committee. We guide you through the registration process and plan your day around it, but we never promise guaranteed access.",
  },
  {
    q: "What is included in the price?",
    a: "Every package page lists inclusions and exclusions clearly. Typically the vehicle, driver, fuel, toll and parking are included; meals and temple tickets are not.",
  },
  {
    q: "Do you pick up from Indore airport or station?",
    a: "Yes. Indore airport and railway pickup and drop are available as part of the packages or as a standalone transfer.",
  },
  {
    q: "What if I need to cancel?",
    a: "Each package shows its cancellation policy with refund percentages by how early you cancel. The same terms are stored with your booking.",
  },
  {
    q: "Is the trip suitable for elderly parents?",
    a: "Yes. Our itineraries are paced for families and elderly pilgrims. Tell us about wheelchair or walking needs and we will plan around them.",
  },
];

const festivals = [
  { hindi: "महाशिवरात्रि", name: "Mahashivratri", when: "Feb–Mar · date per panchang", note: "The biggest night at Mahakal. Advance booking and capped seats." },
  { hindi: "श्रावण सोमवार", name: "Shravan Somvar", when: "Monsoon (Shravan month)", note: "Every Monday sees heavy darshan crowds. Early start recommended." },
  { hindi: "कार्तिक पूर्णिमा", name: "Kartik Purnima", when: "Oct–Nov · date per panchang", note: "Holy dips and fairs along the Kshipra and Narmada." },
  { hindi: "सिंहस्थ २०२८", name: "Simhastha 2028", when: "Apr–May 2028 · Ujjain", note: "The great Kumbh of Ujjain. Register interest to be first in line." },
];

const gradients = [
  "from-maroon via-maroon-2 to-saffron-2",
  "from-[#2b1247] via-maroon-2 to-saffron",
  "from-night via-maroon to-gold",
];

export default async function Home() {
  const [packages, reviews] = await Promise.all([getPackages(), getReviews()]);
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-night via-maroon to-maroon-2 text-white">
        <div className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2">
          <div className="h-[46rem] w-[46rem] rounded-full bg-saffron/25 blur-[120px] animate-glow" />
        </div>
        <Mandala className="pointer-events-none absolute left-1/2 top-[30%] h-[44rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 text-gold/25 animate-spin-slow" />
        <div className="relative mx-auto max-w-4xl px-4 pb-48 pt-20 text-center sm:pt-28">
          <p className="animate-fade-up font-deva text-3xl gold-text sm:text-4xl">॥ जय महाकाल ॥</p>
          <h1 className="animate-fade-up delay-1 mt-5 font-display text-4xl font-bold leading-tight sm:text-6xl">
            Ujjain &amp; Omkareshwar,
            <br />
            <span className="gold-text">done reliably</span>
          </h1>
          <p className="animate-fade-up delay-2 mx-auto mt-5 max-w-2xl text-lg text-gold-soft/85">
            Fixed-price yatra packages with a named driver, a clear includes and excludes list, and live support from
            pickup to drop.
          </p>
          <div className="animate-fade-up delay-3 mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={whatsappLink("Hi MahakalYatra, I want to book a yatra.")}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-saffron px-7 py-3.5 font-semibold text-night shadow-lg shadow-saffron/30 transition hover:bg-gold"
            >
              Plan my yatra on WhatsApp
            </a>
            <Link
              href="/#packages"
              className="rounded-full border border-gold/60 px-7 py-3.5 font-semibold text-gold-soft transition hover:bg-gold/10"
            >
              View packages
            </Link>
          </div>
          <QuickPlan packages={packages} />
          <div className="animate-fade-up delay-3 mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-4 text-center">
            {[
              ["2", "Jyotirlingas"],
              ["100%", "Written inclusions"],
              ["24×7", "Trip-day support"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-2xl border border-gold/20 bg-white/5 px-2 py-4 backdrop-blur">
                <p className="font-display text-2xl text-gold sm:text-3xl">{n}</p>
                <p className="mt-1 text-xs text-gold-soft/80 sm:text-sm">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <Skyline className="absolute inset-x-0 bottom-0 h-32 w-full text-cream sm:h-44" />
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-saffron-2">Why MahakalYatra</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-maroon sm:text-4xl">Trust built into every trip</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-gold/30 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-saffron/10"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-saffron to-gold text-night">
                <Icon name={f.icon} />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-maroon">{f.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PACKAGES */}
      <section id="packages" className="scroll-mt-20 bg-sand/60 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-saffron-2">Our packages</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-maroon sm:text-4xl">Choose your yatra</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {packages.map((p, i) => (
              <Link
                key={p.slug}
                href={`/packages/${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-md transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className={`relative h-44 overflow-hidden bg-gradient-to-br ${gradients[i % 3]}`}>
                  <Mandala className="absolute -right-10 -top-10 h-56 w-56 text-white/20 transition group-hover:rotate-12" />
                  <Skyline className="absolute inset-x-0 bottom-0 h-16 w-full text-white/90" />
                  <span className="absolute left-5 top-5 rounded-full bg-night/60 px-3 py-1 text-xs font-medium text-gold-soft backdrop-blur">
                    {p.duration}
                  </span>
                  <p className="absolute bottom-20 left-5 font-deva text-3xl text-white drop-shadow">{p.hindi}</p>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-xl font-semibold text-maroon">{p.name}</h3>
                  <p className="mt-2 text-sm text-neutral-600">{p.tagline}</p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {p.highlights.slice(0, 3).map((h) => (
                      <li key={h} className="rounded-full bg-gold-soft/60 px-2.5 py-1 text-xs text-maroon">
                        {h}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto flex items-end justify-between pt-6">
                    <div>
                      <p className="text-xs text-neutral-500">From</p>
                      <p className="font-display text-2xl font-bold text-maroon">{inr(p.price)}</p>
                      <p className="text-xs text-neutral-500">per person</p>
                    </div>
                    <span className="rounded-full bg-maroon px-4 py-2 text-sm font-medium text-gold-soft transition group-hover:bg-saffron-2 group-hover:text-white">
                      View &amp; book →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-neutral-500">
            Prices shown are placeholders until supplier rates are confirmed.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-saffron-2">How it works</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-maroon sm:text-4xl">From enquiry to darshan</h2>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-gold/30 bg-white p-6 text-center">
              <span className="absolute -top-4 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-maroon font-display text-sm text-gold">
                {i + 1}
              </span>
              <span className="mx-auto mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-gold-soft text-maroon">
                <Icon name={s.icon} />
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold text-maroon">{s.title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FESTIVAL CALENDAR */}
      <section id="festivals" className="scroll-mt-20 bg-sand/60 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-saffron-2">Festival calendar</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-maroon sm:text-4xl">Plan early for the big days</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-neutral-600">
              Festival dates fill up fast. We cap seats, take advance bookings and price these dates higher so every
              traveller gets a proper trip. Exact dates follow the panchang and are confirmed on booking.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {festivals.map((f) => (
              <div key={f.name} className="relative overflow-hidden rounded-2xl border border-gold/40 bg-white p-5 shadow-sm">
                <Mandala className="absolute -right-8 -top-8 h-28 w-28 text-gold/30" />
                <p className="font-deva text-2xl text-saffron-2">{f.hindi}</p>
                <h3 className="mt-1 font-display text-lg font-semibold text-maroon">{f.name}</h3>
                <p className="mt-1 text-xs font-medium text-neutral-500">{f.when}</p>
                <p className="mt-3 text-sm text-neutral-600">{f.note}</p>
                <Link href="/enquiry" className="mt-4 inline-block text-sm font-semibold text-maroon underline">
                  Reserve my date →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DRIVER CARD + BHASMA AARTI */}
      <section className="bg-gradient-to-br from-night via-maroon to-maroon-2 py-20 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-gold">Know who is driving you</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
              Your driver card, <span className="gold-text">the night before</span>
            </h2>
            <p className="mt-4 text-gold-soft/85">
              No guesswork on pickup day. You receive your driver&apos;s name, photo, vehicle number and rating on
              WhatsApp, so you and your family can travel with confidence.
            </p>
            <div className="mt-8 rounded-2xl border border-gold/30 bg-white/5 p-5 backdrop-blur">
              <div className="flex items-start gap-3">
                <Icon name="shield" className="mt-0.5 h-6 w-6 shrink-0 text-gold" />
                <div>
                  <h3 className="font-display text-lg text-gold-soft">Bhasma Aarti guidance</h3>
                  <p className="mt-1 text-sm text-gold-soft/80">
                    We help you understand the registration process and plan your visit around it. Access is decided by
                    the temple committee, so we never promise guaranteed entry.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm">
            <div className="rotate-2 rounded-3xl bg-cream p-5 text-neutral-800 shadow-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-saffron-2">Sample driver card</p>
              <div className="mt-4 flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-saffron to-gold text-night">
                  <Icon name="driver" className="h-9 w-9" />
                </span>
                <div>
                  <p className="font-display text-xl font-semibold text-maroon">Your Driver Name</p>
                  <p className="text-sm text-neutral-600">★ 4.8 · 6 years experience</p>
                </div>
              </div>
              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between rounded-lg bg-white px-3 py-2">
                  <dt className="text-neutral-500">Vehicle</dt>
                  <dd className="font-medium">AC Sedan / SUV</dd>
                </div>
                <div className="flex justify-between rounded-lg bg-white px-3 py-2">
                  <dt className="text-neutral-500">Number</dt>
                  <dd className="font-medium">MP 09 XX 0000</dd>
                </div>
                <div className="flex justify-between rounded-lg bg-white px-3 py-2">
                  <dt className="text-neutral-500">Pickup</dt>
                  <dd className="font-medium">6:00 AM</dd>
                </div>
              </dl>
              <p className="mt-4 flex items-center gap-2 text-xs text-green-700">
                <Icon name="check" className="h-4 w-4" /> Sent on WhatsApp the night before
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS: only real, approved reviews are ever shown */}
      {reviews.count > 0 && (
        <section id="reviews" className="mx-auto max-w-6xl px-4 pt-20">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-saffron-2">Traveller reviews</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-maroon sm:text-4xl">
              {reviews.average} <span className="text-saffron">★</span>
              <span className="ml-2 text-lg font-normal text-neutral-500">from {reviews.count} trips</span>
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {reviews.reviews.slice(0, 3).map((r) => (
              <figure key={r.name + r.date} className="rounded-2xl border border-gold/30 bg-white p-6 shadow-sm">
                <p className="text-saffron" aria-label={`${r.rating} out of 5`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                <blockquote className="mt-3 text-sm text-neutral-700">{r.comment || "A smooth, well-organised yatra."}</blockquote>
                <figcaption className="mt-4 text-xs font-semibold text-maroon">{r.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 mx-auto max-w-3xl px-4 py-20">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-saffron-2">Questions</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-maroon sm:text-4xl">Frequently asked</h2>
        </div>
        <div className="mt-10 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-gold/30 bg-white p-5 open:shadow-md">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-maroon">
                {f.q}
                <span className="ml-4 text-xl text-saffron-2 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-neutral-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-maroon py-16 text-center text-white">
        <Mandala className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 text-gold/15" />
        <div className="relative mx-auto max-w-2xl px-4">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Ready for <span className="gold-text">Mahakal darshan?</span>
          </h2>
          <p className="mt-3 text-gold-soft/85">Tell us your dates. We will handle the rest.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              href={whatsappLink("Hi MahakalYatra, I want to book a yatra.")}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-saffron px-7 py-3.5 font-semibold text-night hover:bg-gold"
            >
              WhatsApp us
            </a>
            <Link href="/enquiry" className="rounded-full border border-gold/60 px-7 py-3.5 font-semibold text-gold-soft hover:bg-gold/10">
              Send an enquiry
            </Link>
          </div>
        </div>
      </section>
      <ChatBot packages={packages} />
    </>
  );
}
