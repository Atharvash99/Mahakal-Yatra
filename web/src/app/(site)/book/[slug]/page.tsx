import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import BookingFlow from "@/components/BookingFlow";
import { Mandala } from "@/components/Art";
import { getAddons, getPackage, getPackages } from "@/lib/catalog";

export async function generateStaticParams() {
  return (await getPackages()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/book/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await getPackage(slug);
  return { title: p ? `Book ${p.name} | MahakalYatra` : "Book | MahakalYatra" };
}

async function Flow({ slug, searchParams }: { slug: string; searchParams: PageProps<"/book/[slug]">["searchParams"] }) {
  const [p, addons] = await Promise.all([getPackage(slug), getAddons()]);
  if (!p) notFound();
  const sp = await searchParams;
  const date = typeof sp.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : undefined;
  const n = typeof sp.n === "string" ? Math.min(12, Math.max(1, parseInt(sp.n, 10) || 2)) : undefined;
  return <BookingFlow pkg={p} addons={addons} initialDate={date} initialTravellers={n} />;
}

export default async function BookPage(props: PageProps<"/book/[slug]">) {
  const { slug } = await props.params;
  const p = await getPackage(slug);
  if (!p) notFound();
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-night via-maroon to-maroon-2 py-10 text-white">
        <Mandala className="pointer-events-none absolute -right-20 top-1/2 h-80 w-80 -translate-y-1/2 text-gold/20 animate-spin-slow" />
        <div className="relative mx-auto max-w-6xl px-4">
          <p className="font-deva text-2xl gold-text">{p.hindi}</p>
          <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Book {p.name}</h1>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-sand/60" />}>
          <Flow slug={slug} searchParams={props.searchParams} />
        </Suspense>
      </div>
    </>
  );
}
