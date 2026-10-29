import type { Metadata } from "next";
import { Geist, Playfair_Display, Tiro_Devanagari_Hindi } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

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
      <body className="min-h-full">{children}</body>
    </html>
  );
}
