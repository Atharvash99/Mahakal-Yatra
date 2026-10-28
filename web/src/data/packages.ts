// PLACEHOLDER CONTENT: prices, inclusions and terms must be replaced with
// confirmed supplier rates before launch (see plan, next step 1).

export type Item = {
  label: string;
  /** lowercase words a traveller might use when asking about this item */
  keywords: string[];
};

export type CancellationRule = {
  /** refund applies if cancelled at least this many hours before pickup */
  hoursBefore: number;
  refundPercent: number;
};

export type TravelPackage = {
  slug: string;
  name: string;
  tagline: string;
  /** Devanagari title used as decorative art */
  hindi: string;
  duration: string;
  /** price per person in INR (placeholder) */
  price: number;
  pickupPoint: string;
  highlights: string[];
  itinerary: { title: string; detail: string }[];
  inclusions: Item[];
  exclusions: Item[];
  cancellation: CancellationRule[];
};

const sharedCancellation: CancellationRule[] = [
  { hoursBefore: 72, refundPercent: 90 },
  { hoursBefore: 24, refundPercent: 50 },
  { hoursBefore: 0, refundPercent: 0 },
];

const cab: Item = {
  label: "AC cab with driver for the whole trip",
  keywords: ["cab", "car", "taxi", "vehicle", "driver", "transport", "ac"],
};
const toll: Item = {
  label: "Fuel, toll, parking and driver allowance",
  keywords: ["fuel", "petrol", "diesel", "toll", "parking", "allowance"],
};
const driverCard: Item = {
  label: "Driver card (name, photo, vehicle number) on WhatsApp the night before",
  keywords: ["driver card", "driver details", "driver name", "vehicle number"],
};
const water: Item = {
  label: "Bottled water in the vehicle",
  keywords: ["water", "bottle"],
};

const food: Item = {
  label: "Meals",
  keywords: ["food", "meal", "meals", "lunch", "dinner", "breakfast", "veg"],
};
const entry: Item = {
  label: "Temple entry or special darshan tickets",
  keywords: [
    "ticket",
    "tickets",
    "entry",
    "darshan",
    "vip",
    "special darshan",
    "temple fee",
  ],
};
const bhasma: Item = {
  label: "Bhasma Aarti registration or guaranteed access",
  keywords: ["bhasma", "aarti", "bhasm", "registration"],
};
const personal: Item = {
  label: "Personal expenses, tips and shopping",
  keywords: ["tip", "tips", "shopping", "personal", "puja items", "prasad"],
};

export const packages: TravelPackage[] = [
  {
    slug: "ujjain-temple-circuit",
    name: "Ujjain Temple Circuit",
    tagline: "Mahakaleshwar and the major Ujjain temples in one comfortable day",
    hindi: "उज्जैन",
    duration: "1 day",
    price: 2500,
    pickupPoint: "Your Ujjain hotel, Ujjain railway station or Indore (on request)",
    highlights: [
      "Mahakaleshwar Jyotirlinga",
      "Kal Bhairav",
      "Harsiddhi",
      "Ram Ghat",
      "Sandipani Ashram",
      "Mangalnath",
    ],
    itinerary: [
      { title: "Morning", detail: "Pickup, Mahakaleshwar darshan and Ram Ghat." },
      { title: "Midday", detail: "Kal Bhairav and Harsiddhi temples, vegetarian lunch stop." },
      { title: "Afternoon", detail: "Sandipani Ashram and Mangalnath, drop at your stay." },
    ],
    inclusions: [cab, toll, driverCard, water],
    exclusions: [food, entry, bhasma, personal],
    cancellation: sharedCancellation,
  },
  {
    slug: "omkareshwar-day-trip",
    name: "Omkareshwar Day Trip",
    tagline: "Omkareshwar Jyotirlinga from Indore or Ujjain",
    hindi: "ओंकारेश्वर",
    duration: "1 day",
    price: 3000,
    pickupPoint: "Indore airport, Indore railway station or your Indore/Ujjain hotel",
    highlights: ["Omkareshwar Jyotirlinga", "Mamleshwar", "Narmada ghat"],
    itinerary: [
      { title: "Early morning", detail: "Pickup and drive to Omkareshwar." },
      { title: "Midday", detail: "Darshan, Narmada ghat, vegetarian lunch stop." },
      { title: "Evening", detail: "Return drive and drop." },
    ],
    inclusions: [cab, toll, driverCard, water],
    exclusions: [food, entry, personal],
    cancellation: sharedCancellation,
  },
  {
    slug: "ujjain-omkareshwar-2-days",
    name: "Ujjain + Omkareshwar",
    tagline: "Our flagship two-day yatra covering both Jyotirlingas",
    hindi: "महाकाल यात्रा",
    duration: "2 days",
    price: 6500,
    pickupPoint: "Indore airport, Indore railway station or your hotel",
    highlights: [
      "Mahakaleshwar Jyotirlinga",
      "Omkareshwar Jyotirlinga",
      "Kal Bhairav",
      "Harsiddhi",
      "Ram Ghat",
    ],
    itinerary: [
      { title: "Day 1", detail: "Indore pickup, Ujjain temple circuit, overnight stay in Ujjain." },
      { title: "Day 2", detail: "Drive to Omkareshwar, darshan, return and drop at Indore." },
    ],
    inclusions: [
      cab,
      toll,
      driverCard,
      water,
      {
        label: "1 night stay in a standard hotel (twin sharing)",
        keywords: ["hotel", "stay", "room", "night", "accommodation", "lodging"],
      },
      {
        label: "Breakfast at the hotel",
        keywords: ["breakfast"],
      },
    ],
    exclusions: [
      {
        label: "Lunch and dinner",
        keywords: ["lunch", "dinner", "food", "meal", "meals", "veg"],
      },
      entry,
      bhasma,
      personal,
    ],
    cancellation: sharedCancellation,
  },
];

export function getPackage(slug: string) {
  return packages.find((p) => p.slug === slug);
}

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
