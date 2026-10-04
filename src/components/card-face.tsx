"use client";

import { useId, useRef, useState } from "react";
import { LogoGlyph } from "@/components/logo";
import type { CardStatus } from "@/lib/books";

export type CardVariant = "red" | "charcoal" | "silver";

type Skin = {
  base: string;
  dark: boolean;
  shadow: string;
  emboss: string;
  line: string;
};

const skins: Record<CardVariant, Skin> = {
  red: {
    base: "linear-gradient(135deg,#ff6b5d 0%,#e10600 36%,#8f0a1c 70%,#3b0720 100%)",
    dark: false,
    shadow: "0 26px 44px -22px rgba(225,6,0,0.65), 0 10px 18px -12px rgba(20,22,28,0.5)",
    emboss: "0 1px 0 rgba(255,255,255,0.3), 0 -1px 1px rgba(60,0,10,0.6)",
    line: "#ffffff",
  },
  charcoal: {
    base: "linear-gradient(135deg,#4a4e5f 0%,#1c1e29 50%,#07080c 100%)",
    dark: false,
    shadow: "0 26px 44px -22px rgba(8,9,13,0.7), 0 10px 18px -12px rgba(20,22,28,0.5)",
    emboss: "0 1px 0 rgba(255,255,255,0.22), 0 -1px 1px rgba(0,0,0,0.8)",
    line: "#ffffff",
  },
  silver: {
    base: "linear-gradient(135deg,#ffffff 0%,#eef0f5 42%,#c7ccd9 100%)",
    dark: true,
    shadow: "0 26px 44px -24px rgba(20,22,28,0.45), 0 10px 18px -12px rgba(20,22,28,0.35)",
    emboss: "0 1px 0 rgba(255,255,255,0.95), 0 -1px 0 rgba(20,22,28,0.3)",
    line: "#14161c",
  },
};

/* Fine engraved waves, like the security print on a banknote. Built once so server and browser agree. */
function wave(offset: number, amplitude: number, phase: number) {
  let path = "";
  for (let x = 0; x <= 400; x += 8) {
    const y = 126 + offset + Math.sin((x / 400) * Math.PI * 3 + phase) * amplitude;
    path += `${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)} `;
  }
  return path;
}
const WAVES = Array.from({ length: 16 }, (_, i) => wave((i - 8) * 8.5, 30 - i * 0.9, i * 0.24));

function Artwork({ skin, live }: { skin: Skin; live: boolean }) {
  return (
    <>
      {/* engraved line texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background: `repeating-linear-gradient(118deg, ${
            skin.dark ? "rgba(20,22,28,0.05)" : "rgba(255,255,255,0.06)"
          } 0 1px, transparent 1px 5px)`,
        }}
      />
      <svg
        aria-hidden
        viewBox="0 0 400 252"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        fill="none"
        stroke={skin.line}
        strokeWidth="0.7"
        opacity={skin.dark ? 0.12 : 0.17}
      >
        {WAVES.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
      {/* soft light from the top-left */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.34), transparent 55%)",
        }}
      />
      {/* moving sheen */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${live ? "" : "card-sheen"}`}
        style={{
          backgroundImage:
            "linear-gradient(115deg, transparent 32%, rgba(255,255,255,0.0) 38%, rgba(255,255,255,0.32) 47%, rgba(255,255,255,0.06) 54%, transparent 62%)",
          backgroundSize: "260% 100%",
          backgroundPosition: "var(--sheen, 100%) 0",
          mixBlendMode: "soft-light",
        }}
      />
      {/* polished edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.22), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.18)",
        }}
      />
    </>
  );
}

function Chip({ id }: { id: string }) {
  return (
    <svg aria-hidden viewBox="0 0 48 36" className="h-[11.5cqw] w-[15.5cqw] drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8e9b4" />
          <stop offset="0.35" stopColor="#dcbb69" />
          <stop offset="0.7" stopColor="#b8913f" />
          <stop offset="1" stopColor="#ecd493" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="47" height="35" rx="7" fill={`url(#${id})`} stroke="#7d5f22" strokeOpacity="0.55" />
      <g stroke="#7d5f22" strokeOpacity="0.55" strokeWidth="0.9" fill="none">
        <rect x="16" y="11" width="16" height="14" rx="3.5" />
        <path d="M0.5 12h15.500M0.5 24h15.500M32 12h15.500M32 24h15.500M24 0.5v10.500M24 25v10.500" />
      </g>
      <rect x="2" y="2" width="44" height="12" rx="6" fill="#fff" opacity="0.18" />
    </svg>
  );
}

