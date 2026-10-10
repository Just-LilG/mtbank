"use client";

import Link from "next/link";
import { useState } from "react";
import { useBank } from "@/components/bank-provider";
import { Spinner } from "@/components/staff/ui";
import { currencySymbol, dollars } from "@/lib/books";

function Pot({ role, label, amount }: { role: string; label: string; amount: number }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <p className="text-xs text-muted">{role}</p>
        <p className="font-display text-lg">{label}</p>
      </div>
      <p className="font-display tabular text-lg">{dollars(amount)}</p>
    </div>
  );
}

export default function MovePage() {
  const bank = useBank();
  const me = bank.me;
  const [direction, setDirection] = useState<"toSavings" | "toEveryday">("toSavings");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ amount: number; to: string } | null>(null);

  if (!me) return null;

  const toSavings = direction === "toSavings";
  const fromAmount = toSavings ? me.balance : me.savings;
  const toAmount = toSavings ? me.savings : me.balance;
  const fromLabel = toSavings ? "Everyday" : "Savings";
  const toLabel = toSavings ? "Savings" : "Everyday";
  const value = Number(amount);
  const over = value > fromAmount;
  const frozen = me.status === "Frozen";
  const ready = value > 0 && !over && !frozen;

  if (done) {
    return (
      <div className="px-5 pb-8 pt-10 md:max-w-xl">
        <div className="flex flex-col items-center text-center">
          <span className="done-pop grid h-20 w-20 place-items-center rounded-full bg-moss/15 text-moss ring-8 ring-moss/10">
            <svg viewBox="0 0 24 24" className="check-draw h-9 w-9" fill="none" aria-hidden>
              <path d="M5 12.500l4.500 4.500L19 7" stroke="currentColor" strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h1 className="font-display mt-6 text-3xl tracking-tight">Moved</h1>
          <p className="mt-2 max-w-xs text-muted">
            {dollars(done.amount)} is now in {done.to.toLowerCase()}. It happened right away, because it never left your account.
          </p>
        </div>
        <dl className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card text-sm">
          <div className="flex justify-between px-4 py-3.5">
            <dt className="text-muted">Everyday now</dt>
            <dd className="tabular font-medium">{dollars(me.balance)}</dd>
          </div>
          <div className="flex justify-between px-4 py-3.5">
            <dt className="text-muted">Savings now</dt>
            <dd className="tabular font-medium">{dollars(me.savings)}</dd>
          </div>
        </dl>
        <Link href="/customer" className="mt-6 block w-full rounded-full bg-solid py-3.5 text-center font-medium text-white">
          Back home
        </Link>
        <button
          type="button"
          onClick={() => {
            setDone(null);
            setAmount("");
            setError("");
          }}
          className="mt-2 w-full py-3 text-sm text-muted"
        >
          Move more
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pb-8 pt-7 md:max-w-xl">
      <h1 className="font-display text-2xl tracking-tight">Move money</h1>
      <p className="mt-2 text-sm text-muted">
        This stays inside your account, so it happens right away. No branch review needed.
      </p>

      {frozen && (
        <p className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
          This account is frozen. The branch has to open it before you can move money.
        </p>
      )}

      <form
        className="mt-6 space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          const problem = await bank.moveBetweenPots(me.id, direction, value);
          setBusy(false);
          if (problem) {
            setError(problem);
            return;
          }
          setDone({ amount: value, to: toLabel });
        }}
      >
        <div className="relative overflow-hidden rounded-[24px] border border-line bg-card">
          <Pot role="From" label={fromLabel} amount={fromAmount} />
          <div className="relative border-t border-line">
            <button
              type="button"
              onClick={() => setDirection(toSavings ? "toEveryday" : "toSavings")}
              aria-label={`Swap. Now moving from ${toLabel} to ${fromLabel}`}
              className="absolute right-5 top-0 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-card text-red shadow-sm"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M8 4v15m0 0-3-3m3 3 3-3M16 20V5m0 0-3 3m3-3 3 3" />
              </svg>
            </button>
          </div>
          <div className="border-t border-line bg-paper/50">
            <Pot role="To" label={toLabel} amount={toAmount} />
          </div>
        </div>

        <label className="block">
          <span className="text-sm text-muted">How much</span>
          <div className="relative mt-1.5">
            <span aria-hidden className="font-display pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-4xl text-muted">
              {currencySymbol()}
            </span>
            <input
              required
              inputMode="decimal"
              placeholder="0.00"
              autoComplete="off"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="font-display tabular w-full rounded-2xl border border-line bg-card py-4 pl-10 pr-4 text-4xl outline-none transition-shadow focus:border-red focus:ring-2 focus:ring-red/25"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setAmount(fromAmount.toFixed(2))}
              disabled={fromAmount <= 0}
              className="rounded-full border border-line bg-card px-3.5 py-1.5 text-sm text-red disabled:opacity-40"
            >
              All of {fromLabel.toLowerCase()}
            </button>
          </div>
          {over && (
            <p role="alert" className="mt-2 text-sm text-danger">
              That is more than the {dollars(fromAmount)} in {fromLabel.toLowerCase()}.
            </p>
          )}
        </label>

        {error && (
          <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!ready || busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-solid py-3.5 font-medium text-white transition-opacity disabled:opacity-40"
        >
          {busy && <Spinner />}
          {busy ? "Moving…" : `Move to ${toLabel.toLowerCase()}`}
        </button>
      </form>

      <Link
        href="/customer/goals"
        className="mt-5 flex items-center justify-between rounded-[22px] border border-line bg-card px-4 py-3.5 text-sm"
      >
        <span>
          Savings goals
          <span className="block text-xs text-muted">Set part of your savings aside for something</span>
        </span>
        <span aria-hidden className="text-muted">
          ›
        </span>
      </Link>
    </div>
  );
}
