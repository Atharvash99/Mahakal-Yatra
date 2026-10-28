import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mandala } from "@/components/Art";
import JsonLd from "@/components/JsonLd";
import { getGuide, guides } from "@/data/guides";
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata(props: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const g = getGuide(slug);
  return g ? { title: `${g.title} | MahakalYatra`, description: g.description, alternates: { canonical: `/guides/${g.slug}` } } : {};
}

export default async function GuidePage(props: PageProps<"/guides/[slug]">) {
  const { slug } = await props.params;
  const g = getGuide(slug);
  if (!g) notFound();

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "Article", headline: g.title, description: g.description, mainEntityOfPage: `${SITE_URL}/guides/${g.slug}`, publisher: { "@type": "Organization", name: "MahakalYatra" } },
          { "@type": "FAQPage", mainEntity: g.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
        ],
      }} />
      <section className="relative overflow-hidden bg-gradient-to-br from-night via-maroon to-maroon-2 py-14 text-white">
        <Mandala className="pointer-events-none absolute -right-24 top-1/2 h-96 w-96 -translate-y-1/2 text-gold/20 animate-spin-slow" />
        <div className="relative mx-auto max-w-3xl px-4">
          <p className="font-deva text-3xl gold-text">{g.hindi}</p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-5xl">{g.title}</h1>
        </div>
      </section>
      <article className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-lg text-neutral-700">{g.intro}</p>
        {g.sections.map((s) => (
          <section key={s.heading} className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-maroon">{s.heading}</h2>
            {s.body.map((p) => (
              <p key={p} className="mt-3 text-neutral-700">{p}</p>
            ))}
          </section>
        ))}

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-maroon">Frequently asked</h2>
          <div className="mt-4 space-y-3">
            {g.faqs.map((f) => (
              <details key={f.q} className="rounded-2xl border border-gold/30 bg-white p-4">
                <summary className="cursor-pointer font-medium text-maroon">{f.q}</summary>
                <p className="mt-2 text-sm text-neutral-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-12 rounded-3xl bg-gradient-to-br from-maroon to-maroon-2 p-8 text-center text-white">
          <p className="font-display text-2xl">Ready to plan?</p>
          <Link href={g.cta.href} className="mt-4 inline-block rounded-full bg-saffron px-7 py-3 font-semibold text-night hover:bg-gold">
            {g.cta.label}
          </Link>
        </div>

        <aside className="mt-10 text-sm text-neutral-500">
          More guides:{" "}
          {guides.filter((x) => x.slug !== g.slug).map((x, i) => (
            <span key={x.slug}>{i > 0 && " · "}<Link href={`/guides/${x.slug}`} className="underline">{x.title}</Link></span>
          ))}
        </aside>
      </article>
    </>
  );
}
