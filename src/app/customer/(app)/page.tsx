"use client";

import Link from "next/link";
import { useBank } from "@/components/bank-provider";
import { dollars, dollarParts, firstName } from "@/lib/books";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

const actions = [
  {
    href: "/customer/send",
    label: "Send",
    icon: (
      <path d="M4 12h14m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
  },
  {
    href: "/customer/cards",
    label: "Card",
    icon: (
      <>
        <rect x="3.5" y="6" width="17" height="12" rx="2.2" stroke="currentColor" strokeWidth="1.7" fill="none" />
        <path d="M3.5 10.5h17" stroke="currentColor" strokeWidth="1.7" />
      </>
    ),
  },
  {
    href: "/customer/activity",
    label: "Activity",
    icon: (
      <path d="M4 12h3l2.2 6L13 6l2 6h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
  },
  {
    href: "/customer/profile",
    label: "Profile",
    icon: (
      <>
        <circle cx="12" cy="8.3" r="3.3" stroke="currentColor" strokeWidth="1.7" fill="none" />
        <path d="M5 19c1.3-3.2 4-4.8 7-4.8s5.7 1.6 7 4.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none" />
      </>
    ),
  },
];

const cardTones = [
  "bg-ink text-white",
  "bg-red text-white",
  "bg-card text-ink border border-line",
];

export default function CustomerHomePage() {
  const { me } = useBank();
  if (!me) return null;

  const total = dollarParts(me.balance + me.savings);
  const primaryCard = me.cards[0];
  const restCards = me.cards.slice(1);

  return (
    <div className="px-5 pb-6 pt-7 md:px-8 md:pb-10 md:pt-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink font-display text-sm text-white ring-2 ring-white ring-offset-2 ring-offset-paper">
            {initials(me.name)}
          </span>
          <div>
            <p className="text-sm text-muted">Good day</p>
            <p className="font-display text-2xl leading-none tracking-tight">
              {firstName(me.name)}
            </p>
          </div>
        </div>
        <Link
          href="/customer/notifications"
          aria-label="Notifications"
          className="grid h-11 w-11 place-items-center rounded-full border border-line bg-card text-ink shadow-sm"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
            <path
              d="M6 10a6 6 0 1 1 12 0c0 3.2 1 5 1.6 5.8a.9.9 0 0 1-.7 1.4H5.1a.9.9 0 0 1-.7-1.4C5 15 6 13.2 6 10Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M9.5 19.5a2.5 2.5 0 0 0 5 0"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </Link>
      </div>

      <div className="md:mt-8 md:grid md:grid-cols-[1.2fr_1fr] md:gap-8">
        <div>
          <div className="mt-7 md:mt-0">
            <p className="text-sm text-muted">Total balance</p>
            <p className="font-display mt-1 text-5xl leading-none tracking-tight md:text-6xl">
              {total.whole}
              <span className="text-muted">{total.cents}</span>
            </p>
          </div>

          <section className="mt-6">
            <div className="flex items-baseline justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Cards</p>
              <Link href="/customer/cards" className="text-sm text-red">
                Add +
              </Link>
            </div>
            <div className="mt-3 -mx-5 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0 md:flex-wrap">
              <div className="relative w-[250px] shrink-0 overflow-hidden rounded-[22px] bg-ink text-white">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent"
                />
                <div className="relative flex items-start justify-between px-5 pt-5">
                  <p className="font-display text-sm italic tracking-tight">Ubex</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">
                    Everyday
                  </p>
                </div>
                <div className="relative px-5 pt-5">
                  <p className="text-xs text-white/55">Balance</p>
                  <p className="font-display mt-1 text-2xl tracking-tight">
                    {dollars(me.balance)}
                  </p>
                </div>
                <div className="relative mt-5 flex items-center justify-between px-5 pb-5 text-xs text-white/65">
                  <p>···· {me.account.slice(-4)}</p>
                  {primaryCard && <p>Exp {primaryCard.expires}</p>}
                </div>
              </div>

              {restCards.map((card, i) => (
                <div
                  key={card.id}
                  className={`relative w-[200px] shrink-0 overflow-hidden rounded-[22px] ${
                    cardTones[i % cardTones.length]
                  }`}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"
                  />
                  <div className="relative flex items-start justify-between px-5 pt-5">
                    <p className="font-display text-sm italic tracking-tight">Ubex</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] opacity-60">
                      {card.status}
                    </p>
                  </div>
                  <p className="font-display relative mt-8 px-5 text-base tracking-[0.15em]">
                    •••• {card.last4}
                  </p>
                  <p className="relative mt-4 px-5 pb-5 text-xs opacity-60">
                    Exp {card.expires}
                  </p>
                </div>
              ))}

              <Link
                href="/customer/cards"
                className="grid w-[90px] shrink-0 place-items-center rounded-[22px] border border-dashed border-line text-sm text-muted"
              >
                + Add
              </Link>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-2 gap-3 rounded-[24px] border border-line bg-card p-4">
            <Link href="/customer/move" className="block">
              <p className="text-xs text-muted">Savings</p>
              <p className="font-display mt-1 text-xl tracking-tight">{dollars(me.savings)}</p>
              <p className="mt-1 text-xs text-red">Move money →</p>
            </Link>
            <div className="border-l border-line pl-4">
              <p className="text-xs text-muted">Daily send limit</p>
              <p className="font-display mt-1 text-xl tracking-tight">
                {dollars(me.dailyLimit)}
              </p>
            </div>
          </section>
        </div>

        <div>
          <section className="mt-6 rounded-[24px] bg-ink p-4 md:mt-0">
            <p className="text-xs uppercase tracking-[0.2em] text-white/55">Quick actions</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-white/[0.06] py-4"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" aria-hidden>
                    {action.icon}
                  </svg>
                  <span className="text-xs text-white/70">{action.label}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-7 md:mt-6">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl">Latest</h2>
              <Link href="/customer/activity" className="text-sm text-red">
                See all
              </Link>
            </div>
            <ul className="mt-3 divide-y divide-line overflow-hidden rounded-[24px] border border-line bg-card">
              {me.movements.slice(0, 4).map((item) => (
                <li key={item.id} className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted">{item.detail}</p>
                  </div>
                  <p className={item.amount > 0 ? "text-moss" : ""}>
                    {item.amount === 0
                      ? "—"
                      : `${item.amount > 0 ? "+" : "−"}${dollars(Math.abs(item.amount))}`}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

