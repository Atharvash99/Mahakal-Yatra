import type { Metadata } from "next";
import { Suspense } from "react";
import EnquiryForm from "@/components/EnquiryForm";
import { Icon, Mandala } from "@/components/Art";

export const metadata: Metadata = {
  title: "Enquiry | MahakalYatra",
  description: "Tell us your travel dates and we will plan your Ujjain and Omkareshwar yatra.",
};

async function FormWithPackage({ searchParams }: { searchParams: PageProps<"/enquiry">["searchParams"] }) {
  const sp = await searchParams;
  const pkg = typeof sp.package === "string" ? sp.package : "";
  return <EnquiryForm defaultPackage={pkg} />;
}

export default function EnquiryPage(props: PageProps<"/enquiry">) {
  return (
    <div className="grid min-h-[80vh] lg:grid-cols-2">
      <section className="relative overflow-hidden bg-gradient-to-br from-night via-maroon to-maroon-2 px-6 py-14 text-white sm:px-12 lg:py-20">
        <Mandala className="pointer-events-none absolute -bottom-32 -left-32 h-[32rem] w-[32rem] text-gold/20 animate-spin-slow" />
        <div className="relative mx-auto max-w-md">
          <p className="font-deva text-3xl gold-text">॥ हर हर महादेव ॥</p>
          <h1 className="mt-4 font-display text-4xl font-bold">Plan your yatra</h1>
          <p className="mt-3 text-gold-soft/85">
            Share a few details and our team will reply on WhatsApp or phone with a clear, written quote.
          </p>
          <ul className="mt-8 space-y-4 text-sm text-gold-soft/90">
            <li className="flex gap-3"><Icon name="tag" className="h-5 w-5 shrink-0 text-gold" /> Fixed price with inclusions and exclusions</li>
            <li className="flex gap-3"><Icon name="driver" className="h-5 w-5 shrink-0 text-gold" /> Named driver and vehicle before the trip</li>
            <li className="flex gap-3"><Icon name="shield" className="h-5 w-5 shrink-0 text-gold" /> Honest guidance on Bhasma Aarti, no false promises</li>
          </ul>
        </div>
      </section>
      <section className="px-4 py-12 sm:px-12 lg:py-20">
        <div className="mx-auto max-w-lg">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-sand/60" />}>
            <FormWithPackage searchParams={props.searchParams} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
