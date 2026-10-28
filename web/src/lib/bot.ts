import { inr, packages, type Item, type TravelPackage } from "@/data/packages";

// Rule-based answers generated only from package data, so the bot can never
// invent an inclusion or promise temple access. Anything it cannot answer is
// handed to WhatsApp.

export type BotReply = {
  text: string;
  /** true when the question should be continued with a human on WhatsApp */
  handoff?: boolean;
  /** follow-up chips */
  suggestions?: string[];
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ");

function has(q: string, words: string[]) {
  return words.some((w) => q.includes(w));
}

// whole-word match so short keywords like "ac" don't hit "package"
const hasWord = (q: string, k: string) => ` ${q.replace(/ +/g, " ")} `.includes(` ${k} `);

function matchItem(q: string, items: Item[]) {
  return items.find((i) => i.keywords.some((k) => hasWord(q, k)));
}

export function detectPackage(q: string): TravelPackage | undefined {
  const n = norm(q);
  if (has(n, ["omkareshwar", "omkar"]) && has(n, ["ujjain", "2 day", "two day", "flagship"]))
    return packages[2];
  if (has(n, ["flagship", "2 day", "two day", "2 days"])) return packages[2];
  if (has(n, ["omkareshwar", "omkar"])) return packages[1];
  if (has(n, ["ujjain", "circuit"])) return packages[0];
  return undefined;
}

const list = (items: Item[]) => items.map((i) => `• ${i.label}`).join("\n");

export function answer(question: string, pkg?: TravelPackage): BotReply {
  const q = norm(question);
  const target = pkg ?? detectPackage(q);

  if (has(q, ["bhasma", "bhasm", "vip", "guaranteed", "special darshan"])) {
    return {
      text:
        "Bhasma Aarti and darshan permissions are managed by the Mahakaleshwar temple committee. " +
        "We can guide you through the registration process, but we never promise guaranteed access or tickets. " +
        "Want our team to explain the current process?",
      handoff: true,
    };
  }

  if (has(q, ["wheelchair", "elderly", "senior", "old age", "parents", "walking"])) {
    return {
      text:
        "Our itineraries are planned for families and elderly pilgrims with vegetarian meal stops. " +
        "For wheelchair access and walking distances at each temple, please confirm with our team before booking.",
      handoff: true,
    };
  }

  if (!target) {
    if (has(q, ["package", "price", "cost", "include", "exclude", "book", "tour", "trip"])) {
      return {
        text: "Which package do you want to know about?",
        suggestions: packages.map((p) => p.name),
      };
    }
    return {
      text:
        "I can answer what is included and excluded in each package, plus price, duration, pickup and cancellation. " +
        "For anything else, our team on WhatsApp will help.",
      handoff: true,
      suggestions: packages.map((p) => p.name),
    };
  }

  const followUps = [
    `What is included in ${target.name}?`,
    `What is not included in ${target.name}?`,
  ];

  // Is a specific thing included? e.g. "is lunch included", "do you cover toll"
  const asksList = has(q, ["what is", "what's", "what all", "list", "inclusion", "exclusion"]);
  if (!asksList) {
    // the item with the most specific (longest) matching keyword wins; a tie
    // goes to the exclusion so we never over-promise
    const best = (items: Item[]) =>
      Math.max(0, ...items.flatMap((i) => i.keywords.filter((k) => hasWord(q, k)).map((k) => k.length)));
    const inScore = best(target.inclusions);
    const exScore = best(target.exclusions);
    if (exScore > 0 && exScore >= inScore) {
      const hit = matchItem(q, target.exclusions)!;
      return { text: `No. In ${target.name}, "${hit.label}" is NOT included.`, suggestions: followUps };
    }
    if (inScore > 0) {
      const hit = matchItem(q, target.inclusions)!;
      return { text: `Yes. ${target.name} includes: ${hit.label}.`, suggestions: followUps };
    }
  }

  if (has(q, ["not included", "exclude", "exclusion", "extra", "not cover", "pay extra", "excluded"])) {
    return { text: `Not included in ${target.name}:\n${list(target.exclusions)}`, suggestions: followUps };
  }
  if (has(q, ["include", "inclusion", "cover", "what do i get", "what is in"])) {
    return { text: `Included in ${target.name}:\n${list(target.inclusions)}`, suggestions: followUps };
  }
  if (has(q, ["price", "cost", "rate", "how much", "fare"])) {
    return {
      text: `${target.name} is ${inr(target.price)} per person, final price with all taxes shown at booking.`,
      suggestions: followUps,
    };
  }
  if (has(q, ["duration", "how long", "days", "time"])) {
    return { text: `${target.name} takes ${target.duration}.`, suggestions: followUps };
  }
  if (has(q, ["pickup", "pick up", "meeting", "start from", "where"])) {
    return { text: `Pickup for ${target.name}: ${target.pickupPoint}.`, suggestions: followUps };
  }
  if (has(q, ["cancel", "refund"])) {
    const rules = target.cancellation
      .map((r) =>
        r.hoursBefore === 0
          ? `• Less than the above: ${r.refundPercent}% refund`
          : `• ${r.hoursBefore}+ hours before pickup: ${r.refundPercent}% refund`,
      )
      .join("\n");
    return { text: `Cancellation policy for ${target.name}:\n${rules}`, suggestions: followUps };
  }

  // Package picked but no clear question: show a summary.
  if (norm(question).trim() === norm(target.name).trim() || !asksList) {
    return {
      text:
        `${target.name}: ${target.duration}, ${inr(target.price)} per person.\n` +
        `Included:\n${list(target.inclusions)}\n` +
        `Not included:\n${list(target.exclusions)}`,
      suggestions: ["Cancellation policy", "Pickup point"],
    };
  }

  return {
    text: "I'm not sure about that one. Our team on WhatsApp can answer it.",
    handoff: true,
    suggestions: followUps,
  };
}