function Hologram({ dark }: { dark: boolean }) {
  return (
    <div
      aria-hidden
      className="relative grid h-[8.5cqw] w-[12.5cqw] place-items-center overflow-hidden rounded-[1.4cqw]"
      style={{
        background:
          "conic-gradient(from 200deg at 50% 50%, #8ef0ff, #f6c5d0, #c9b6f0, #a9efd1, #fff3b4, #8ef0ff)",
        boxShadow: dark
          ? "inset 0 0 0 1px rgba(20,22,28,0.25)"
          : "inset 0 0 0 1px rgba(255,255,255,0.55), 0 1px 2px rgba(0,0,0,0.3)",
      }}
    >
      <svg viewBox="0 0 64 64" className="h-[6.4cqw] w-[6.4cqw] text-white opacity-80">
        <LogoGlyph />
      </svg>
      <span
        className="absolute inset-0"
        style={{ background: "linear-gradient(120deg, rgba(255,255,255,0.55), transparent 45%, rgba(255,255,255,0.25))" }}
      />
    </div>
  );
}

function NetworkMark({ dark }: { dark: boolean }) {
  return (
    <div aria-hidden className="flex shrink-0 -space-x-[2.4cqw]">
      <span className={`h-[7.6cqw] w-[7.6cqw] rounded-full ${dark ? "bg-ink/80" : "bg-white/80"}`} />
      <span className={`h-[7.6cqw] w-[7.6cqw] rounded-full mix-blend-multiply ${dark ? "bg-red/85" : "bg-white/35"}`} />
    </div>
  );
}

function Contactless() {
  return (
    <svg viewBox="0 0 24 24" className="h-[7.4cqw] w-[7.4cqw]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
      <path d="M8.5 9a4.5 4.5 0 0 1 0 6M12 6.5a8.5 8.5 0 0 1 0 11M15.5 4a12.5 12.5 0 0 1 0 16" />
    </svg>
  );
}

function Dots() {
  return (
    <span aria-hidden className="inline-flex gap-[0.9cqw]">
      {[0, 1, 2, 3].map((i) => (
        <i key={i} className="h-[1.9cqw] w-[1.9cqw] rounded-full bg-current opacity-85" />
      ))}
    </span>
  );
}

type FaceProps = {
  variant?: CardVariant;
  holder: string;
  last4: string;
  expires: string;
  status?: CardStatus;
  label?: string;
  balance?: string;
  live?: boolean;
};

function Front({
  variant = "red",
  holder,
  last4,
  expires,
  status = "Active",
  label = "Debit",
  balance,
  live = false,
}: FaceProps) {
  const skin = skins[variant];
  const chipId = useId();
  const soft = skin.dark ? "text-ink/55" : "text-white/65";
  const inactive = status !== "Active";

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-[6.4cqw] p-[6.2cqw] text-left ${
        skin.dark ? "text-ink" : "text-white"
      } ${inactive ? "saturate-[0.3]" : ""}`}
      style={{ background: skin.base, boxShadow: skin.shadow }}
    >
      <Artwork skin={skin} live={live} />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-[2.2cqw]">
            <span
              className={`grid h-[8cqw] w-[8cqw] place-items-center rounded-[2.4cqw] ${
                skin.dark ? "bg-red text-white" : "bg-white/16 text-white ring-1 ring-white/25"
              }`}
            >
              <svg viewBox="0 0 64 64" className="h-[5.6cqw] w-[5.6cqw]" aria-hidden>
                <LogoGlyph />
              </svg>
            </span>
            <div className="leading-none">
              <p className="font-display text-[max(14px,5.2cqw)] italic tracking-tight">Ubex</p>
              <p className={`mt-[0.8cqw] text-[max(9px,2.5cqw)] uppercase tracking-[0.2em] ${soft}`}>{label}</p>
            </div>
          </div>
          <Contactless />
        </div>

        {balance ? (
          <div>
            <p className={`text-[max(11px,3.2cqw)] ${soft}`}>Balance</p>
            <p className="font-display tabular text-[max(24px,8.6cqw)] leading-none tracking-tight">{balance}</p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <Chip id={chipId} />
            <Hologram dark={skin.dark} />
          </div>
        )}

        <p
          className="flex items-center gap-[2.6cqw] text-[max(14px,5.6cqw)] tabular-nums"
          style={{ textShadow: skin.emboss }}
        >
          <Dots />
          <Dots />
          <Dots />
          <span className="tracking-[0.14em]">{last4}</span>
        </p>

        <div className="flex items-end justify-between gap-[3cqw]">
          <div className="min-w-0">
            <p className={`text-[max(8px,2.3cqw)] uppercase tracking-[0.18em] ${soft}`}>Card holder</p>
            <p className="truncate text-[max(11px,3.5cqw)] uppercase tracking-[0.06em]">{holder}</p>
          </div>
          <div className="text-right">
            <p className={`text-[max(8px,2.3cqw)] uppercase tracking-[0.18em] ${soft}`}>Valid thru</p>
            <p className="tabular text-[max(11px,3.5cqw)]">{expires}</p>
          </div>
          <NetworkMark dark={skin.dark} />
        </div>
      </div>

      {inactive && (
        <div className="absolute inset-0 grid place-items-center bg-black/35 backdrop-blur-[1.5px]">
          <span className="flex items-center gap-[1.6cqw] rounded-full bg-black/55 px-[4cqw] py-[2cqw] text-[max(11px,3.4cqw)] text-white">
            <svg viewBox="0 0 24 24" className="h-[4cqw] w-[4cqw]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="5" y="11" width="14" height="9" rx="2.5" />
              <path d="M8.5 11V8a3.500 3.500 0 0 1 7 0v3" />
            </svg>
            Card {status.toLowerCase()}
          </span>
        </div>
      )}
    </div>
  );
}

function Back({ variant = "red", last4 }: { variant?: CardVariant; last4: string }) {
  const skin = skins[variant];
  const soft = skin.dark ? "text-ink/55" : "text-white/65";
  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-[6.4cqw] text-left ${skin.dark ? "text-ink" : "text-white"}`}
      style={{ background: skin.base, boxShadow: skin.shadow }}
    >
      <Artwork skin={skin} live />
      <div className="relative flex h-full flex-col">
        <div className="mt-[7cqw] h-[15cqw] w-full bg-gradient-to-b from-[#2a2b31] via-[#0b0b0e] to-[#202127]" />
        <div className="mx-[6cqw] mt-[5cqw] flex items-stretch gap-[2cqw]">
          <div
            className="flex flex-1 items-center rounded-[1.2cqw] bg-[#f4f1e8] px-[3cqw] py-[2.4cqw]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(-45deg, rgba(20,22,28,0.06) 0 2px, transparent 2px 6px)",
            }}
          >
            <span className="text-[max(8px,2.4cqw)] italic text-ink/45">Authorised signature</span>
          </div>
          <div className="grid w-[16cqw] place-items-center rounded-[1.2cqw] bg-white text-ink">
            <span className="text-[max(8px,2.1cqw)] uppercase tracking-[0.14em] text-ink/45">CVV</span>
            <span className="-mt-[1cqw] text-[max(13px,4.4cqw)] font-medium tracking-[0.2em]">•••</span>
          </div>
        </div>
        <p className={`mx-[6cqw] mt-[4cqw] text-[max(8px,2.4cqw)] leading-snug ${soft}`}>
          Issued by Ubex Bank, Osu Branch. This card stays the property of the bank. If you find
          it, please hand it to any branch.
        </p>
        <div className="mx-[6cqw] mt-auto flex items-end justify-between pb-[5.4cqw]">
          <div>
            <p className={`text-[max(8px,2.3cqw)] uppercase tracking-[0.18em] ${soft}`}>Card</p>
            <p className="num text-[max(12px,3.8cqw)]">···· {last4}</p>
          </div>
          <Hologram dark={skin.dark} />
          <NetworkMark dark={skin.dark} />
        </div>
      </div>
    </div>
  );
}

