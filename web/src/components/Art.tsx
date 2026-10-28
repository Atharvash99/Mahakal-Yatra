// Decorative SVG art: no external images needed.

export function Mandala({ className = "" }: { className?: string }) {
  const petals = Array.from({ length: 16 }, (_, i) => i * 22.5);
  const inner = Array.from({ length: 8 }, (_, i) => i * 45 + 22.5);
  return (
    <svg viewBox="-200 -200 400 400" className={className} aria-hidden fill="none" stroke="currentColor">
      <circle r="195" strokeWidth="0.8" opacity="0.5" />
      <circle r="180" strokeWidth="0.5" strokeDasharray="2 6" opacity="0.7" />
      {petals.map((a) => (
        <ellipse key={a} cx="0" cy="-130" rx="22" ry="52" transform={`rotate(${a})`} strokeWidth="0.9" opacity="0.8" />
      ))}
      {inner.map((a) => (
        <ellipse key={a} cx="0" cy="-78" rx="14" ry="30" transform={`rotate(${a})`} strokeWidth="0.9" />
      ))}
      <circle r="52" strokeWidth="0.9" />
      <circle r="38" strokeWidth="0.6" strokeDasharray="1 4" />
      <circle r="10" fill="currentColor" stroke="none" opacity="0.8" />
    </svg>
  );
}

function Tower({ x, s = 1 }: { x: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${200 - 200 * s}) scale(${s})`}>
      <path d="M-60 200 V128 C-60 100 -34 92 -26 66 C-20 44 -12 34 -6 22 L0 4 L6 22 C12 34 20 44 26 66 C34 92 60 100 60 128 V200 Z" />
      <path d="M-38 200 V150 H38 V200 Z" opacity="0.55" />
      <circle cx="0" cy="2" r="4" />
      <path d="M0 -2 V-30 L16 -24 L0 -18" />
    </g>
  );
}

export function Skyline({ className = "", fill = "currentColor" }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 1440 200" preserveAspectRatio="none" className={className} aria-hidden fill={fill}>
      <path d="M0 200 V176 H1440 V200 Z" />
      {/* small domes */}
      {[120, 330, 1110, 1320].map((x) => (
        <g key={x}>
          <path d={`M${x - 46} 176 V150 C${x - 46} 116 ${x + 46} 116 ${x + 46} 150 V176 Z`} />
          <rect x={x - 3} y="106" width="6" height="14" />
        </g>
      ))}
      <Tower x={520} s={0.7} />
      <Tower x={920} s={0.7} />
      <Tower x={720} s={1} />
      <Tower x={225} s={0.55} />
      <Tower x={1215} s={0.55} />
    </svg>
  );
}

type IconName = "tag" | "driver" | "elder" | "list" | "chat" | "calendar" | "shield" | "car" | "pin" | "check" | "temple";

const paths: Record<IconName, React.ReactNode> = {
  tag: <path d="M3 12V4h8l10 10-8 8L3 12zM7.5 8.5h.01" />,
  driver: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  elder: (
    <>
      <circle cx="12" cy="5" r="2.5" />
      <path d="M12 8v6l-3 7M12 14l4 7M8 11h8" />
    </>
  ),
  list: <path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  chat: <path d="M21 12a8 8 0 0 1-12 6.9L3 20l1.2-5A8 8 0 1 1 21 12z" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4" />,
  car: (
    <>
      <path d="M5 16l1.5-5h11L19 16M3 16h18v3H3z" />
      <circle cx="7.5" cy="19" r="1.2" />
      <circle cx="16.5" cy="19" r="1.2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  check: <path d="M5 12l5 5 9-10" />,
  temple: <path d="M12 3c1 3 3 4 3 7H9c0-3 2-4 3-7zM6 10h12v3H6zM5 13h14v8H5zM10 21v-4h4v4" />,
};

export function Icon({ name, className = "h-6 w-6" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}
