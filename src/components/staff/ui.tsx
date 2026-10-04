"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

/* ---------- layout ---------- */

export function StaffPage({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-5xl px-5 pb-14 pt-6 md:px-8 md:pt-9">{children}</div>;
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-[1.75rem] leading-tight tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}

/* ---------- buttons ---------- */

export const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-solid px-5 py-3 text-sm font-medium text-white shadow-[0_8px_18px_-10px_rgba(225,6,0,0.8)] transition-opacity hover:opacity-95 disabled:opacity-50";
export const ghostBtn =
  "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 text-sm transition-colors hover:bg-line/50 disabled:opacity-50";
export const dangerBtn =
  "inline-flex items-center justify-center gap-2 rounded-full border border-danger/30 px-4 py-2.5 text-sm text-danger transition-colors hover:bg-danger/5 disabled:opacity-50";

export function Spinner({ light = true }: { light?: boolean }) {
  return (
    <span
      aria-hidden
      className={`h-3.5 w-3.5 animate-spin rounded-full border-2 ${
        light ? "border-white/40 border-t-white" : "border-ink/25 border-t-ink"
      }`}
    />
  );
}

export function LinkButton({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <Link href={href} className={primary ? primaryBtn : ghostBtn}>
      {children}
    </Link>
  );
}

/* ---------- small pieces ---------- */

const tones: Record<string, string> = {
  ok: "bg-moss/10 text-moss",
  warn: "bg-amber-100 text-amber-800",
  bad: "bg-danger/10 text-danger",
  quiet: "bg-line text-muted",
};

export function Pill({ tone = "quiet", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${tones[tone]}`}>{children}</span>;
}

const avatarTones = [
  "bg-red/10 text-red",
  "bg-moss/10 text-moss",
  "bg-amber-100 text-amber-800",
  "bg-sky-100 text-sky-800",
  "bg-violet-100 text-violet-800",
];

export function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  const tone = avatarTones[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % avatarTones.length];
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full font-medium ${tone} ${
        large ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm"
      }`}
    >
      {initials || "?"}
    </span>
  );
}

export function Notice({ tone = "ok", children }: { tone?: "ok" | "error"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`mt-4 rounded-2xl px-4 py-3 text-sm ${tone === "ok" ? "bg-moss/10 text-moss" : "bg-danger/10 text-danger"}`}
    >
      {children}
    </p>
  );
}

export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-line px-6 py-12 text-center">
      <p className="font-display text-lg">{title}</p>
      {text && <p className="mt-1 text-sm text-muted">{text}</p>}
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-full border border-line bg-card p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-full px-4 py-2 text-sm transition-colors ${
            value === option.value ? "bg-solid text-white shadow-sm" : "text-muted"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Chips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-full px-4 py-2 text-sm transition-colors ${
            value === option.value ? "bg-solid text-white" : "border border-line bg-card text-muted"
          }`}
        >
          {option.label}
          {option.count !== undefined && (
            <span className={`ml-1.5 text-xs ${value === option.value ? "text-white/80" : "text-muted"}`}>
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative block w-full">
      <span className="sr-only">{placeholder}</span>
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="6.500" />
        <path d="m16 16 4 4" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-line bg-card py-3 pl-11 pr-4 text-sm outline-none transition-shadow focus:border-red focus:ring-2 focus:ring-red/25"
      />
    </label>
  );
}

export function MoneyInput({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm text-muted">{label}</span>
      <span className="relative mt-1.5 block">
        <span aria-hidden className="font-display pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted">
          $
        </span>
        <input
          required={required}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="font-display tabular w-full rounded-2xl border border-line bg-card py-3.5 pl-9 pr-4 text-2xl outline-none transition-shadow focus:border-red focus:ring-2 focus:ring-red/25"
        />
      </span>
    </label>
  );
}

/* ---------- icons ---------- */

function Round({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span aria-hidden className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone}`}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </span>
  );
}

/** A picture for each kind of line in the ledger. */
export function LedgerIcon({ text }: { text: string }) {
  const neutral = "bg-line/70 text-ink";
  if (/^deposit/i.test(text)) return <Round tone="bg-moss/15 text-moss"><path d="M17 7 7 17m0 0h7m-7 0V10" /></Round>;
  if (/^withdrawal/i.test(text)) return <Round tone={neutral}><path d="M7 17 17 7m0 0h-7m7 0v7" /></Round>;
  if (/^opened account/i.test(text)) return <Round tone="bg-moss/15 text-moss"><path d="M12 5v14M5 12h14" /></Round>;
  if (/^closed/i.test(text)) return <Round tone="bg-danger/10 text-danger"><path d="M6 6l12 12M18 6 6 18" /></Round>;
  if (/^(froze|unfroze)/i.test(text)) return <Round tone="bg-sky-100 text-sky-800"><rect x="5" y="11" width="14" height="9" rx="2.500" /><path d="M8.500 11V8a3.500 3.500 0 0 1 7 0v3" /></Round>;
  if (/card|issued debit|removed card/i.test(text)) return <Round tone={neutral}><path d="M3.500 7.500h17v9h-17zM3.500 11h17" /></Round>;
  if (/^approved/i.test(text)) return <Round tone="bg-moss/15 text-moss"><path d="M5 12.500l4.500 4.500L19 7" /></Round>;
  if (/^declined/i.test(text)) return <Round tone="bg-danger/10 text-danger"><path d="M6 6l12 12M18 6 6 18" /></Round>;
  if (/waiting review|asked to send/i.test(text)) return <Round tone="bg-amber-100 text-amber-800"><path d="M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" /></Round>;
  if (/moved/i.test(text)) return <Round tone={neutral}><path d="M7 7h11m0 0-3-3m3 3-3 3M17 17H6m0 0 3-3m-3 3 3 3" /></Round>;
  if (/password/i.test(text)) return <Round tone="bg-violet-100 text-violet-800"><circle cx="8.500" cy="14.500" r="3.500" /><path d="m11 12 8-8m-3 3 2.500 2.500" /></Round>;
  if (/limit/i.test(text)) return <Round tone={neutral}><path d="M4 14a8 8 0 0 1 16 0M12 14l4-4" /></Round>;
  return <Round tone={neutral}><circle cx="12" cy="12" r="1.500" fill="currentColor" /></Round>;
}

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard can be blocked */
        }
      }}
      className="rounded-full bg-red/10 px-3 py-1.5 text-xs text-red"
      aria-live="polite"
    >
      {done ? "Copied" : label}
    </button>
  );
}
