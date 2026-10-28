import type { Metadata } from "next";
import { Suspense } from "react";
import ReviewForm from "@/components/ReviewForm";
import { Mandala } from "@/components/Art";

export const metadata: Metadata = { title: "Rate your trip | MahakalYatra" };

export default function ReviewPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-night via-maroon to-maroon-2 py-10 text-white">
        <Mandala className="pointer-events-none absolute -right-20 top-1/2 h-80 w-80 -translate-y-1/2 text-gold/20 animate-spin-slow" />
        <div className="relative mx-auto max-w-6xl px-4">
          <p className="font-deva text-2xl gold-text">॥ धन्यवाद ॥</p>
          <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Rate your trip</h1>
        </div>
      </section>
      <div className="mx-auto max-w-lg px-4 py-10">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-sand/60" />}>
          <ReviewForm />
        </Suspense>
      </div>
    </>
  );
}
