// SEO guides for the high-intent searches named in the plan. Keep claims general:
// timings, rules and fees change, so each guide points readers to confirm locally.

export type Guide = {
  slug: string;
  title: string;
  description: string;
  hindi: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
  faqs: { q: string; a: string }[];
  cta: { label: string; href: string };
};

export const guides: Guide[] = [
  {
    slug: "ujjain-omkareshwar-one-day-trip",
    title: "Ujjain and Omkareshwar in One Day: Is It Possible?",
    description:
      "How to plan an Ujjain and Omkareshwar yatra from Indore, what a 1-day trip covers, and why most families prefer 2 days.",
    hindi: "उज्जैन · ओंकारेश्वर",
    intro:
      "Ujjain (Mahakaleshwar) and Omkareshwar are two of the twelve Jyotirlingas, and both are within a few hours of Indore. Doing both in a single day is possible, but it is a long, rushed day. Here is how to decide.",
    sections: [
      {
        heading: "The two places at a glance",
        body: [
          "Ujjain is about an hour and a half from Indore by road and is home to Mahakaleshwar, Kal Bhairav, Harsiddhi, Ram Ghat, Sandipani Ashram and Mangalnath.",
          "Omkareshwar sits on the Narmada river a few hours from Indore. Most visitors combine the Jyotirlinga darshan with the Narmada ghat and the Mamleshwar temple.",
          "Ujjain and Omkareshwar are in different directions from Indore, so doing both means long driving hours.",
        ],
      },
      {
        heading: "One day or two?",
        body: [
          "A 1-day trip works best when you choose one destination: either the Ujjain temple circuit or Omkareshwar.",
          "Covering both in one day usually means leaving very early, long queues with little slack, and a late return. Families with children or elderly parents generally find two days far more comfortable.",
          "A 2-day yatra lets you stay overnight in Ujjain, see the evening aarti atmosphere, and reach Omkareshwar fresh the next morning.",
        ],
      },
      {
        heading: "Practical tips",
        body: [
          "Start early. Darshan queues are shortest in the morning.",
          "Check the temple committee's official channels for current timings and any registration needs before you travel.",
          "Wear comfortable footwear and carry water. Both places involve walking and steps.",
          "Festival days such as Mahashivratri and Shravan Mondays are very crowded. Plan and book well in advance.",
        ],
      },
    ],
    faqs: [
      { q: "Can I visit both Jyotirlingas in one day?", a: "It is possible but tiring. Most families prefer a 2-day plan, or a single destination per day." },
      { q: "Do you pick up from Indore airport?", a: "Yes, Indore airport and railway pickup and drop are part of our packages." },
    ],
    cta: { label: "See the 2-day Ujjain + Omkareshwar package", href: "/packages/ujjain-omkareshwar-2-days" },
  },
  {
    slug: "indore-to-ujjain-taxi",
    title: "Indore to Ujjain Taxi: What to Know Before You Book",
    description:
      "Planning an Indore to Ujjain cab for darshan? Here is what a fair, transparent taxi booking should include.",
    hindi: "इंदौर से उज्जैन",
    intro:
      "Most pilgrims reach Ujjain through Indore, which has the nearest airport and a major railway station. A good taxi booking removes stress: a clear price, a named driver and a pickup that is actually on time.",
    sections: [
      {
        heading: "What a transparent fare includes",
        body: [
          "The vehicle, driver, fuel, toll and parking should be stated clearly, not discovered on the day.",
          "Ask whether waiting time at the temple is included, and what happens if darshan takes longer than planned.",
          "Prefer operators who share the driver's name and vehicle number in advance.",
        ],
      },
      {
        heading: "Why licensed commercial vehicles matter",
        body: [
          "Paid tourist transport should use properly permitted commercial vehicles with insurance. A private car offered as a taxi can leave you uninsured and unprotected if something goes wrong.",
        ],
      },
      {
        heading: "Airport and station transfers",
        body: [
          "Tell your operator your flight or train number so they can track delays and be there when you arrive.",
          "If you are travelling with elderly family members, mention it so the right vehicle and a comfortable pace can be arranged.",
        ],
      },
    ],
    faqs: [
      { q: "Do you share the driver details?", a: "Yes. You receive the driver's name, photo and vehicle number on WhatsApp the night before the trip." },
      { q: "Is there a standalone transfer without a package?", a: "Yes. Airport and railway pickup and drop can be booked on its own or added to any package." },
    ],
    cta: { label: "Plan your Ujjain trip", href: "/#packages" },
  },
  {
    slug: "bhasma-aarti-booking-guide",
    title: "Mahakal Bhasma Aarti: Booking and Visit Guide",
    description:
      "An honest guide to Bhasma Aarti at Mahakaleshwar: how registration works in general and how to plan your visit.",
    hindi: "भस्म आरती",
    intro:
      "The Bhasma Aarti at Mahakaleshwar is among the most sought-after experiences in Ujjain. Access is controlled by the temple committee, so no outside operator, including us, can guarantee a place. This guide explains how to prepare.",
    sections: [
      {
        heading: "How access works",
        body: [
          "Permissions for Bhasma Aarti are issued by the Mahakaleshwar temple committee through its official process. The process, quotas and rules can change.",
          "Always use the official channels announced by the temple committee, and be careful of anyone promising guaranteed or special-access tickets.",
        ],
      },
      {
        heading: "How we can help",
        body: [
          "We guide you through the registration steps, help you plan your day around the aarti timing, and arrange transport and stay so you are rested and on time.",
          "We do not sell tickets or promise access. If your registration is not confirmed, we help you plan the rest of your darshan.",
        ],
      },
      {
        heading: "Planning your day",
        body: [
          "The aarti happens in the early morning, so plan to stay in Ujjain the night before.",
          "Follow the temple's dress and conduct rules, and carry only what you need.",
          "Plan a relaxed second half of the day for other temples such as Kal Bhairav and Harsiddhi.",
        ],
      },
    ],
    faqs: [
      { q: "Can you guarantee Bhasma Aarti entry?", a: "No. Permissions are decided by the temple committee. We help with guidance and planning only." },
      { q: "Should I stay in Ujjain the night before?", a: "Yes. The aarti is very early, so staying in Ujjain avoids a night drive from Indore." },
    ],
    cta: { label: "Plan a 2-day Ujjain + Omkareshwar yatra", href: "/packages/ujjain-omkareshwar-2-days" },
  },
];

export const getGuide = (slug: string) => guides.find((g) => g.slug === slug);
