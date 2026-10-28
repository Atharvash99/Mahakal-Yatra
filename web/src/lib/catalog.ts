// Server-side data access. The Django API is the source of truth; if it is
// unreachable (for example during a build) we fall back to the static copy.
import { cacheLife } from "next/cache";
import { packages as fallbackPackages, type TravelPackage } from "@/data/packages";

const BASE = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function api<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}/api${path}`);
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

// prices and content change rarely: refresh at most every 15 minutes
const life = { stale: 300, revalidate: 900, expire: 86400 };

export async function getPackages(): Promise<TravelPackage[]> {
  "use cache";
  cacheLife(life);
  const data = await api<TravelPackage[]>("/packages/");
  return data?.length ? data : fallbackPackages;
}

export async function getPackage(slug: string): Promise<TravelPackage | undefined> {
  return (await getPackages()).find((p) => p.slug === slug);
}

export type Addon = { slug: string; name: string; description: string; price: number; perPerson: boolean };

export async function getAddons(): Promise<Addon[]> {
  "use cache";
  cacheLife(life);
  return (await api<Addon[]>("/addons/")) ?? [];
}

export type Review = { name: string; rating: number; comment: string; package: string; date: string };
export type ReviewsData = { average: number | null; count: number; reviews: Review[] };

export async function getReviews(packageSlug?: string): Promise<ReviewsData> {
  "use cache";
  cacheLife({ stale: 120, revalidate: 600, expire: 86400 });
  const q = packageSlug ? `?package=${encodeURIComponent(packageSlug)}` : "";
  return (await api<ReviewsData>(`/reviews/${q}`)) ?? { average: null, count: 0, reviews: [] };
}