/** The card as a picture. Used in lists and the Home carousel. */
export function CardFace(props: FaceProps) {
  return (
    <div style={{ containerType: "inline-size" }}>
      <div className="aspect-[1.586/1] w-full">
        <Front {...props} />
      </div>
    </div>
  );
}

/** The big card: follows your finger or cursor with a little tilt, and flips over on tap. */
export function FlipCard(props: FaceProps) {
  const [flipped, setFlipped] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, sheen: 100 });
  const box = useRef<HTMLDivElement>(null);

  function follow(event: React.PointerEvent) {
    const rect = box.current?.getBoundingClientRect();
    if (!rect || spinning) return;
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    setTilt({ x: (0.5 - py) * 12, y: (px - 0.5) * 16, sheen: 100 - px * 100 });
  }

  function flip() {
    setSpinning(true);
    setFlipped((value) => !value);
    setTimeout(() => setSpinning(false), 720);
  }

  const turn = (flipped ? 180 : 0) + tilt.y;

  return (
    <div>
      <div style={{ containerType: "inline-size", perspective: "1200px" }}>
        <div
          ref={box}
          role="button"
          tabIndex={0}
          aria-pressed={flipped}
          aria-label={flipped ? "Showing the back of the card. Tap to see the front." : "Showing the front of the card. Tap to see the back."}
          onClick={flip}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              flip();
            }
          }}
          onPointerMove={follow}
          onPointerLeave={() => setTilt({ x: 0, y: 0, sheen: 100 })}
          className="relative aspect-[1.586/1] w-full cursor-pointer select-none rounded-[6.4cqw] outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${spinning ? 0 : tilt.x}deg) rotateY(${turn}deg)`,
            transition: spinning
              ? "transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)"
              : "transform 0.14s ease-out",
            "--sheen": `${tilt.sheen}%`,
          } as React.CSSProperties}
        >
          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
            <Front {...props} live />
          </div>
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <Back variant={props.variant} last4={props.last4} />
          </div>
        </div>
      </div>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 12a8 8 0 0 1 14-5.300L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.300L4 15M4 20v-5h5" />
        </svg>
        Tap the card to flip it
      </p>
    </div>
  );
}
