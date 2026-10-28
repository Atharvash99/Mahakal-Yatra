import type { Metadata } from "next";
import MyBookings from "@/components/MyBookings";
import { Mandala } from "@/components/Art";

export const metadata: Metadata = { title: "My booking | MahakalYatra" };

export default function MyBookingsPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-night via-maroon to-maroon-2 py-10 text-white">
        <Mandala className="pointer-events-none absolute -right-20 top-1/2 h-80 w-80 -translate-y-1/2 text-gold/20 animate-spin-slow" />
        <div className="relative mx-auto max-w-6xl px-4">
          <p className="font-deva text-2xl gold-text">॥ आपकी यात्रा ॥</p>
          <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">My booking</h1>
        </div>
      </section>
      <div className="px-4 py-10">
        <MyBookings />
      </div>
    </>
  );
}
