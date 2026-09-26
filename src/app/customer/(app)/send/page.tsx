"use client";

import { useEffect, useState } from "react";
import { findRecipient } from "@/app/actions";
import { useBank } from "@/components/bank-provider";
import { dollars, nowLabel } from "@/lib/books";

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

  return (
    <div className="px-5 pb-8 pt-7">
      <p className="text-sm text-muted">Move money</p>
      <h1 className="font-display text-4xl tracking-tight">Send</h1>
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
          <p className="text-sm font-medium">{dollars(me.balance)}</p>
        </div>
      </div>

      {frozen && (
        <p className="mt-4 rounded-2xl bg-red/10 px-4 py-3 text-sm text-red">
          This account is frozen. The branch has to open it before you can send.
        </p>
      )}

      {step === "write" && !frozen && (
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            setStep("check");
          }}
        >
          <label className="block">
            <span className="text-sm text-muted">Who gets it</span>
            <input
              required
              value={who}
              onChange={(event) => setWho(event.target.value)}
              placeholder="Name or Ubex account"
              className="mt-1.5 w-full rounded-2xl border border-line bg-card px-4 py-3.5 outline-none ring-red/30 focus:ring-2"
            />
            {checking && <p className="mt-1.5 text-sm text-muted">Checking…</p>}
            {!checking && recipient && (
              <p className="mt-1.5 text-sm text-moss">Sending to {recipient.name}</p>
            )}
            {!checking && !recipient && who.replace(/\D/g, "").length >= 4 && (
              <p className="mt-1.5 text-sm text-muted">
                No Ubex account matches that number.
              </p>
            )}
          </label>
          <label className="block">
            <span className="text-sm text-muted">How much</span>
            <input
              required
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="font-display mt-1.5 w-full rounded-2xl border border-line bg-card px-4 py-4 text-4xl outline-none ring-red/30 focus:ring-2"
            />
            <p className={`mt-1.5 text-sm ${overBalance ? "text-red" : "text-muted"}`}>
              {dollars(me.balance)} available
            </p>
          </label>
          <label className="block">
            <span className="text-sm text-muted">A short note</span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-line bg-card px-4 py-3.5 outline-none ring-red/30 focus:ring-2"
            />
          </label>
          <button type="submit" className="w-full rounded-full bg-red py-3.5 font-medium text-white">
            Look it over
          </button>
        </form>
      )}

      {step === "check" && (
        <div className="mt-6 rounded-[28px] border border-line bg-card p-5">
          <p className="text-sm text-muted">Sending, once approved</p>
          <p className="font-display mt-2 text-5xl tracking-tight">
            {dollars(Number(amount) || 0)}
          </p>
          <p className="mt-4 text-sm">To {recipient ? recipient.name : who}</p>
          {note && <p className="text-sm text-muted">{note}</p>}
          {error && <p className="mt-3 text-sm text-red">{error}</p>}
          <button
            type="button"
            disabled={sending}
            onClick={async () => {
              setSending(true);
              const problem = await bank.send(me.id, who, Number(amount), note);
              setSending(false);
              if (problem) {
                setError(problem);
                return;
              }
              setSentAt(nowLabel());
              setStep("done");
            }}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 font-medium text-white transition-opacity disabled:opacity-60"
          >
            {sending && (
              <span
                aria-hidden
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
            )}
            {sending ? "Sending…" : "Send for approval"}
          </button>
          <button type="button" onClick={() => setStep("write")} className="mt-3 w-full py-2 text-sm text-muted">
            Change it
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="mt-8">
          <p className="font-display text-5xl leading-none tracking-tight">Pending.</p>
          <p className="mt-4 text-muted">
            {dollars(Number(amount) || 0)} to {recipient ? recipient.name : who} is waiting on
            the branch to approve. Nothing has left your account yet.
          </p>

          <ol className="mt-8">
            {[
              { label: "Requested", when: sentAt, done: true },
              { label: "Branch review", when: "In progress", done: true, current: true },
              { label: "Approved and sent", when: "Not yet", done: false },
            ].map((stage, i, arr) => (
              <li key={stage.label} className="relative flex gap-4 pb-8 last:pb-0">
                {i < arr.length - 1 && (
                  <span
                    aria-hidden
                    className={`absolute left-[15px] top-8 h-full w-px ${
                      stage.done ? "bg-ink/30" : "bg-line"
                    }`}
                  />
                )}
                <span
                  className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                    stage.current
                      ? "bg-red text-white"
                      : stage.done
                        ? "bg-ink text-white"
                        : "border border-line bg-card text-muted"
                  }`}
                >
                  {stage.done && !stage.current ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                      <path
                        d="M5 12.5l4.5 4.5L19 7"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : stage.current ? (
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-line" />
                  )}
                </span>
                <div className="pt-1">
                  <p className={`text-sm font-medium ${stage.done ? "text-ink" : "text-muted"}`}>
                    {stage.label}
                  </p>
                  <p className="text-sm text-muted">{stage.when}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-2 text-sm text-muted">
            You can check back any time under Activity.
          </p>

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
            className="mt-8 rounded-full bg-red px-5 py-3 text-white"
          >
            Send another
          </button>
        </div>
      )}
    </div>
  );
}
