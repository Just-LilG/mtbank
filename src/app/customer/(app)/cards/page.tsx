"use client";

import { useBank } from "@/components/bank-provider";

const dotGroups = ["····", "····", "····"];

export default function CardsPage() {
  const bank = useBank();
  const me = bank.me;
  if (!me) return null;
  const card = me.cards[0];

  return (
    <div className="px-5 pb-8 pt-7">
      <p className="text-sm text-muted">In your pocket</p>
      <h1 className="font-display text-4xl tracking-tight">Card</h1>

      {!card && (
        <p className="mt-6 rounded-[24px] border border-dashed border-line px-4 py-8 text-sm text-muted">
          The branch has not issued a card for this account yet.
        </p>
      )}

      {card && (
        <>
          <div
            className={`relative mt-6 overflow-hidden rounded-[28px] p-6 pb-7 text-white shadow-[0_20px_40px_-20px_rgba(22,19,15,0.45)] ${
              card.status === "Active" ? "bg-ink" : "bg-[#6b665e]"
            }`}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.14] via-transparent to-transparent"
            />
            <div
              aria-hidden
              className={`pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl ${
                card.status === "Active" ? "bg-red/40" : "bg-white/10"
              }`}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-1/2 h-px -rotate-6 bg-white/10"
            />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="font-display text-xl italic tracking-tight">Ubex</p>
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/55">Bank</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${
                  card.status === "Active"
                    ? "bg-white/15 text-white"
                    : "bg-white/10 text-white/70"
                }`}
              >
                {card.status}
              </span>
            </div>

            <div
              aria-hidden
              className="relative mt-7 h-8 w-11 rounded-md bg-gradient-to-br from-[#e8d9a8] to-[#c9a961]"
            />

            <p className="relative mt-5 flex gap-3 font-mono text-xl tracking-[0.12em]">
              {dotGroups.map((group, i) => (
                <span key={i} className="text-white/50">
                  {group}
                </span>
              ))}
              <span>{card.last4}</span>
            </p>

            <div className="relative mt-7 flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                  Card holder
                </p>
                <p className="mt-1 text-sm">{me.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Expires</p>
                <p className="mt-1 text-sm">{card.expires}</p>
              </div>
            </div>
          </div>

          {card.status === "Blocked" ? (
            <p className="mt-4 text-sm text-red">
              The branch blocked this card. Only the desk can turn it back on.
            </p>
          ) : (
            <button
              type="button"
              onClick={() =>
                void bank.setCardStatus(me.id, card.id, card.status === "Paused" ? "Active" : "Paused")
              }
              className="mt-6 w-full rounded-full border border-line bg-card py-3.5 font-medium"
            >
              {card.status === "Paused" ? "Use the card again" : "Pause the card"}
            </button>
          )}
          {me.cards.length > 1 && (
            <ul className="mt-4 space-y-2 text-sm">
              {me.cards.slice(1).map((extra) => (
                <li
                  key={extra.id}
                  className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3"
                >
                  <span>Debit ··· {extra.last4}</span>
                  <span className="text-muted">{extra.status}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
