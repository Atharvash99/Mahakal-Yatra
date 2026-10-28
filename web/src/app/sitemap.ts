import type { MetadataRoute } from "next";
import { guides } from "@/data/guides";
import { getPackages } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const packages = await getPackages();
  const page = (path: string, priority: number) => ({ url: `${SITE_URL}${path}`, priority });
  return [
    page("/", 1),
    page("/enquiry", 0.6),
    page("/my-bookings", 0.3),
    ...packages.map((p) => page(`/packages/${p.slug}`, 0.9)),
    ...guides.map((g) => page(`/guides/${g.slug}`, 0.8)),
  ];
}
