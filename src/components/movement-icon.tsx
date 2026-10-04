const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden {...stroke}>
      <path d={d} />
    </svg>
  );
}

/** Round icon that tells a movement's story at a glance. */
export function MovementIcon({ amount, title }: { amount: number; title: string }) {
  let body: React.ReactNode;
  let tone = "bg-line/70 text-ink";

  if (amount > 0) {
    body = <Glyph d="M17 7 7 17m0 0h7m-7 0V10" />;
    tone = "bg-moss/15 text-moss";
  } else if (amount < 0) {
    body = <Glyph d="M7 17 17 7m0 0h-7m7 0v7" />;
  } else if (/card/i.test(title)) {
    body = <Glyph d="M3.5 7.5h17v9h-17zM3.5 11h17" />;
  } else if (/pending/i.test(title)) {
    body = <Glyph d="M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />;
  } else if (/declined/i.test(title)) {
    body = <Glyph d="M6 6l12 12M18 6 6 18" />;
    tone = "bg-danger/10 text-danger";
  } else {
    body = <span className="text-lg leading-none">•</span>;
  }

  return (
    <span aria-hidden className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone}`}>
      {body}
    </span>
  );
}
