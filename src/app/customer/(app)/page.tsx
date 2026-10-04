"use client";

import Link from "next/link";
import { useBank } from "@/components/bank-provider";
import { CardFace } from "@/components/card-face";
import { NotificationBell } from "@/components/customer/bell";
import { MovementIcon } from "@/components/movement-icon";
import { dollars, dollarParts, firstName } from "@/lib/books";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

const actions = [
  { href: "/customer/send", label: "Send", icon: (<path d="M4 12h14m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />) },
  { href: "/customer/move", label: "Move", icon: (<path d="M7 7h11m0 0-3-3m3 3-3 3M17 17H6m0 0 3-3m-3 3 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />) },
  { href: "/customer/statements", label: "Statements", icon: (<path d="M7 4h7l4 4v12H7zM14 4v4h4M10 13h5M10 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />) },
  { href: "/support", label: "Help", icon: (<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.7 9.6a2.4 2.4 0 1 1 3.4 2.2c-.7.4-1.1.9-1.1 1.6M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />) },
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
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-solid font-display text-sm text-white ring-2 ring-line ring-offset-2 ring-offset-paper">
            {initials(me.name)}
          </span>
          <div>
            <p className="text-sm text-muted">Hello</p>
            <p className="font-display text-2xl leading-none tracking-tight">
              {firstName(me.name)}
            </p>
          </div>
        </div>
        <NotificationBell customerId={me.id} movements={me.movements} />
      </div>

      <div className="md:mt-8 md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-8">
        <div className="min-w-0">
          <div className="mt-7 md:mt-0">
            <p className="text-sm text-muted">Total balance</p>
            <p className="font-display mt-1 text-5xl leading-none tracking-tight md:text-6xl">
              {total.whole}
              <span className="text-muted">{total.cents}</span>
            </p>
          </div>

          <section className="mt-6">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-lg">Cards</h2>
              <Link href="/customer/cards" className="text-sm text-red">
                Manage
              </Link>
            </div>
            <div className="mt-3 -mx-5 -mb-8 flex snap-x snap-mandatory scroll-pl-5 gap-3 overflow-x-auto px-5 pb-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:[mask-image:linear-gradient(to_right,#000_88%,transparent)]">
              <Link href="/customer/cards" className="block w-[290px] shrink-0 snap-start" aria-label="Everyday account card">
                <CardFace
                  variant="red"
                  holder={me.name}
                  last4={me.account.slice(-4)}
                  expires={primaryCard?.expires ?? "--/--"}
                  label="Everyday account"
                  balance={dollars(me.balance)}
                />
              </Link>
              {restCards.map((card, i) => (
                <Link key={card.id} href="/customer/cards" className="block w-[290px] shrink-0 snap-start" aria-label={`Card ending ${card.last4}`}>
                  <CardFace
                    variant={i % 2 === 0 ? "charcoal" : "silver"}
                    holder={me.name}
                    last4={card.last4}
                    expires={card.expires}
                    status={card.status}
                    label="Debit"
                  />
                </Link>
              ))}
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

        <div className="min-w-0">
          <section className="mt-6 rounded-[24px] border border-line bg-card p-4 md:mt-0">
            <p className="font-display text-base">Quick actions</p>
            <div className="mt-3 grid grid-cols-4 gap-1">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex flex-col items-center gap-2 rounded-2xl py-2 transition-transform active:scale-95"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-red/10 text-red">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                      {action.icon}
                    </svg>
                  </span>
                  <span className="text-xs text-ink/80">{action.label}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-7 md:mt-6">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-lg">Last transactions</h2>
              <Link href="/customer/activity" className="text-sm text-red">
                See all
              </Link>
            </div>
            {me.movements.length === 0 && (
              <p className="mt-3 rounded-[24px] border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
                Nothing yet. Deposits, sends and card changes will show up here.
              </p>
            )}
            <ul
              className={`mt-3 divide-y divide-line overflow-hidden rounded-[24px] border border-line bg-card ${
                me.movements.length === 0 ? "hidden" : ""
              }`}
            >
              {me.movements.slice(0, 4).map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                  <MovementIcon amount={item.amount} title={item.title} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="truncate text-sm text-muted">{item.detail}</p>
                  </div>
                  <p className={`tabular shrink-0 pl-3 ${item.amount > 0 ? "text-moss" : ""}`}>
                    {item.amount === 0
                      ? ""
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

