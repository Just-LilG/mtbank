"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBank } from "@/components/bank-provider";
import { IconSettings } from "@/components/icons";
import { useToast } from "@/components/toast";
import { dollars } from "@/lib/books";

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export default function ProfilePage() {
  const bank = useBank();
  const router = useRouter();
  const toast = useToast();
  const me = bank.me;
  if (!me) return null;

  const initials = me.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  const open = me.status === "Open";

  async function copyAccount() {
    try {
      await navigator.clipboard.writeText(me!.account.replace(/\s/g, ""));
      toast("Account number copied");
    } catch {
      toast("Could not copy. Select the number instead.", "error");
    }
  }

  const activeCards = me.cards.filter((card) => card.status === "Active").length;
  const links = [
    { href: "/customer/statements", label: "Statements", note: "Download or print" },
    {
      href: "/customer/cards",
      label: "My cards",
      note: me.cards.length === 0 ? "None yet" : `${activeCards} of ${me.cards.length} active`,
    },
    { href: "/customer/move", label: "Move money", note: "Between everyday and savings" },
    { href: "/customer/goals", label: "Savings goals", note: "Set money aside for something" },
    { href: "/customer/scheduled", label: "Scheduled transfers", note: "Send on a date or on repeat" },
    { href: "/customer/request", label: "Request money", note: "Share a link or QR code" },
    { href: "/customer/notifications", label: "Notifications", note: "Deposits and branch updates" },
  ];

  return (
    <div className="px-5 pb-8 pt-7 md:max-w-xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-tight">Profile</h1>
        <Link
          href="/customer/settings"
          aria-label="App settings"
          className="grid h-11 w-11 place-items-center rounded-full border border-line bg-card text-ink shadow-sm"
        >
          <IconSettings className="h-5 w-5" />
        </Link>
      </div>

      <div className="mt-6 flex flex-col items-center text-center">
        <span className="font-display grid h-20 w-20 place-items-center rounded-full bg-solid text-2xl text-white shadow-[0_12px_24px_-12px_rgba(225,6,0,0.7)] ring-4 ring-card">
          {initials}
        </span>
        <p className="font-display mt-3 text-xl">{me.name}</p>
        <span
          className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${
            open ? "bg-moss/10 text-moss" : "bg-danger/10 text-danger"
          }`}
        >
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
          {open ? "Account open" : `Account ${me.status.toLowerCase()}`}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-[24px] border border-line bg-card px-4 py-4">
          <p className="text-xs text-muted">Everyday</p>
          <p className="sensitive font-display tabular mt-1 text-xl">{dollars(me.balance)}</p>
        </div>
        <div className="rounded-[24px] border border-line bg-card px-4 py-4">
          <p className="text-xs text-muted">Savings</p>
          <p className="sensitive font-display tabular mt-1 text-xl">{dollars(me.savings)}</p>
        </div>
      </div>

      <dl className="mt-4 divide-y divide-line overflow-hidden rounded-[24px] border border-line bg-card">
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <dt className="text-sm text-muted">Account</dt>
          <dd className="flex items-center gap-3 text-sm">
            <span className="tabular">{me.account}</span>
            <button type="button" onClick={copyAccount} className="hit rounded-full bg-red/10 px-3 py-1 text-xs text-red">
              Copy
            </button>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <dt className="text-sm text-muted">Email</dt>
          <dd className="min-w-0 truncate text-sm">{me.email || "Not given"}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <dt className="text-sm text-muted">Phone</dt>
          <dd className="tabular text-sm">{me.phone || "Not given"}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <dt className="text-sm text-muted">Customer since</dt>
          <dd className="text-sm">{me.opened}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <dt className="text-sm text-muted">Daily send limit</dt>
          <dd className="tabular text-sm">{dollars(me.dailyLimit)}</dd>
        </div>
      </dl>

      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[24px] border border-line bg-card">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-center justify-between px-4 py-3.5 text-sm transition-colors active:bg-line/60"
            >
              <span className="min-w-0">
                {link.label}
                <span className="block truncate text-xs text-muted">{link.note}</span>
              </span>
              <Chevron />
            </Link>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={async () => {
          await bank.signOut();
          router.push("/");
        }}
        className="mt-6 w-full rounded-full border border-danger/40 py-3.5 text-sm text-danger"
      >
        Sign out
      </button>
    </div>
  );
}
