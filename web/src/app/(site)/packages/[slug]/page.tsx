import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ChatBot from "@/components/ChatBot";
import { Icon, Mandala, Skyline } from "@/components/Art";
import { inr } from "@/data/packages";
import { getPackage, getPackages, getReviews } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import { whatsappLink } from "@/lib/whatsapp";

export async function generateStaticParams() {
  return (await getPackages()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/packages/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await getPackage(slug);
  return p ? { title: `${p.name} | MahakalYatra`, description: p.tagline } : {};
}

export default async function PackagePage(props: PageProps<"/packages/[slug]">) {
  const { slug } = await props.params;
  const [p, all, reviews] = await Promise.all([getPackage(slug), getPackages(), getReviews(slug)]);
  if (!p) notFound();

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "TouristTrip",
        name: p.name,
        description: p.tagline,
        touristType: "Pilgrims",
        itinerary: p.itinerary.map((s) => ({ "@type": "TouristAttraction", name: s.title, description: s.detail })),
        offers: { "@type": "Offer", price: p.price, priceCurrency: "INR", availability: "https://schema.org/InStock", url: `${SITE_URL}/packages/${p.slug}` },
        provider: { "@type": "TravelAgency", name: "MahakalYatra", url: SITE_URL },
        ...(reviews.count > 0 && reviews.average ? { aggregateRating: { "@type": "AggregateRating", ratingValue: reviews.average, reviewCount: reviews.count } } : {}),
      }} />
      <section className="relative overflow-hidden bg-gradient-to-b from-night via-maroon to-maroon-2 text-white">
        <Mandala className="pointer-events-none absolute -right-24 top-1/2 h-[30rem] w-[30rem] -translate-y-1/2 text-gold/20 animate-spin-slow" />
        <div className="relative mx-auto max-w-6xl px-4 pb-28 pt-12 sm:pt-16">
          <Link href="/#packages" className="text-sm text-gold-soft/80 hover:text-white">
            ← All packages
          </Link>
          <p className="animate-fade-up mt-6 font-deva text-3xl gold-text">{p.hindi}</p>
          <h1 className="animate-fade-up delay-1 mt-2 font-display text-4xl font-bold sm:text-5xl">{p.name}</h1>
          <p className="animate-fade-up delay-2 mt-3 max-w-xl text-lg text-gold-soft/85">{p.tagline}</p>
          <div className="animate-fade-up delay-3 mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-white/10 px-4 py-1.5 backdrop-blur">⏱ {p.duration}</span>
            <span className="rounded-full bg-white/10 px-4 py-1.5 backdrop-blur">📍 {p.pickupPoint}</span>
          </div>
        </div>
        <Skyline className="absolute inset-x-0 bottom-0 h-24 w-full text-cream sm:h-32" />
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1fr_22rem]">
        <article>
          <h2 className="font-display text-2xl font-semibold text-maroon">Highlights</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {p.highlights.map((h) => (
              <li key={h} className="rounded-full border border-gold/50 bg-gold-soft/50 px-3 py-1 text-sm text-maroon">
                {h}
              </li>
            ))}
          </ul>

          <h2 className="mt-12 font-display text-2xl font-semibold text-maroon">Itinerary</h2>
          <ol className="relative mt-5 space-y-5 border-l-2 border-gold/50 pl-7">
            {p.itinerary.map((s) => (
              <li key={s.title} className="relative rounded-2xl bg-white p-4 shadow-sm">
                <span className="absolute -left-[2.35rem] top-5 h-4 w-4 rounded-full border-2 border-gold bg-saffron" />
                <p className="font-display text-lg font-semibold text-maroon">{s.title}</p>
                <p className="mt-1 text-sm text-neutral-600">{s.detail}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-emerald-900">
                <Icon name="check" className="h-5 w-5" /> Included
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-emerald-950">
                {p.inclusions.map((i) => (
                  <li key={i.label} className="flex gap-2">
                    <span className="text-emerald-600">✓</span>
                    {i.label}
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <h2 className="font-display text-lg font-semibold text-rose-900">✕ Not included</h2>
              <ul className="mt-3 space-y-2 text-sm text-rose-950">
                {p.exclusions.map((i) => (
                  <li key={i.label} className="flex gap-2">
                    <span className="text-rose-500">✕</span>
                    {i.label}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {reviews.count > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-2xl font-semibold text-maroon">
                Traveller reviews <span className="text-base font-normal text-neutral-500">{reviews.average} ★ · {reviews.count}</span>
              </h2>
              <div className="mt-4 space-y-3">
                {reviews.reviews.slice(0, 3).map((r) => (
                  <figure key={r.name + r.date} className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-sm text-saffron">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                    <blockquote className="mt-1 text-sm text-neutral-700">{r.comment || "A smooth, well-organised yatra."}</blockquote>
                    <figcaption className="mt-2 text-xs font-semibold text-maroon">{r.name}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}

          <h2 className="mt-12 font-display text-2xl font-semibold text-maroon">Cancellation policy</h2>
          <ul className="mt-4 divide-y divide-gold/30 overflow-hidden rounded-2xl border border-gold/40 bg-white text-sm">
            {p.cancellation.map((r) => (
              <li key={r.hoursBefore} className="flex items-center justify-between px-4 py-3">
                <span>{r.hoursBefore > 0 ? `${r.hoursBefore}+ hours before pickup` : "Later than that"}</span>
                <span className="rounded-full bg-gold-soft px-3 py-0.5 font-semibold text-maroon">
                  {r.refundPercent}% refund
                </span>
              </li>
            ))}
          </ul>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-gold/40 bg-white p-6 shadow-xl">
            <p className="text-sm text-neutral-500">Final price</p>
            <p className="font-display text-4xl font-bold text-maroon">{inr(p.price)}</p>
            <p className="text-sm text-neutral-500">per person · all inclusions as listed</p>
            <Link
              href={`/book/${p.slug}`}
              className="mt-5 block rounded-full bg-saffron px-6 py-3 text-center font-semibold text-night shadow-lg shadow-saffron/30 hover:bg-gold"
            >
              Book now
            </Link>
            <a
              href={whatsappLink(`Hi MahakalYatra, I want to book ${p.name}.`)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 block rounded-full border border-maroon px-6 py-3 text-center font-semibold text-maroon hover:bg-maroon hover:text-gold-soft"
            >
              Chat on WhatsApp
            </a>
            <Link
              href={`/enquiry?package=${p.slug}`}
              className="mt-3 block text-center text-sm text-neutral-600 underline"
            >
              Or send an enquiry
            </Link>
            <ul className="mt-5 space-y-2 text-xs text-neutral-600">
              <li className="flex gap-2"><Icon name="driver" className="h-4 w-4 text-saffron-2" /> Driver card the night before</li>
              <li className="flex gap-2"><Icon name="shield" className="h-4 w-4 text-saffron-2" /> Written cancellation terms</li>
              <li className="flex gap-2"><Icon name="chat" className="h-4 w-4 text-saffron-2" /> Live WhatsApp support</li>
            </ul>
          </div>
        </aside>
      </div>
      <ChatBot packages={all} packageSlug={p.slug} />
    </>
  );
}
