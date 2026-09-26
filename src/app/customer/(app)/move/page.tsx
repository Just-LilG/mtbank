"use client";

import Link from "next/link";
import { useState } from "react";
import { useBank } from "@/components/bank-provider";
import { dollars } from "@/lib/books";

export default function MovePage() {
  const bank = useBank();
  const me = bank.me;
  const [direction, setDirection] = useState<"toSavings" | "toEveryday">("toSavings");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!me) return null;

  const from = direction === "toSavings" ? me.balance : me.savings;
  const toLabel = direction === "toSavings" ? "Savings" : "Everyday";
  const fromLabel = direction === "toSavings" ? "Everyday" : "Savings";
  const overBalance = Number(amount) > from;
  const frozen = me.status === "Frozen";

  if (done) {
    return (
      <div className="px-5 pb-8 pt-7">
        <p className="font-display text-5xl leading-none tracking-tight">Moved.</p>
        <p className="mt-4 text-muted">
          {dollars(Number(amount) || 0)} is now in {toLabel.toLowerCase()}. This moved right
          away since it never left the bank.
        </p>
        <div className="mt-8 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setDone(false);
              setAmount("");
              setError("");
            }}
            className="rounded-full bg-red px-5 py-3 text-white"
          >
            Move more
          </button>
          <Link
            href="/customer"
            className="rounded-full border border-line px-5 py-3 text-sm"
          >
            Back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-8 pt-7">
      <p className="text-sm text-muted">Between your own pots</p>
      <h1 className="font-display text-4xl tracking-tight">Move money</h1>
      <p className="mt-2 text-sm text-muted">
        This stays inside your account, so it moves right away — no branch review needed.
      </p>

      {frozen && (
        <p className="mt-4 rounded-2xl bg-red/10 px-4 py-3 text-sm text-red">
          This account is frozen. The branch has to open it before money can move.
        </p>
      )}

      {!frozen && (
        <>
          <div className="mt-6 flex overflow-hidden rounded-full border border-line bg-card p-1">
            {(
              [
                ["toSavings", "Everyday → Savings"],
                ["toEveryday", "Savings → Everyday"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setDirection(id);
                  setError("");
                }}
                className={`flex-1 rounded-full px-3 py-2.5 text-sm transition-colors ${
                  direction === id ? "bg-ink text-white" : "text-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3">
            <div>
              <p className="text-xs text-muted">From {fromLabel.toLowerCase()}</p>
              <p className="text-sm font-medium">{dollars(from)} available</p>
            </div>
            <span className="text-muted">→ {toLabel}</span>
          </div>

          <label className="mt-6 block">
            <span className="text-sm text-muted">How much</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="font-display mt-1.5 w-full rounded-2xl border border-line bg-card px-4 py-4 text-4xl outline-none ring-red/30 focus:ring-2"
            />
            <p className={`mt-1.5 text-sm ${overBalance ? "text-red" : "text-muted"}`}>
              {dollars(from)} available in {fromLabel.toLowerCase()}
            </p>
          </label>

          {error && <p className="mt-3 text-sm text-red">{error}</p>}

          <button
            type="button"
            disabled={busy || !amount || overBalance}
            onClick={async () => {
              setBusy(true);
              const problem = await bank.moveBetweenPots(me.id, direction, Number(amount));
              setBusy(false);
              if (problem) {
                setError(problem);
                return;
              }
              setDone(true);
            }}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 font-medium text-white transition-opacity disabled:opacity-50"
          >
            {busy && (
              <span
                aria-hidden
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
            )}
            {busy ? "Moving…" : `Move to ${toLabel.toLowerCase()}`}
          </button>
        </>
      )}
    </div>
  );
}
