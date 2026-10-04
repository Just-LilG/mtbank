"use client";

import Link from "next/link";
import { useBank } from "@/components/bank-provider";
import { FlipCard } from "@/components/card-face";
import { dollars } from "@/lib/books";

const controlIcon =
  "grid h-12 w-12 place-items-center rounded-full bg-solid text-white shadow-[0_8px_16px_-8px_rgba(225,6,0,0.7)]";

function Svg({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export default function CardsPage() {
  const bank = useBank();
  const me = bank.me;
  if (!me) return null;
  const card = me.cards[0];
  const now = new Date();
  const spent = me.movements
    .filter((item) => {
      const when = new Date(item.at);
      return (
        item.amount < 0 &&
        when.getMonth() === now.getMonth() &&
        when.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);

  return (
    <div className="px-5 pb-8 pt-7">
      <h1 className="font-display text-2xl tracking-tight">Cards</h1>

      {!card && (
        <p className="mt-6 rounded-[24px] border border-dashed border-line px-4 py-8 text-sm text-muted">
          The branch has not issued a card for this account yet.
        </p>
      )}

      {card && (
        <>
          <div className="mt-5 max-w-[440px]">
            <FlipCard
              variant="red"
              holder={me.name}
              last4={card.last4}
              expires={card.expires}
              status={card.status}
              label="Debit"
            />
          </div>

          <section className="mt-7">
            <h2 className="font-display text-lg">Card control</h2>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[11px] text-muted">
              {card.status === "Blocked" ? (
                <p className="col-span-4 text-left text-sm text-danger">
                  The branch blocked this card. Only the desk can turn it back on.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    void bank.setCardStatus(me.id, card.id, card.status === "Paused" ? "Active" : "Paused")
                  }
                  className="flex flex-col items-center gap-2"
                >
                  <span className={controlIcon}>
                    <Svg d={card.status === "Paused" ? "M8 5v14l11-7z" : "M9 5v14M15 5v14"} />
                  </span>
                  {card.status === "Paused" ? "Resume" : "Pause"}
                </button>
              )}
              <Link href="/customer/send" className="flex flex-col items-center gap-2">
                <span className={controlIcon}><Svg d="M5 9h13m0 0-3-3m3 3-3 3M19 15H6m0 0 3-3m-3 3 3 3" /></span>
                Send
              </Link>
              <Link href="/customer/move" className="flex flex-col items-center gap-2">
                <span className={controlIcon}><Svg d="M12 5v14M5 12h14" /></span>
                Move
              </Link>
              <Link href="/customer/statements" className="flex flex-col items-center gap-2">
                <span className={controlIcon}><Svg d="M7 4h7l4 4v12H7zM14 4v4h4M10 13h5M10 16h5" /></span>
                Statement
              </Link>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-[22px] border border-line bg-card p-4">
              <p className="text-sm text-muted">Spent this month</p>
              <p className="font-display tabular mt-3 text-xl">{dollars(spent)}</p>
            </div>
            <div className="rounded-[22px] border border-line bg-card p-4">
              <p className="text-sm text-muted">Daily send limit</p>
              <p className="font-display tabular mt-3 text-xl">{dollars(me.dailyLimit)}</p>
            </div>
          </section>

          {me.cards.length > 1 && (
            <section className="mt-7">
              <h2 className="font-display text-lg">Other cards</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {me.cards.slice(1).map((extra) => (
                  <li
                    key={extra.id}
                    className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3.5"
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-line/70">
                        <Svg d="M3.5 7.5h17v9h-17zM3.5 11h17" />
                      </span>
                      Debit ···· {extra.last4}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        extra.status === "Active"
                          ? "bg-moss/10 text-moss"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {extra.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
