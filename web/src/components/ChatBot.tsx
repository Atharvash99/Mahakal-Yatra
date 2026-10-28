"use client";

import { useEffect, useRef, useState } from "react";
import { answer, detectPackage } from "@/lib/bot";
import type { TravelPackage } from "@/data/packages";
import { whatsappLink } from "@/lib/whatsapp";

type Msg = { from: "bot" | "user"; text: string; handoff?: boolean };

export default function ChatBot({ packages, packageSlug }: { packages: TravelPackage[]; packageSlug?: string }) {
  const fixed = packageSlug ? packages.find((p) => p.slug === packageSlug) : undefined;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<TravelPackage | undefined>(fixed);
  const [input, setInput] = useState("");
  const [chips, setChips] = useState<string[]>(
    fixed
      ? [`What is included in ${fixed.name}?`, `What is not included in ${fixed.name}?`]
      : packages.map((p) => p.name),
  );
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: "bot",
      text: fixed
        ? `Hi! Ask me what is included or excluded in ${fixed.name}.`
        : "Namaste! Pick a package or ask what is included or excluded.",
    },
  ]);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [msgs, open]);

  function send(text: string) {
    const t = text.trim();
    if (!t) return;
    const mentioned = detectPackage(t, packages);
    const pkg = mentioned ?? active;
    if (mentioned) setActive(mentioned);
    const reply = answer(t, packages, pkg);
    setMsgs((m) => [
      ...m,
      { from: "user", text: t },
      { from: "bot", text: reply.text, handoff: reply.handoff },
    ]);
    setChips(reply.suggestions ?? []);
    setInput("");
  }

  const waText = `Hi MahakalYatra, I have a question${active ? ` about ${active.name}` : ""}.`;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="flex h-[28rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-gold/50 bg-white text-neutral-900 shadow-2xl">
          <div className="flex items-center justify-between bg-gradient-to-r from-maroon to-maroon-2 px-4 py-3 text-gold-soft">
            <span className="font-display font-semibold">Package assistant</span>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-xl leading-none">
              Ã—
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
            {msgs.map((m, i) => (
              <div key={i} className={m.from === "user" ? "text-right" : ""}>
                <div
                  className={`inline-block max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-left ${
                    m.from === "user" ? "bg-gold-soft" : "bg-sand/70"
                  }`}
                >
                  {m.text}
                </div>
                {m.handoff && (
                  <div className="mt-1">
                    <a
                      href={whatsappLink(waText)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-green-700 underline"
                    >
                      Continue on WhatsApp
                    </a>
                  </div>
                )}
              </div>
            ))}
            <div ref={end} />
          </div>
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1 px-3 pb-2">
              {chips.map((c) => (
                <button
                  key={c}
                  onClick={() => send(c)}
                  className="rounded-full border border-gold px-2 py-1 text-xs text-maroon hover:bg-gold-soft"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Is lunch included?"
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
            />
            <button className="rounded-lg bg-saffron px-3 text-sm font-semibold text-night">Send</button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-maroon px-5 py-3 font-medium text-gold-soft shadow-lg ring-2 ring-gold/60 hover:bg-maroon-2"
        >
          Ask about inclusions
        </button>
      )}
    </div>
  );
}

