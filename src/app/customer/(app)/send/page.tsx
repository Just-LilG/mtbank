"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { findRecipient, listPayees } from "@/app/actions";
import { useBank } from "@/components/bank-provider";
import { SavedPayees, SavePayee } from "@/components/customer/payees";
import type { Payee } from "@/lib/payees";
import { currencySymbol, dollars, nowLabel } from "@/lib/books";

/** Keep only digits and one dot, with at most two decimals. */
function cleanAmount(raw: string) {
  const kept = raw.replace(/[^0-9.]/g, "");
  const dot = kept.indexOf(".");
  if (dot === -1) return kept.slice(0, 9);
  return kept.slice(0, 9).slice(0, dot + 1) + kept.slice(dot + 1).replace(/\./g, "").slice(0, 2);
}

export default function SendPage() {
  const bank = useBank();
  const me = bank.me;
  const [step, setStep] = useState<"write" | "check" | "done">("write");
  const [who, setWho] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [recipient, setRecipient] = useState<{ name: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [sentAt, setSentAt] = useState("");
  const [sending, setSending] = useState(false);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [fromLink, setFromLink] = useState(false);

  // Opened from a payment link: fill in who, how much and what for.
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const to = (query.get("to") ?? "").replace(/\D/g, "").slice(0, 12);
    if (!to) return;
    setWho(to.replace(/(\d{4})(?=\d)/g, "$1 "));
    const asked = query.get("amount");
    if (asked) setAmount(cleanAmount(asked));
    const why = query.get("note");
    if (why) setNote(why.slice(0, 80));
    setFromLink(true);
  }, []);

  const loadPayees = async () => setPayees(await listPayees());
  useEffect(() => {
    listPayees()
      .then(setPayees)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!me) return;
    const digitsOnly = who.replace(/\D/g, "");
    if (digitsOnly.length < 4) {
      setRecipient(null);
      setChecking(false);
      return;
    }
    setChecking(true);
    const id = setTimeout(async () => {
      const found = await findRecipient(me.id, who);
      setRecipient(found);
      setChecking(false);
    }, 350);
    return () => clearTimeout(id);
  }, [who, me]);

  if (!me) return null;
  const frozen = me.status === "Frozen";
  const overBalance = Number(amount) > me.balance;
  const overLimit = Number(amount) > me.dailyLimit;

  return (
    <div className="px-5 pb-8 pt-7 md:max-w-xl">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl tracking-tight">Send</h1>
        <div className="flex gap-4 text-sm">
          <Link href="/customer/scheduled" className="hit text-red">
            Schedule
          </Link>
          <Link href="/customer/request" className="hit text-red">
            Request
          </Link>
        </div>
      </div>
      {fromLink && step === "write" && (
        <p className="mt-3 rounded-2xl bg-paper px-4 py-3 text-sm text-muted">
          Filled in from a payment request. Check the details, then look it over.
        </p>
      )}
      <p className="mt-2 text-sm text-muted">
        Up to {dollars(me.dailyLimit)} a day from the everyday account.
      </p>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3">
        <div>
          <p className="text-xs text-muted">From</p>
          <p className="text-sm">{me.name} · ··· {me.account.slice(-4)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Available</p>
          <p className="sensitive text-sm font-medium">{dollars(me.balance)}</p>
        </div>
      </div>

      {!frozen && me.balance <= 0 && me.savings > 0 && (
        <Link
          href="/customer/move"
          className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-800"
        >
          <span>Your everyday account is empty. Move some money from savings to send.</span>
          <span className="shrink-0 font-medium">Move →</span>
        </Link>
      )}

      {frozen && (
        <p className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
          This account is frozen. The branch has to open it before you can send.
        </p>
      )}

      {step === "write" && !frozen && (
        <form
          className="mt-6 space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            // Say what is missing and go there, instead of a button that will not press.
            if (!who.trim()) {
              setError("Enter who you are sending to.");
              document.getElementById("send-who")?.focus();
              return;
            }
            if (!(Number(amount) > 0)) {
              setError("Enter how much you want to send.");
              document.getElementById("send-amount")?.focus();
              return;
            }
            if (overBalance || overLimit) {
              document.getElementById("send-amount")?.focus();
              return;
            }
            setError("");
            setStep("check");
          }}
        >
          <SavedPayees
            payees={payees}
            picked={who.replace(/\D/g, "")}
            onPick={(account) => setWho(account)}
            onChanged={loadPayees}
          />
          {me.recentPayees.filter((item) => !payees.some((saved) => saved.account === item.account.replace(/\D/g, ""))).length > 0 && (
            <div>
              <p className="text-sm text-muted">Recent</p>
              <ul className="-mx-5 mt-2 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {me.recentPayees
                  .filter((item) => !payees.some((saved) => saved.account === item.account.replace(/\D/g, "")))
                  .map((payee) => {
                  const picked = who.replace(/\D/g, "") === payee.account.replace(/\D/g, "");
                  return (
                    <li key={payee.id} className="shrink-0">
                      <button
                        type="button"
                        aria-pressed={picked}
                        onClick={() => setWho(payee.account)}
                        className="flex w-[72px] flex-col items-center gap-1.5"
                      >
                        <span
                          className={`font-display grid h-14 w-14 place-items-center rounded-full text-base transition-colors ${
                            picked ? "bg-solid text-white" : "bg-red/10 text-red"
                          }`}
                        >
                          {payee.name
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((word) => word[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                        <span className="w-full truncate text-center text-xs text-ink/80">
                          {payee.name.split(" ")[0]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <label className="block">
            <span className="text-sm text-muted">Who gets it</span>
            <input
              id="send-who"
              value={who}
              onChange={(event) => {
                setWho(event.target.value);
                setError("");
              }}
              placeholder="Name or Ubex account"
              autoComplete="off"
              className="mt-1.5 w-full rounded-2xl border border-line bg-card px-4 py-3.5 outline-none ring-red/30 focus:ring-2"
            />
            {checking && <p className="mt-1.5 text-sm text-muted">Checking…</p>}
            {!checking && recipient && (
              <p className="mt-1.5 text-sm text-moss">Sending to {recipient.name}</p>
            )}
            {!checking && recipient && (
              <SavePayee
                account={who}
                name={recipient.name}
                saved={payees.some((item) => item.account === who.replace(/\D/g, ""))}
                onSaved={loadPayees}
              />
            )}
            {!checking && !recipient && who.replace(/\D/g, "").length >= 4 && (
              <p className="mt-1.5 text-sm text-muted">
                No Ubex account matches that number.
              </p>
            )}
          </label>
          <label className="block">
            <span className="text-sm text-muted">How much</span>
            <div className="relative mt-1.5">
              <span aria-hidden className="font-display pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-4xl text-muted">
                {currencySymbol()}
              </span>
              <input
                id="send-amount"
                inputMode="decimal"
                placeholder="0.00"
                autoComplete="off"
                value={amount}
                onChange={(event) => {
                  setAmount(cleanAmount(event.target.value));
                  setError("");
                }}
                className="font-display w-full rounded-2xl border border-line bg-card py-4 pl-10 pr-4 text-4xl outline-none ring-red/30 focus:ring-2"
              />
            </div>
            <div className="mt-2 flex gap-2">
              {[50, 100, 500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className="rounded-full border border-line bg-card px-3.5 py-1.5 text-sm text-muted hover:text-ink"
                >
                  {currencySymbol()}
                  {preset}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount(Math.min(me.balance, me.dailyLimit).toFixed(2))}
                disabled={Math.min(me.balance, me.dailyLimit) <= 0}
                className="rounded-full border border-line bg-card px-3.5 py-1.5 text-sm text-red disabled:opacity-40"
              >
                Max
              </button>
            </div>
            {(overBalance || overLimit) && (
              <p role="alert" className="mt-2 text-sm text-danger">
                {overBalance
                  ? `That is more than the ${dollars(me.balance)} available.`
                  : `The daily limit is ${dollars(me.dailyLimit)}.`}
              </p>
            )}
          </label>
          <label className="block">
            <span className="text-sm text-muted">A short note (optional)</span>
            <input
              placeholder="What is it for?"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-line bg-card px-4 py-3.5 outline-none ring-red/30 focus:ring-2"
            />
          </label>
          {error && (
            <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-full bg-solid py-3.5 font-medium text-white shadow-[0_10px_22px_-12px_rgba(225,6,0,0.9)] transition-opacity active:opacity-90"
          >
            Look it over
          </button>
        </form>
      )}

      {step === "check" && (
        <div className="mt-6">
          <div className="overflow-hidden rounded-[28px] border border-line bg-card">
            <div className="px-5 pb-5 pt-6 text-center">
              <p className="text-sm text-muted">You are sending</p>
              <p className="font-display tabular mt-2 text-5xl tracking-tight">
                {dollars(Number(amount) || 0)}
              </p>
            </div>
            <dl className="divide-y divide-line border-t border-line text-sm">
              <div className="flex justify-between gap-4 px-5 py-3.5">
                <dt className="text-muted">From</dt>
                <dd className="text-right">
                  {me.name}
                  <span className="block text-xs text-muted">Everyday ···· {me.account.slice(-4)}</span>
                </dd>
              </div>
              <div className="flex justify-between gap-4 px-5 py-3.5">
                <dt className="text-muted">To</dt>
                <dd className="text-right">
                  {recipient ? recipient.name : who}
                  {recipient ? (
                    <span className="mt-0.5 flex items-center justify-end gap-1 text-xs text-moss">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M5 12.5l4.5 4.5L19 7" />
                      </svg>
                      Ubex account found
                    </span>
                  ) : (
                    <span className="block text-xs text-muted">The branch will check this payee</span>
                  )}
                </dd>
              </div>
              {note && (
                <div className="flex justify-between gap-4 px-5 py-3.5">
                  <dt className="text-muted">Note</dt>
                  <dd className="text-right">{note}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 px-5 py-3.5">
                <dt className="text-muted">Fee</dt>
                <dd>Free</dd>
              </div>
            </dl>
          </div>
          <p className="mt-3 flex items-start gap-2 px-1 text-xs text-muted">
            <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.500 7-10V6l-7-3Z" />
            </svg>
            The branch reviews every send. Nothing leaves your account until it is approved.
          </p>
          {error && (
            <p role="alert" className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}
          <button
            type="button"
            disabled={sending}
            onClick={async () => {
              setSending(true);
              setError("");
              const problem = await bank.send(me.id, who, Number(amount), note);
              setSending(false);
              if (problem) {
                setError(problem);
                return;
              }
              setSentAt(nowLabel());
              setStep("done");
            }}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-solid py-3.5 font-medium text-white transition-opacity disabled:opacity-60"
          >
            {sending && (
              <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {sending ? "Sending…" : "Send for approval"}
          </button>
          <button
            type="button"
            onClick={() => {
              setError("");
              setStep("write");
            }}
            className="mt-2 w-full py-3 text-sm text-muted"
          >
            Change it
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="mt-6">
          <div className="flex flex-col items-center text-center">
            <span className="done-pop grid h-20 w-20 place-items-center rounded-full bg-moss/12 text-moss ring-8 ring-moss/10">
              <svg viewBox="0 0 24 24" className="check-draw h-9 w-9" fill="none" aria-hidden>
                <path d="M5 12.500l4.500 4.500L19 7" stroke="currentColor" strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 className="font-display mt-6 text-3xl tracking-tight">Sent for approval</h2>
            <p className="mt-2 max-w-xs text-muted">
              {dollars(Number(amount) || 0)} to {recipient ? recipient.name : who} is waiting on the
              branch. Nothing has left your account yet.
            </p>
          </div>

          <ol className="mt-8 rounded-2xl border border-line bg-card p-4">
            {[
              { label: "Requested", note: sentAt, state: "done" },
              { label: "Branch review", note: "In progress", state: "current" },
              { label: "Approved and sent", note: "Not yet", state: "todo" },
            ].map((stage, i, arr) => (
              <li key={stage.label} className="relative flex gap-3 pb-6 last:pb-0">
                {i < arr.length - 1 && (
                  <span aria-hidden className={`absolute left-[13px] top-7 h-full w-px ${stage.state === "done" ? "bg-moss/40" : "bg-line"}`} />
                )}
                <span
                  className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                    stage.state === "done"
                      ? "bg-moss text-white"
                      : stage.state === "current"
                        ? "bg-red text-white"
                        : "border border-line bg-card"
                  }`}
                >
                  {stage.state === "done" ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                      <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : stage.state === "current" ? (
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-line" />
                  )}
                </span>
                <div className="pt-0.5">
                  <p className={`text-sm font-medium ${stage.state === "todo" ? "text-muted" : ""}`}>{stage.label}</p>
                  <p className="text-sm text-muted">{stage.note}</p>
                </div>
              </li>
            ))}
          </ol>

          <Link href="/customer" className="mt-6 block w-full rounded-full bg-solid py-3.5 text-center font-medium text-white">
            Back home
          </Link>
          <Link href="/customer/activity" className="mt-2 block w-full rounded-full border border-line bg-card py-3.5 text-center text-sm">
            View in Activity
          </Link>
          <button
            type="button"
            onClick={() => {
              setStep("write");
              setWho("");
              setAmount("");
              setNote("");
              setError("");
              setRecipient(null);
              setSentAt("");
            }}
            className="mt-2 w-full py-3 text-sm text-muted"
          >
            Send another
          </button>
        </div>
      )}
    </div>
  );
}
