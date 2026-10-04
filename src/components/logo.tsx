/**
 * The Ubex mark: a bank roof over two pillars that curve into a U,
 * with a third pillar holding up the roof. Drawn on a 64 x 64 grid.
 */
export function LogoGlyph() {
  return (
    <g>
      <polygon points="32,5 60,20 4,20" fill="currentColor" />
      <rect x="6" y="23" width="52" height="4" rx="1" fill="currentColor" />
      <path
        d="M15.5 30 V43 a16.5 16.5 0 0 0 33 0 V30"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
      />
      <rect x="28.5" y="30" width="7" height="22" fill="currentColor" />
    </g>
  );
}

/** The mark on its rounded tile. `tone="light"` is the white tile used on red or dark backgrounds. */
export function LogoMark({
  className = "h-10 w-10",
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "light";
}) {
  const light = tone === "light";
  return (
    <svg viewBox="0 0 76 76" className={className} aria-hidden>
      <rect width="76" height="76" rx="20" fill={light ? "#ffffff" : "#e10600"} />
      <g transform="translate(8 7) scale(0.92)" color={light ? "#e10600" : "#ffffff"}>
        <LogoGlyph />
      </g>
    </svg>
  );
}
