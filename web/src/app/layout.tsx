import type { Metadata } from "next";
import { Geist, Playfair_Display, Tiro_Devanagari_Hindi } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { whatsappLink } from "@/lib/whatsapp";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });
const deva = Tiro_Devanagari_Hindi({ variable: "--font-deva", subsets: ["devanagari", "latin"], weight: "400" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "MahakalYatra | Ujjain & Omkareshwar Tours",
  description:
    "Fixed-price Ujjain and Omkareshwar yatra packages with a named driver and vehicle shared before the trip.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${playfair.variable} ${deva.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-40 border-b border-gold/20 bg-night/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-deva text-2xl gold-text">ॐ</span>
              <span className="font-display text-lg font-semibold tracking-wide text-gold-soft">MahakalYatra</span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm text-gold-soft/80 md:flex">
              <Link href="/#packages" className="hover:text-white">Packages</Link>
              <Link href="/#how" className="hover:text-white">How it works</Link>
              <Link href="/#faq" className="hover:text-white">FAQ</Link>
              <Link href="/#festivals" className="hover:text-white">Festivals</Link>
              <Link href="/my-bookings" className="hover:text-white">My booking</Link>
              <Link href="/enquiry" className="hover:text-white">Enquiry</Link>
            </nav>
            <a
              href={whatsappLink("Hi MahakalYatra, I want to plan a yatra.")}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-saffron px-4 py-2 text-sm font-semibold text-night transition hover:bg-gold"
            >
              WhatsApp us
            </a>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-night text-gold-soft/70">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
            <div>
              <p className="font-display text-xl text-gold-soft">MahakalYatra</p>
              <p className="mt-2 text-sm">Ujjain &amp; Omkareshwar, done reliably. Fixed prices, named drivers, live support.</p>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-gold-soft">Explore</p>
              <ul className="mt-2 space-y-1">
                <li><Link href="/#packages" className="hover:text-white">Packages</Link></li>
                <li><Link href="/enquiry" className="hover:text-white">Send an enquiry</Link></li>
                <li><Link href="/#faq" className="hover:text-white">FAQ</Link></li>
                <li><Link href="/guides/bhasma-aarti-booking-guide" className="hover:text-white">Bhasma Aarti guide</Link></li>
                <li><Link href="/guides/indore-to-ujjain-taxi" className="hover:text-white">Indore to Ujjain taxi</Link></li>
                <li><Link href="/guides/ujjain-omkareshwar-one-day-trip" className="hover:text-white">Ujjain + Omkareshwar in a day</Link></li>
              </ul>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-gold-soft">Good to know</p>
              <p className="mt-2">
                We never promise guaranteed Bhasma Aarti, VIP darshan or temple tickets. Permissions are managed by the
                temple committee; we only guide you.
              </p>
            </div>
          </div>
          <div className="border-t border-gold/10 py-4 text-center text-xs">© MahakalYatra. Jai Mahakal 🙏</div>
        </footer>
      </body>
    </html>
  );
}
